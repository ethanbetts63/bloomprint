from rest_framework import serializers
from partners.models import Partner, DiscountCode, Commission, DeliveryRequest
from django.db.models import Sum, Count


class DiscountCodeSerializer(serializers.ModelSerializer):
    total_uses = serializers.SerializerMethodField()

    class Meta:
        model = DiscountCode
        fields = ['id', 'code', 'discount_amount', 'is_active', 'total_uses', 'created_at']

    def get_total_uses(self, obj):
        return obj.usages.count()


class CommissionSummarySerializer(serializers.Serializer):
    total_earned = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_pending = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_approved = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=10, decimal_places=2)


class CommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commission
        fields = ['id', 'commission_type', 'amount', 'status', 'note', 'created_at']


class DeliveryRequestDashboardSerializer(serializers.ModelSerializer):
    event_id = serializers.IntegerField(source='event.id')
    delivery_date = serializers.DateField(source='event.delivery_date')
    recipient_name = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryRequest
        fields = ['id', 'event_id', 'delivery_date', 'recipient_name', 'status', 'token', 'expires_at', 'created_at']

    def get_recipient_name(self, obj):
        order = obj.event.order
        return getattr(order, 'recipient_name', '')


class PartnerDashboardSerializer(serializers.ModelSerializer):
    discount_codes = serializers.SerializerMethodField()
    commission_summary = serializers.SerializerMethodField()
    recent_commissions = serializers.SerializerMethodField()
    delivery_requests = serializers.SerializerMethodField()
    stripe_connect_onboarding_complete = serializers.BooleanField(read_only=True)
    payout_summary = serializers.SerializerMethodField()

    class Meta:
        model = Partner
        fields = [
            'id', 'partner_type', 'status', 'business_name', 'phone',
            'discount_codes', 'commission_summary',
            'recent_commissions', 'delivery_requests',
            'street_address', 'suburb', 'city', 'state', 'postcode', 'country',
            'latitude', 'longitude', 'service_radius_km',
            'stripe_connect_onboarding_complete', 'payout_summary',
            'created_at',
        ]

    def get_commission_summary(self, obj):
        commissions = obj.commissions.all()
        return CommissionSummarySerializer({
            'total_earned': commissions.aggregate(total=Sum('amount'))['total'] or 0,
            'total_pending': commissions.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0,
            'total_approved': commissions.filter(status='approved').aggregate(total=Sum('amount'))['total'] or 0,
            'total_paid': commissions.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0,
        }).data

    def get_discount_codes(self, obj):
        if obj.partner_type != 'non_delivery':
            return []
        return DiscountCodeSerializer(obj.discount_codes.all(), many=True).data

    def get_recent_commissions(self, obj):
        recent = obj.commissions.order_by('-created_at')[:20]
        return CommissionSerializer(recent, many=True).data

    def get_delivery_requests(self, obj):
        if obj.partner_type != 'delivery':
            return []
        requests = obj.delivery_requests.order_by('-created_at')[:20]
        return DeliveryRequestDashboardSerializer(requests, many=True).data

    def get_payout_summary(self, obj):
        payouts = obj.payouts.all()
        return {
            'total_paid': payouts.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0,
            'total_pending': payouts.filter(status__in=['pending', 'processing']).aggregate(total=Sum('amount'))['total'] or 0,
        }
