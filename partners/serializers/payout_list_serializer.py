from rest_framework import serializers

from partners.models import Payout


class PayoutListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = [
            'id', 'payout_type', 'amount', 'currency', 'status',
            'period_start', 'period_end', 'created_at',
        ]
