from django.urls import path

from .views import OrdersView, OrderStatusUpdateView

urlpatterns = [
    path("orders/", OrdersView.as_view()),
    path("orders/<int:order_id>/status", OrderStatusUpdateView.as_view()),
]
