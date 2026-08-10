from rest_framework import serializers

from events.models import Event


class AvailableDeliverySerializer(serializers.ModelSerializer):
    """
    What a florist sees on the claim board, before claiming.

    Deliberately withholds the street address, recipient name, phone, card
    message, and delivery notes: every active florist whose radius covers the
    delivery can see this, and none of them has committed to the job yet.
    Suburb and state are enough to judge the drive. The full detail unlocks on
    the token page once claimed.

    The money, by contrast, is shown in full — see the breakdown below.
    """
    suburb = serializers.CharField(source='order.recipient_suburb', read_only=True)
    state = serializers.CharField(source='order.recipient_state', read_only=True)
    postcode = serializers.CharField(source='order.recipient_postcode', read_only=True)
    occasion = serializers.CharField(source='order.get_occasion_display', read_only=True)
    flower_notes = serializers.CharField(source='order.flower_notes', read_only=True)
    preferred_delivery_time = serializers.CharField(
        source='order.preferred_delivery_time', read_only=True
    )
    # The full money breakdown, matching the florist brief: the customer's
    # budget, our cut, and what the florist keeps. Showing the commission openly
    # is the point — a florist should be able to check our arithmetic before
    # deciding whether the job is worth claiming.
    budget = serializers.DecimalField(
        source='order.budget', max_digits=10, decimal_places=2, read_only=True
    )
    platform_commission = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    commission_rate = serializers.SerializerMethodField()
    florist_budget = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    delivery_fee = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    florist_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'reference', 'delivery_date', 'preferred_delivery_time',
            'suburb', 'state', 'postcode',
            'occasion', 'flower_notes',
            'budget', 'platform_commission', 'commission_rate',
            'florist_budget', 'delivery_fee', 'florist_total',
        ]

    def get_commission_rate(self, obj):
        """The rate as a percentage string, e.g. "10%" — same label as the brief."""
        from decimal import Decimal
        from django.conf import settings

        rate = (Decimal(str(settings.FLORIST_COMMISSION_RATE)) * 100).quantize(Decimal('0.01')).normalize()
        return f'{rate:f}%'
