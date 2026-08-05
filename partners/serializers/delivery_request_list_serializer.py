from rest_framework import serializers

from partners.models import DeliveryRequest


class DeliveryRequestListSerializer(serializers.ModelSerializer):
    """
    What a florist sees for a delivery offered to them.

    Deliberately exposes the event's reference rather than its primary key, and
    the florist's own budget rather than the customer's — a florist quoting
    "Event #7" reveals Bloom Print's volume, and a florist shown the customer's
    budget would expect to be paid it.
    """
    reference = serializers.CharField(source='event.reference', read_only=True)
    delivery_date = serializers.DateField(source='event.delivery_date')
    recipient_name = serializers.SerializerMethodField()
    florist_budget = serializers.DecimalField(
        source='event.florist_budget', max_digits=10, decimal_places=2, read_only=True
    )
    delivery_fee = serializers.DecimalField(
        source='event.delivery_fee', max_digits=10, decimal_places=2, read_only=True
    )
    florist_total = serializers.DecimalField(
        source='event.florist_total', max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = DeliveryRequest
        fields = [
            'id', 'reference', 'delivery_date', 'recipient_name',
            'florist_budget', 'delivery_fee', 'florist_total',
            'status', 'token', 'expires_at', 'created_at',
        ]

    def get_recipient_name(self, obj):
        order = obj.event.order
        return f'{order.recipient_first_name or ""} {order.recipient_last_name or ""}'.strip()
