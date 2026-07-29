from rest_framework import serializers
from partners.models import Commission


class AdminCommissionDetailSerializer(serializers.ModelSerializer):
    business_account_name = serializers.SerializerMethodField()
    business_account_id = serializers.IntegerField(source='business_account.id', read_only=True)
    account_type = serializers.CharField(source='business_account.account_type', read_only=True)
    stripe_connect_onboarding_complete = serializers.BooleanField(
        source='business_account.stripe_connect_onboarding_complete', read_only=True
    )
    stripe_connect_account_id = serializers.CharField(
        source='business_account.stripe_connect_account_id', read_only=True
    )

    class Meta:
        model = Commission
        fields = [
            'id',
            'commission_type',
            'amount',
            'status',
            'note',
            'created_at',
            'event',
            'business_account_name',
            'business_account_id',
            'account_type',
            'stripe_connect_onboarding_complete',
            'stripe_connect_account_id',
        ]

    def get_business_account_name(self, obj):
        account = obj.business_account
        if account.business_name:
            return account.business_name
        return f"{account.user.first_name} {account.user.last_name}".strip() or account.user.email
