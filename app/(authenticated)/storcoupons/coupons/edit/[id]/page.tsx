"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import { ArrowLeft } from "lucide-react";

import { useTranslations } from "next-intl";

// API base URLs
const API_BASE = "/api/storcoupons";
const PRODUCTS_API = "/api/storcoupons/products";

// Types
interface CouponData {
    id?: number;
    code: string;
    amount: string;
    discount_type: string;
    description?: string;
    date_expires?: string;
    free_shipping?: boolean;
    exclude_sale_items?: boolean;
    individual_use?: boolean;
    product_ids?: number[];
    minimum_amount?: string;
    maximum_amount?: string;
}

interface Product {
    id: number;
    name: string;
}

// Schema
const couponSchema = z.object({
    code: z.string().min(1, "Coupon code is required"),
    amount: z.string().min(1, "Amount is required"),
    discount_type: z.enum(["fixed_cart", "percent", "fixed_product"]),
    description: z.string().optional(),
    date_expires: z.string().optional(),
    free_shipping: z.boolean().optional(),
    exclude_sale_items: z.boolean().optional(),
    individual_use: z.boolean().optional(),
    product_ids: z.array(z.number()).optional(),
    minimum_amount: z.string().optional(),
    maximum_amount: z.string().optional(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

// API functions
async function fetchCoupon(id: number): Promise<CouponData | null> {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch coupon");
    }

    const result = await response.json();
    return result.data || null;
}

async function fetchProducts(): Promise<Product[]> {
    const response = await fetch(PRODUCTS_API, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "force-cache", // Products can be cached
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch products");
    }

    const result = await response.json();
    return result.data || [];
}

async function updateCouponApi(id: number, data: Partial<CouponData>): Promise<CouponData> {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update coupon");
    }

    const result = await response.json();
    return result.data;
}

export default function EditCouponPage() {
    const router = useRouter();
    const params = useParams();
    const couponId = params?.id ? Number(params.id) : null;

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!!couponId);
    const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
    const t = useTranslations("storecoupons.edit");
    const form = useForm<CouponFormValues>({
        resolver: zodResolver(couponSchema),
        defaultValues: {
            code: "",
            amount: "",
            discount_type: "fixed_cart",
            description: "",
            date_expires: "",
            free_shipping: false,
            exclude_sale_items: false,
            individual_use: false,
            product_ids: [],
            minimum_amount: "",
            maximum_amount: "",
        },
    });

    useEffect(() => {
        (async () => {
            try {
                const [coupon, productsList] = await Promise.all([
                    couponId ? fetchCoupon(couponId) : Promise.resolve(null),
                    fetchProducts(),
                ]);
                setProducts(productsList || []);

                if (coupon) {
                    form.reset({
                        ...coupon,
                        discount_type: coupon.discount_type as "fixed_cart" | "percent" | "fixed_product",
                        date_expires: coupon.date_expires
                            ? new Date(
                                new Date(coupon.date_expires).getTime() -
                                new Date(coupon.date_expires).getTimezoneOffset() * 60000
                            )
                                .toISOString()
                                .split("T")[0]
                            : "",

                        minimum_amount: coupon.minimum_amount
                            ? String(Number(coupon.minimum_amount))
                            : "",
                        maximum_amount: coupon.maximum_amount
                            ? String(Number(coupon.maximum_amount))
                            : "",
                        free_shipping: !!coupon.free_shipping,
                        exclude_sale_items: !!coupon.exclude_sale_items,
                        individual_use: !!coupon.individual_use,
                        product_ids: coupon.product_ids || [],
                    });
                }
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Failed to load coupon data");
            } finally {
                setLoading(false);
            }
        })();
    }, [couponId, form]);

    const onSubmit = async (values: CouponFormValues) => {
        try {
            setSaving(true);

            const cleanedValues = {
                ...values,
                minimum_amount: values.minimum_amount?.trim() || "",
                maximum_amount: values.maximum_amount?.trim() || "",
                date_expires: values.date_expires || undefined,
            };

            console.log("Submitting cleaned coupon:", cleanedValues);

            if (couponId) {
                await updateCouponApi(couponId, cleanedValues);
                toast.success("Coupon updated successfully");
            } else {
                toast.error("Coupon ID missing!");
            }

            router.push("/storcoupons");
            router.refresh();

        } catch (error: any) {
            toast.error(error.message || "Failed to save coupon");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto p-6 border rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-semibold">
                    {couponId ? t("title") : "Create Coupon"}
                </h1>
                <Button
                    variant="outline"
                    onClick={() => router.push("/storcoupons")}
                    className="flex items-center gap-1"
                >
                    <ArrowLeft size={16} />{t("backButton")}
                </Button>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    {/* Coupon Code */}
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("couponCode")}</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter coupon code" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Amount */}
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("amount")}</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter discount amount" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Discount Type */}
                    <FormField
                        control={form.control}
                        name="discount_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("discountType")}</FormLabel>
                                <FormControl>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select discount type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed_cart">Fixed Cart</SelectItem>
                                            <SelectItem value="percent">Percentage</SelectItem>
                                            <SelectItem value="fixed_product">
                                                Fixed Product
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Description */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("description")}</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter description" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Expiration Date */}
                    <FormField
                        control={form.control}
                        name="date_expires"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("expirationDate")}</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Minimum Spend */}
                    <FormField
                        control={form.control}
                        name="minimum_amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("minimumSpend")}</FormLabel>
                                <FormControl>
                                    <Input placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Maximum Spend */}
                    <FormField
                        control={form.control}
                        name="maximum_amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("maximumSpend")}</FormLabel>
                                <FormControl>
                                    <Input placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Free Shipping */}
                    <FormField
                        control={form.control}
                        name="free_shipping"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Checkbox
                                            checked={!!field.value}
                                            onCheckedChange={field.onChange}
                                            className="shrink-0"
                                        />
                                    </FormControl>
                                    <FormLabel className="mb-0 cursor-pointer">{t("freeShipping")}</FormLabel>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />


                    {/* Exclude Sale Items */}
                    <FormField
                        control={form.control}
                        name="exclude_sale_items"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Checkbox
                                            checked={!!field.value}
                                            onCheckedChange={field.onChange}
                                            className="shrink-0"
                                        />
                                    </FormControl>
                                    <FormLabel className="mb-0 cursor-pointer">{t("excludeSaleItems")}</FormLabel>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="individual_use"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Checkbox
                                            checked={!!field.value}
                                            onCheckedChange={field.onChange}
                                            className="shrink-0"
                                        />
                                    </FormControl>
                                    <FormLabel className="mb-0 cursor-pointer">{t("individualUseOnly")}</FormLabel>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />


                    {/* Product IDs */}
                    <FormField
                        control={form.control}
                        name="product_ids"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("applytoProducts")}</FormLabel>
                                <FormControl>
                                    <div className="border rounded-md p-2">
                                        <Command className="max-h-60 overflow-y-auto text-sm">
                                            <CommandInput placeholder="Search products..." />
                                            <CommandList>
                                                <CommandEmpty>No products found.</CommandEmpty>
                                                <CommandGroup>
                                                    {products.map((product) => {
                                                        const selectedIds = field.value ?? [];
                                                        const isSelected = selectedIds.includes(product.id);
                                                        return (
                                                            <CommandItem
                                                                key={product.id}
                                                                value={product.name.toLowerCase()}
                                                                onSelect={() => {
                                                                    const newValue = isSelected
                                                                        ? selectedIds.filter(
                                                                            (id) => id !== product.id
                                                                        )
                                                                        : [...selectedIds, product.id];
                                                                    field.onChange(newValue);
                                                                }}
                                                                className="flex items-center justify-between text-xs py-1"
                                                            >
                                                                <span>{product.name}</span>
                                                                {isSelected && (
                                                                    <span className="text-primary text-xs font-medium">
                                                                        ✓
                                                                    </span>
                                                                )}
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </div>
                                </FormControl>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t("selected")}:{" "}
                                    {(field.value ?? []).length
                                        ? (field.value ?? []).join(", ")
                                        : "No products selected"}
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/storcoupons")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Update Coupon"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
