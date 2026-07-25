from django.conf import settings
from django.db import transaction
from django.middleware.csrf import get_token
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from data_management.models import TermsAndConditions
from events.models import CheckoutSession, Order
from events.serializers import OrderSerializer
from partners.serializers import ValidateDiscountCodeSerializer
from payments.utils.checkout import (
    start_order_payment,
    validate_order_ready_for_payment,
)

CHECKOUT_COOKIE = 'guest_checkout_token'


def _discount_already_used_by_email(code, email):
    """
    Whether this discount code has already been redeemed by this email.
    Orders store the customer email directly, so it is the identity that
    persists across checkouts. (Card fingerprint tracking would be stronger;
    deliberately deferred.)
    """
    from partners.models import DiscountUsage
    return DiscountUsage.objects.filter(
        discount_code__code__iexact=code,
        payment__order__customer_email__iexact=email,
    ).exists()


class GuestCheckoutView(APIView):
    """Guest checkout API. The opaque cookie authorizes exactly one draft order."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []

    def _set_cookie(self, response, token, request):
        get_token(request)
        response.set_cookie(
            CHECKOUT_COOKIE,
            token,
            max_age=int(settings.GUEST_CHECKOUT_LIFETIME.total_seconds()),
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
        )

    def _session(self, request):
        token = request.COOKIES.get(CHECKOUT_COOKIE)
        if not token:
            return None
        try:
            session = CheckoutSession.objects.select_related('order').get(
                token_hash=CheckoutSession.hash_token(token)
            )
        except CheckoutSession.DoesNotExist:
            return None
        return None if session.is_expired else session

    def _require_session(self, request):
        session = self._session(request)
        if not session:
            return None, Response({'detail': 'Your checkout session has expired. Please start again.'}, status=410)
        if session.order.status != 'pending_payment':
            return None, Response({'detail': 'This checkout is no longer editable.'}, status=400)
        return session, None

    def post(self, request, action):
        if action == 'start':
            return self.start(request)
        session, error = self._require_session(request)
        if error:
            return error
        if action == 'order':
            return self.update_order(request, session)
        if action == 'claim':
            return self.claim(request, session)
        if action == 'make-recurring':
            return self.make_recurring(request, session)
        if action == 'make-one-time':
            return self.make_one_time(session)
        if action == 'accept-terms':
            return self.accept_terms(session)
        if action == 'discount':
            return self.discount(request, session)
        if action == 'checkout':
            return self.checkout(session)
        return Response({'detail': 'Unknown checkout action.'}, status=404)

    def get(self, request, action):
        session = self._session(request)
        if not session:
            return Response({'detail': 'Your checkout session has expired. Please start again.'}, status=410)
        if action == 'order':
            order = session.order
            data = OrderSerializer(order).data
            data['customer_email'] = order.customer_email or ''
            data['customer_first_name'] = order.customer_first_name or ''
            data['customer_last_name'] = order.customer_last_name or ''
            data['terms_accepted'] = self._has_accepted_current_terms(order)
            return Response(data)
        return Response({'detail': 'Unknown checkout action.'}, status=404)

    def _has_accepted_current_terms(self, order):
        latest = TermsAndConditions.objects.filter(terms_type='customer').order_by('-published_at').first()
        if not latest:
            return False
        return order.accepted_terms_id == latest.id

    @transaction.atomic
    def start(self, request):
        existing = self._session(request)
        if existing and existing.order.status == 'pending_payment':
            order = existing.order
        else:
            order = Order.objects.create(billing_mode='one_time')
            _, token = CheckoutSession.create_for_order(order)

        serializer = OrderSerializer(order, data=request.data.get('brief', {}), partial=True)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        response = Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        if not (existing and existing.order.status == 'pending_payment'):
            self._set_cookie(response, token, request)
        return response

    def update_order(self, request, session):
        serializer = OrderSerializer(session.order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(OrderSerializer(serializer.save()).data)

    @transaction.atomic
    def claim(self, request, session):
        email = str(request.data.get('email', '')).strip().lower()
        first_name = str(request.data.get('first_name', '')).strip()
        last_name = str(request.data.get('last_name', '')).strip()
        if not email or not first_name or not last_name:
            return Response({'detail': 'First name, last name, and email are required.'}, status=400)

        order = session.order
        order.customer_email = email
        order.customer_first_name = first_name
        order.customer_last_name = last_name
        order.save(update_fields=['customer_email', 'customer_first_name', 'customer_last_name'])

        session.customer_email = email
        session.save(update_fields=['customer_email', 'updated_at'])
        return Response(OrderSerializer(order).data)

    def make_recurring(self, request, session):
        frequency = request.data.get('frequency')
        if frequency not in dict(Order.FREQUENCY_CHOICES):
            return Response({'frequency': 'Choose a valid delivery frequency.'}, status=400)

        order = session.order
        order.make_recurring(frequency)
        return Response(OrderSerializer(order).data)

    def make_one_time(self, session):
        order = session.order
        order.make_one_time()
        return Response(OrderSerializer(order).data)

    def discount(self, request, session):
        serializer = ValidateDiscountCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data.get('code', '')
        if code and session.customer_email and _discount_already_used_by_email(code, session.customer_email):
            return Response({'code': ['This discount code has already been used.']}, status=400)
        return Response(serializer.apply_discount(session.order))

    def accept_terms(self, session):
        latest = TermsAndConditions.objects.filter(terms_type='customer').order_by('-published_at').first()
        if not latest:
            return Response({'detail': 'Customer terms are unavailable.'}, status=404)
        order = session.order
        created = order.accepted_terms_id != latest.id
        order.accepted_terms = latest
        if order.terms_accepted_at is None:
            order.terms_accepted_at = timezone.now()
        order.save(update_fields=['accepted_terms', 'terms_accepted_at'])
        return Response({'accepted': True, 'created': created}, status=201 if created else 200)

    def checkout(self, session):
        order = session.order
        if not session.customer_email:
            return Response({'detail': 'Enter your contact details before payment.'}, status=400)

        if order.discount_code and _discount_already_used_by_email(
            order.discount_code.code, session.customer_email
        ):
            order.discount_code = None
            order.discount_amount = 0
            order.save()
            return Response(
                {'detail': 'This discount code has already been used with this email. '
                           'It has been removed — please review your total and try again.'},
                status=400,
            )

        problem = validate_order_ready_for_payment(order)
        if problem:
            return Response({'detail': problem}, status=400)

        return Response({'clientSecret': start_order_payment(order)})
