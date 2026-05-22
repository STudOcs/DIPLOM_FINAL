from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from .models import Document
from .serializers import DocumentSerializer
from .services import LatexService

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Пользователь видит только свои документы
        return Document.objects.filter(owner=self.request.user)
    
    @action(detail=True, methods=['post'])
    def compile(self, request, pk=None):
        document = self.get_object()
        service = LatexService()
        
        # Генерируем PDF
        pdf_relative_path, error_log = service.compile_pdf(document)
        
        if pdf_relative_path:
            # Ссылка на файл для фронтенда
            pdf_url = request.build_absolute_uri(settings.MEDIA_URL + pdf_relative_path)
            return Response({
                'status': 'success',
                'pdf_url': pdf_url
            })
        else:
            return Response({
                'status': 'error',
                'log': error_log
            }, status=400)
