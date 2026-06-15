from djoser.serializers import UserSerializer
from djoser.serializers import UserCreatePasswordRetypeSerializer
from .models import User


class CustomUserCreateSerializer(UserCreatePasswordRetypeSerializer):
    class Meta(UserCreatePasswordRetypeSerializer.Meta):
        model = User
        fields = (
            'id',
            'email',
            'username',
            'password',
            're_password',
            'first_name',
            'last_name',
            'middle_name',
            'student_group',
        )

    def create(self, validated_data):
        validated_data.pop('re_password', None)
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user


class CustomUserSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        model = User
        fields = (
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'middle_name',
            'student_group',
            'student_card',
            'department',
            'date_joined',
        )