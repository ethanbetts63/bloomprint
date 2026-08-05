from rest_framework import serializers
from events.models import Event


class AdminEventListSerializer(serializers.ModelSerializer):
    """
    Row shape for the admin Events table. Carries just enough order context to
    identify a delivery at a glance; the full picture lives on the event detail
    page, so this deliberately stays smaller than AdminEventSerializer.
    """
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_type = serializers.CharField(source='order.billing_mode', read_only=True)
    budget = serializers.DecimalField(
        source='order.budget', max_digits=10, decimal_places=2, read_only=True
    )
    recipient_first_name = serializers.CharField(source='order.recipient_first_name', read_only=True)
    recipient_last_name = serializers.CharField(source='order.recipient_last_name', read_only=True)
    recipient_suburb = serializers.CharField(source='order.recipient_suburb', read_only=True)
    recipient_city = serializers.CharField(source='order.recipient_city', read_only=True)
    customer_first_name = serializers.CharField(source='order.customer_first_name', read_only=True)
    customer_last_name = serializers.CharField(source='order.customer_last_name', read_only=True)
    customer_email = serializers.EmailField(source='order.customer_email', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id',
            'delivery_date',
            'status',
            'ordered_at',
            'delivered_at',
            'order_id',
            'order_type',
            'budget',
            'recipient_first_name',
            'recipient_last_name',
            'recipient_suburb',
            'recipient_city',
            'customer_first_name',
            'customer_last_name',
            'customer_email',
        ]
