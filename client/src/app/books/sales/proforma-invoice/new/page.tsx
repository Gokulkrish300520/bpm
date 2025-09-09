"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { generateQuotePDF } from "../../quotes/new/pdfGenerator";
import logo from "../../../../../../public/logo.png";
import { fetchWithAuth } from "@/auth/tokenservice";

type ItemRow = { id: string; itemId?: number; name: string; qty: number; rate: number };
type Customer = {
  id: number;
  display_name: string;
  billing_attention: string;
  billing_street1: string;
  billing_street2: string;
  billing_city: string;
  billing_state: string;
  billing_pin_code: string;
  billing_country: string;
  billing_phone: string;
  shipping_attention: string;
  shipping_street1: string;
  shipping_street2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pin_code: string;
  shipping_country: string;
  shipping_phone: string;
};

type Item = {
  id: number;
  name: string;
  price: string; // stringified decimal from backend
};

const STORAGE_KEY = "proforma_invoices";

export default function NewProformaInvoicePage() {
  const router = useRouter();

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Items state (fetched from backend)
  const [itemsList, setItemsList] = useState<Item[]>([]);

  useEffect(() => {
    async function loadCustomers() {
      try {
  const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/customers/");
        const data = await res.json();
        setCustomers(data.results || []);
      } catch (err) {
        console.error("Failed to load customers", err);
      }
    }
    loadCustomers();
  }, []);

  useEffect(() => {
    async function loadItems() {
      try {
  const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/items/");
        const data = await res.json();
        setItemsList(data.results || []);
      } catch (err) {
        console.error("Failed to load items", err);
      }
    }
    loadItems();
  }, []);

  // Fetch selected customer details
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomer(null);
      return;
    }
    async function loadCustomer() {
      try {
        const res = await fetchWithAuth(
          `https://bom-front-production.up.railway.app/api/customers/${selectedCustomerId}/`
        );
        const data = await res.json();
        setCustomer(data);
      } catch (err) {
        console.error("Failed to load customer", err);
      }
    }
    loadCustomer();
  }, [selectedCustomerId]);

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState(
    "PI-" + (Math.floor(Date.now() / 1000) % 100000)
  );
  const [reference, setReference] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [projectName, setProjectName] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("Looking forward for your business.");
  const [terms, setTerms] = useState("");
  const [logo, setLogo] = useState<string>("");
  
    useEffect(() => {
    (async () => {
      const base64Logo = await getBase64FromUrl("/logo.png");
      setLogo(base64Logo); // put this in a useState
    })();
  }, []);

  // Items state with itemId for backend linkage
  const [items, setItems] = useState<ItemRow[]>([
    { id: crypto.randomUUID(), itemId: undefined, name: "", qty: 1, rate: 0 },
  ]);

  // Pricing controls
  const [discountPct, setDiscountPct] = useState(0); // %
  const [taxType, setTaxType] = useState<"TDS" | "TCS">("TDS");
  const [taxPct, setTaxPct] = useState(0); // 0, 5, 12, 18, 28
  const [adjustment, setAdjustment] = useState(0);

  // Computations
  const subTotal = useMemo(
    () =>
      items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0),
    [items]
  );
  const discountAmt = useMemo(
    () => (subTotal * (Number(discountPct) || 0)) / 100,
    [subTotal, discountPct]
  );
  const taxAmt = useMemo(() => {
    const base = ((subTotal - discountAmt) * (Number(taxPct) || 0)) / 100;
    return taxType === "TDS" ? -base : base;
  }, [subTotal, discountAmt, taxPct, taxType]);
  const total = useMemo(
    () => subTotal - discountAmt + taxAmt + (Number(adjustment) || 0),
    [subTotal, discountAmt, taxAmt, adjustment]
  );

  // Item row actions
  const addRow = () =>
    setItems((rows) => [...rows, { id: crypto.randomUUID(), name: "", qty: 1, rate: 0 }]);
  const removeRow = (id: string) =>
    setItems((rows) => (rows.length === 1 ? rows : rows.filter((r) => r.id !== id)));
  const updateRow = (id: string, patch: Partial<ItemRow>) =>
    setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // Format address utility
  function formatAddress(cust: Customer, type: "billing" | "shipping") {
    return [
      cust[`${type}_attention` as keyof Customer],
      cust[`${type}_street1` as keyof Customer],
      cust[`${type}_street2` as keyof Customer],
      `${cust[`${type}_city` as keyof Customer]}, ${cust[`${type}_state` as keyof Customer]} ${cust[`${type}_pin_code` as keyof Customer]}`,
      cust[`${type}_country` as keyof Customer],
      cust[`${type}_phone` as keyof Customer] ? `Phone: ${cust[`${type}_phone` as keyof Customer]}` : null,
    ].filter(Boolean).join("\n");
  }

  // Save function with backend integration
  async function save(status: "Draft" | "Sent") {
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    // Prepare payload for backend with item IDs
    const payload = {
      customer_id: selectedCustomerId,
      invoice_number: invoiceNumber,
      reference_number: reference,
      invoice_date: invoiceDate,
      expiry_date: expiryDate,
      salesperson,
      project_name: projectName,
      subject,
      customer_notes: notes,
      terms_and_conditions: terms,
      subtotal: subTotal.toFixed(2),
      discount: discountPct.toFixed(2),
      tax_type: taxType,
      tax_percentage: taxPct.toString(),
      adjustment: adjustment.toFixed(2),
      total_amount: total.toFixed(2),
      status: status.toLowerCase(),
      item_details: items
        .filter(i => i.itemId !== undefined)
        .map(i => ({
          item_id: i.itemId,
          quantity: i.qty,
          rate: i.rate,
          amount: (i.qty * i.rate).toFixed(2),
        })),
    };

    try {
  const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/proformainvoices/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to save invoice: ${JSON.stringify(err)}`);
        return;
      }

      // Generate PDF only when status is "Sent" and customer is present
      if (status === "Sent" && customer) {
        const billTo = formatAddress(customer, "billing");
        const shipTo = formatAddress(customer, "shipping");
        generateQuotePDF({
          title: "PROFORMA INVOICE",
          quoteNumber: invoiceNumber,
          quoteDate: invoiceDate,
          expiryDate,
          customerName: customer.display_name,
          billTo,
          shipTo,
          placeOfSupply: customer.billing_state
            ? `${customer.billing_state} (${customer.billing_pin_code})`
            : customer.billing_country,
          items: items.map((i) => ({
            name: i.name,
            hsn: "853200",
            qty: i.qty,
            rate: i.rate,
          })),
          subTotal,
          taxBreakup: [{ label: taxType, pct: taxPct, amount: (subTotal * taxPct) / 100 }],
          total,
          totalInWords: "Indian Rupees " + total.toFixed(2) + " Only",
          notes,
          terms,
          logo,
        });
      }

      router.push("/books/sales/proforma-invoice");
    } catch (err) {
      alert("Error saving invoice.");
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <h1 className="mb-6 text-2xl font-bold text-green-800">New Proforma Invoice</h1>
      <div className="p-6 space-y-8 bg-white shadow-md rounded-2xl">
        {/* Top grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-green-800">Customer*</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            >
              <option value="">-- Select a customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-green-800">Invoice #*</label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-green-800">Reference # (optional)</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-800">Invoice Date*</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-800">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-green-800">Salesperson</label>
            <input
              value={salesperson}
              onChange={(e) => setSalesperson(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-green-800">Project Name</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-green-800">Subject</label>
          <textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Let your customer know what this invoice is for"
            className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
          />
        </div>
        {/* Items with item select */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-green-700">Item Table</h2>
            <span className="text-sm text-green-700/80">Bulk Actions</span>
          </div>
          <div className="overflow-hidden border rounded-xl">
            <table className="w-full">
              <thead className="text-green-900 bg-green-200">
                <tr>
                  <th className="p-2 text-left">Item Details</th>
                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Rate</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b bg-green-50">
                    <td className="p-2">
                      <select
                        value={row.itemId ?? ""}
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          const selectedItem = itemsList.find((i) => i.id === id);
                          updateRow(row.id, {
                            itemId: id,
                            name: selectedItem?.name ?? "",
                            rate: selectedItem ? Number(selectedItem.price) : 0,
                          });
                        }}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value="">-- Select an item --</option>
                        {itemsList.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.qty}
                        onChange={(e) =>
                          updateRow(row.id, { qty: Number(e.target.value) })
                        }
                        className="w-24 px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.rate}
                        onChange={(e) =>
                          updateRow(row.id, { rate: Number(e.target.value) })
                        }
                        className="px-2 py-1 border rounded w-28"
                      />
                    </td>
                    <td className="p-2 font-medium">
                      ₹{(row.qty * row.rate).toFixed(2)}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3 mt-3">
            <button
              onClick={addRow}
              className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
            >
              + Add New Row
            </button>
            <button className="px-4 py-2 border rounded-lg hover:bg-green-100">
              + Add Items in Bulk
            </button>
          </div>
        </div>
        {/* Totals */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-green-800">
              Customer Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div className="p-4 space-y-3 border bg-green-50 rounded-2xl">
            <div className="flex justify-between">
              <span className="text-green-900">Sub Total</span>
              <span>₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-green-900">Discount</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Number(e.target.value))}
                  className="w-24 px-2 py-1 border rounded"
                />
                <span>%</span>
                <span className="text-sm text-gray-600">₹{discountAmt.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={taxType === "TDS"}
                    onChange={() => setTaxType("TDS")}
                  />
                  TDS
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={taxType === "TCS"}
                    onChange={() => setTaxType("TCS")}
                  />
                  TCS
                </label>
              </div>
              <select
                value={taxPct}
                onChange={(e) => setTaxPct(Number(e.target.value))}
                className="px-2 py-1 border rounded"
              >
                {[0, 5, 12, 18, 28].map((t) => (
                  <option key={t} value={t}>
                    {t}% Tax
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">
                {taxType === "TDS" ? "-" : "+"}₹{Math.abs(taxAmt).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-green-900">Adjustment</label>
              <input
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(Number(e.target.value))}
                className="px-2 py-1 border rounded w-28"
              />
            </div>
            <div className="flex justify-between pt-2 text-lg font-semibold text-green-800 border-t">
              <span>Total (₹)</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        {/* Terms */}
        <div>
          <label className="block text-sm font-medium text-green-800">
            Terms & Conditions
          </label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
          />
        </div>
        {/* Footer buttons */}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            onClick={() => save("Draft")}
            className="px-4 py-2 border rounded-lg hover:bg-green-100"
          >
            Save as Draft
          </button>
          <button
            onClick={() => save("Sent")}
            className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
          >
            Save and Send
          </button>
          <button
            onClick={() => router.push("/books/sales/proforma-invoice")}
            className="px-4 py-2 border rounded-lg hover:bg-red-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

async function getBase64FromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
