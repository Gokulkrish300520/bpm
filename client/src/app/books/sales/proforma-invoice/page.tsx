"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProformaInvoice = {
  id: string;
  date: string; // ISO date
  invoiceNumber: string;
  customerName: string;
  status: "Draft" | "Sent" | "Accepted" | "Rejected";
  amount: number;
};

const STORAGE_KEY = "proforma_invoices";

export default function ProformaInvoicesPage() {
  const [invoices, setInvoices] = useState<ProformaInvoice[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setInvoices(JSON.parse(saved));
    } else {
      // seed example
      const seed: ProformaInvoice[] = [
        {
          id: String(Date.now()),
          date: new Date().toISOString().slice(0, 10),
          invoiceNumber: "PI-1001",
          customerName: "XYZ Pvt Ltd",
          status: "Draft",
          amount: 7500,
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      setInvoices(seed);
    }
  }, []);

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
            {invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-gray-500 bg-white"
                >
                  No proforma invoices found
                </td>
              </tr>
            ) : (
              invoices.map((inv, idx) => (
                <tr
                  key={inv.id}
                  className={`${
                    idx % 2 ? "bg-green-100" : "bg-green-50"
                  } border-b`}
                >
                  <td className="p-3">{inv.date}</td>
                  <td className="p-3">{inv.invoiceNumber}</td>
                  <td className="p-3">{inv.customerName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        inv.status === "Draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : inv.status === "Sent"
                          ? "bg-blue-100 text-blue-800"
                          : inv.status === "Accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3">₹{inv.amount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
