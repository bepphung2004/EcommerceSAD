from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Shipment
from .serializers import ShipmentSerializer


class ShipmentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ShipmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shipment = serializer.save(status="processing")
        return Response(ShipmentSerializer(shipment).data, status=status.HTTP_201_CREATED)


class ShipmentStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        order_id = request.query_params.get("order_id")
        shipment = Shipment.objects.filter(order_id=order_id).order_by("-id").first()
        if not shipment:
            return Response({"detail": "not found"}, status=404)
        return Response(ShipmentSerializer(shipment).data)

    def patch(self, request):
        order_id = request.data.get("order_id")
        status_val = request.data.get("status")
        if not order_id or not status_val:
            return Response({"detail": "order_id and status are required"}, status=400)

        if status_val not in ["processing", "shipping", "delivered", "failed"]:
            return Response({"detail": "invalid status"}, status=400)

        shipment = Shipment.objects.filter(order_id=order_id).order_by("-id").first()
        if not shipment:
            return Response({"detail": "not found"}, status=404)

        shipment.status = status_val
        shipment.save(update_fields=["status"])
        return Response(ShipmentSerializer(shipment).data)

