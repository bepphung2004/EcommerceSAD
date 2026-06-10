from django.db import models


class Cart(models.Model):
    user_id = models.IntegerField(unique=True)


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product_id = models.IntegerField()
    quantity = models.IntegerField(default=1)


