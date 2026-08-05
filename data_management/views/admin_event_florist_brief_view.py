from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from data_management.utils.florist_brief_pdf import build_florist_brief
from events.models import Event


class AdminEventFloristBriefView(APIView):
    """
    Returns the printable one-page florist brief for a delivery event as a PDF.

    Admins print this and hand it to a florist in person, so it carries the
    delivery details, the customer's brief, and the amount available to spend on
    flowers after commission.
    """

    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            event = Event.objects.select_related('order').get(pk=pk)
        except Event.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        pdf_bytes = build_florist_brief(event)
        filename = f"bloomprint-florist-brief-delivery-{event.pk}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = str(len(pdf_bytes))
        return response
