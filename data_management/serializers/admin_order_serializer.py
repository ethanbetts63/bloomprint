from rest_framework import serializers
from events.models import Order


class AdminOrderSerializer(serializers.ModelSerializer):
    order_type = serializers.CharField(source='billing_mode', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_type',
            'status',
            'budget',
            'total_amount',
            'frequency',
            'start_date',
            'created_at',
            'recipient_first_name',
            'recipient_last_name',
            'customer_first_name',
            'customer_last_name',
            'customer_email',
        ]
