from rest_framework import serializers
from django.contrib.auth import get_user_model
from events.models import Order
from users.roles import get_user_role

User = get_user_model()


class AdminUserDetailSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    referred_by = serializers.SerializerMethodField()
    orders = serializers.SerializerMethodField()

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
            'orders',
        ]

    def get_role(self, obj):
        return get_user_role(obj)

    def get_referred_by(self, obj):
        if not obj.referred_by_affiliate:
            return None
        p = obj.referred_by_affiliate
        return p.business_name or f"{p.user.first_name} {p.user.last_name}".strip()

    def get_orders(self, obj):
        # Orders carry no FK to User — customer identity is snapshotted onto the
        # order at checkout — so email is the only link back to an account.
        # A user with no email (or an order placed under a different one) simply
        # shows nothing here.
        if not obj.email:
            return []
        orders = (
            Order.objects
            .filter(customer_email__iexact=obj.email)
            .order_by('-created_at', '-id')
        )
        return [
            {
                'id': order.id,
                'order_type': order.billing_mode,
                'status': order.status,
                'total_amount': order.total_amount,
                'created_at': order.created_at,
                'recipient_first_name': order.recipient_first_name,
                'recipient_last_name': order.recipient_last_name,
            }
            for order in orders
        ]
