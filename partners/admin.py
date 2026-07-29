from django.contrib import admin
from partners.models import (
    BusinessAccount, DiscountCode, DiscountUsage, Commission,
    DeliveryRequest, Payout, PayoutLineItem,
)


class DiscountCodeInline(admin.StackedInline):
    model = DiscountCode
    extra = 0


@admin.register(BusinessAccount)
class BusinessAccountAdmin(admin.ModelAdmin):
    list_display = ['user', 'account_type', 'status', 'business_name', 'created_at']
    list_filter = ['account_type', 'status']
    search_fields = ['user__email', 'business_name']
    inlines = [DiscountCodeInline]


@admin.register(DiscountCode)
class DiscountCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'business_account', 'discount_amount', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['code', 'business_account__business_name']


@admin.register(DiscountUsage)
class DiscountUsageAdmin(admin.ModelAdmin):
    list_display = ['discount_code', 'payment', 'created_at']
    search_fields = ['discount_code__code', 'payment__order__customer_email']


@admin.register(Commission)
class CommissionAdmin(admin.ModelAdmin):
    list_display = ['business_account', 'commission_type', 'amount', 'status', 'created_at']
    list_filter = ['commission_type', 'status']
    search_fields = ['business_account__business_name']
    actions = ['approve_commissions']

    def approve_commissions(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='approved')
        self.message_user(request, f"{updated} commission(s) approved.")
    approve_commissions.short_description = "Approve selected commissions"


@admin.register(DeliveryRequest)
class DeliveryRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'event', 'business_account', 'status', 'expires_at', 'created_at']
    list_filter = ['status']
    search_fields = ['business_account__business_name', 'token']


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ['id', 'business_account', 'payout_type', 'amount', 'status', 'created_at']
    list_filter = ['payout_type', 'status']
    search_fields = ['business_account__business_name']


@admin.register(PayoutLineItem)
class PayoutLineItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'payout', 'amount', 'description', 'created_at']
