import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { flexRender, Table } from "@tanstack/react-table";
import { ProductType } from "../type";

interface RecordsCardProps {
  records: ProductType[];
  table: Table<ProductType>;
}


export function CardsView({ records, table }: RecordsCardProps) {
  const getActionCell = React.useCallback(
    (recordId: string) => {
      return table
        .getRowModel()
        .rowsById[recordId]?.getAllCells()
        .find((cell) => cell.column.id === "actions");
    },
    [table]
  );

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {records.map((product) => {
        const actionCell = getActionCell(product.id?.toString() ?? "");

        return (
          <Card key={product?.id} className="w-full rounded-md relative">
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>SKU: {product.sku}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>ID: {product.id}</p>
              <p>Price: {product.price}</p>
              <p>Status: {product.status}</p>
              <p>Stock: {product.stock_quantity ?? '-'}</p>
              {product.images && product.images[0] && (
                <img src={product.images[0].src} alt={product.images[0].alt} className="w-full h-32 object-contain mt-2" />
              )}
            </CardContent>

            <div className="absolute right-0 bottom-0 p-4">
              {actionCell
                ? flexRender(
                    actionCell.column.columnDef.cell,
                    actionCell.getContext()
                  )
                : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
