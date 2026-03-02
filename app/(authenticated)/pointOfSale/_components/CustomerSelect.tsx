"use client";
import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, X, Loader2, Search } from "lucide-react";
import { useCart } from "../context/context";

export type Customer = {
  id: number;
  name: string;
  email?: string;
};

function truncate(text: string, maxLen: number) {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

export default function CustomerSelect() {
  const { selectedCustomer, setSelectedCustomer } = useCart();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch customers once on mount
  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/pos/customers");
        const result = await res.json();

        if (result.success) {
          const uniqueCustomers = result.data.filter(
            (v: Customer, i: number, a: Customer[]) => a.findIndex((c) => c.id === v.id) === i
          );
          setCustomers(uniqueCustomers);
          setFiltered(uniqueCustomers);
        } else {
          setCustomers([{ id: 0, name: "Guest" }]);
          setFiltered([{ id: 0, name: "Guest" }]);
        }
      } catch (error) {
        console.error("Failed to load customers:", error);
        setCustomers([{ id: 0, name: "Guest" }]);
        setFiltered([{ id: 0, name: "Guest" }]);
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300); // 300ms debounce
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Filter customers when debounced term changes
  useEffect(() => {
    if (!debouncedTerm) {
      setFiltered(customers);
    } else {
      const filteredList = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          (c.email && c.email.toLowerCase().includes(debouncedTerm.toLowerCase()))
      );
      setFiltered(filteredList);
    }
  }, [debouncedTerm, customers]);

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDropdownOpen(false);
  };

  const clearSelection = () => setSelectedCustomer(null);

  const displayName = (customer: Customer) => truncate(customer.name, 21);
  const displayEmail = (customer: Customer) =>
    customer.email && customer.email !== customer.name ? truncate(customer.email, 21) : null;

  return (
    <div ref={containerRef} className="relative w-60">
      {selectedCustomer ? (
        <div className="relative flex items-start gap-3 p-3 rounded-lg border border-gray-300 bg-gray-50 transition-all duration-200 h-[64px]">
          <div className="flex items-center gap-3 truncate w-full pr-6">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-medium shrink-0">
              {selectedCustomer.name[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex flex-col truncate leading-tight">
              <span className="font-medium text-gray-800 truncate text-sm" title={selectedCustomer.name}>
                {displayName(selectedCustomer)}
              </span>
              {displayEmail(selectedCustomer) && (
                <span className="text-xs text-gray-500 truncate" title={selectedCustomer.email}>
                  {displayEmail(selectedCustomer)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={clearSelection}
            className="absolute top-1 right-1 p-1 hover:bg-gray-200 rounded-md"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full flex items-center justify-between h-[40px] transition-all duration-200"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4" />
            Select Customer
          </div>
        </Button>
      )}

      {dropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-4 text-gray-600">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </div>
          ) : (
            <>
              <div className="p-2 border-b sticky top-0 bg-white z-10">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>
              {filtered.length === 0 ? (
                <div className="text-center text-gray-500 py-4 text-sm">No customers found</div>
              ) : (
                filtered.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleSelect(customer)}
                    className={`cursor-pointer px-4 py-2 flex flex-col ${
                      selectedCustomer?.id === customer.id ? "bg-blue-50" : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-medium text-sm" title={customer.name}>
                      {displayName(customer)}
                    </span>
                    {displayEmail(customer) && (
                      <span className="text-xs text-gray-500" title={customer.email}>
                        {displayEmail(customer)}
                      </span>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
