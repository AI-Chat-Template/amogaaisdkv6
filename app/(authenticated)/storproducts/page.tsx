/* eslint-disable */
"use client";

import * as React from "react";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Search as SearchIcon,
  Plus,
  Pencil,
  Trash2,
  Globe,
  BarChart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { getWooProducts, deleteWooProduct, getWooCategories } from "./actions";

import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const stripHtml = (html?: string) =>
  html ? html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";

type WooImage = { src: string; alt?: string };
type WooCategory = { id: number; name: string; slug: string; parent: number };
type Product = {
  id: number;
  name: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  images: WooImage[];
  stock_status?: string;
  stock_quantity?: number | null;
  short_description?: string;
  description?: string;
  categories?: { id: number; name?: string; slug?: string }[];
};

const PER_PAGE = 15;
const MAX_PAGES_TO_FETCH = 50;

export default function StorProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const pageFromUrl = Number(sp.get("page") || "1");
  const catFromUrl = sp.get("cat") || "all";
  const searchFromUrl = sp.get("q") || "";
  const t = useTranslations("StoreProducts");

  const [page, setPage] = React.useState<number>(Math.max(1, pageFromUrl));
  const [q, setQ] = React.useState<string>(searchFromUrl);
  const [category, setCategory] = React.useState<string>(catFromUrl);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [categories, setCategories] = React.useState<WooCategory[]>([]);
  const [fullProducts, setFullProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const cats = await getWooCategories();
        setCategories([{ id: -1, name: "All Products", slug: "all", parent: 0 }, ...cats]);
      } catch {
        setCategories([{ id: -1, name: "All Products", slug: "all", parent: 0 }]);
      }
    })();
  }, []);

  const visibleProducts = React.useMemo(() => {
    let filtered = fullProducts;
    if (category && category !== "all") {
      filtered = filtered.filter((p) =>
        p.categories?.some((c) => c.slug === category)
      );
    }
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(term));
    }
    return filtered;
  }, [fullProducts, category, q]);

  const filteredPages = Math.max(1, Math.ceil(visibleProducts.length / PER_PAGE));
  const pageClamped = Math.min(Math.max(1, page), filteredPages);

  const paginatedProducts = React.useMemo(() => {
    const start = (pageClamped - 1) * PER_PAGE;
    return visibleProducts.slice(start, start + PER_PAGE);
  }, [visibleProducts, pageClamped]);

  const loadAllForQuery = React.useCallback(
    async (queryStr: string) => {
      setLoading(true);
      setError(null);
      try {
        const first = await getWooProducts({ page: 1, perPage: PER_PAGE, search: queryStr || undefined });
        const firstProducts = (first.products as Product[]) ?? [];
        const totalPages = Math.min(first.pages || 1, MAX_PAGES_TO_FETCH);
        if (totalPages <= 1) {
          setFullProducts(firstProducts);
          setLoading(false);
          return;
        }
        const pagesToFetch = [];
        for (let p = 2; p <= totalPages; p++) {
          pagesToFetch.push(p);
        }
        const BATCH = 5;
        let aggregated = [...firstProducts];
        for (let i = 0; i < pagesToFetch.length; i += BATCH) {
          const batch = pagesToFetch.slice(i, i + BATCH);
          const res = await Promise.all(
            batch.map((p) => getWooProducts({ page: p, perPage: PER_PAGE, search: queryStr || undefined }))
          );
          for (const r of res) {
            aggregated = aggregated.concat(((r?.products as Product[]) ?? []));
          }
        }
        const dedup = Array.from(new Map(aggregated.map((p) => [p.id, p])).values());
        setFullProducts(dedup);
      } catch (e: any) {
        setError(e.message || "Failed to load products");
        setFullProducts([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const syncUrl = (nextPage: number, nextQ: string, nextCat: string) => {
    const params = new URLSearchParams(sp);
    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");
    if (nextQ && nextQ.trim()) params.set("q", nextQ.trim());
    else params.delete("q");
    if (nextCat && nextCat !== "all") params.set("cat", nextCat);
    else params.delete("cat");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  React.useEffect(() => {
    loadAllForQuery(q);
  }, [q, loadAllForQuery]);

  React.useEffect(() => {
    setCategory(catFromUrl);
    setPage(Math.max(1, pageFromUrl));
  }, [catFromUrl, pageFromUrl]);

  const goTo = (p: number) => {
    const np = Math.min(Math.max(1, p), filteredPages || 1);
    setPage(np);
    syncUrl(np, q, category);
  };

  const onSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    setPage(1);
    syncUrl(1, value, category);
    setQ(value);
  };

  const onCategoryClick = (slug: string) => {
    setPage(1);
    setCategory(slug);
    syncUrl(1, q, slug);
  };

  const goCreate = () => router.push("/storproducts/product/new");
  const goEdit = (id: number) => router.push(`/storproducts/product/edit/${id}`);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);

  const requestDelete = (product: Product) => {
    setDeleteTarget(product);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const prev = fullProducts;
    setFullProducts((d) => d.filter((x) => x.id !== deleteTarget.id));
    setConfirmOpen(false);
    try {
      await deleteWooProduct(deleteTarget.id);
      toast.success("Product deleted successfully");
    } catch {
      setFullProducts(prev);
      toast.error("Delete failed");
    }
    setDeleteTarget(null);
  };

  const Pagination = () => {
    const total = filteredPages || 1;
    if (total <= 1 || visibleProducts.length === 0) return null;
    const maxWindow = 5;
    const half = Math.floor(maxWindow / 2);
    let start = Math.max(1, pageClamped - half);
    let end = start + maxWindow - 1;
    if (end > total) {
      end = total;
      start = Math.max(1, end - maxWindow + 1);
    }
    const pagesArray = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    return (
      <nav className="mt-6 flex items-center justify-center gap-1" aria-label="Pagination">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => goTo(pageClamped - 1)}
          disabled={pageClamped <= 1}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pagesArray.map((n) => (
          <Button
            key={n}
            variant={n === pageClamped ? "default" : "outline"}
            className="h-9 px-3"
            onClick={() => goTo(n)}
            aria-current={n === pageClamped ? "page" : undefined}
          >
            {n}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => goTo(pageClamped + 1)}
          disabled={pageClamped >= total}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    );
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!scrollRef.current) return;
    const activeButton = scrollRef.current.querySelector(`[data-cat="${category}"]`) as HTMLElement;
    if (activeButton) {
      const left = activeButton.offsetLeft - 18;
      scrollRef.current.scrollTo({ left, behavior: "smooth" });
    }
  }, [category]);

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[800px] px-2 sm:px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>
        <div className="mb-6 flex flex-row items-center gap-2 w-full">
          <div className="relative flex-1 min-w-0">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onSearchEnter}
              placeholder={t("placeholder")}
              className="pl-9"
              aria-label="Search products"
            />
          </div>
          <Button className="h-9 w-9 min-w-[36px] p-0 flex-shrink-0" onClick={goCreate} aria-label="Create">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-2 mb-5 overflow-x-auto no-scrollbar"
          style={{ maxWidth: 800, width: "100%" }}
        >
          {categories.map((cat) => (
            <Button
              key={cat.id}
              data-cat={cat.slug}
              variant={category === cat.slug ? "default" : "outline"}
              className="rounded-lg font-normal py-2 px-5 text-sm whitespace-nowrap"
              onClick={() => onCategoryClick(cat.slug)}
            >
              {cat.name}
            </Button>
          ))}
          <style jsx global>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </div>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : loading ? (
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
        ) : visibleProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noProducts")}</p>
        ) : (
          <div className="space-y-4">
            {paginatedProducts.map((p) => {
              const img = p.images?.[0]?.src ?? "";
              const alt = p.images?.[0]?.alt ?? p.name;
              const description = stripHtml(p.short_description || p.description);
              const qty =
                typeof p.stock_quantity === "number" ? p.stock_quantity : undefined;
              const statusText = (p.stock_status || "unknown").replace(/_/g, " ");
              const statusColor =
                p.stock_status === "instock"
                  ? "bg-green-100 text-green-700"
                  : p.stock_status === "onbackorder"
                    ? "bg-amber-100 text-amber-700"
                    : p.stock_status === "outofstock"
                      ? "bg-red-100 text-red-700"
                      : "bg-muted text-muted-foreground";
              const regular = p.regular_price && Number(p.regular_price) > 0
                ? <span className="text-muted-foreground line-through">$ {p.regular_price}</span>
                : null;
              const current = p.sale_price && Number(p.sale_price) > 0 ? p.sale_price : p.price;
              const price =
                current && Number(current) > 0
                  ? <span className="font-medium">$ {current}</span>
                  : !regular
                    ? <span>—</span>
                    : null;

              // Responsive card: column on mobile, row on desktop
              return (
                <Card key={p.id} className="overflow-hidden hover:bg-popover">
                  <div className="flex flex-col sm:flex-row gap-4 p-3 sm:p-4">
                    {/* Image section */}
                    <div className="flex justify-center items-center w-full sm:w-32 sm:min-w-[128px]">
                      <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-md overflow-hidden mb-2">
                        {img ? (
                          <Image
                            src={img}
                            alt={alt}
                            fill
                            sizes="128px"
                            className="object-contain"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                      </div>
                    </div>
                    {/* Info + actions - stack as column so icons always below text */}
                    <div className="flex-1 flex flex-col justify-between">
                      {/* Info section */}
                      <div>
                        <CardHeader className="p-0 mb-1">
                          <CardTitle className="text-base truncate">{p.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 mb-1">
                          <p
                            className="text-sm text-muted-foreground"
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {description || "No description"}
                          </p>
                        </CardContent>
                        <div className="mb-1">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                              {regular}{price}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {qty !== undefined ? (
                            <span className="inline-flex min-w-[24px] justify-center items-center rounded-md bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                              {qty}
                            </span>
                          ) : null}
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs ${statusColor}`}>
                            {statusText}
                          </span>
                        </div>
                      </div>
                      {/* Actions row always below info */}
                      <div className="flex flex-row gap-2 mt-3 sm:mt-4 items-center justify-end w-full sm:w-auto">
                        <Button variant="ghost" size="icon" onClick={() => goEdit(p.id)} aria-label="Edit">
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toast("Location for " + p.name)} aria-label="Location">
                          <Globe className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toast("Chart for " + p.name)} aria-label="Chart">
                          <BarChart className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toast("Chat for " + p.name)} aria-label="Chat">
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="More">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-md shadow-lg p-1">
                            <DropdownMenuItem onClick={() => goEdit(p.id)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast("Location for " + p.name)}>
                              <Globe className="h-4 w-4 mr-2" /> Location
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast("Chart for " + p.name)}>
                              <BarChart className="h-4 w-4 mr-2" /> Chart
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast("Chat for " + p.name)}>
                              <MessageCircle className="h-4 w-4 mr-2" /> Chat
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => requestDelete(p)}
                              className="text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </Card>

              );
            })}
          </div>
        )}
        <Pagination />
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-md rounded-lg p-4 shadow-md ">
            <DialogHeader className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <DialogTitle className="text-md font-bold text-gray-900 dark:text-gray-100">
                Confirm Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              {deleteTarget && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  ID: {deleteTarget.id}
                </div>
              )}
            </div>
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 transition px-3 py-1.5 text-sm"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 transition px-3 py-1.5 text-sm"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
