/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import ChartTheme from "./_components/ChartTheme";
import { Overview } from "./_components/overview";
import { RecentSales } from "./_components/recent-sales";
import Charts from "./_components/Charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GripVertical } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

const defaultColors = ["#FF6B6B", "#16a34a", "#14532d", "#fde047", "#60a5fa"];

export default function Dashboard() {
  const [activeColors, setActiveColors] = useState<string[]>(defaultColors);
  const [isEditMode, setIsEditMode] = useState(false);

  const [statCards, setStatCards] = useState([
    {
      id: "total-revenue",
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1% from last month",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      id: "subscriptions",
      title: "Subscriptions",
      value: "+2350",
      change: "+180.1% from last month",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: "sales",
      title: "Sales",
      value: "+12,234",
      change: "+19% from last month",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <path d="M2 10h20" />
        </svg>
      ),
    },
    {
      id: "active-now",
      title: "Active Now",
      value: "+573",
      change: "+201 since last hour",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
  ]);

  const [dashboardSections, setDashboardSections] = useState([
    {
      id: "overview",
      component: (
        <Card className="group relative">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview colors={activeColors} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "recent-sales",
      component: (
        <Card className="group relative">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>You made 265 sales this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "charts",
      component: (
        <Card className="group relative">
          <CardHeader>
            <CardTitle>Charts</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Charts colors={activeColors} />
          </CardContent>
        </Card>
      ),
    },
  ]);

  const handleThemeChange = (newColors: string[]) => {
    setActiveColors(newColors);
    // Update the Overview component with new colors
    const newSections = dashboardSections.map((section) => {
      if (section.id === "overview") {
        return {
          ...section,
          component: (
            <Card className="group relative">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview colors={newColors} />
              </CardContent>
            </Card>
          ),
        };
      }
      if (section.id === "charts") {
        return {
          ...section,
          component: (
            <Card className="group relative">
              <CardHeader>
                <CardTitle>Charts</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Charts colors={newColors} />
              </CardContent>
            </Card>
          ),
        };
      }
      return section;
    });
    setDashboardSections(newSections);
  };

  const handleCardDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const newCards = Array.from(statCards);
    const [removed] = newCards.splice(source.index, 1);
    newCards.splice(destination.index, 0, removed);

    setStatCards(newCards);
  };

  const handleSectionDragEnd = (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;
    const newSections = Array.from(dashboardSections);
    const [removed] = newSections.splice(source.index, 1);
    newSections.splice(destination.index, 0, removed);

    setDashboardSections(newSections);
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <Tabs defaultValue="overview" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
            <div className="flex items-center space-x-4">
              <TabsList className="bg-secondary text-primary">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics" disabled>
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <ChartTheme onThemeChange={handleThemeChange} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="edit-mode"
              checked={isEditMode}
              onCheckedChange={setIsEditMode}
            />
            <Label htmlFor="edit-mode" className="text-sm font-medium">
              Enable Editing
            </Label>
          </div>
          <TabsContent value="overview" className="space-y-4">
            <DragDropContext onDragEnd={handleCardDragEnd}>
              <Droppable
                droppableId="stat-cards"
                isDropDisabled={!isEditMode}
                direction="horizontal"
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    {statCards.map((card, index) => (
                      <Draggable
                        key={card.id}
                        draggableId={card.id}
                        index={index}
                        isDragDisabled={!isEditMode}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              gridRow: "auto",
                              gridColumn: "auto",
                            }}
                            className="h-full"
                          >
                            <Card className="relative h-full">
                              {isEditMode && (
                                <div
                                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 flex items-center justify-center cursor-move"
                                  {...provided.dragHandleProps}
                                >
                                  <GripVertical className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm text-primary font-medium">
                                  {card.title}
                                </CardTitle>
                                {card.icon}
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <h2 className="text-lg font-semibold">
                                    {card.value}
                                  </h2>
                                  <p className="text-sm text-muted-foreground">
                                    {card.change}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </TabsContent>
        </Tabs>

        <DragDropContext onDragEnd={handleSectionDragEnd}>
          <Droppable droppableId="sections" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-1 lg:flex-row gap-4"
              >
                {dashboardSections.map((section, index) => (
                  <Draggable
                    key={section.id}
                    draggableId={section.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="w-full min-w-0"
                      >
                        {section.component}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </ScrollArea>
  );
}
