export interface PromptDeliveryOptions {
  aiChat: boolean;
  notifier: boolean;
  email: boolean;
  chat: boolean;
}

export interface PromptSchedule {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'special';
  executionTime: string; // HH:MM format
  timezone: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  hourlyInterval?: number; // for hourly frequency
  selectedWeekdays?: number[]; // 0-6 for Sunday-Saturday
  dayOfMonth?: number; // 1-31 for monthly
  startMonth?: number; // 1-12 for yearly
  endMonth?: number; // 1-12 for yearly
  selectedYear?: number; // for yearly
  specificDates?: string[]; // ISO date strings for special frequency
}

export interface Prompt {
  id: number;
  createdAt: string;
  updatedAt?: string;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'deleted';
  remarks?: string;
  createdBy: number;
  isScheduled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'special';
  scheduleTime?: string;
  startDate?: string;
  endDate?: string;
  hourlyInterval?: number;
  selectedWeekdays?: number[];
  dayOfMonth?: number;
  startMonth?: number;
  endMonth?: number;
  selectedYear?: number;
  selectedMonth?: number;
  selectedDay?: number;
  specificDates?: string[];
  deliveryOptions: PromptDeliveryOptions;
  targetUserIds?: number[];
  targetAllUsers: boolean;
  timezone: string;
  lastExecuted?: string;
  nextExecution?: string;
  executionStatus: 'idle' | 'running' | 'completed' | 'failed';
  promptGroup: string;
  businessNumber?: number | string;
  createdUserId?: number;
  createdUserName?: string;
  forBusinessNumber?: number | string;
}

export interface UserSearchResult {
  user_catalog_id: number;
  first_name: string;
  last_name: string;
  user_email: string;
}

export interface PromptExecutionResult {
  promptId: number;
  successCount: number;
  failureCount: number;
  errors: string[];
  executedAt: string;
}

export interface PromptCreateRequest {
  title: string;
  description: string;
  remarks?: string;
  status: 'active' | 'inactive';
  isScheduled: boolean;
  frequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'special';
  scheduleTime?: string;
  timezone?: string;
  startDate?: string;
  endDate?: string;
  hourlyInterval?: number;
  selectedWeekdays?: number[];
  dayOfMonth?: number;
  startMonth?: number;
  endMonth?: number;
  selectedYear?: number;
  selectedMonth?: number;
  selectedDay?: number;
  specificDates?: string[];
  deliveryOptions: PromptDeliveryOptions;
  targetUserIds?: number[];
  targetAllUsers: boolean;
  promptGroup?: string;
}

export interface PromptUpdateRequest extends Partial<PromptCreateRequest> {
  id: number;
}


