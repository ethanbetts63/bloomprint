"""
The outbound message log.

Every email and SMS the platform sends is already recorded as a Notification —
customer confirmations, admin alerts, florist fan-outs, claim confirmations, and
hand-written outreach. These views expose that record so an admin can answer
"what did we actually send them, and did it arrive?" without reading the
database.
"""
from django.db.models import Q
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAdminUser

from config.pagination import DashboardPagination
from data_management.models import Notification
from data_management.serializers.admin_notification_serializer import (
    AdminNotificationDetailSerializer,
    AdminNotificationListSerializer,
)

ORDERING_MAP = {
    'recipient_type': ('recipient_type',),
    'subject': ('subject',),
    'status': ('status',),
    'channel': ('channel',),
    'sent_at': ('sent_at',),
    'created_at': ('created_at',),
}


class AdminNotificationListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminNotificationListSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        params = self.request.query_params
        queryset = Notification.objects.select_related(
            'related_event', 'recipient_business_account', 'recipient_business_account__user'
        )

        # Scoping to one delivery is what powers the history box on the event
        # page; without it this is the full log.
        event_id = params.get('related_event', '').strip()
        if event_id.isdigit():
            queryset = queryset.filter(related_event_id=int(event_id))

        for field in ('status', 'channel', 'recipient_type'):
            value = params.get(field, '').strip()
            if value:
                queryset = queryset.filter(**{
                    f'{field}__in': [part.strip() for part in value.split(',') if part.strip()]
                })

        search = params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search)
                | Q(body__icontains=search)
                | Q(recipient_email__icontains=search)
                | Q(related_event__reference__icontains=search)
                | Q(recipient_business_account__business_name__icontains=search)
            )

        ordering = params.get('ordering', '').strip() or '-created_at'
        descending = ordering.startswith('-')
        fields = ORDERING_MAP.get(ordering.lstrip('-'), ('created_at',))
        if descending:
            fields = tuple(f'-{field}' for field in fields)
        return queryset.order_by(*fields, '-id')


class AdminNotificationDetailView(RetrieveAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminNotificationDetailSerializer

    def get_object(self):
        notification = Notification.objects.select_related(
            'related_event', 'recipient_business_account', 'recipient_business_account__user'
        ).filter(pk=self.kwargs['pk']).first()
        if notification is None:
            raise NotFound('Message not found.')
        return notification
