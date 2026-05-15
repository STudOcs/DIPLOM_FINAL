from django.urls import path, include

urlpatterns = [
    # Базовые эндпоинты: регистрация, сброс пароля, подтверждение и т.д.
    path('', include('djoser.urls')),
    # Эндпоинты для JWT: логин (создание токена), обновление токена
    path('', include('djoser.urls.jwt')),
]