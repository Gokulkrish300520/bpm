"use client";

import { useEffect, useMemo, useState } from "react";
import VendorModal from "./VendorModel"; // assuming you have this
import { FaPlus } from "react-icons/fa";
import { fetchWithAuth } from "@/auth/tokenservice";
import router from "next/router";

type Vendor = {
  id: string; // or number depends on backend
  first_name: string;
};

type Item = {
  id: string;
  name: string;
  price: number;
};

type FileBlob = {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
};

type BillItem = {
  id: string;
  name: string;
  qty: number;
  rate: number;
  desc?: string;
  taxPct?: number;
};

type Bill = {
  id: string;
  billNo: string;
  date: string;
  dueDate?: string;
  vendorId: string;
  vendorSnapshot: Vendor;
  referenceNumber?: string;
  status: "PAID" | "UNPAID" | "PARTIAL" | "DRAFT";
  notes?: string;
  items: { id: string; name: string; qty: number; rate: number }[];
  amount: number;
  tax: number;
  total: number;
  balanceDue: number;
  meta: {
    files: FileBlob[];
    itemsExtended: BillItem[];
  };
};

const btnGreen = "bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2";
const input = "border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (bill: Bill) => void;
};

export default function NewBillDrawer({ open, onClose, onSaved }: Props) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);

  // bill fields
  const [billNo, setBillNo] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [status, setStatus] = useState<Bill["status"]>("PAID");
  const [notes, setNotes] = useState("");

  // attachments
  const [files, setFiles] = useState<FileBlob[]>([]);

  // items
  const [billItems, setBillItems] = useState<BillItem[]>([
    { id: crypto.randomUUID(), name: "", qty: 1, rate: 0, desc: "", taxPct: 0 },
  ]);

  // fetch vendors and items from backend API when drawer opens
  useEffect(() => {
    if (!open) return;

    async function fetchVendorsAndItems() {
      try {
        const vendorRes = await fetchWithAuth("https://bom-front-production.up.railway.app/api/vendors/");
        if (!vendorRes.ok) throw new Error("Failed to fetch vendors");
        const vendorData = await vendorRes.json();
        setVendors(vendorData.results);

        const itemRes = await fetchWithAuth("https://bom-front-production.up.railway.app/api/items/");
        if (!itemRes.ok) throw new Error("Failed to fetch items");
        const itemData = await itemRes.json();
        setItems(itemData.results || itemData); // adjust if data wrapped in results
      } catch (err) {
        console.error(err);
      }
    }

    fetchVendorsAndItems();
  }, [open]);

  const subtotal = useMemo(() => billItems.reduce((sum, it) => sum + (it.qty || 0) * (it.rate || 0), 0), [billItems]);
  const taxTotal = useMemo(() => billItems.reduce((sum, it) => sum + ((it.qty || 0) * (it.rate || 0)) * ((it.taxPct || 0) / 100), 0), [billItems]);
  const total = subtotal + taxTotal;

  function addRow() {
    setBillItems((rows) => [...rows, { id: crypto.randomUUID(), name: "", qty: 1, rate: 0, desc: "", taxPct: 0 }]);
  }

  function removeRow(id: string) {
    setBillItems((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  }

  function updateRow(id: string, field: keyof BillItem, value: string | number) {
    setBillItems((rows) =>
      rows.map((r) => (r.id === id ? { ...r, [field]: field === "name" || field === "desc" ? String(value) : Number(value) } : r))
    );
  }

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files;
    if (!f) return;
    const toRead = Array.from(f).slice(0, Math.max(0, 10 - files.length));
    const read = await Promise.all(
      toRead.map(
        (file) =>
          new Promise<FileBlob>((res, rej) => {
            const reader = new FileReader();
            reader.onload = () =>
              res({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, dataUrl: String(reader.result) });
            reader.onerror = rej;
            reader.readAsDataURL(file);
          })
      )
    );
    setFiles((prev) => [...prev, ...read]);
    e.currentTarget.value = "";
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function submit() {
  const vendor = vendors.find((v) => String(v.id) === vendorId);
  if (!vendor) {
    alert("Please select a vendor (or create one).");
    return;
  }
  if (!billNo.trim()) {
    alert("Bill # is required.");
    return;
  }

  const cleanItems = billItems
    .map((i) => ({
      ...i,
      qty: Number(i.qty) || 0,
      rate: Number(i.rate) || 0,
      taxPct: Number(i.taxPct) || 0,
    }))
    .filter((i) => i.name.trim() && i.qty > 0);

  const payload = {
    bill_number: billNo.trim(),
    bill_date: date,
    due_date: dueDate || null,
    vendor_id: vendor.id,
    reference_number: referenceNumber || null,
    status,
    notes: notes || null,
    items: cleanItems.map(({ id, name, qty, rate, taxPct, desc }) => ({
      // Adjust properties here according to your backend item details schema
      item_name: name,
      quantity: qty,
      rate: rate,
      tax_percentage: taxPct,
      description: desc || "",
    })),
    subtotal: subtotal,
    tax: taxTotal,
    total_amount: total,
    attachments: files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      data_url: f.dataUrl, // or handle file upload separately if API requires
    })),
    // Add other required fields if needed
  };

  try {
    const token = localStorage.getItem("authToken") ?? "";
    const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/bills/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json();
      alert(`Error saving bill: ${JSON.stringify(errData)}`);
      return;
    }

    const createdBill = await res.json();


    // Reset form state
    setBillNo("");
    setReferenceNumber("");
    setVendorId("");
    setNotes("");
    setBillItems([{ id: crypto.randomUUID(), name: "", qty: 1, rate: 0, desc: "", taxPct: 0 }]);
    setFiles([]);

  } catch (error) {
    alert("Network error saving bill. Please try again.");
    console.error(error);
  }
}


  if (!open) return null;

  return (
    <>
      <VendorModal
        open={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        onCreated={(v) => {
          setVendors((prev) => [...prev, v]);
          setVendorId(v.id);
        }}
      />

      <div className="fixed inset-0 z-40">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="absolute top-0 right-0 w-full h-full max-w-5xl p-6 overflow-y-auto bg-white shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-emerald-700">Create New Bill</h2>
            <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded-xl hover:bg-gray-200">
              Close
            </button>
          </div>

          {/* Vendor Select */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Vendor</label>
              <div className="flex gap-2">
                <select className={`${input} w-full`} value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                  <option value="">Select vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.first_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => router.push("/books/purchase/vendors/new")}
                  className="px-3 border whitespace-nowrap rounded-xl bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                >
                  + New Vendor
                </button>
              </div>
            </div>

            {/* Bill Number */}
            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Bill #</label>
              <input className={input} value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="e.g. B-1001" />
            </div>

            {/* Reference Number */}
            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Reference #</label>
              <input className={input} value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Status</label>
              <select className={input} value={status} onChange={(e) => setStatus(e.target.value as Bill["status"])}>
                <option value="PAID">PAID</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>

            {/* Bill Date */}
            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Bill Date</label>
              <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            {/* Due Date */}
            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Due Date</label>
              <input type="date" className={input} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Items */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-emerald-700">Items</h3>
              <button type="button" onClick={addRow} className={btnGreen}>
                + Add Item
              </button>
            </div>
            <div className="overflow-x-auto border rounded-xl">
              <table className="min-w-[900px] w-full">
                <thead className="bg-emerald-50">
                  <tr className="text-sm text-left text-emerald-800">
                    <th className="p-3">Item</th>
                    <th className="w-64 p-3">Description</th>
                    <th className="w-24 p-3">Qty</th>
                    <th className="p-3 w-28">Rate</th>
                    <th className="p-3 w-28">Tax %</th>
                    <th className="w-32 p-3">Amount</th>
                    <th className="w-12 p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item) => {
                    const amount =
                      (Number(item.qty) || 0) * (Number(item.rate) || 0) * (1 + ((Number(item.taxPct) || 0) / 100));
                    return (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">
                          <input
                            className={input}
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => updateRow(item.id, "name", e.target.value)}
                            list="item-list"
                          />
                          <datalist id="item-list">
                            {items.map((i) => (
                              <option key={i.id} value={i.name} />
                            ))}
                          </datalist>
                        </td>
                        <td className="p-2">
                          <input
                            className={input}
                            placeholder="Description"
                            value={item.desc || ""}
                            onChange={(e) => updateRow(item.id, "desc", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className={input}
                            type="number"
                            min="0"
                            value={item.qty}
                            onChange={(e) => updateRow(item.id, "qty", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className={input}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateRow(item.id, "rate", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className={input}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.taxPct ?? 0}
                            onChange={(e) => updateRow(item.id, "taxPct", e.target.value)}
                          />
                        </td>
                        <td className="p-2">₹ {amount.toFixed(2)}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => removeRow(item.id)}
                            className="px-3 py-1 bg-gray-100 rounded-xl hover:bg-gray-200"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attachments */}
          <div className="mt-6">
            <h4 className="mb-2 font-semibold text-emerald-700">Attachments</h4>
            <div className="flex flex-wrap items-center gap-3">
              <label className="px-3 py-2 border cursor-pointer rounded-xl border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                Upload Files
                <input type="file" className="hidden" multiple accept="*/*" onChange={onPickFiles} />
              </label>
              {files.map((file) => (
                <span
                  key={file.id}
                  className="flex items-center gap-2 px-2 py-1 text-sm bg-gray-100 rounded-xl"
                >
                  {file.name}
                  <button onClick={() => removeFile(file.id)} className="text-gray-500 hover:text-red-600">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Notes and Totals */}
          <div className="grid gap-6 mt-6 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm text-gray-600">Notes</label>
              <textarea
                className={`${input} w-full`}
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl h-fit">
              <div className="flex justify-between py-1">
                <span>Subtotal</span>
                <span>₹ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Tax</span>
                <span>₹ {taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 mt-2 font-semibold border-t text-emerald-800">
                <span>Total</span>
                <span>₹ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200">
              Cancel
            </button>
            <button onClick={submit} className={btnGreen}>
              Save Bill
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
