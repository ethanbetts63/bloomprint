from rest_framework import serializers
from partners.models import Partner, DiscountCode, Commission
from django.db.models import Count, Sum


class DiscountCodeSerializer(serializers.ModelSerializer):
    total_uses = serializers.SerializerMethodField()

    class Meta:
        model = DiscountCode
        fields = ['id', 'code', 'discount_amount', 'is_active', 'total_uses', 'created_at']

    def get_total_uses(self, obj):
        return obj.usage_count if hasattr(obj, 'usage_count') else obj.usages.count()


class CommissionSummarySerializer(serializers.Serializer):
    total_earned = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_pending = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_approved = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=10, decimal_places=2)


class CommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commission
        fields = ['id', 'commission_type', 'amount', 'status', 'note', 'created_at']


class PartnerDashboardSerializer(serializers.ModelSerializer):
    account_type = serializers.SerializerMethodField()
    discount_code_summary = serializers.SerializerMethodField()
    commission_summary = serializers.SerializerMethodField()
    stripe_connect_onboarding_complete = serializers.BooleanField(read_only=True)
    payout_summary = serializers.SerializerMethodField()

    class Meta:
        model = Partner
        fields = [
            'id', 'account_type', 'status', 'business_name', 'phone',
            'commission_summary', 'discount_code_summary',
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

    def get_account_type(self, obj):
        return 'florist' if obj.partner_type == 'delivery' else 'affiliate'

    def get_discount_code_summary(self, obj):
        if obj.partner_type != 'non_delivery':
            return {'active_codes': 0, 'total_uses': 0}
        return {
            'active_codes': obj.discount_codes.filter(is_active=True).count(),
            'total_uses': DiscountCode.objects.filter(partner=obj).aggregate(total=Count('usages'))['total'] or 0,
        }

    def get_payout_summary(self, obj):
        payouts = obj.payouts.all()
        return {
            'total_paid': payouts.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0,
            'total_pending': payouts.filter(status__in=['pending', 'processing']).aggregate(total=Sum('amount'))['total'] or 0,
        }
