"use client";

import { useState } from "react";
import { Plus, ChevronDown, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function InvoiceListPage() {
  const [statusFilter, setStatusFilter] = useState("Invoices");
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(1);

  const invoices = [
    { number: "INV-000001", customer: "John Doe", date: "2025-08-01", due: "2025-08-15", total: 5000, status: "Draft" },
    { number: "INV-000002", customer: "Acme Corp", date: "2025-08-05", due: "2025-08-20", total: 12500, status: "Sent" },
    { number: "INV-000003", customer: "Jane Smith", date: "2025-08-10", due: "2025-08-25", total: 8000, status: "Paid" },
  ];

  const filteredInvoices =
    statusFilter === "Invoices"
      ? invoices
      : invoices.filter((inv) => inv.status === statusFilter);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-700 border border-gray-300";
      case "Sent":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "Paid":
        return "bg-green-100 text-green-700 border border-green-300";
      case "Overdue":
        return "bg-red-100 text-red-700 border border-red-300";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Navbar */}
      <div className="flex items-center justify-between p-4 mb-6 bg-white rounded-lg shadow-sm">
        {/* Left: Invoice Filter */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-800 transition border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100"
          >
            {statusFilter} <ChevronDown size={16} />
          </button>

          {filterOpen && (
            <div className="absolute z-50 w-48 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
              {["Invoices", "Draft", "Sent", "Paid", "Overdue"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setFilterOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-green-50"
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: New Invoice & Three-dot Menu */}
        <div className="flex items-center gap-3">
          <Link
            href="/books/sales/invoice/new"
            className="flex items-center gap-2 px-5 py-2 font-medium text-white transition bg-green-600 rounded-lg shadow-sm hover:bg-green-700"
          >
            <Plus size={16} /> New Invoice
          </Link>

          {/* Three-dot Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 transition border rounded-lg hover:bg-gray-100"
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-44">
                <button className="w-full px-4 py-2 text-left hover:bg-green-50">Sort by</button>
                <button className="w-full px-4 py-2 text-left hover:bg-green-50">Import</button>
                <button className="w-full px-4 py-2 text-left hover:bg-green-50">Export</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-left text-gray-600">Invoice#</th>
              <th className="px-4 py-3 font-medium text-left text-gray-600">Customer</th>
              <th className="px-4 py-3 font-medium text-left text-gray-600">Invoice Date</th>
              <th className="px-4 py-3 font-medium text-left text-gray-600">Due Date</th>
              <th className="px-4 py-3 font-medium text-right text-gray-600">Total</th>
              <th className="px-4 py-3 font-medium text-left text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((inv) => (
              <tr key={inv.number} className="transition border-b hover:bg-green-50">
                <td className="px-4 py-3 font-medium text-green-600">{inv.number}</td>
                <td className="px-4 py-3">{inv.customer}</td>
                <td className="px-4 py-3">{inv.date}</td>
                <td className="px-4 py-3">{inv.due}</td>
                <td className="px-4 py-3 font-medium text-right">₹{inv.total.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(inv.status)}`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <span>Showing {filteredInvoices.length} of {invoices.length}</span>
        <div className="flex gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`flex items-center gap-1 border px-3 py-1.5 rounded-lg hover:bg-gray-100 transition ${
              page === 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button className="border px-3 py-1.5 rounded-lg bg-green-600 text-white shadow-sm">
            {page}
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 border px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
