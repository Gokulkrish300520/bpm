"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Challan = {
  id: string;
  date: string;
  challanNo: string;
  referenceNo: string;
  customerName: string;
  status: string;
  invoiceStatus: string;
};

export default function ChallansPage() {
  const [challans, setChallans] = useState<Challan[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("challans") || "[]");
    setChallans(stored);
  }, []);

  return (
    <div className="min-h-screen p-6 bg-green-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-800">All Delivery Challans</h1>
        <Link href="/books/sales/challans/new">
          <button className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700">
            + New
          </button>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-sm text-green-900 bg-green-100">
              <th className="p-3 text-left">DATE</th>
              <th className="p-3 text-left">DELIVERY CHALLAN#</th>
              <th className="p-3 text-left">REFERENCE NUMBER</th>
              <th className="p-3 text-left">CUSTOMER NAME</th>
              <th className="p-3 text-left">STATUS</th>
              <th className="p-3 text-left">INVOICE STATUS</th>
            </tr>
          </thead>
          <tbody>
            {challans.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No challans found. Click <b>+ New</b> to create one.
                </td>
              </tr>
            ) : (
              challans.map((c) => (
                <tr key={c.id} className="border-b hover:bg-green-50">
                  <td className="p-3">{c.date}</td>
                  <td className="p-3 font-medium text-green-700">
                    <Link href={`/challans/${c.challanNo}`} className="hover:underline">
                      {c.challanNo}
                    </Link>
                  </td>
                  <td className="p-3">{c.referenceNo}</td>
                  <td className="p-3">{c.customerName}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs text-green-800 bg-green-200 rounded-full">
                      {c.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{c.invoiceStatus || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
