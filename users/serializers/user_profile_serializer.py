from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model, focused on profile data that a
    user is allowed to view and edit.
    """
    is_partner = serializers.SerializerMethodField()

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
            'is_partner',
        ]
        read_only_fields = [
            'username',
            'id',
            'is_staff',
            'is_superuser',
            'is_partner',
        ]

    def get_is_partner(self, obj):
        return hasattr(obj, 'partner_profile')

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

