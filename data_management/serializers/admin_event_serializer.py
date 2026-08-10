from rest_framework import serializers
from events.models import Event


class AdminEventSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id')
    order_type = serializers.CharField(source='order.billing_mode')
    budget = serializers.DecimalField(source='order.budget', max_digits=10, decimal_places=2)
    total_amount = serializers.DecimalField(source='order.total_amount', max_digits=10, decimal_places=2)
    frequency = serializers.CharField(source='order.frequency')
    start_date = serializers.DateField(source='order.start_date')
    preferred_delivery_time = serializers.CharField(source='order.preferred_delivery_time')
    delivery_notes = serializers.CharField(source='order.delivery_notes')

    recipient_first_name = serializers.CharField(source='order.recipient_first_name')
    recipient_last_name = serializers.CharField(source='order.recipient_last_name')
    recipient_street_address = serializers.CharField(source='order.recipient_street_address')
    recipient_suburb = serializers.CharField(source='order.recipient_suburb')
    recipient_city = serializers.CharField(source='order.recipient_city')
    recipient_state = serializers.CharField(source='order.recipient_state')
    recipient_postcode = serializers.CharField(source='order.recipient_postcode')
    recipient_country = serializers.CharField(source='order.recipient_country')
    # Null means the address was never geocoded, so this delivery reaches no
    # florist — worth seeing on the detail page rather than having to guess.
    latitude = serializers.FloatField(source='order.latitude', allow_null=True)
    longitude = serializers.FloatField(source='order.longitude', allow_null=True)

    flower_notes = serializers.CharField(source='order.flower_notes')

    customer_first_name = serializers.CharField(source='order.customer_first_name')
    customer_last_name = serializers.CharField(source='order.customer_last_name')
    customer_email = serializers.EmailField(source='order.customer_email')

    class Meta:
        model = Event
        fields = [
            'id', 'reference', 'delivery_date', 'status', 'message',
            'ordered_at', 'ordering_evidence_text',
            'delivered_at', 'delivery_evidence_text',
            'florist_budget', 'platform_commission', 'delivery_fee',
            'order_id', 'order_type', 'budget', 'total_amount', 'frequency',
            'start_date', 'preferred_delivery_time', 'delivery_notes',
            'recipient_first_name', 'recipient_last_name', 'recipient_street_address',
            'recipient_suburb', 'recipient_city', 'recipient_state',
            'recipient_postcode', 'recipient_country',
            'latitude', 'longitude',
            'flower_notes',
            'customer_first_name', 'customer_last_name', 'customer_email',
        ]
