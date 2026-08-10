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
    florist_budget = serializers.SerializerMethodField()
    delivery_fee = serializers.SerializerMethodField()
    florist_total = serializers.SerializerMethodField()

    def _money(self, obj):
        return obj.event.money_breakdown()

    def get_florist_budget(self, obj):
        return str(self._money(obj)['florist_budget'])

    def get_delivery_fee(self, obj):
        return str(self._money(obj)['delivery_fee'])

    def get_florist_total(self, obj):
        return str(self._money(obj)['florist_total'])

    class Meta:
        model = DeliveryRequest
        fields = [
            'id', 'reference', 'delivery_date', 'recipient_name',
            'florist_budget', 'delivery_fee', 'florist_total',
            'status', 'token', 'created_at',
        ]

    def get_recipient_name(self, obj):
        order = obj.event.order
        return f'{order.recipient_first_name or ""} {order.recipient_last_name or ""}'.strip()
