import os

import requests
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .serializers import OrderSerializer


class OrdersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        role = request.auth.get("role", "customer") if request.auth else "customer"
        if role in ["admin", "staff"]:
            queryset = Order.objects.all().order_by("-id")
        else:
            queryset = Order.objects.filter(user_id=request.user.id).order_by("-id")
        return Response(OrderSerializer(queryset, many=True).data)

    def post(self, request):
        payload = request.data.copy()
        payload["user_id"] = request.user.id
        serializer = OrderSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        auth_header = request.headers.get("Authorization", "")
        payment_url = os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8004/payment/pay")
        shipping_url = os.getenv("SHIPPING_SERVICE_URL", "http://shipping-service:8005/shipping/create")

        payment_method = request.data.get("payment_method", "COD")
        wallet_details = request.data.get("wallet_details", "")
        payment_res = requests.post(
            payment_url,
            json={
                "order_id": order.id, 
                "amount": order.total_price, 
                "method": payment_method,
                "wallet_details": wallet_details
            },
            headers={"Authorization": auth_header},
            timeout=5,
        )

        if payment_res.ok:
            payment_data = payment_res.json()
            payment_status = payment_data.get("status", "pending")
            if payment_status == "success":
                order.status = "paid"
            else:
                order.status = "pending"
            order.save(update_fields=["status"])
            
            address = request.data.get("address", "N/A")
            requests.post(
                shipping_url,
                json={"order_id": order.id, "address": address},
                headers={"Authorization": auth_header},
                timeout=5,
            )
        else:
            order.status = "failed"
            order.save(update_fields=["status"])

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, order_id):
        role = request.auth.get("role", "customer") if request.auth else "customer"
        if role not in ["admin", "staff"]:
            return Response({"detail": "Forbidden"}, status=403)

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=404)

        new_status = request.data.get("status")
        if new_status not in ["pending", "paid", "failed", "shipping", "delivered"]:
            return Response({"detail": "Invalid status value"}, status=400)

        auth_header = request.headers.get("Authorization", "")
        payment_pay_url = os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8004/payment/pay")
        payment_url = payment_pay_url.rsplit("/pay", 1)[0] + "/status"
        
        # Fetch payment to check method
        payment_method = "COD"
        try:
            pay_res = requests.get(
                f"{payment_url}?order_id={order.id}",
                headers={"Authorization": auth_header},
                timeout=5,
            )
            if pay_res.ok:
                payment_method = pay_res.json().get("method", "COD")
        except Exception as e:
            print(f"Failed to fetch payment method: {e}")

        order.status = new_status
        order.save(update_fields=["status"])

        # Sync status change to shipping service
        shipping_url = os.getenv("SHIPPING_SERVICE_URL", "http://shipping-service:8005/shipping/create")
        shipping_status_url = shipping_url.rsplit("/create", 1)[0] + "/status"
        ship_status_map = {
            "shipping": "shipping",
            "delivered": "delivered",
            "failed": "failed",
            "pending": "processing",
            "paid": "processing",
        }
        ship_status = ship_status_map.get(new_status)
        if ship_status:
            try:
                requests.patch(
                    shipping_status_url,
                    json={"order_id": order.id, "status": ship_status},
                    headers={"Authorization": auth_header},
                    timeout=5,
                )
            except Exception as e:
                print(f"Failed to update shipping status: {e}")

        # Sync status change to payment service
        if new_status == "paid":
            try:
                requests.patch(
                    payment_url,
                    json={"order_id": order.id, "status": "success"},
                    headers={"Authorization": auth_header},
                    timeout=5,
                )
            except Exception as e:
                print(f"Failed to update payment status: {e}")
        elif new_status == "delivered":
            # For COD, payment is success only when delivered
            if payment_method == "COD":
                try:
                    requests.patch(
                        payment_url,
                        json={"order_id": order.id, "status": "success"},
                        headers={"Authorization": auth_header},
                        timeout=5,
                    )
                except Exception as e:
                    print(f"Failed to update payment status to success on delivery: {e}")
        elif new_status == "failed":
            try:
                requests.patch(
                    payment_url,
                    json={"order_id": order.id, "status": "failed"},
                    headers={"Authorization": auth_header},
                    timeout=5,
                )
            except Exception as e:
                print(f"Failed to update payment status: {e}")

        return Response(OrderSerializer(order).data)
