import Image from "next/image";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, Package, Tag } from "lucide-react";

// Type definitions
type ProductImage = {
  id: number;
  src: string;
  alt: string | null;
};

type ProductVariant = {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  inventory_quantity: number;
};

type Product = {
  id: number;
  title: string;
  body_html: string;
  product_type: string;
  vendor: string;
  status: string;
  images: ProductImage[];
  variants: ProductVariant[];
  created_at: string;
};

// API Response type
type ProductsResponse = {
  products: Product[];
};

// Server-side data fetching with optimized caching
async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/products`,
      {
        // Cache for 60 seconds, then revalidate in background
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      console.error("Failed to fetch products:", res.status);
      return [];
    }

    const data: ProductsResponse = await res.json();
    return data.products || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  const variant = product.variants?.[0];
  const hasDiscount = variant?.compare_at_price && 
    parseFloat(variant.compare_at_price) > parseFloat(variant.price);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative aspect-square bg-muted">
        {image?.src ? (
          <Image
            src={image.src}
            alt={image.alt || product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {product.status && (
          <Badge 
            variant={product.status === "active" ? "default" : "secondary"}
            className="absolute top-2 right-2"
          >
            {product.status}
          </Badge>
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
        {product.product_type && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Tag className="h-3 w-3" />
            {product.product_type}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">
              ${variant?.price || "0.00"}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                ${variant?.compare_at_price}
              </span>
            )}
          </div>
          {variant?.inventory_quantity !== undefined && variant.inventory_quantity > 0 && (
            <Badge variant="outline">
              {variant.inventory_quantity} in stock
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton Component
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square" />
          <CardHeader className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Skeleton className="h-6 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
        <p className="text-muted-foreground">
          There are no products in your store yet.
        </p>
      </div>
    </Card>
  );
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Shopify Products</h1>
          <p className="text-muted-foreground">
            Manage your store products
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Products Grid */}
      <Suspense fallback={<ProductGridSkeleton />}>
        {products.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Suspense>

      {/* Pagination (placeholder - can be extended) */}
      {products.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page 1 of 1
          </span>
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}