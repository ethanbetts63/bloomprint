from django.urls import path
from .views.guest_checkout_view import GuestCheckoutView

urlpatterns = [
    path('guest-checkout/<str:action>/', GuestCheckoutView.as_view(), name='guest-checkout'),
]
