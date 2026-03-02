"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllCustomers, deleteCustomer, Customer } from "./actions";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Edit,
  Plus,
  User,
  UserCheck,
  Building2,
  MapPin,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";


const ITEMS_PER_PAGE = 10;


export default function StoreCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const t= useTranslations("StoreCustomers");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getAllCustomers();
        setCustomers(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch customers");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  // Search & pagination
  const filtered = search
    ? customers.filter((c) =>
        [c.first_name, c.last_name, c.username, c.email]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : customers;


  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


  const handleDelete = async (id: number) => {
    setActionLoading(true);
    try {
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast.success("Customer deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete customer");
    } finally {
      setActionLoading(false);
    }
  };


  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>


      {/* Search + New Customer Button */}
      <div className="flex gap-2 mb-4">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by name, username, email"
          className="flex-1"
          disabled={loading || actionLoading}
        />
        <Button
          onClick={() => router.push("/storcustomers/customers/new")}
          disabled={loading || actionLoading}
        >
          <Plus className="w-4 h-4 text-secondary" />
        </Button>
      </div>


      <p className="text-sm mb-4">{t("total")}: {filtered.length}</p>


      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {paginated.map((c) => (
            <Card key={c.id} className="p-4 hover:shadow-md transition-shadow">
              <CardContent className="flex flex-col gap-4 text-sm">
                <div className="flex items-center gap-3 py-1">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold min-w-[90px]">{t("username")}:</span>
                  <span>{c.username || "-"}</span>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold min-w-[90px]">{t("firstName")}:</span>
                  <span>{c.first_name || "-"}</span>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold min-w-[90px]">{t("lastName")}:</span>
                  <span>{c.last_name || "-"}</span>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <UserCheck className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold min-w-[90px]">{t("Role")}:</span>
                  <span>{c.role || "-"}</span>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold min-w-[90px]">{t("company")}:</span>
                  <span>{c.billing?.company || "-"}</span>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold min-w-[90px]">{t("zipcode")}:</span>
                  <span>{c.billing?.postcode || "-"}</span>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold min-w-[90px]">{t("email")}:</span>
                  {/* Added styles here for responsiveness */}
                  <span 
                    className="block max-w-full truncate overflow-hidden break-words"
                    style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                  >
                    {c.email || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold min-w-[90px]">{t("mobile")}:</span>
                  <span>{c.billing?.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold min-w-[90px]">{t("joinDate")}:</span>
                  <span>
                    {c.date_created
                      ? new Date(c.date_created).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  onClick={() => router.push(`/storcustomers/customers/edit/${c.id}`)}
                  disabled={actionLoading}
                  variant="outline"
                  size="sm"
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button
                  onClick={() => handleDelete(c.id)}
                  disabled={actionLoading}
                  variant="default"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}


      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            disabled={currentPage === 1 || actionLoading}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            disabled={currentPage === totalPages || actionLoading}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
