import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon
} from "@radix-ui/react-icons";

export const labels = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Documentation",
  },
];
export const priorities = [
  {
    label: "Low",
    value: "low",
    icon: ArrowDownIcon,
  },
  {
    label: "Medium",
    value: "medium",
    icon: ArrowRightIcon,
  },
  {
    label: "High",
    value: "high",
    icon: ArrowUpIcon,
  },
];
export const statuses = [
  {
    value: "publish",
    label: "Publish",
  },
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "private",
    label: "Private",
  },
];

export const stock_status = [
  {
    value: "instock",
    label: "Instock",
  },
  {
    value: "outofstock",
    label: "Out of stock",
  },
  {
    value: "lowstock",
    label: "Low Stock",
  },
  {
    value: "onbackorder",
    label: "On backorder",
  }
]
