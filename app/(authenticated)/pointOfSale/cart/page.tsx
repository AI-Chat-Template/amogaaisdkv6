"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart, BillingDetails, ShippingDetails } from "../context/context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react";
import { z, ZodError } from "zod";
import { useTranslations } from "next-intl";

type CustomerDataWithDetails = {
  email?: string;
  billing?: BillingDetails;
  shipping?: ShippingDetails;
};

// Validation schemas with enhanced rules
const guestBillingSchema = z.object({
  first_name: z.string().min(1, { message: "Required" }),
  last_name: z.string().min(1, { message: "Required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val), {
      message: "Phone number must be exactly 10 digits",
    }),
  address_1: z.string().min(1, { message: "Required" }),
  address_2: z.string().optional(),
  city: z.string().min(1, { message: "Required" }),
  state: z.string().min(1, { message: "Required" }),
  postcode: z
    .string()
    .min(1, { message: "Required" })
    .regex(/^\d+$/, { message: "Postcode must contain digits only" }),
  country: z.string().min(1, { message: "Required" }),
});

const guestShippingSchema = z.object({
  first_name: z.string().min(1, { message: "Required" }),
  last_name: z.string().min(1, { message: "Required" }),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val), {
      message: "Phone number must be exactly 10 digits",
    }),
  address_1: z.string().min(1, { message: "Required" }),
  address_2: z.string().optional(),
  city: z.string().min(1, { message: "Required" }),
  state: z.string().min(1, { message: "Required" }),
  postcode: z
    .string()
    .min(1, { message: "Required" })
    .regex(/^\d+$/, { message: "Postcode must contain digits only" }),
  country: z.string().min(1, { message: "Required" }),
});

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    selectedCustomer,
    getTotalAmount,
    clearCart,
    guestBilling,
    setGuestBilling,
    guestShipping,
    setGuestShipping,
    updateCartItem,
    removeFromCart,
  } = useCart();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const t = useTranslations("pos.cart");

  // State for validation error messages per field for display
  const [billingErrors, setBillingErrors] = useState<Record<string, string>>({});
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedCustomer?.id === 0) {
      if (!guestBilling) {
        setGuestBilling({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          address_1: "",
          address_2: "",
          city: "",
          state: "",
          postcode: "",
          country: "",
        });
      }
      if (!guestShipping) {
        setGuestShipping({
          first_name: "",
          last_name: "",
          phone: "",
          address_1: "",
          address_2: "",
          city: "",
          state: "",
          postcode: "",
          country: "",
        });
      }
    } else {
      setGuestBilling(null);
      setGuestShipping(null);
      setBillingErrors({});
      setShippingErrors({});
    }
  }, [selectedCustomer, setGuestBilling, setGuestShipping]);

  const billingFields: (keyof BillingDetails)[] = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "address_1",
    "address_2",
    "city",
    "state",
    "postcode",
    "country",
  ];

  const shippingFields: (keyof ShippingDetails)[] = [
    "first_name",
    "last_name",
    "phone",
    "address_1",
    "address_2",
    "city",
    "state",
    "postcode",
    "country",
  ];

  function handleInputChange(
    e: ChangeEvent<HTMLInputElement>,
    type: "billing" | "shipping",
    field: keyof BillingDetails | keyof ShippingDetails
  ) {
    const value = e.target.value;
    if (type === "billing" && guestBilling) {
      setGuestBilling({ ...guestBilling, [field]: value });
      setBillingErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (type === "shipping" && guestShipping) {
      setGuestShipping({ ...guestShipping, [field]: value });
      setShippingErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  async function handlePlaceOrder() {
    if (!selectedCustomer || cart.length === 0) return;

    if (selectedCustomer.id === 0) {
      setMessage(null);
      let billingValidationErrors: Record<string, string> = {};
      let shippingValidationErrors: Record<string, string> = {};

      try {
        guestBillingSchema.parse(guestBilling);
        setBillingErrors({});
      } catch (e) {
        if (e instanceof ZodError) {
          const fieldErrors = e.formErrors.fieldErrors;
          billingValidationErrors = {};
          for (const key in fieldErrors) {
            const arr = fieldErrors[key];
            if (arr && arr.length > 0) {
              billingValidationErrors[key] = arr[0];
            }
          }
          setBillingErrors(billingValidationErrors);
        }
      }

      try {
        guestShippingSchema.parse(guestShipping);
        setShippingErrors({});
      } catch (e) {
        if (e instanceof ZodError) {
          const fieldErrors = e.formErrors.fieldErrors;
          shippingValidationErrors = {};
          for (const key in fieldErrors) {
            const arr = fieldErrors[key];
            if (arr && arr.length > 0) {
              shippingValidationErrors[key] = arr[0];
            }
          }
          setShippingErrors(shippingValidationErrors);
        }
      }

      if (
        Object.keys(billingValidationErrors).length > 0 ||
        Object.keys(shippingValidationErrors).length > 0
      ) {
        setMessage("Please fill all required fields correctly.");
        setSaving(false);
        return;
      }
    }

    setSaving(true);
    setMessage(null);

    try {
      let orderData: any = {
        line_items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_method: "cod",
        payment_method_title: "Cash on Delivery",
        set_paid: false,
      };

      if (selectedCustomer.id === 0) {
        orderData.billing = guestBilling;
        orderData.shipping = guestShipping;
      } else {
        // Use API route instead of direct server action
        const customerResp = await fetch(`/api/pos/customers/${selectedCustomer.id}`);
        const customerJson = await customerResp.json();
        const customerData: CustomerDataWithDetails = customerJson.data || {};

        if (!customerData.billing) customerData.billing = {} as BillingDetails;
        if (!customerData.billing.email || customerData.billing.email.trim() === "") {
          customerData.billing.email = customerData.email || "";
        }

        orderData.customer_id = selectedCustomer.id;
        orderData.billing = customerData.billing;
        orderData.shipping = customerData.shipping || {};
      }

      // Use API route to create order
      const orderResp = await fetch("/api/pos/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const result = await orderResp.json();

      if (!result.success) throw new Error(result.error || "Order failed");

      setMessage("Order placed successfully!");
      setOrderId(result.data.id);
      setModalOpen(true);
      clearCart();
      setGuestBilling(null);
      setGuestShipping(null);
      setBillingErrors({});
      setShippingErrors({});
    } catch (err: any) {
      setMessage("Failed to place order: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">{t("title")}</h1>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-1"
          >
            <ArrowLeft size={16} />
            <span>{t("backButton")}</span>
          </Button>
        </div>

        {/* Customer Details */}
        <section className="border p-4 rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t("customerDetails")}</h2>
          {selectedCustomer ? (
            <div>
              <p className="font-bold text-lg">{selectedCustomer.name}</p>
              <p className="text-muted-foreground">{selectedCustomer.email}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">{t("noCustomer")}</p>
          )}
        </section>

        {/* Guest Billing & Shipping */}
        {selectedCustomer?.id === 0 && guestBilling && guestShipping && (
          <section className="border p-4 rounded shadow-sm space-y-6">
            {/* Billing */}
            <div>
              <h3 className="font-semibold mb-2">{t("billing.title")}</h3>
              <div className="grid grid-cols-1 gap-3">
                {billingFields.map((field) => (
                  <div key={`billing-${field}`} className="flex flex-col">
                    <label className="text-sm font-medium mb-1">
                      {t(`billing.${field}`)}
                    </label>
                    <Input
                      placeholder={t(`billing.placeholder.${field}`)}
                      value={guestBilling[field] || ""}
                      onChange={(e) => handleInputChange(e, "billing", field)}
                    />
                    {billingErrors[field] && (
                      <p className="text-red-600 text-xs mt-1">{billingErrors[field]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping */}
            <div>
              <h3 className="font-semibold mb-2">{t("shipping.title")}</h3>
              <div className="grid grid-cols-1 gap-3">
                {shippingFields.map((field) => (
                  <div key={`shipping-${field}`} className="flex flex-col">
                    <label className="text-sm font-medium mb-1">
                      {t(`shipping.${field}`)}
                    </label>
                    <Input
                      placeholder={t(`shipping.placeholder.${field}`)}
                      value={guestShipping[field] || ""}
                      onChange={(e) => handleInputChange(e, "shipping", field)}
                    />
                    {shippingErrors[field] && (
                      <p className="text-red-600 text-xs mt-1">{shippingErrors[field]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Cart Items */}
        <section className="border p-4 rounded shadow-sm space-y-4">
          <h2 className="text-xl font-semibold mb-4">{t("order.title")}</h2>
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground">{t("order.cartempty")}.</p>
          ) : (
            cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between border-b py-3 gap-4"
              >
                <img
                  src={product.image || "/placeholder.png"}
                  alt={product.name}
                  className="w-24 h-24 object-contain rounded"
                />
                <div className="flex-1">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Price: ${parseFloat(product.price).toFixed(2)}
                  </p>
                </div>

                {/* Quantity & Remove */}
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() =>
                      updateCartItem(product.id, Math.max(1, quantity - 1))
                    }
                    variant="default"
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="px-3 py-1 border rounded text-center w-12">
                    {quantity}
                  </span>
                  <Button
                    onClick={() => updateCartItem(product.id, quantity + 1)}
                    variant="default"
                  >
                    <Plus size={16} />
                  </Button>
                  <Button
                    onClick={() => removeFromCart(product.id)}
                    variant="default"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <p className="font-bold">
                  ${(parseFloat(product.price) * quantity).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </section>

        {/* Total */}
        <section className="flex justify-between font-bold text-xl border-t pt-4">
          <span>Total</span>
          <span>${getTotalAmount().toFixed(2)}</span>
        </section>

        {/* Message */}
        {message && (
          <p
            className={`mt-4 font-semibold ${
              message.toLowerCase().includes("success")
                ? "text-green-600"
                : "text-red-600"
            }`}
            role="alert"
          >
            {message}
          </p>
        )}

        {/* Action buttons */}
        <section className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => router.back()}
            className="w-full sm:w-auto"
          >
            Go Back
          </Button>
          <Button
            disabled={cart.length === 0 || !selectedCustomer || saving}
            onClick={handlePlaceOrder}
            className="w-full sm:w-auto"
          >
            {saving ? "Placing Order..." : "Place Order"}
          </Button>
        </section>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Order Placed Successfully"
      >
        <div className="flex flex-col justify-between h-full">
          <div className="space-y-2">
            <p className="text-gray-800 text-lg font-semibold">
              Your order ID is{" "}
              <span className="text-green-600 font-bold">{orderId}</span>.
            </p>
            <p className="text-gray-600 text-sm">
              Thank you for your purchase! We appreciate your business.
            </p>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="px-6 py-2 rounded border-gray-300 hover:bg-gray-100 transition-colors duration-150"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                router.push("/pointOfSale");
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow-lg transition-colors duration-150"
            >
              Go To Point Of Sale
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg relative mx-2 sm:mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-green-700">{title}</h2>
        <div className="text-left">{children}</div>
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-600 hover:text-gray-900 text-xl font-bold"
          aria-label="Close modal"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
