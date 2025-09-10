"use client";

import { useRouter } from "next/navigation";
import { Bill } from "./types";

type BillTableProps = {
  bills: Bill[];
  onRowClick?: (bill: Bill) => void;
  onEditClick?: (bill: Bill) => void; 
};

const statusColor: Record<Bill["status"], string> = {
  PAID: "text-emerald-600",
  UNPAID: "text-red-600",
  PARTIAL: "text-amber-600",
  DRAFT: "text-gray-500",
};

export default function BillTable({ bills, onRowClick, onEditClick  }: BillTableProps) {
  const router = useRouter();

  const hasAttachments = (bill: Bill & { meta?: { files?: string[] } }) =>
  Boolean(bill.meta?.files?.length);


  return (
    <div className="overflow-x-auto border rounded-2xl bg-white">
      <table className="min-w-full">
        <thead className="bg-emerald-50 text-emerald-800">
          <tr className="text-left">
            <th className="p-3">Date</th>
            <th className="p-3">Bill #</th>
            <th className="p-3">Reference</th>
            <th className="p-3">Vendor</th>
            <th className="p-3">Status</th>
            <th className="p-3">Due Date</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Balance Due</th>
            <th className="p-3">Att.</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => (
            <tr key={b.id} >
              <td 
                className="p-3 cursor-pointer"
                onClick={() => onRowClick?.(b)} >{b.bill_date}</td>
              <td onClick={() => onRowClick?.(b)} className="p-3 text-emerald-700 font-medium">{b.bill_number}</td>
              <td className="p-3">{b.referenceNumber || "-"}</td>
              <td className="p-3">{b.vendor.first_name}</td>
              <td className={`p-3 font-medium ${statusColor[b.status]}`}>{b.status}</td>
              <td className="p-3">{b.due_date || "-"}</td>
              <td className="p-3">₹ {b.total_amount}</td>
              <td className="p-3">₹ {b.balanceDue}</td>
              <td className="p-3">{hasAttachments(b) ? "📎" : "-"}</td>
              <td><button
                  className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  type="button"
                  onClick={() => onEditClick?.(b)}
                >
                  Edit
                </button></td>
            </tr>
          ))}
          {bills.length === 0 && (
            <tr>
              <td colSpan={9} className="p-6 text-center text-gray-500">No bills yet. Click “New” to create one.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}