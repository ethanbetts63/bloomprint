from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.roles import get_user_role

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model, focused on profile data that a
    user is allowed to view and edit.
    """
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_staff',
            'is_superuser',
            'role',
        ]
        read_only_fields = [
            'username',
            'id',
            'is_staff',
            'is_superuser',
            'role',
        ]

    def get_role(self, obj):
        return get_user_role(obj)

    def validate_email(self, value):
        """
        Ensure the new email is not already in use by another user.
        """
        lower_email = value.lower()
        if self.instance and self.instance.email == lower_email:
            return lower_email
            
        if User.objects.real().filter(email__iexact=lower_email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return lower_email

