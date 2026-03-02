"use client";

import React, { useEffect, useState } from "react";
import { type Product, type Category } from "../actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ShoppingCart,
  MapPin,
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  Archive,
  ChartColumn,
  MessageCircle,
} from "lucide-react";
import CustomerSelect from "./CustomerSelect";
import { useRouter } from "next/navigation";
import { useCart } from "../context/context";
import { useDebounce } from "@/hooks/use-debounce";

interface POSClientProps {
  products: Product[];
  categories: Category[];
  initialCategory: string;
  initialSearchQuery: string;
  initialPage: number;
  totalPages: number;
}

export default function POSClient({
  products: initialProducts,
  categories,
  initialCategory,
  initialSearchQuery,
  initialPage,
  totalPages: initialTotalPages,
}: POSClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  const { addToCart, selectedCustomer, getTotalItems } = useCart();
  const router = useRouter();
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    async function loadProducts() {

      setLoading(true);
      setError(null);
      try {
        const result = await fetch("/api/pos/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: selectedCategory === "all" ? undefined : selectedCategory,
            search: debouncedSearch || undefined,
            page: currentPage,
            per_page: 20,
          }),
        }).then((res) => res.json());

        if (result.success) {
          setProducts(result.data);
          setTotalPages(result.pages || 1);
        } else {
          setProducts([]);
          setTotalPages(1);
          setError(result.error || "Failed to load products");
        }
      } catch (e) {
        setProducts([]);
        setTotalPages(1);
        setError((e as Error)?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [selectedCategory, debouncedSearch, currentPage]);

  function handleCartClick() {
    if (!selectedCustomer) return;
    router.push("/pointOfSale/cart");
  }

  function handleAddToCart(product: Product) {
    const priceNumber = Number(product.price ?? product.regular_price ?? 0) || 0;
    const minimalProduct = {
      id: product.id,
      name: product.name,
      price: priceNumber.toFixed(2),
      image: product.images && product.images[0]?.src ? product.images[0].src : undefined,
    };

    try {
      addToCart(minimalProduct);
    } catch (e) {
      setError((e as Error)?.message || "Failed to add to cart");
    }
  }

  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full max-w-[800px]">
        {/* Header */}
        <header className="sticky top-0 z-10 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-3 sm:gap-4">
            {/* Search Bar (Top on mobile, left on desktop) */}
            <div className="relative flex-1 max-w-xl w-full order-1 sm:order-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search products by name"
                value={searchQuery}
                className="pl-10"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Customer + Cart (Below search on mobile, right on desktop) */}
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto order-2 sm:order-2">
              <CustomerSelect />
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Cart"
                onClick={handleCartClick}
                disabled={!selectedCustomer}
                title={!selectedCustomer ? "Select a customer before viewing cart" : undefined}
              >
                <ShoppingCart className="w-10 h-10" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Categories */}
        <div>
          <div className="px-4 py-3">
            <div
              className="flex gap-2 overflow-x-auto no-scrollbar"
              style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
            >
              <style>
                {`
                  .no-scrollbar::-webkit-scrollbar { display: none; }
                  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}
              </style>
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                className="rounded-md whitespace-nowrap"
                onClick={() => {
                  setSelectedCategory("all");
                  setCurrentPage(1);
                }}
              >
                All Products
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id.toString() ? "default" : "outline"}
                  className="rounded-md whitespace-nowrap"
                  onClick={() => {
                    setSelectedCategory(cat.id.toString());
                    setCurrentPage(1);
                  }}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main product listing */}
        <main className="px-4 py-6">
          <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
            <span>
              Showing <strong>{products.length}</strong> product{products.length !== 1 ? "s" : ""}
            </span>
            {selectedCategory !== "all" && (
              <span>
                In category:{" "}
                <strong>{categories.find((c) => c.id.toString() === selectedCategory)?.name || "Unknown"}</strong>
              </span>
            )}
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading products...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div role="alert" className="text-sm text-red-600">
                  {error}
                </div>
              )}
              {products.map((product) => {
                const regularPrice = parseFloat(product.regular_price || "0");
                const currentPrice = parseFloat(product.price || "0");
                const hasDiscount = regularPrice > currentPrice;

                return (
                  <Card
                    key={product.id}
                    className="flex flex-row items-start px-4 py-4 rounded-2xl shadow-none border min-h-[140px] relative"
                  >
                    {/* Image */}
                    <div className="w-32 h-32  flex items-center justify-center rounded-lg overflow-hidden shrink-0 mr-4 pt-1">
                      {product.images && product.images[0]?.src ? (
                        <img
                          src={product.images[0].src}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs">No Image</span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                      <div>
                        <div className="font-medium text-base truncate" title={product.name}>
                          {product.name}
                        </div>
                        <div className="flex items-center mb-1 mt-2">
                          {hasDiscount && (
                            <span className="text-sm line-through text-muted-foreground mr-2">
                              ${regularPrice.toFixed(0)}
                            </span>
                          )}
                          <span className="text-lg font-bold">${currentPrice.toFixed(0)}</span>
                        </div>
                        <div
                          className="text-sm text-muted-foreground mb-3"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {product.short_description?.replace(/<[^>]*>/g, "") ||
                            product.description?.replace(/<[^>]*>/g, "") ||
                            "No description available"}
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="font-medium px-3 py-1 rounded bg-muted border text-xs">
                            {product.stock_quantity || 0}
                          </span>
                          <span className="px-3 py-1 rounded border text-xs">{product.stock_status}</span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2 justify-end w-full mt-auto">
                        <Button
                          size="icon"
                          variant="default"
                          onClick={() => handleAddToCart(product)}
                          aria-label="Add to Cart"
                          className="rounded-lg"
                        >
                          <Plus />
                        </Button>
                        <Button size="icon" variant="ghost" className="rounded-lg">
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <MessageCircle className="mr-2 w-4 h-4" /> Chat
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ChartColumn className="mr-2 w-4 h-4" />Chart
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ShoppingCart className="mr-2 w-4 h-4" /> Orders
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="mr-2 w-4 h-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="mr-2 w-4 h-4" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">
                              <Trash2 className="mr-2 w-4 h-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="outline"
              >
                Previous
              </Button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
