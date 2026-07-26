from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model, focused on profile data that a
    user is allowed to view and edit.
    """
    is_partner = serializers.SerializerMethodField()
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
            'is_partner',
            'role',
        ]
        read_only_fields = [
            'username',
            'id',
            'is_staff',
            'is_superuser',
            'is_partner',
            'role',
        ]

    def get_is_partner(self, obj):
        return hasattr(obj, 'partner_profile')

    def get_role(self, obj):
        """
        The single source of truth for which dashboard a user lands on.
        Admin wins over a partner profile; florists deliver, affiliates refer.
        """
        if obj.is_staff or obj.is_superuser:
            return 'admin'
        partner = getattr(obj, 'partner_profile', None)
        if partner is not None:
            return 'florist' if partner.partner_type == 'delivery' else 'affiliate'
        return 'customer'

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

