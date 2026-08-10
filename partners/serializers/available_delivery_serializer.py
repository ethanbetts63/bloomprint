from rest_framework import serializers

from events.models import Event


class AvailableDeliverySerializer(serializers.ModelSerializer):
    """
    What a florist sees on the claim board, before claiming.

    Deliberately withholds the street address, recipient name, phone, and card
    message: every active florist whose radius covers the delivery can see this,
    and none of them has committed to the job yet. Suburb and state are enough
    to judge the drive. The full detail unlocks on the token page once claimed.
    """
    suburb = serializers.CharField(source='order.recipient_suburb', read_only=True)
    state = serializers.CharField(source='order.recipient_state', read_only=True)
    postcode = serializers.CharField(source='order.recipient_postcode', read_only=True)
    occasion = serializers.CharField(source='order.occasion', read_only=True)
    flower_notes = serializers.CharField(source='order.flower_notes', read_only=True)
    florist_budget = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    delivery_fee = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    florist_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'reference', 'delivery_date',
            'suburb', 'state', 'postcode',
            'occasion', 'flower_notes',
            'florist_budget', 'delivery_fee', 'florist_total',
        ]
