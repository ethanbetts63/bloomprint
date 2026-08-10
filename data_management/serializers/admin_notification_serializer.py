from rest_framework import serializers

from data_management.models import Notification


class AdminNotificationListSerializer(serializers.ModelSerializer):
    """
    A row in the outbound message log.

    `to` is resolved rather than stored: an admin notification goes to the
    configured admin address, a business-account one to the account's user, and
    customer or florist-prospect mail to an address held on the row itself.
    """
    to = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    related_event_reference = serializers.CharField(
        source='related_event.reference', read_only=True, default=None
    )

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient_type', 'to', 'recipient_name', 'channel',
            'subject', 'status', 'scheduled_for', 'sent_at', 'created_at',
            'related_event', 'related_event_reference',
        ]

    def get_to(self, obj):
        from data_management.utils.send_notification import resolve_recipient

        email, phone = resolve_recipient(obj)
        return (phone if obj.channel == 'sms' else email) or '—'

    def get_recipient_name(self, obj):
        if obj.recipient_business_account:
            account = obj.recipient_business_account
            return account.business_name or str(account)
        if obj.recipient_type == 'admin':
            return 'Bloom Print admin'
        return None


class AdminNotificationDetailSerializer(AdminNotificationListSerializer):
    """The full record, including the body actually sent and any failure."""

    class Meta(AdminNotificationListSerializer.Meta):
        fields = AdminNotificationListSerializer.Meta.fields + ['body', 'error_message']
