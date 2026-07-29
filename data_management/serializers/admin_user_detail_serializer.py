from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.roles import get_user_role

User = get_user_model()


class AdminUserDetailSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    referred_by = serializers.SerializerMethodField()
    plans = serializers.SerializerMethodField()

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
            'stripe_customer_id',
            'deleted_at',
            'role',
            'referred_by',
            'plans',
        ]

    def get_role(self, obj):
        return get_user_role(obj)

    def get_referred_by(self, obj):
        if not obj.referred_by_affiliate:
            return None
        p = obj.referred_by_affiliate
        return p.business_name or f"{p.user.first_name} {p.user.last_name}".strip()

    def get_plans(self, obj):
        # Orders are no longer owned by a User; customer identity lives on the
        # order itself. Staff/account accounts own no orders.
        return []
