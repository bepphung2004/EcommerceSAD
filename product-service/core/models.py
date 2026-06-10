from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Product(models.Model):
    DOMAIN_CHOICES = (
        ("book", "Book"),
        ("electronics", "Electronics"),
        ("fashion", "Fashion"),
    )

    sku = models.CharField(max_length=40, unique=True)
    slug = models.SlugField(max_length=280, unique=True)
    name = models.CharField(max_length=255)
    short_description = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    brand = models.CharField(max_length=120, blank=True)
    image_url = models.URLField(blank=True)
    price = models.FloatField()
    discount_percent = models.PositiveSmallIntegerField(default=0)
    stock = models.IntegerField()
    sold_count = models.PositiveIntegerField(default=0)
    rating_avg = models.FloatField(default=0)
    rating_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    domain = models.CharField(max_length=20, choices=DOMAIN_CHOICES)


class Book(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE)
    author = models.CharField(max_length=255)
    publisher = models.CharField(max_length=255)
    isbn = models.CharField(max_length=20)
    pages = models.PositiveIntegerField(default=0)
    language = models.CharField(max_length=80, blank=True)
    published_year = models.PositiveIntegerField(default=0)


class Electronics(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE)
    brand = models.CharField(max_length=100)
    warranty = models.IntegerField()
    model_name = models.CharField(max_length=120, blank=True)
    ram = models.CharField(max_length=40, blank=True)
    storage = models.CharField(max_length=40, blank=True)
    chip = models.CharField(max_length=120, blank=True)
    screen_size = models.CharField(max_length=30, blank=True)
    battery = models.CharField(max_length=60, blank=True)
    origin = models.CharField(max_length=80, blank=True)


class Fashion(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE)
    size = models.CharField(max_length=10)
    color = models.CharField(max_length=50)
    material = models.CharField(max_length=80, blank=True)
    gender = models.CharField(max_length=30, blank=True)
    style = models.CharField(max_length=80, blank=True)
