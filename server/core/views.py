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
    """ViewSet for managing Customers."""

    queryset = Customer.objects.prefetch_related("customerdocument_set", "contactperson_set").order_by("-created_at")
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Invoices."""

    queryset = Invoice.objects.select_related("customer").prefetch_related("invoiceitem_set", "files").order_by("-created_at")
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]


class VendorViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Vendors."""

    queryset = Vendor.objects.all().order_by("-created_at")  # No related fields to optimize
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]


class ItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Items."""

    queryset = Item.objects.all().order_by("-created_at")  # No related fields to optimize
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Payments."""

    queryset = Payment.objects.select_related("invoice").order_by("-created_at")
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
class QuoteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Quotes."""

    queryset = Quote.objects.select_related("customer").prefetch_related("quoteitem_set").order_by("-created_at")
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]
class ProformaInvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Proforma Invoices."""

    queryset = ProformaInvoice.objects.select_related("customer").prefetch_related("proformainvoiceitem_set").order_by("-created_at")
    serializer_class = ProformaInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]


class DeliveryChallanViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Delivery Challans."""

    queryset = DeliveryChallan.objects.select_related("customer").prefetch_related("deliverychallanitem_set").order_by("-created_at")
    serializer_class = DeliveryChallanSerializer
    permission_classes = [permissions.IsAuthenticated]


class InventoryAdjustmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Inventory Adjustments."""

    queryset = InventoryAdjustment.objects.all().order_by("-created_at")  # No related fields to optimize
    serializer_class = InventoryAdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated]


# Profit and Loss Report API
class ProfitAndLossReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Returns a Profit and Loss report for the given period, basis, and comparison.
        Query params:
        - time: "This Month", "Last Month", "This Year" (default: This Month)
        - basis: "Accrual" or "Cash" (default: Accrual)
        - compare_with: "None", "Last Month", "Last Year" (default: None)
        - customer_id: optional
        """
        from datetime import date, timedelta
        import calendar

        today = date.today()
        time_param = request.query_params.get("time", "This Month")
        basis = request.query_params.get("basis", "Accrual")
        compare_with = request.query_params.get("compare_with", "None")
        customer_id = request.query_params.get("customer_id")

        # Helper to get date range
        def get_range(period):
            if period == "This Month":
                start = today.replace(day=1)
                end = today
            elif period == "Last Month":
                first = today.replace(day=1) - timedelta(days=1)
                start = first.replace(day=1)
                end = first
            elif period == "This Year":
                start = today.replace(month=1, day=1)
                end = today
            elif period == "Last Year":
                start = today.replace(year=today.year-1, month=1, day=1)
                end = today.replace(year=today.year-1, month=12, day=calendar.monthrange(today.year-1, 12)[1])
            else:
                return None, None
            return start, end

        start_date, end_date = get_range(time_param)
        if not start_date or not end_date:
            return Response({"error": "Invalid time parameter."}, status=400)

        # Comparison range
        compare_data = None
        if compare_with and compare_with != "None":
            compare_start, compare_end = get_range(compare_with)
        else:
            compare_start = compare_end = None

        def get_report(start_date, end_date, summary_only=False):
            invoice_filter = Q(invoice_date__gte=start_date, invoice_date__lte=end_date)
            if customer_id:
                invoice_filter &= Q(customer_id=customer_id)
            invoices = Invoice.objects.filter(invoice_filter)
            operating_income = invoices.aggregate(total=Sum("total_amount"))['total'] or 0

            # Cost of Goods Sold (COGS): For now, treat all Bill total_amount as COGS
            bill_filter = Q(bill_date__gte=start_date, bill_date__lte=end_date)
            bills = Bill.objects.filter(bill_filter)
            cost_of_goods_sold = bills.aggregate(total=Sum("total_amount"))['total'] or 0

            gross_profit = operating_income - cost_of_goods_sold

            # Operating Expense: Not tracked separately, set to 0 (can be split from bills if needed)
            operating_expense = 0
            operating_profit = gross_profit - operating_expense

            # Non Operating Income/Expense: Not tracked, set to 0
            non_operating_income = 0
            non_operating_expense = 0

            net_profit_loss = operating_profit + non_operating_income - non_operating_expense

            payments = Payment.objects.filter(
                invoice__in=invoices,
                date__gte=start_date,
                date__lte=end_date,
            )
            payments_total = payments.aggregate(total=Sum("amount"))['total'] or 0

            if not summary_only:
                invoice_breakdown = [
                    {
                        "id": inv.id,
                        "invoice_number": inv.invoice_number,
                        "date": inv.invoice_date,
                        "customer": inv.customer.display_name,
                        "total_amount": float(inv.total_amount),
                    }
                    for inv in invoices
                ]
                bill_breakdown = [
                    {
                        "id": bill.id,
                        "bill_number": bill.bill_number,
                        "date": bill.bill_date,
                        "vendor": bill.vendor.name,
                        "total_amount": float(bill.total_amount),
                    }
                    for bill in bills
                ]
            else:
                invoice_breakdown = None
                bill_breakdown = None

            return {
                "operating_income": float(operating_income),
                "cost_of_goods_sold": float(cost_of_goods_sold),
                "gross_profit": float(gross_profit),
                "operating_expense": float(operating_expense),
                "operating_profit": float(operating_profit),
                "non_operating_income": float(non_operating_income),
                "non_operating_expense": float(non_operating_expense),
                "net_profit_loss": float(net_profit_loss),
                "payments_received": float(payments_total),
                "invoice_breakdown": invoice_breakdown,
                "bill_breakdown": bill_breakdown,
            }

        summary_only = request.query_params.get("summary_only", "false").lower() == "true"
        main_data = get_report(start_date, end_date, summary_only=summary_only)
        if compare_start and compare_end:
            compare_data = get_report(compare_start, compare_end, summary_only=summary_only)

        response = {
            "period": time_param,
            "basis": basis,
            "start_date": str(start_date),
            "end_date": str(end_date),
            "report": main_data,
        }
        if compare_data:
            response["compare_with"] = compare_with
            response["compare_report"] = compare_data
        return Response(response)

# @api_view(['GET'])
# @permission_classes([permissions.IsAuthenticated])
# def quote_pdf_view(request, quote_id):
#     quote = get_object_or_404(Quote.objects.prefetch_related('item_details__item'), pk=quote_id)
#     Subtotal = float(quote.subtotal)
#     cgst_amount = round(Subtotal * 0.09, 2)
#     sgst_amount = round(Subtotal * 0.09, 2)
#     total = round(Subtotal + cgst_amount + sgst_amount, 2)
#     context = {
#         'quote': quote,
#         'cgst_amount': cgst_amount,
#         'sgst_amount': sgst_amount,
#         'total_amount': total,
#         }

#     html_string = render_to_string('quotes/quote_pdf.html', context)

#     pdf_file = BytesIO()
#     HTML(string=html_string, base_url=request.build_absolute_uri('/')).write_pdf(target=pdf_file)
#     pdf_file.seek(0)

#     response = HttpResponse(pdf_file, content_type='application/pdf')
#     response['Content-Disposition'] = f'attachment; filename="quote_{quote.quote_number}.pdf"'
#     return response
