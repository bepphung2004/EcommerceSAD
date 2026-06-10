from django.db import models


class Payment(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
    )

    order_id = models.IntegerField()
    amount = models.FloatField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="pending")
    method = models.CharField(max_length=50, default="COD")
    wallet_details = models.CharField(max_length=255, blank=True, default="")


