from django.urls import path
from partners.views import (
    BusinessAccountRegistrationView,
    BusinessAccountDashboardView,
    CommissionListView,
    BusinessAccountUpdateView,
    DeliveryRequestListView,
    FloristDeliveryDetailView,
    FloristMarkDeliveredView,
    AvailableDeliveryListView,
    AvailableDeliveryDetailView,
    ClaimDeliveryView,
    StripeConnectOnboardView,
    StripeConnectStatusView,
    PayoutListView,
    PayoutDetailView,
    AdminBusinessAccountListView,
    AdminBusinessAccountDetailView,
    AdminApproveBusinessAccountView,
    AdminDenyBusinessAccountView,
    AdminPayCommissionView,
    AdminCommissionListView,
    AdminCommissionDetailView,
    AdminApproveCommissionView,
    AdminDenyCommissionView,
    AffiliateDiscountCodeListCreateView,
)

urlpatterns = [
    path('register/', BusinessAccountRegistrationView.as_view(), name='business-account-register'),
    path('dashboard/', BusinessAccountDashboardView.as_view(), name='business-account-dashboard'),
    path('commissions/', CommissionListView.as_view(), name='commission-list'),
    path('update/', BusinessAccountUpdateView.as_view(), name='business-account-update'),
    path('discount-codes/', AffiliateDiscountCodeListCreateView.as_view(), name='affiliate-discount-code-list-create'),

    path('available-deliveries/', AvailableDeliveryListView.as_view(), name='available-delivery-list'),
    path('available-deliveries/<int:event_id>/', AvailableDeliveryDetailView.as_view(), name='available-delivery-detail'),
    path('available-deliveries/<int:event_id>/claim/', ClaimDeliveryView.as_view(), name='claim-delivery'),

    path('delivery-requests/', DeliveryRequestListView.as_view(), name='delivery-request-list'),
    path('delivery-requests/<int:delivery_id>/', FloristDeliveryDetailView.as_view(), name='florist-delivery-detail'),
    path('delivery-requests/<int:delivery_id>/mark-delivered/', FloristMarkDeliveredView.as_view(), name='florist-mark-delivered'),

    path('admin/commissions/', AdminCommissionListView.as_view(), name='admin-commission-list'),
    path('admin/commissions/<int:pk>/', AdminCommissionDetailView.as_view(), name='admin-commission-detail'),
    path('admin/commissions/<int:pk>/approve/', AdminApproveCommissionView.as_view(), name='admin-approve-commission'),
    path('admin/commissions/<int:pk>/deny/', AdminDenyCommissionView.as_view(), name='admin-deny-commission'),

    path('admin/list/', AdminBusinessAccountListView.as_view(), name='admin-business-account-list'),
    path('admin/<int:pk>/', AdminBusinessAccountDetailView.as_view(), name='admin-business-account-detail'),
    path('admin/<int:pk>/approve/', AdminApproveBusinessAccountView.as_view(), name='admin-approve-business-account'),
    path('admin/<int:pk>/deny/', AdminDenyBusinessAccountView.as_view(), name='admin-deny-business-account'),
    path('admin/<int:pk>/commissions/<int:commission_id>/pay/', AdminPayCommissionView.as_view(), name='admin-pay-commission'),

    path('stripe-connect/onboard/', StripeConnectOnboardView.as_view(), name='stripe-connect-onboard'),
    path('stripe-connect/status/', StripeConnectStatusView.as_view(), name='stripe-connect-status'),
    path('payouts/', PayoutListView.as_view(), name='payout-list'),
    path('payouts/<int:payout_id>/', PayoutDetailView.as_view(), name='payout-detail'),
]
