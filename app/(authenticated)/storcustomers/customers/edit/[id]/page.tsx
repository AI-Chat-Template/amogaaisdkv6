"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { ArrowLeft, ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import countriesData from "@/data/countries.json";
import statesData from "@/data/states.json";
import {
  getAllCustomers,
  updateCustomer,
  CustomerBilling,
  CustomerShipping,
} from "../../../actions";
import { useTranslations } from "next-intl";

// Zod Schemas
const billingSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  address_1: z.string().optional(),
  address_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email("Enter valid email address"),
  phone: z.string().optional(),
});

const shippingSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  address_1: z.string().optional(),
  address_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
});

const customerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  billing: billingSchema,
  shipping: shippingSchema,
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const defaultBilling: CustomerBilling = {
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "",
  country: "",
  email: "",
  phone: "",
};

const defaultShipping: CustomerShipping = {
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "",
};

// Dropdown component
interface DropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { id?: number; name: string; emoji?: string }[];
  placeholder?: string;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    if (search.length >= 2) {
      setFilteredOptions(
        options.filter((opt) =>
          opt.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFilteredOptions(options);
    }
  }, [search, options]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const selectedOption = options.find(
    (o) => o.name.toLowerCase() === (value ?? "").toLowerCase()
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
          onClick={() => setOpen((o) => !o)}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.emoji && <span>{selectedOption.emoji}</span>}
              <span>{selectedOption.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0" side="bottom" align="start">
        <Command>
          <CommandInput
            autoFocus
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No {placeholder.toLowerCase()} found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-60 w-full">
              {filteredOptions.map((opt) => (
                <CommandItem
                  key={opt.id ?? opt.name}
                  value={opt.name}
                  onSelect={() => {
                    onChange(opt.name);
                    setOpen(false);
                  }}
                  className="flex justify-between items-center text-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {opt.emoji && <span>{opt.emoji}</span>}
                    <span>{opt.name}</span>
                  </div>
                  <Check
                    className={
                      value?.toLowerCase() === opt.name.toLowerCase()
                        ? "opacity-100 h-4 w-4"
                        : "opacity-0 h-4 w-4"
                    }
                  />
                </CommandItem>
              ))}
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billingStates, setBillingStates] = useState<any[]>([]);
  const [shippingStates, setShippingStates] = useState<any[]>([]);
  const t= useTranslations("StoreCustomers.edit");
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      billing: defaultBilling,
      shipping: defaultShipping,
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      role: "customer",
    },
  });

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === "billing.country") {
        const filtered = statesData.filter(
          (s) => s.country_name === values.billing?.country
        );
        setBillingStates(filtered);
        form.setValue("billing.state", "");
      }
      if (name === "shipping.country") {
        const filtered = statesData.filter(
          (s) => s.country_name === values.shipping?.country
        );
        setShippingStates(filtered);
        form.setValue("shipping.state", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      try {
        const data = await getAllCustomers();
        const c = data.find((c) => c.id === customerId);
        if (!c) {
          toast.error("Customer not found");
          router.push("/storcustomers");
          return;
        }
        if (c.role === "subscriber") {
          toast.error("Subscriber role has no access to edit customer");
          router.push("/storcustomers");
          return;
        }
        form.reset({
          ...c,
          billing: { ...defaultBilling, ...(c.billing || {}) },
          shipping: { ...defaultShipping, ...(c.shipping || {}) },
        });
        setBillingStates(statesData.filter((s) => s.country_name === c.billing?.country));
        setShippingStates(statesData.filter((s) => s.country_name === c.shipping?.country));
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch customer");
        router.push("/storcustomers");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [customerId, router, form]);

  const onSubmit = async (values: CustomerFormValues) => {
    setSaving(true);
    try {
      await updateCustomer(customerId, values);
      toast.success("Customer details are updated successfully");
      router.push("/storcustomers");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 border rounded-xl text-foreground mb-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/storcustomers")}
          className="flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          {t("backButton")}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Basic Info */}
          <div className="space-y-4">
            {[t("userName"), t("firstName"), t("lastName"),t("email")].map((key) => (
              <FormField
                key={key}
                control={form.control}
                name={key as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{key.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={`Enter ${key.replace("_", " ")}`}
                        type={key === "email" ? "email" : "text"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("role")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="subscriber">Subscriber</SelectItem>
                        <SelectItem value="shop_manager">Shop Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Billing Section */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">{t("billingHeader")}</h2>
            {[
              t("billingFirstName"),
              t("billingLastName"),
              t("billingCompany"),
              t("billingAddress1"),
              t("billingAddress2"),
              t("billingCity"),
              t("billingPostcode"),
              t("billingEmail"),
              t("billingPhone"),
            ].map((key) => (
              <FormField
                key={key}
                control={form.control}
                name={`billing.${key}` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{key.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={`Enter ${key.replace("_", " ")}`}
                        type={key === "email" ? "email" : "text"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <FormField
              control={form.control}
              name="billing.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("billingCountry")}</FormLabel>
                  <FormControl>
                    <Dropdown
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={countriesData}
                      placeholder="Select Country"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("billingState")}</FormLabel>
                  <FormControl>
                    <Dropdown
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={billingStates}
                      placeholder="Select State"
                      disabled={!billingStates.length}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Shipping Section */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">{t("shippingHeader")}</h2>
            {[
              t("shippingFirstName"),
              t("shippingLastName"),
              t("shippingCompany"),
              t("shippingAddress1"),
              t("shippingAddress2"),
              t("shippingCity"),
              t("shippingPostcode"),
            ].map((key) => (
              <FormField
                key={key}
                control={form.control}
                name={`shipping.${key}` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{key.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={`Enter ${key.replace("_", " ")}`} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <FormField
              control={form.control}
              name="shipping.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("shippingCountry")}</FormLabel>
                  <FormControl>
                    <Dropdown
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={countriesData}
                      placeholder="Select Country"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shipping.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("shippingState")}</FormLabel>
                  <FormControl>
                    <Dropdown
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={shippingStates}
                      placeholder="Select State"
                      disabled={!shippingStates.length}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/storcustomers")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
