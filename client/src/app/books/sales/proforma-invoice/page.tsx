"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";

type CustomerType = {
  id: number;
  display_name: string;
  // other fields if needed
};

type ProformaStatus = "draft" | "sent" | "accepted" | "rejected";

type ProformaInvoice = {
  id: string;
  customer: CustomerType;
  invoice_number: string; // corrected field name
  invoice_date: string; // ISO date string, corrected field name
  expiry_date: string; // due_date renamed to expiry_date if applicable
  total_amount: string | number; // corrected field name
  status: ProformaStatus;
  notes: string;
  created_at: string;
};

export default function ProformaInvoicesPage() {
  const [proformaInvoices, setProformaInvoices] = useState<ProformaInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProformaInvoices() {
      try {
        const res = await fetchWithAuth(
          "https://bpm-production.up.railway.app/api/proformainvoices/"
        );
        if (!res.ok) throw new Error("Failed to fetch proforma invoices");
        const data = await res.json();
        setProformaInvoices(data.results || []);
      } catch (err) {
        setError("Failed to load proforma invoices");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadProformaInvoices();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  if (loading) return <p>Loading proforma invoices...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-800">All Proforma Invoices</h1>
        <Link
          href="proforma-invoice/new"
          className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
        >
          + New
        </Link>
      </div>

      <div className="overflow-hidden shadow rounded-xl">
        <table className="w-full border-collapse">
          <thead className="text-green-900 bg-green-200">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Invoice Number</th>
              <th className="p-3 text-left">Customer Name</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {proformaInvoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500 bg-white">
                  No proforma invoices found
                </td>
              </tr>
            ) : (
              proformaInvoices.map((inv, idx) => (
                <tr
                  key={inv.id}
                  className={`${idx % 2 ? "bg-green-100" : "bg-green-50"} border-b`}
                >
                  <td className="p-3">{formatDate(inv.invoice_date)}</td>
                  <td className="p-3">{inv.invoice_number}</td>
                  <td className="p-3">{inv.customer.display_name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        inv.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : inv.status === "sent"
                          ? "bg-blue-100 text-blue-800"
                          : inv.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3">₹{inv.total_amount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
