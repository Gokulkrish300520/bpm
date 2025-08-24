"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

type Customer = {
  id: number;
  name: string;
  companyName: string;
  email: string;
  workPhone: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const data = localStorage.getItem("customers");
    if (data) {
      try {
        setCustomers(JSON.parse(data));
      } catch (err) {
        console.error("Failed to parse customers from localStorage", err);
      }
    }
  }, []);

  const deleteCustomer = (id: number) => {
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    localStorage.setItem("customers", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">
          Active Customers
        </h1>
        <Link
          href="/books/sales/customers/new"
          className="flex items-center gap-2 px-4 py-2 text-white transition bg-green-600 rounded-lg shadow hover:bg-green-700"
        >
          <FaPlus /> New
        </Link>
      </div>

      <div className="overflow-hidden bg-white rounded-lg shadow-md">
        <table className="w-full text-left border-collapse">
          <thead className="text-sm text-green-800 uppercase bg-green-100">
            <tr>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Company Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Work Phone</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-green-50">
                  <td className="px-4 py-2 border">{c.name}</td>
                  <td className="px-4 py-2 border">{c.companyName}</td>
                  <td className="px-4 py-2 border">{c.email}</td>
                  <td className="px-4 py-2 border">{c.workPhone}</td>
                  <td className="flex gap-3 px-4 py-2 border">
                    <button className="text-green-600 hover:text-green-800">
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deleteCustomer(c.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 italic text-center text-gray-500"
                >
                  No customers added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
