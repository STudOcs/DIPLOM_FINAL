from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MediaAsset
from .serializers import MediaAssetSerializer


class MediaUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response(
                {"detail": "Файл не передан. Используй поле file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        asset = MediaAsset.objects.create(
            owner=request.user,
            file=uploaded_file,
        )

        serializer = MediaAssetSerializer(asset, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)