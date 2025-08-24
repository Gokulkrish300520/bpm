"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Quote = {
  id: string;
  date: string;          // ISO date
  quoteNumber: string;
  customerName: string;
  status: "Draft" | "Sent" | "Accepted" | "Rejected";
  amount: number;
};

const STORAGE_KEY = "quotes";

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setQuotes(JSON.parse(saved));
    } else {
      // seed example once
      const seed: Quote[] = [
        {
          id: String(Date.now()),
          date: new Date().toISOString().slice(0, 10),
          quoteNumber: "Q-1001",
          customerName: "ABC Pvt Ltd",
          status: "Draft",
          amount: 5000,
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      setQuotes(seed);
    }
  }, []);

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-800">All Quotes</h1>
        <Link
          href="quotes/new"
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
              <th className="p-3 text-left">Quote Number</th>
              <th className="p-3 text-left">Customer Name</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500 bg-white">
                  No quotes found
                </td>
              </tr>
            ) : (
              quotes.map((q, idx) => (
                <tr
                  key={q.id}
                  className={`${idx % 2 ? "bg-green-100" : "bg-green-50"} border-b`}
                >
                  <td className="p-3">{q.date}</td>
                  <td className="p-3">{q.quoteNumber}</td>
                  <td className="p-3">{q.customerName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        q.status === "Draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : q.status === "Sent"
                          ? "bg-blue-100 text-blue-800"
                          : q.status === "Accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="p-3">₹{q.amount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
