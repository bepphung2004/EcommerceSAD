from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed default users for local testing"

    def handle(self, *args, **options):
        User = get_user_model()

        users = [
            {
                "username": "admin",
                "email": "admin@example.com",
                "password": "admin123",
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "username": "staff",
                "email": "staff@example.com",
                "password": "staff123",
                "role": "staff",
                "is_staff": True,
                "is_superuser": False,
            },
            {
                "username": "customer",
                "email": "customer@example.com",
                "password": "customer123",
                "role": "customer",
                "is_staff": False,
                "is_superuser": False,
            },
        ]

        for item in users:
            username = item["username"]
            defaults = {
                "email": item["email"],
                "role": item["role"],
                "is_staff": item["is_staff"],
                "is_superuser": item["is_superuser"],
            }
            user, created = User.objects.get_or_create(username=username, defaults=defaults)
            if not created:
                user.email = item["email"]
                user.role = item["role"]
                user.is_staff = item["is_staff"]
                user.is_superuser = item["is_superuser"]
            user.set_password(item["password"])
            user.save()

            self.stdout.write(self.style.SUCCESS(f"Seeded user: {username}"))

        self.stdout.write(self.style.SUCCESS("User seed completed."))
