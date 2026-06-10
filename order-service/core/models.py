from django.db import models


class Order(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("shipping", "Shipping"),
        ("delivered", "Delivered"),
    )

    user_id = models.IntegerField()
    total_price = models.FloatField(default=0)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="pending")
    address = models.CharField(max_length=255, default="N/A")


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product_id = models.IntegerField()
    quantity = models.IntegerField()
    price = models.FloatField()
