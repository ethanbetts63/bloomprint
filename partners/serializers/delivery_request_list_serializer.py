from rest_framework import serializers

from partners.models import DeliveryRequest


class DeliveryRequestListSerializer(serializers.ModelSerializer):
    event_id = serializers.IntegerField(source='event.id')
    delivery_date = serializers.DateField(source='event.delivery_date')
    recipient_name = serializers.SerializerMethodField()
    budget = serializers.DecimalField(source='event.order.budget', max_digits=10, decimal_places=2)

    class Meta:
        model = DeliveryRequest
        fields = [
            'id', 'event_id', 'delivery_date', 'recipient_name', 'budget',
            'status', 'token', 'expires_at', 'created_at',
        ]

    def get_recipient_name(self, obj):
        order = obj.event.order
        return f'{order.recipient_first_name or ""} {order.recipient_last_name or ""}'.strip()
