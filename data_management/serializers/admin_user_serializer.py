from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    is_partner = serializers.SerializerMethodField()
    plan_count = serializers.SerializerMethodField()
    referred_by = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'is_staff',
            'is_superuser',
            'is_active',
            'date_joined',
            'is_partner',
            'plan_count',
            'referred_by',
        ]

    def get_is_partner(self, obj):
        return hasattr(obj, 'partner_profile')

    def get_plan_count(self, obj):
        # Orders are no longer owned by a User; customer identity lives on the
        # order itself. Staff/partner accounts own no orders.
        return 0

    def get_referred_by(self, obj):
        if not obj.referred_by_partner:
            return None
        p = obj.referred_by_partner
        return p.business_name or f"{p.user.first_name} {p.user.last_name}".strip()
