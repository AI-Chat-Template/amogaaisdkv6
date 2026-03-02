import { getProducts, getCategories, type Product, type Category } from "./actions";
import POSClient from "./_components/POSClient";

interface POSPageProps {
  searchQuery?: string;
  category?: string;
  page?: number;
}

export default async function POSPage({ searchQuery = "", category = "all", page = 1 }: POSPageProps) {
  const categoriesResult = await getCategories();
  const categories = categoriesResult.success ? categoriesResult.data : [];

  const productsResult = await getProducts({
    category: category === "all" ? undefined : category,
    search: searchQuery || undefined,
    page,
    per_page: 20,
  });

  const products = productsResult.success ? productsResult.data : [];
  const totalPages = productsResult.pages ?? 1;

  return (
    <POSClient
      products={products}
      categories={categories}
      initialCategory={category}
      initialSearchQuery={searchQuery}
      initialPage={page}
      totalPages={totalPages}
    />
  );
}
