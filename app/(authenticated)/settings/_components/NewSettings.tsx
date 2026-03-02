"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROVIDER_MODELS } from "@/utils/aiModels";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import {
  getAISettingsData,
  saveAIFieldsSettings,
  editAIFieldsSettings,
} from "../actions";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";

const aiSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  model: z.string().min(1, "Model is required"),
  key: z.string().min(10, "Key must be at least 10 characters long"),
  tokens_limit: z.coerce.number().min(1, "Tokens used must be a positive number"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  status: z.enum(["active", "inactive"]),
  created_date: z.string(),
  default: z.boolean(),
});
type AiSchemaType = z.infer<typeof aiSchema>;

const NewSettings = ({ id }: { id?: string }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const form = useForm<AiSchemaType>({
    resolver : zodResolver(aiSchema),
    defaultValues: {
      provider: "",
      model: "",
      key: "",
      tokens_limit:100,
      start_date: "",
      end_date: "",
      status: "active",
      created_date: "",
      default: false,
    },
  });

  const randomId = uuidv4();
  const t = useTranslations("Settings.newAiapiConnection");
  const providers = Object.keys(PROVIDER_MODELS);
  const provider = form.watch("provider");
  const modelOptions = Object.entries(PROVIDER_MODELS[provider]?.models || {});

  const reset = () => {
    form.reset();
  };

  // Use a ref to store the current edit id
  const editIdRef = React.useRef<string | undefined>(id);

  React.useEffect(() => {
    try {
      if (id) {
        const fetchAISettings = async () => {
          const response = await getAISettingsData();
          if (response?.data) {
            const aiData = response.data.aiapi_connection_json;
            const filterJSONData = aiData.filter((data) => data.id === id);
            if (filterJSONData.length > 0) {
              form.reset({
                provider: filterJSONData[0].provider,
                model: filterJSONData[0].model,
                key: filterJSONData[0].key,
                tokens_limit: Number(filterJSONData[0].tokens_limit),
                start_date: filterJSONData[0].start_date,
                end_date: filterJSONData[0].end_date,
                status: filterJSONData[0].status,
                created_date: filterJSONData[0].created_date,
                default: filterJSONData[0].default || false,
              });
              editIdRef.current = id;
            }
          }
        };
        fetchAISettings();
      }
    } catch (error) {
      console.error("Error fetching AI settings:", error);
    }
  }, [form, id]);

  const handleFormSubmit = async (data: z.infer<typeof aiSchema>) => {
    try {
      setIsLoading(true);
      let response;
      if (editIdRef.current) {
        // Edit mode
        response = await editAIFieldsSettings(editIdRef.current, data);
      } else {
        // Add mode
        response = await saveAIFieldsSettings(data, randomId);
      }

      if (!response.success) {
        toast.error("Error saving AI settings");
      } else {
        toast.success("AI Settings Saved Successfully");
      }
    } catch (error) {
      toast.error(`${error}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold">{t("title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("description")}
              </p>
            </div>
            <div>
              <Link href="/settings">
                <Button variant="outline">
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" /> {t("backButton")}
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("aiProvider")}</FormLabel>

                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an AI provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p, index) => (
                        <SelectItem key={index} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("model")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map(([model, info]) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("apiKey")}</FormLabel>
                  <Input type="text" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tokens_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("tokenLimit")}</FormLabel>
                  <Input type="number" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("startDate")}</FormLabel>
                  <Input type="date" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("endDate")}</FormLabel>
                  <Input type="date" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent defaultValue={field.value}>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="default"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2.5 mt-5">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FormLabel>Default Model</FormLabel>
                </FormItem>
              )}
            />
          </Form>
        </CardContent>
        <CardFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button variant={"outline"} onClick={reset}>
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(handleFormSubmit)}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewSettings;
