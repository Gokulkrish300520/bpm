"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { fetchWithAuth } from "@/auth/tokenservice";

type Vendor = {
  id: number;
  first_name: string;
  company_name: string;
  email: string;
  mobile: string;
};

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVendors() {
      try {
        const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/vendors/");
        if (!res.ok) throw new Error("Failed to fetch vendors");
        const data = await res.json();
        setVendors(data.results);
      } catch (err) {
        setError("Failed to load vendors");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadVendors();
  }, []);

  async function deleteVendor(id: number) {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    try {
      const token = localStorage.getItem("authToken") ?? "";
      const res = await fetchWithAuth(`https://bom-front-production.up.railway.app/api/vendors/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to delete vendor: ${JSON.stringify(err)}`);
        return;
      }
      setVendors((prev) => prev.filter((v) => v.id !== id));
      alert("Vendor deleted successfully.");
    } catch (err) {
      alert("Network error while deleting vendor.");
      console.error(err);
    }
  }

  if (loading) return <p>Loading vendors...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">Vendors</h1>
        <Link
          href="/books/purchase/vendors/new"
          className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
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
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length > 0 ? (
              vendors.map((v) => (
                <tr key={v.id} className="hover:bg-green-50">
                  <td className="px-4 py-2 border">
                    <Link href={`/books/purchase/vendors/${v.id}`} className="text-green-700 hover:underline">
                      {v.first_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 border">{v.company_name}</td>
                  <td className="px-4 py-2 border">{v.email}</td>
                  <td className="px-4 py-2 border">{v.mobile}</td>
                  <td className="flex gap-3 px-4 py-2 border">
                    <Link href={`/books/purchase/vendors/${v.id}/edit`} className="text-green-600 hover:text-green-800">
                      <FaEdit />
                    </Link>
                    <button onClick={() => deleteVendor(v.id)} className="text-red-600 hover:text-red-800">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 italic text-center text-gray-500">
                  No vendors added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
