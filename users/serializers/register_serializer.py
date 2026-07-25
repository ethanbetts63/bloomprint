from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new, fully claimed user account.
    This is now the single entry point for all new user registrations.
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = [
            'email', 'password', 'first_name', 'last_name'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate_email(self, value):
        lower_email = value.lower()
        if User.objects.real().filter(email__iexact=lower_email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return lower_email

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data.get('email').lower()

        user = User.objects.create_user(
            username=email,
            password=password,
            **validated_data
        )

        return user
