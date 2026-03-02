// app/(authenticated)/storproducts/products/edit/[id]/page.tsx
/* eslint-disable */
import EditProducts from "../../../_components/EditProduct";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6">
      <EditProducts id={id} />
    </div>
  );
}
