"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Tag,
  FileText,
  Percent,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash,
} from "lucide-react";
import { useTranslations } from "next-intl";

// API base URL - using relative path for client components
const API_BASE = "/api/storcoupons";

// Types (matching API response)
interface CouponData {
  id?: number;
  code: string;
  amount: string;
  status?: string;
  date_created?: string;
  date_modified?: string;
  discount_type: string;
  description?: string;
  date_expires?: string;
  date_expires_gmt?: string;
  usage_limit_per_user?: number;
  free_shipping?: boolean;
  product_ids?: number[];
  exclude_sale_items?: boolean;
  minimum_amount?: string;
  maximum_amount?: string;
  email_restrictions?: string[];
  individual_use?: boolean;
}

// API functions
async function fetchCoupons(): Promise<CouponData[]> {
  const response = await fetch(API_BASE, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch coupons");
  }

  const result = await response.json();
  return result.data || [];
}

async function deleteCouponApi(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete coupon");
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to delete coupon");
  }
}

export default function StoreCouponsPage() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [filtered, setFiltered] = useState<CouponData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 5;
  const router = useRouter();

  const fetchCouponsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCoupons();
      setCoupons(data);
      setFiltered(data);
    } catch (err: any) {
      setError(err.message || "Failed to load coupons");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCouponsData();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchCouponsData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const filteredList = coupons.filter((c) =>
      c.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFiltered(filteredList);
    setPage(1);
  }, [searchTerm, coupons]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const t = useTranslations("storecoupons");

  // Direct delete with Sonner toast
  const handleDelete = async (id: number) => {
    try {
      await deleteCouponApi(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setFiltered((prev) => prev.filter((c) => c.id !== id));
      toast.success("Coupon deleted successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete coupon");
    }
  };

  return (
    <div className="flex justify-center p-6">
      <div className="w-full max-w-[800px] space-y-6">
        <h1 className="font-bold text-2xl">{t("title")}</h1>

        {/* Searchbar + New Button */}
        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4" />
            <Input
              placeholder="Search coupons..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={() => router.push("/storcoupons/coupons/new")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Total Coupons Count */}
        {!loading && !error && (
          <p className="text-sm text-gray-600">
            {t("description")}: {coupons.length}
          </p>
        )}

        {/* Loading/Error */}
        {loading && (
          <div className="flex justify-center my-10">
            <svg
              className="animate-spin -ml-1 mr-3 h-10 w-10 text-gray-900"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Loading"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
        )}
        {error && <p className="text-center text-red-600">{error}</p>}

        {/* Coupon Cards */}
        {!loading && !error && paginated.length === 0 && (
          <p className="text-center">No coupons found.</p>
        )}

        {!loading &&
          !error &&
          paginated.map((coupon) => (
            <Card key={coupon.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  {coupon.code}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{t("cardDescription")}:</span>
                  <span>{coupon.description || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  <span className="font-medium">{t("amount")}:</span>
                  <span>{coupon.amount || "_"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{t("created")}:</span>
                  <span>
                    {coupon.date_created
                      ? new Date(coupon.date_created).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{t("expiry")}:</span>
                  <span>
                    {(coupon.date_expires || coupon.date_expires_gmt)
                      ? new Date(
                          new Date(
                            coupon.date_expires || coupon.date_expires_gmt || ""
                          ).getTime() -
                            new Date(
                              coupon.date_expires || coupon.date_expires_gmt || ""
                            ).getTimezoneOffset() *
                              60000
                        ).toLocaleDateString()
                      : "No expiry"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {coupon.status === "publish" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span className="font-medium">{t("status")}:</span>
                  <span>{coupon.status || "unknown"}</span>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/storcoupons/coupons/edit/${coupon.id}`)
                  }
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleDelete(coupon.id!)}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
