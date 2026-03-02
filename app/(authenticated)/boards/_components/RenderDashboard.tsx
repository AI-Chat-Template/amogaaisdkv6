/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";
import RenderCharts from "./RenderCharts";
import { executeSqlQuery } from "../lib/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormData } from "../types/types";
import RenderTable from "./RenderTable";

export type Root = Root2[];

export interface Root2 {
  data: Daum[];
  label: string;
}

export interface Daum {
  count: number;
}

const RenderDashboard = ({
  contentJson,
  data,
  apiToken,
}: {
  contentJson: any[];
  data: FormData;
  apiToken?: string;
}) => {
  const { name, description, cards, charts } = contentJson[0] || {};
  const [cardData, setCardData] = React.useState<{ [key: number]: number }>({});
  const [chartsData, setChartsData] = React.useState<any>({
    pieChart: [],
    lineChart: [],
    barChart: [],
    areaChart: [],
  });
  const [cardDataForAI, setCardDataForAI] = React.useState({});
  const [storyTemplate, setStoryTemplate] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    if (contentJson[0].type === "graphql") {
      const fetchGraphql = async (
        query: string,
        api: string,
        id: number,
        cardName: string
      ) => {
        try {
          if (!query || !api) {
            toast.error("No query or api provided for Shopify data fetch");
            return;
          }
          const response = await fetch("/api/boards/graphql", {
            method: "POST",
            body: JSON.stringify({ query, api }),
          });
          const result = await response.json();
          const count = result[0].count;
          setCardData((prev) => ({
            ...prev,
            [id]: count,
          }));
          setCardDataForAI((prev) => ({
            ...prev,
            [cardName.toLowerCase()]: {
              value: count,
              label: query,
            },
          }));
        } catch (error) {
          throw error;
        }
      };
      cards.forEach(
        (card: {
          id: number;
          name: "string";
          description: "string";
          query: "string";
          api: "string";
        }) => {
          if (card.query && card.api) {
            fetchGraphql(card.query, card.api, card.id, card.name);
          }
        }
      );
    }
  }, [contentJson, cards]);

  React.useEffect(() => {
    if (contentJson[0]?.type === "db") {
      const fetchSqlData = async (
        query: string,
        cardId: number,
        cardName: string
      ) => {
        try {
          const response: Root = await executeSqlQuery(query);
          const count = response[0]?.data[0]?.count || 0;
          setCardData((prev) => ({
            ...prev,
            [cardId]: count,
          }));
          setCardDataForAI((prev) => ({
            ...prev,
            [cardName.toLowerCase()]: {
              value: count,
              label: response[0]?.label,
            },
          }));
        } catch (error) {
          console.error(`Error fetching data for card ${cardName}:`, error);
          setCardData((prev) => ({
            ...prev,
            [cardId]: 0,
          }));
          setCardDataForAI((prev) => ({
            ...prev,
            [cardName.toLowerCase()]: 0,
          }));
        }
      };

      const fetchApiData = async (api: string) => {
        try {
          const response = await fetch(api, {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Basic YWRtaW46cGFzc3dvcmQxMjM=",
            },
            method: "GET",
          });
          if (!response.ok) {
            toast("Error fetching Template");
          }
          const result = await response.json();
          setStoryTemplate(result?.template);
        } catch (error) {
          throw error;
        }
      };

      cards.forEach(
        (card: { id: number; name: string; query?: string; api?: string }) => {
          if (card.query) {
            fetchSqlData(card.query, card.id, card.name);
          }
          if (card.api) {
            fetchApiData(card.api);
          }
        }
      );
    }
  }, [cards, contentJson]);

  React.useEffect(() => {
    if (contentJson[0]?.type === "api") {
      const fetchApiData = async (
        api: string,
        cardId: number,
        cardName: string,
        field: string
      ) => {
        try {
          const response = await fetch(api, {
            method: "GET",
            headers: {
              Authorization: apiToken!,
            },
          });
          const result = await response.json();
          const keys =
            field &&
            field.match(/\['(.+?)'\]/g).map((k) => k.replace(/\['|'\]/g, ""));

          const value =
            keys &&
            keys.reduce((obj, key) => (obj ? obj[key] : undefined), result);

          setCardData((prev) => ({
            ...prev,
            [cardId]: value,
          }));
          setCardDataForAI((prev) => ({
            ...prev,
            [cardName.toLowerCase()]: {
              value: value,
              label: cardName,
            },
          }));
        } catch (error) {
          console.error(`Error fetching data for card ${cardName}:`, error);
          setCardData((prev) => ({
            ...prev,
            [cardId]: 0,
          }));
          setCardDataForAI((prev) => ({
            ...prev,
            [cardName.toLowerCase()]: 0,
          }));
        }
      };

      cards.forEach(
        (card: { id: number; name: string; api: string; field: string }) => {
          if (card.api && card.field) {
            fetchApiData(card.api, card.id, card.name, card.field);
          } else {
            toast.error("No API or field provided for fetching data");
          }
        }
      );
    }
  }, [cards, contentJson, apiToken]);

  const handleChatWithBoard = async () => {
    if (chartsData[0]?.type === "db") {
      try {
        const response = await fetch("/api/boards", {
          method: "POST",
          body: JSON.stringify({ cardDataForAI, chartsData }),
        });
        if (!response.ok) {
          throw new Error("Failed to save board data");
        }
        router.push(`/agent/${data?.agent_uuid}/?mode=chat_with_board`);
      } catch (error) {
        toast.error("Something Went wrong");
        throw error;
      }
    } else if (contentJson[0]?.type === "graphql") {
      try {
        const response = await fetch("/api/boards", {
          method: "POST",
          body: JSON.stringify({ cardDataForAI, chartsData }),
        });
        if (!response.ok) {
          throw new Error("Failed to save board data");
        }
        router.push(`/agent/${data?.agent_uuid}/?mode=chat_with_board`);
      } catch (error) {
        toast.error("Something Went wrong");
        throw error;
      }
    } else if (contentJson[0]?.type === "api") {
      try {
        const response = await fetch("/api/boards", {
          method: "POST",
          body: JSON.stringify({ cardDataForAI, chartsData }),
        });
        if (!response.ok) {
          throw new Error("Failed to save board data");
        }
        router.push(`/agent/${data?.agent_uuid}/?mode=chat_with_board`);
      } catch (error) {
        toast.error("Something Went wrong");
        throw error;
      }
    }
  };

  return (
    <div>
      <h1 className="font-bold text-2xl">{name}</h1>
      <h1 className="text-muted-foreground text-lg">{description}</h1>
      <div className="grid grid-cols-1 mt-4 md:grid-cols-2 gap-3">
        {cards.map(
          (card: {
            id: number;
            name: string;
            description: string;
            query?: string;
            api?: string;
          }) => (
            <Card key={card.id}>
              <CardContent className="flex flex-col justify-center p-2.5">
                <h1 className="text-lg font-medium">{card.name}</h1>
                <h1 className="text-muted-foreground">{card.description}</h1>
                <h1 className="font-semibold text-xl">
                  {cardData[card.id] || 0}
                </h1>
              </CardContent>
            </Card>
          )
        )}
      </div>
      <div className="w-full">
        <RenderCharts
          charts={charts}
          storyTemplate={storyTemplate}
          setChartsData={setChartsData}
          contentJson={contentJson}
          apiToken={apiToken}
        />
      </div>
      <div className="mt-5">
        <RenderTable contentJson={contentJson} apiToken={apiToken} />
      </div>
      <div className="w-full sticky bottom-5 mt-2 mb-4">
        <Button
          className="w-full bg-muted"
          variant={"outline"}
          onClick={handleChatWithBoard}
        >
          Chat with Board
        </Button>
      </div>
    </div>
  );
};

export default RenderDashboard;
