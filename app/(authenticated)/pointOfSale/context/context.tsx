"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export type ProductMinimal = {
  id: number;
  name: string;
  price: string;
  image?: string;
};

export type CartItem = {
  product: ProductMinimal;
  quantity: number;
};

export type Customer = {
  id: number;
  name: string;
  email?: string;
};

export type BillingDetails = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};

export type ShippingDetails = {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: ProductMinimal) => void;
  removeFromCart: (productId: number) => void;
  updateCartItem: (productId: number, quantity: number) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  getTotalAmount: () => number;
  getTotalItems: () => number;
  clearCart: () => void;
  guestBilling: BillingDetails | null;
  setGuestBilling: (billing: BillingDetails | null) => void;
  guestShipping: ShippingDetails | null;
  setGuestShipping: (shipping: ShippingDetails | null) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [guestBilling, setGuestBilling] = useState<BillingDetails | null>(null);
  const [guestShipping, setGuestShipping] = useState<ShippingDetails | null>(null);

  const addToCart = (product: ProductMinimal) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartItem = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const getTotalAmount = () =>
    cart.reduce((total, item) => total + parseFloat(item.product.price) * item.quantity, 0);

  const getTotalItems = () => cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartItem,
        selectedCustomer,
        setSelectedCustomer,
        getTotalAmount,
        getTotalItems,
        clearCart,
        guestBilling,
        setGuestBilling,
        guestShipping,
        setGuestShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
