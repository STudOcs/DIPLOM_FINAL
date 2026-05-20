from rest_framework import viewsets, permissions
from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Пользователь видит только свои документы
        return Document.objects.filter(owner=self.request.user)
