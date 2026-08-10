from rest_framework import serializers

from partners.models import DeliveryRequest


class DeliveryRequestListSerializer(serializers.ModelSerializer):
    """
    A row in the florist's list of deliveries they have claimed.

    Exposes the event's reference rather than its primary key: a florist quoting
    "Event #7" reveals Bloom Print's volume.

    Only the florist's own figures appear here, because this lists work already
    taken. The customer's budget and our commission are shown in full on the
    claim board and the brief, where a florist is still deciding whether the job
    is worth taking.
    """
    reference = serializers.CharField(source='event.reference', read_only=True)
    delivery_date = serializers.DateField(source='event.delivery_date')
    recipient_name = serializers.SerializerMethodField()
    florist_budget = serializers.SerializerMethodField()
    delivery_fee = serializers.SerializerMethodField()
    florist_total = serializers.SerializerMethodField()

    def _money(self, obj):
        # Cached per row: three fields read this, and recomputing the breakdown
        # once each turned a 50-row page into 150 identical calculations.
        cache = self.context.setdefault('_money_cache', {})
        if obj.pk not in cache:
            cache[obj.pk] = obj.event.money_breakdown()
        return cache[obj.pk]

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
            'status', 'created_at',
        ]

    def get_recipient_name(self, obj):
        order = obj.event.order
        return f'{order.recipient_first_name or ""} {order.recipient_last_name or ""}'.strip()
