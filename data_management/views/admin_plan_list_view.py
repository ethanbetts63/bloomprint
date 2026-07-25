from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Q
from events.models import Order
from data_management.serializers.admin_plan_serializer import AdminPlanSerializer


class AdminPlanListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get('status', '').strip()
        plan_type_filter = request.query_params.get('plan_type', '').strip()
        search = request.query_params.get('search', '').strip()

        orders_qs = Order.objects.all()

        if status_filter:
            orders_qs = orders_qs.filter(status=status_filter)

        if plan_type_filter:
            orders_qs = orders_qs.filter(billing_mode=plan_type_filter)

        if search:
            q = (
                Q(customer_first_name__icontains=search)
                | Q(customer_last_name__icontains=search)
                | Q(customer_email__icontains=search)
                | Q(recipient_first_name__icontains=search)
                | Q(recipient_last_name__icontains=search)
            )
            orders_qs = orders_qs.filter(q)

        orders = orders_qs.order_by('-created_at')

        return Response(AdminPlanSerializer(orders, many=True).data)
