from django.urls import path
from .views.add_to_blocklist_view import AddToBlocklistView
from .views.blocklist_success_view import BlocklistSuccessView
from .views.terms_and_conditions_view import LatestTermsAndConditionsView
from .views.terms_acceptance_view import AcceptTermsView
from .views.admin_dashboard_view import AdminDashboardView
from .views.admin_event_list_view import AdminEventListView
from .views.admin_event_detail_view import AdminEventDetailView
from .views.admin_event_florist_brief_view import AdminEventFloristBriefView
from .views.admin_mark_ordered_view import AdminMarkOrderedView
from .views.admin_mark_delivered_view import AdminMarkDeliveredView
from .views.admin_order_list_view import AdminOrderListView
from .views.admin_order_detail_view import AdminOrderDetailView
from .views.admin_user_list_view import AdminUserListView
from .views.admin_user_detail_view import AdminUserDetailView

app_name = 'data_management'

urlpatterns = [
    path('blocklist/block/<str:signed_email>/', AddToBlocklistView.as_view(), name='add_to_blocklist'),
    path('blocklist-success/', BlocklistSuccessView.as_view(), name='blocklist_success'),
    path('terms/latest/', LatestTermsAndConditionsView.as_view(), name='latest-terms'),
    path('terms/accept/', AcceptTermsView.as_view(), name='accept-terms'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/orders/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/orders/<int:pk>/', AdminOrderDetailView.as_view(), name='admin-order-detail'),
    path('admin/events/', AdminEventListView.as_view(), name='admin-event-list'),
    path('admin/events/<int:pk>/', AdminEventDetailView.as_view(), name='admin-event-detail'),
    path('admin/events/<int:pk>/florist-brief/', AdminEventFloristBriefView.as_view(), name='admin-event-florist-brief'),
    path('admin/events/<int:pk>/mark-ordered/', AdminMarkOrderedView.as_view(), name='admin-mark-ordered'),
    path('admin/events/<int:pk>/mark-delivered/', AdminMarkDeliveredView.as_view(), name='admin-mark-delivered'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
]
