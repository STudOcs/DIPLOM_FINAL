from djoser.serializers import UserCreateSerializer, UserSerializer
from .models import User

# Этот используется при регистрации (POST /users/)
class CustomUserCreateSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'password', 'first_name', 'last_name', 'middle_name', 'student_group')

# Этот используется при получении данных (GET /users/me/)
class CustomUserSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'middle_name', 'student_group')