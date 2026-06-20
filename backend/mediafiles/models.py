import uuid
from django.conf import settings
from django.db import models


def media_upload_path(instance, filename):
    ext = filename.split(".")[-1].lower()
    return f"media/{instance.owner_id}/{uuid.uuid4().hex}.{ext}"


class MediaAsset(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="media_assets",
    )
    file = models.ImageField(upload_to=media_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.file.name