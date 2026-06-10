from django.urls import path

from .views import AddToCartView, CartView, RemoveFromCartView

urlpatterns = [
    path("cart/", CartView.as_view()),
    path("cart/add", AddToCartView.as_view()),
    path("cart/remove", RemoveFromCartView.as_view()),
]
