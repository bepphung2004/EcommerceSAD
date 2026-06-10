from django.db import models


class Shipment(models.Model):
    STATUS_CHOICES = (
        ("processing", "Processing"),
        ("shipping", "Shipping"),
        ("delivered", "Delivered"),
    )

    order_id = models.IntegerField()
    address = models.TextField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="processing")
