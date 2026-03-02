import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Coins,
  CopyCheck,
  Edit,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { deleteAIFieldsSettings, getAISettingsData } from "../actions";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AISettings {
  provider: string;
  model: string;
  tokens_used: string;
  start_date: string;
  end_date: string;
  status: "active" | "inactive";
  id: string;
  tokens_limit: number;
  default: boolean;
}

const AISettings = () => {
  const [data, setData] = React.useState<AISettings[]>([]);
  const [id, setId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchAISettings = async () => {
    try {
      setIsLoading(true);
      const response = await getAISettingsData();
      if (response?.data) {
        setData(response.data.aiapi_connection_json);
        setId(response.data.user_catalog_id);
      }
    } catch (error) {
      console.error("Error fetching AI settings:", error);
      toast.error("Error fetching AI Settings");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAISettings();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteAIFieldsSettings(id);
      if (response.success) {
        toast.success("AI Settings Deleted Successfully");
        fetchAISettings();
      } else {
        toast.error("Error deleting AI settings");
      }
    } catch (error) {
      toast.error("Error deleting AI settings");
      throw error;
    }
  };

  console.log("data------", data);

  return (
    <div>
      <div className="flex items-center gap-2.5 w-full">
        <div className="rounded w-full flex border items-center my-5">
          <Search className="w-5 h-5 ml-5 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="border-0" />
        </div>
        <Link href="/settings/ai/new">
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
            <Card key={item?.id} className="mb-5">
              <CardContent className="p-2.5 space-y-2">
                <h1 className="capitalize">Provider: {item?.provider}</h1>
                <h1>Model: {item?.model}</h1>
                <h1 className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" /> Tokens Used:{" "}
                  {item?.tokens_used}
                </h1>
                <h1 className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" /> Tokens Limit:{" "}
                  {item?.tokens_limit}
                </h1>
                <h1 className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" /> Start
                  Date: {item?.start_date}
                </h1>
                <h1 className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" /> End
                  Date: {item?.end_date}
                </h1>
                <h1 className="flex items-center gap-2">
                  Default Model: {item?.default ? "True" : "False"}
                </h1>
                <div className="flex items-center justify-between">
                  <h1 className="flex items-center gap-2">
                    <CopyCheck className="w-5 h-5 text-muted-foreground" />{" "}
                    Status: {item?.status}
                  </h1>
                  <div className="flex items-center gap-2.5">
                    <Trash2
                      onClick={() => handleDelete(item?.id)}
                      className="w-5 cursor-pointer h-5 text-muted-foreground"
                    />
                    <Link href={`/settings/ai/edit/${item?.id}`}>
                      <Edit className="w-5 h-5 text-muted-foreground" />
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

export default AISettings;
