"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CopyCheck,
  Edit,
  Plus,
  Search,
  Trash2,
  Link as LinkIcon,
  KeyRound,
  Shield,
  Globe,
  FileSignature,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// UPDATED: import Woo-specific actions
import { deleteWooFieldsSettings, getWooSettingsData } from "../actions";

interface WooAISettings {
  id: string;
  apiname: string;
  App_name: string;
  site_url: string;
  consumer_key: string;
  consumer_secret: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

const WooAISettings = () => {
  const [data, setData] = React.useState<WooAISettings[]>([]);
  const [id, setId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchWooSettings = async () => {
    try {
      setIsLoading(true);
      const response = await getWooSettingsData();
      if (response?.data) {
        setData(response.data.api_connection_json as WooAISettings[]);
        setId(response.data.user_catalog_id as string);
      }
    } catch (error) {
      console.error("Error fetching Woo settings:", error);
      toast.error("Error fetching WooCommerce Settings");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWooSettings();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteWooFieldsSettings(id);
      if (response.success) {
        toast.success("WooCommerce Settings Deleted Successfully");
        fetchWooSettings();
      } else {
        toast.error("Error deleting WooCommerce settings");
      }
    } catch (error) {
      toast.error("Error deleting WooCommerce settings");
      throw error;
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2.5 w-full">
        <div className="rounded w-full flex border items-center my-5">
          <Search className="w-5 h-5 ml-5 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="border-0" />
        </div>
        <Link href="/settings/wooai/new">
          <Button size={"icon"}>
            <Plus className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      <div>
        {data && data[0] === null && !isLoading && (
          <div>
            <h1>No Data Found</h1>
          </div>
        )}

        {isLoading ? (
          <Card className="min-h-[250px]">
            <CardContent className="p-2.5">
              <div className="space-y-2">
                <Skeleton className="h-[250px] w-full" />
              </div>
            </CardContent>
          </Card>
        ) : (
          data &&
          data?.length > 0 &&
          data[0] !== null &&
          data.map((item) => (
            <Card
              key={item?.id}
              className="mb-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-4 space-y-3">
                {/* API Name */}
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-blue-500" />
                  <span className="font-bold">
                    API Name:{" "}
                    <span className="font-bold text-gray-900">
                      {item?.apiname}
                    </span>
                  </span>
                </div>

                {/* App Name */}
                <div className="flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold">
                    App Name: {item?.App_name}
                  </span>
                </div>

                {/* API URL */}
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-500" />
                  <span className="font-semibold">API URL: {item?.site_url}</span>
                </div>

                {/* API Secret */}
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-pink-500" />
                  <span className="font-semibold">
                    API Secret:{" "}
                    {item?.consumer_secret && (
                      <>
                        {item.consumer_secret.slice(0, 6)}
                        <span className="align-middle text-yellow-500">
                          ************
                        </span>
                      </>
                    )}
                  </span>
                </div>

                {/* API Key */}
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-500" />
                  <span className="font-semibold">
                    API Key:{" "}
                    {item?.consumer_key && (
                      <>
                        {item.consumer_key.slice(0, 6)}
                        <span className="align-middle text-yellow-500">
                          ************
                        </span>
                      </>
                    )}
                  </span>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center justify-between pt-2 border-t mt-3">
                  <div className="flex items-center gap-2">
                    <CopyCheck className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">
                      Status:{" "}
                      <span className="text-green-500 font-medium">
                        {item?.status}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Trash2
                      onClick={() => handleDelete(item?.id)}
                      className="w-5 cursor-pointer h-5 text-muted-foreground hover:text-red-500 transition"
                    />
                    <Link href={`/settings/wooai/edit/${item?.id}`}>
                      <Edit className="w-5 h-5 text-muted-foreground hover:text-blue-500 transition" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WooAISettings;
