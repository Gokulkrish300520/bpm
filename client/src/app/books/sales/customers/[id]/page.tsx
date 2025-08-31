"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUpload,
  FaInfoCircle,
  FaTag,
  FaTrash,
  FaCopy,
  FaPlus,
} from "react-icons/fa";

type CustomerType = "Business" | "Individual";
type TabKey =
  | "Other Details"
  | "Address"
  | "Contact Persons"
  | "Custom Fields"
  | "Reporting Tags"
  | "Remarks";

type ContactPerson = {
  salutation: string;
  first_name: string;
  last_name: string;
  email: string;
  work_phone: string;
  mobile: string;
};

type Address = {
  attention: string;
  country: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  fax: string;
};

type FileMeta = { name: string; size: number; type: string };

type CustomField = { key: string; value: string };

const CURRENCY_OPTIONS = [
  "AED - UAE Dirham",
  "AUD - Australian Dollar",
  "BND - Brunei Dollar",
  "CAD - Canadian Dollar",
  "CNY - Yuan Renminbi",
  "EUR - Euro",
  "GBP - Pound Sterling",
  "INR - Indian Rupee",
  "JPY - Japanese Yen",
  "SAR - Saudi Riyal",
  "USD - United States Dollar",
  "ZAR - South African Rand",
];

const PAYMENT_TERMS = ["Due on Receipt", "Net 7", "Net 15", "Net 30", "Net 45"];

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const inputBase =
    "w-full rounded-md border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500";
  const withIcon =
    "flex items-center rounded-md border border-green-300 px-3 focus-within:ring-2 focus-within:ring-green-500";

  const [customerType, setCustomerType] = useState<CustomerType>("Business");

  const [salutation, setSalutation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [email, setEmail] = useState("");
  const [workPhone, setWorkPhone] = useState("");
  const [mobile, setMobile] = useState("");

  const [pan, setPan] = useState("");
  const [currency, setCurrency] = useState("INR - Indian Rupee");
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState("Due on Receipt");
  const [documents, setDocuments] = useState<FileMeta[]>([]);

  const [billing, setBilling] = useState<Address>({
    attention: "",
    country: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    pinCode: "",
    phone: "",
    fax: "",
  });
  const [shipping, setShipping] = useState<Address>({
    attention: "",
    country: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    pinCode: "",
    phone: "",
    fax: "",
  });

  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [reportingTags, setReportingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [remarks, setRemarks] = useState("");

  const [activeTab, setActiveTab] = useState<TabKey>("Other Details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetchWithAuth(
          `https://bpm-production.up.railway.app/api/customers/${id}/`
        );
        if (!res.ok) throw new Error("Failed to fetch customer data");
        const data = await res.json();

        setCustomerType(
          data.customer_type === "individual" ? "Individual" : "Business"
        );
        setSalutation(data.salutation || "");
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setCompanyName(data.company_name || "");
        setDisplayName(data.display_name || "");
        setEmail(data.email || "");
        setWorkPhone(data.work_phone || "");
        setMobile(data.mobile || "");
        setPan(data.pan || "");
        setCurrency(
          data.currency
            ? `${data.currency} - ${currencyNameFromCode(data.currency)}`
            : "INR - Indian Rupee"
        );
        setOpeningBalance(parseFloat(data.opening_balance) || 0);
        setPaymentTerms(data.payment_terms || "Due on Receipt");
        setDocuments(data.documents || []);
        setBilling({
          attention: data.billing_attention || "",
          country: data.billing_country || "",
          street1: data.billing_street1 || "",
          street2: data.billing_street2 || "",
          city: data.billing_city || "",
          state: data.billing_state || "",
          pinCode: data.billing_pin_code || "",
          phone: data.billing_phone || "",
          fax: data.billing_fax || "",
        });
        setShipping({
          attention: data.shipping_attention || "",
          country: data.shipping_country || "",
          street1: data.shipping_street1 || "",
          street2: data.shipping_street2 || "",
          city: data.shipping_city || "",
          state: data.shipping_state || "",
          pinCode: data.shipping_pin_code || "",
          phone: data.shipping_phone || "",
          fax: data.shipping_fax || "",
        });
        setContactPersons(data.contact_persons || []);
        setCustomFields(
          data.custom_fields
            ? Object.entries(data.custom_fields).map(([key, value]) => ({
                key,
                value,
              }))
            : []
        );
        setReportingTags(data.tags || []);
        setRemarks(data.remarks || "");
      } catch (err) {
        setError("Failed to load customer data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id]);

  function currencyNameFromCode(code: string) {
    const found = CURRENCY_OPTIONS.find((c) => c.startsWith(code));
    return found ? found.split(" - ")[1] : "";
  }

  // All update handlers disabled: read-only
  function updateAddress(
    _which: "billing" | "shipping",
    _field: keyof Address
  ): (val: string) => void {
    return () => {};
  }
  function updateCP(_index: number, _patch: Partial<ContactPerson>) {}
  function updateCustomField(_i: number, _patch: Partial<CustomField>) {}
  function addCP() {}
  function removeCP(_index: number) {}
  function addCustomField() {}
  function removeCustomField(_i: number) {}
  function addTag() {}
  function removeTag(_t: string) {}
  function onDocsSelected(_e: ChangeEvent<HTMLInputElement>) {}
  function removeDoc(_idx: number) {}

  if (loading) return <p>Loading customer details...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-green-50 sm:p-8">
      <div className="max-w-6xl p-6 mx-auto bg-white border border-green-200 rounded-lg shadow">
        <button
          className="mb-4 text-green-600 hover:underline"
          onClick={() => router.back()}
        >
          &larr; Back
        </button>

        <h1 className="mb-6 text-2xl font-semibold text-green-700">
          View Customer
        </h1>

        <div className="mb-5">
          <label className="block mb-2 font-medium text-green-800">
            Customer Type
          </label>
          <div className="flex gap-8">
            <label className="flex items-center gap-2 text-green-800">
              <input
                type="radio"
                className="text-green-600 focus:ring-green-600"
                checked={customerType === "Business"}
                readOnly
              />
              Business
            </label>
            <label className="flex items-center gap-2 text-green-800">
              <input
                type="radio"
                className="text-green-600 focus:ring-green-600"
                checked={customerType === "Individual"}
                readOnly
              />
              Individual
            </label>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-1 font-medium text-green-800">Salutation</label>
            <select className={inputBase} value={salutation} disabled>
              <option value="">Select</option>
              <option>Dr</option>
              <option>Mr</option>
              <option>Ms</option>
              <option>Mrs</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium text-green-800">First Name</label>
            <div className={withIcon}>
              <FaUser className="mr-2 text-green-500" />
              <input type="text" className="w-full py-2 outline-none" value={firstName} disabled />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-medium text-green-800">Last Name</label>
            <input type="text" className={inputBase} value={lastName} disabled />
          </div>
        </div>

        {/* Other Fields */}
        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 font-medium text-green-800">Company Name</label>
            <input type="text" className={inputBase} value={companyName} disabled />
          </div>

          <div>
            <label className="block mb-1 font-medium text-green-800">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input className={inputBase} value={displayName} disabled />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 font-medium text-green-800">Email Address</label>
            <div className={withIcon}>
              <FaEnvelope className="mr-2 text-green-500" />
              <input type="email" className="w-full py-2 outline-none" value={email} disabled />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-1 font-medium text-green-800">Work Phone</label>
              <div className={withIcon}>
                <FaPhone className="mr-2 text-green-500" />
                <input type="tel" className="w-full py-2 outline-none" value={workPhone} disabled />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium text-green-800">Mobile</label>
              <div className={withIcon}>
                <FaPhone className="mr-2 text-green-500" />
                <input type="tel" className="w-full py-2 outline-none" value={mobile} disabled />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-green-200">
          {[
            "Other Details",
            "Address",
            "Contact Persons",
            "Custom Fields",
            "Reporting Tags",
            "Remarks",
          ].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as TabKey)}
              className={`mr-6 border-b-2 py-2 text-sm ${
                activeTab === t
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-green-600 hover:text-green-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Other Details Tab */}
        {activeTab === "Other Details" && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block mb-1 font-medium text-green-800">PAN</label>
              <input type="text" value={pan} disabled className={inputBase} />
            </div>

            <div>
              <label className="block mb-1 font-medium text-green-800">Currency</label>
              <select className={inputBase} value={currency} disabled>
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium text-green-800">Opening Balance</label>
              <input type="number" value={openingBalance} disabled className={inputBase} />
            </div>

            <div>
              <label className="block mb-1 font-medium text-green-800">Payment Terms</label>
              <select className={inputBase} value={paymentTerms} disabled>
                {PAYMENT_TERMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Address Tab */}
        {activeTab === "Address" && (
          <div className="grid grid-cols-1 gap-10 mt-6 md:grid-cols-2">
            {/* Billing Address */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-green-700">Billing Address</h3>
              {[
                { label: "Attention", field: "attention" as keyof Address },
                { label: "Country/Region", field: "country" as keyof Address },
                { label: "Street 1", field: "street1" as keyof Address },
                { label: "Street 2", field: "street2" as keyof Address },
                { label: "City", field: "city" as keyof Address },
                { label: "State", field: "state" as keyof Address },
                { label: "Pin Code", field: "pinCode" as keyof Address },
                { label: "Phone", field: "phone" as keyof Address },
                { label: "Fax Number", field: "fax" as keyof Address },
              ].map((row) => (
                <div className="mb-3" key={`bill-${row.field}`}>
                  <label className="block mb-1 font-medium text-green-800">{row.label}</label>
                  <input
                    type="text"
                    className={inputBase}
                    value={billing[row.field]}
                    disabled
                  />
                </div>
              ))}
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-green-700">Shipping Address</h3>
              {[
                { label: "Attention", field: "attention" as keyof Address },
                { label: "Country/Region", field: "country" as keyof Address },
                { label: "Street 1", field: "street1" as keyof Address },
                { label: "Street 2", field: "street2" as keyof Address },
                { label: "City", field: "city" as keyof Address },
                { label: "State", field: "state" as keyof Address },
                { label: "Pin Code", field: "pinCode" as keyof Address },
                { label: "Phone", field: "phone" as keyof Address },
                { label: "Fax Number", field: "fax" as keyof Address },
              ].map((row) => (
                <div className="mb-3" key={`ship-${row.field}`}>
                  <label className="block mb-1 font-medium text-green-800">{row.label}</label>
                  <input
                    type="text"
                    className={inputBase}
                    value={shipping[row.field]}
                    disabled
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Persons Tab */}
        {activeTab === "Contact Persons" && (
          <div className="mt-6">
            <div className="overflow-x-auto border border-green-200 rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="text-green-800 bg-green-50">
                  <tr>
                    <th className="px-3 py-2 font-medium">SALUTATION</th>
                    <th className="px-3 py-2 font-medium">FIRST NAME</th>
                    <th className="px-3 py-2 font-medium">LAST NAME</th>
                    <th className="px-3 py-2 font-medium">EMAIL ADDRESS</th>
                    <th className="px-3 py-2 font-medium">WORK PHONE</th>
                    <th className="px-3 py-2 font-medium">MOBILE</th>
                  </tr>
                </thead>
                <tbody>
                  {contactPersons.length > 0 ? (
                    contactPersons.map((cp, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{cp.salutation || "-"}</td>
                        <td className="px-3 py-2">{cp.first_name || "-"}</td>
                        <td className="px-3 py-2">{cp.last_name || "-"}</td>
                        <td className="px-3 py-2">{cp.email || "-"}</td>
                        <td className="px-3 py-2">{cp.work_phone || "-"}</td>
                        <td className="px-3 py-2">{cp.mobile || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 italic text-center text-gray-500">
                        No contact persons added.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Custom Fields Tab */}
        {activeTab === "Custom Fields" && (
          <div className="mt-6 space-y-3">
            {customFields.length > 0 ? (
              customFields.map((cf, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-green-800">Field</label>
                    <input type="text" className={inputBase} value={cf.key} disabled />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-green-800">Value</label>
                    <input type="text" className={inputBase} value={cf.value} disabled />
                  </div>
                </div>
              ))
            ) : (
              <p className="italic text-gray-600">No custom fields added.</p>
            )}
          </div>
        )}

        {/* Reporting Tags Tab */}
        {activeTab === "Reporting Tags" && (
          <div className="mt-6 flex flex-wrap gap-2">
            {reportingTags.length > 0 ? (
              reportingTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1 text-sm border border-green-300 rounded-full"
                >
                  {tag}
                </span>
              ))
            ) : (
              <p className="italic text-gray-600">No reporting tags added.</p>
            )}
          </div>
        )}

        {/* Remarks Tab */}
        {activeTab === "Remarks" && (
          <div className="mt-6">
            <label className="block mb-1 font-medium text-green-800">Remarks (For Internal Use)</label>
            <textarea
              rows={4}
              className={inputBase}
              value={remarks}
              disabled
            />
          </div>
        )}

        <div className="sticky bottom-0 flex justify-end gap-3 pt-4 mt-8 border-t border-green-100 bg-white">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 font-medium text-green-700 border border-green-300 rounded-md hover:bg-green-50"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
