from django.contrib import admin

from .models import Event, Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'recipient_name', 'recipient_suburb', 'recipient_state',
        'is_geocoded', 'status', 'created_at',
    ]
    # "Geocoded" is filterable because an order without coordinates is invisible
    # to every florist — it is the first thing to check when a delivery is not
    # reaching anyone.
    list_filter = ['status', 'billing_mode', ('latitude', admin.EmptyFieldListFilter)]
    search_fields = [
        'id', 'customer_email', 'recipient_first_name', 'recipient_last_name',
        'recipient_suburb', 'recipient_postcode',
    ]
    actions = ['geocode_selected_orders']

    @admin.display(description='Recipient')
    def recipient_name(self, obj):
        return f'{obj.recipient_first_name or ""} {obj.recipient_last_name or ""}'.strip() or '—'

    @admin.display(description='Geocoded', boolean=True)
    def is_geocoded(self, obj):
        return obj.latitude is not None and obj.longitude is not None

    @admin.action(description='Geocode selected orders (Nominatim, ~1/second)')
    def geocode_selected_orders(self, request, queryset):
        from events.utils.geocoding import geocode_order

        street = suburb = failed = 0
        for order in queryset:
            precision = geocode_order(order)
            if precision == 'street':
                street += 1
            elif precision == 'suburb':
                suburb += 1
            else:
                failed += 1

        self.message_user(
            request,
            f'{street} geocoded exactly, {suburb} to suburb level, {failed} failed.',
            level='WARNING' if failed else 'INFO',
        )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        'reference', 'delivery_date', 'status', 'delivery_area',
        'claimed_by', 'florist_total',
    ]
    list_filter = ['status', 'delivery_date']
    search_fields = ['reference', 'order__recipient_suburb', 'order__recipient_last_name']
    date_hierarchy = 'delivery_date'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order')

    @admin.display(description='Area')
    def delivery_area(self, obj):
        parts = [obj.order.recipient_suburb, obj.order.recipient_state]
        return ', '.join(part for part in parts if part) or '—'

    @admin.display(description='Claimed by')
    def claimed_by(self, obj):
        claim = obj.delivery_requests.filter(status='accepted').select_related('business_account').first()
        if not claim:
            return 'Unclaimed'
        return claim.business_account.business_name or str(claim.business_account)
