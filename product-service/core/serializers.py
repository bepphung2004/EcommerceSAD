from rest_framework import serializers

from .models import Book, Category, Electronics, Fashion, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        exclude = ["id"]


class ElectronicsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Electronics
        exclude = ["id"]


class FashionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fashion
        exclude = ["id"]


class ProductSerializer(serializers.ModelSerializer):
    book = serializers.SerializerMethodField()
    electronics = serializers.SerializerMethodField()
    fashion = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "sku",
            "slug",
            "name",
            "short_description",
            "description",
            "brand",
            "image_url",
            "price",
            "discount_percent",
            "final_price",
            "stock",
            "sold_count",
            "rating_avg",
            "rating_count",
            "is_active",
            "category",
            "domain",
            "book",
            "electronics",
            "fashion",
        ]

    def get_final_price(self, obj):
        if obj.discount_percent <= 0:
            return round(obj.price, 2)
        discounted = obj.price * (100 - obj.discount_percent) / 100
        return round(discounted, 2)

    def get_book(self, obj):
        if hasattr(obj, "book"):
            return BookSerializer(obj.book).data
        return None

    def get_electronics(self, obj):
        if hasattr(obj, "electronics"):
            return ElectronicsSerializer(obj.electronics).data
        return None

    def get_fashion(self, obj):
        if hasattr(obj, "fashion"):
            return FashionSerializer(obj.fashion).data
        return None
