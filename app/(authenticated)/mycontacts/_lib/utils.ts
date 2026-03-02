import { type Contact } from "../type";
import {
  CheckCircle2,
  CircleHelp,
  CircleIcon,
  CircleX,
} from "lucide-react";

/**
 * Returns the appropriate status icon based on the provided status.
 * @param status - The status.
 * @returns A React component representing the status icon.
 */
export function getStatusIcon(status: Contact["status"]) {
  const statusIcons = {
    draft: CircleX,
    active: CheckCircle2,
    inactive: CircleHelp,
  };

  return statusIcons[status] || CircleIcon;
}
