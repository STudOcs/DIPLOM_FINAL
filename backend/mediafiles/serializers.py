from django.conf import settings
from rest_framework import serializers
from .models import MediaAsset


class MediaAssetSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = ("id", "file", "url", "uploaded_at")
        read_only_fields = ("id", "url", "uploaded_at")

    def get_url(self, obj):
        url = obj.file.url

        internal = getattr(settings, "AWS_S3_ENDPOINT_URL", "")
        public = getattr(settings, "AWS_S3_PUBLIC_ENDPOINT_URL", internal)

        if internal and public and url.startswith(internal):
            url = url.replace(internal, public, 1)

        return url