"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import api from "@/lib/api";

/* ================= Types ================= */
type Lead = {
  id: string;
  companyName: string | null;
  email: string | null;
  phoneNumber: string;
  city: string | null;
  category: string;
  subcategory: string | null;
};

/* ================= Component ================= */
export default function LeadsPage() {
  /* ---------- State ---------- */
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");

  const [form, setForm] = useState({
    companyName: "",
    email: "",
    phoneNumber: "",
    city: "",
    category: "standard",
    subcategory: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ================= FETCH LEADS ================= */
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get("/leads");
      setLeads(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CREATE LEAD ================= */
  const handleAddLead = async () => {
    if (!form.phoneNumber) {
      toast.error("Phone number is required");
      return;
    }

    try {
      setLoading(true);
      await api.post("/leads", {
        companyName: form.companyName || null,
        email: form.email || null,
        phoneNumber: form.phoneNumber,
        city: form.city || null,
        category: form.category,
        subcategory: form.subcategory || null,
      });

      toast.success("Lead added");
      setForm({
        companyName: "",
        email: "",
        phoneNumber: "",
        city: "",
        category: "standard",
        subcategory: "",
      });

      fetchLeads();
      await api.post("/leads/revalidate");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE LEAD ================= */
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`/leads/${id}`);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lead deleted");
      await api.post("/leads/revalidate");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete lead");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EXCEL UPLOAD ================= */
  const handleExcelUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);

      const payload = rows
        .filter((r) => r.phoneNumber)
        .map((r) => ({
          companyName: r.companyName ?? null,
          email: r.email ?? null,
          phoneNumber: String(r.phoneNumber),
          city: r.city ?? null,
          category: r.category ?? "standard",
          subcategory: r.subcategory ?? null,
        }));

      if (!payload.length) {
        toast.error("No valid rows found");
        return;
      }

      await api.post("/leads/bulk", { leads: payload });
      toast.success(`${payload.length} leads imported`);
      fetchLeads();
    } catch (err) {
      console.error(err);
      toast.error("Excel import failed");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  /* ================= FILTERED LEADS ================= */
  const filteredLeads = leads.filter((lead) => {
    const categoryMatch =
      categoryFilter === "all" || lead.category === categoryFilter;

    const subcategoryMatch =
      subcategoryFilter === "all" ||
      lead.subcategory === subcategoryFilter;

    return categoryMatch && subcategoryMatch;
  });

  /* ================= LOAD ================= */
  useEffect(() => {
    fetchLeads();
  }, []);

  /* ================= UI ================= */
  return (
    <>
      <Toaster position="top-right" />

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= LEFT: ADD LEAD ================= */}
        <div className="bg-slate-900 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">New Lead</h2>

          <input
            className="w-full p-2 rounded bg-slate-800"
            placeholder="Company name"
            value={form.companyName}
            onChange={(e) =>
              setForm({ ...form, companyName: e.target.value })
            }
          />

          <input
            className="w-full p-2 rounded bg-slate-800"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            className="w-full p-2 rounded bg-slate-800"
            placeholder="+15550000001"
            value={form.phoneNumber}
            onChange={(e) =>
              setForm({ ...form, phoneNumber: e.target.value })
            }
          />

          <input
            className="w-full p-2 rounded bg-slate-800"
            placeholder="City"
            value={form.city}
            onChange={(e) =>
              setForm({ ...form, city: e.target.value })
            }
          />

          <input
            className="w-full p-2 rounded bg-slate-800"
            placeholder="Subcategory (mens_wear, kids)"
            value={form.subcategory}
            onChange={(e) =>
              setForm({ ...form, subcategory: e.target.value })
            }
          />

          <select
            className="w-full p-2 rounded bg-slate-800"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          >
            <option value="standard">Standard</option>
            <option value="enterprise">Enterprise</option>
            <option value="startup">Startup</option>
          </select>

          <button
            onClick={handleAddLead}
            disabled={loading}
            className="w-full bg-green-500 text-black font-medium p-2 rounded flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Lead
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            Upload Excel
          </button>
        </div>

        {/* ================= RIGHT: LEADS LIST ================= */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl p-6">
          <div className="flex gap-3 mb-4">
            <select
              className="bg-slate-800 p-2 rounded"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="standard">Standard</option>
              <option value="enterprise">Enterprise</option>
              <option value="startup">Startup</option>
            </select>

            <select
              className="bg-slate-800 p-2 rounded"
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
            >
              <option value="all">All Subcategories</option>
              <option value="mens_wear">Mens Wear</option>
              <option value="kids">Kids</option>
              <option value="retail">Retail</option>
            </select>
          </div>

          <h2 className="text-lg font-semibold mb-4">
            All Leads ({filteredLeads.length})
          </h2>

          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-slate-800 p-4 rounded flex justify-between"
              >
                <div>
                  <p className="font-medium">
                    {lead.companyName || lead.phoneNumber}
                  </p>
                  <p className="text-sm text-slate-400">{lead.email}</p>
                  <p className="text-sm text-slate-400">
                    {lead.city} • {lead.phoneNumber}
                  </p>
                  <p className="text-xs mt-1">
                    {lead.category}
                    {lead.subcategory && ` • ${lead.subcategory}`}
                  </p>
                </div>

                <button onClick={() => handleDelete(lead.id)}>
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
