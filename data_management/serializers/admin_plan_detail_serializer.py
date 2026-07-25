from rest_framework import serializers
from events.models import Order


class AdminPlanDetailSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField(source='id', read_only=True)
    plan_type = serializers.CharField(source='billing_mode', read_only=True)
    events = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'plan_type', 'status', 'budget', 'total_amount',
            'frequency', 'start_date', 'created_at',
            'recipient_first_name', 'recipient_last_name',
            'recipient_street_address', 'recipient_suburb', 'recipient_city',
            'recipient_state', 'recipient_postcode', 'recipient_country',
            'delivery_notes', 'preferred_delivery_time',
            'flower_notes',
            'customer_id', 'customer_first_name', 'customer_last_name', 'customer_email',
            'events',
        ]

    def get_events(self, obj):
        return [
            {
                'id': e.id,
                'delivery_date': str(e.delivery_date),
                'status': e.status,
            }
            for e in obj.events.all().order_by('delivery_date')
        ]
