from django.shortcuts import render
from rest_framework import viewsets, permissions , status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import CustomerDocument,Customer, Invoice, Vendor, Item, Payment, Quote, ProformaInvoice, DeliveryChallan, InventoryAdjustment , Bill
from .serializers import CustomerDocumentSerializer,CustomerSerializer, InvoiceSerializer, VendorSerializer, ItemSerializer, PaymentSerializer, QuoteSerializer, ProformaInvoiceSerializer, DeliveryChallanSerializer, InventoryAdjustmentSerializer , BillSerializer

# Create your views here.
class CustomerDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for uploading, retrieving,
    and updating customer documents (files)."""
    queryset = CustomerDocument.objects.all().order_by(
        "-uploaded_at"
    )
    serializer_class = CustomerDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def retrieve(self, request, *args, **kwargs) -> Response:
        """Return file as response for GET /api/files/<id>/"""
        # Return file as response for GET /api/files/<id>/
        instance = self.get_object()
        file_handle = instance.file.open("rb")
        response = Response(
            file_handle.read(), content_type="application/octet-stream"
        )
        response["Content-Disposition"] = (
            f'inline; filename="{instance.file.name.split("/")[-1]}"'
        )
        return response

    def create(self, request, *args, **kwargs) -> Response:
        """Handle file upload."""
        # Handle file upload
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs) -> Response:
        """Handle file update (replace file)."""
        # Handle file update (replace file)
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class BillViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Bills."""
    queryset = Bill.objects.all().order_by("-created_at")
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated]
    
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]


# Vendor ViewSet
class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all().order_by('-created_at')
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]


# Item ViewSet
class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().order_by('-created_at')
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]


# Payment ViewSet
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]


# Quote ViewSet
class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all().order_by('-created_at')
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]


# ProformaInvoice ViewSet
class ProformaInvoiceViewSet(viewsets.ModelViewSet):
    queryset = ProformaInvoice.objects.all().order_by('-created_at')
    serializer_class = ProformaInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]


# DeliveryChallan ViewSet
class DeliveryChallanViewSet(viewsets.ModelViewSet):
    queryset = DeliveryChallan.objects.all().order_by('-created_at')
    serializer_class = DeliveryChallanSerializer
    permission_classes = [permissions.IsAuthenticated]


# InventoryAdjustment ViewSet
class InventoryAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = InventoryAdjustment.objects.all().order_by('-created_at')
    serializer_class = InventoryAdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated]