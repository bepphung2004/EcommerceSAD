from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import CartSerializer


def _get_user_id(request):
    return request.user.id if request.user and request.user.is_authenticated else None


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_id = _get_user_id(request)
        cart, _ = Cart.objects.get_or_create(user_id=user_id)
        return Response(CartSerializer(cart).data)


class AddToCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_id = _get_user_id(request)
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))
        if not product_id:
            return Response({"detail": "product_id is required"}, status=400)

        cart, _ = Cart.objects.get_or_create(user_id=user_id)
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_id=product_id,
            defaults={"quantity": quantity},
        )
        if not created:
            item.quantity += quantity
            item.save()
        return Response({"detail": "item added"}, status=status.HTTP_201_CREATED)


class RemoveFromCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user_id = _get_user_id(request)
        product_id = request.data.get("product_id")
        cart = Cart.objects.filter(user_id=user_id).first()
        if not cart:
            return Response({"detail": "cart not found"}, status=404)

        deleted, _ = CartItem.objects.filter(cart=cart, product_id=product_id).delete()
        if deleted == 0:
            return Response({"detail": "item not found"}, status=404)
        return Response({"detail": "item removed"})
