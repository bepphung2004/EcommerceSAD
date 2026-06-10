from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Category",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sku", models.CharField(max_length=40, unique=True)),
                ("slug", models.SlugField(max_length=280, unique=True)),
                ("name", models.CharField(max_length=255)),
                ("short_description", models.CharField(blank=True, max_length=255)),
                ("description", models.TextField(blank=True)),
                ("brand", models.CharField(blank=True, max_length=120)),
                ("image_url", models.URLField(blank=True)),
                ("price", models.FloatField()),
                ("discount_percent", models.PositiveSmallIntegerField(default=0)),
                ("stock", models.IntegerField()),
                ("sold_count", models.PositiveIntegerField(default=0)),
                ("rating_avg", models.FloatField(default=0)),
                ("rating_count", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "domain",
                    models.CharField(
                        choices=[("book", "Book"), ("electronics", "Electronics"), ("fashion", "Fashion")],
                        max_length=20,
                    ),
                ),
                (
                    "category",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="core.category"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Book",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("author", models.CharField(max_length=255)),
                ("publisher", models.CharField(max_length=255)),
                ("isbn", models.CharField(max_length=20)),
                ("pages", models.PositiveIntegerField(default=0)),
                ("language", models.CharField(blank=True, max_length=80)),
                ("published_year", models.PositiveIntegerField(default=0)),
                (
                    "product",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to="core.product"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Electronics",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("brand", models.CharField(max_length=100)),
                ("warranty", models.IntegerField()),
                ("model_name", models.CharField(blank=True, max_length=120)),
                ("ram", models.CharField(blank=True, max_length=40)),
                ("storage", models.CharField(blank=True, max_length=40)),
                ("chip", models.CharField(blank=True, max_length=120)),
                ("screen_size", models.CharField(blank=True, max_length=30)),
                ("battery", models.CharField(blank=True, max_length=60)),
                ("origin", models.CharField(blank=True, max_length=80)),
                (
                    "product",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to="core.product"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Fashion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("size", models.CharField(max_length=10)),
                ("color", models.CharField(max_length=50)),
                ("material", models.CharField(blank=True, max_length=80)),
                ("gender", models.CharField(blank=True, max_length=30)),
                ("style", models.CharField(blank=True, max_length=80)),
                (
                    "product",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to="core.product"),
                ),
            ],
        ),
    ]
