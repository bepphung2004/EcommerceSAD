from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment
from .serializers import PaymentSerializer


class PaymentPayView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        method = request.data.get("method", "COD")
        status_val = "pending" if method == "COD" else "success"
        wallet_details = request.data.get("wallet_details", "")
        payment = serializer.save(status=status_val, method=method, wallet_details=wallet_details)
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class PaymentStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        order_id = request.query_params.get("order_id")
        payment = Payment.objects.filter(order_id=order_id).order_by("-id").first()
        if not payment:
            return Response({"detail": "not found"}, status=404)
        return Response(PaymentSerializer(payment).data)

    def patch(self, request):
        order_id = request.data.get("order_id")
        payment = Payment.objects.filter(order_id=order_id).order_by("-id").first()
        if not payment:
            return Response({"detail": "not found"}, status=404)
        status_val = request.data.get("status")
        if status_val in ["pending", "success", "failed"]:
            payment.status = status_val
            payment.save(update_fields=["status"])
            return Response(PaymentSerializer(payment).data)
        return Response({"detail": "Invalid status value"}, status=400)
