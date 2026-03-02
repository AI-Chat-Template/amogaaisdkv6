# Chat Component Refactoring - COMPLETE PLAN

## Executive Summary

After thorough analysis, here are the key findings:

### The Three Chat Modules
| Module | MCP Tool Used | chat_group Value | API Route |
|--------|---------------|------------------|------------|
| `chatwithwoodata` | `@/lib/ai/woomcp` (WooCommerce) | "Chat With Woodata" | `/api/chatwithwoodata/*` |
| `ChatwithRestAPI` | `@/lib/ai/RestAPImcp` (PostgresREST) | "Chat With Rest API" | `/api/ChatwithRestAPI/*` |
| `chatwithshopify` | `@/lib/ai/shopifymcp` (Shopify) | "Chat With Shopify" | `/api/chatwithshopify/*` |

### Key Insight
The **backend API routes MUST remain separate** because they use completely different MCP (Model Context Protocol) tools. However, the **frontend UI components can be unified** with configuration.

---

# PART 1: SHARED TYPES & CONFIGURATION

## Step 1.1: Create Chat Configuration Type
**File:** `components/chat/types.ts`

```typescript
// ===========================================
// CHAT CONFIGURATION TYPES
// ===========================================

export type ChatConfig = {
  // Unique identifier for this chat type
  chatType: 'woodata' | 'restapi' | 'shopify';
  
  // Display name shown in UI
  displayName: string;
  
  // All API endpoints (these MUST be different per chat type)
  apiBase: string;              // e.g., "/api/chatwithwoodata"
  loadChatEndpoint: string;      // e.g., "/api/chatwithwoodata/loadchat"
  aiApisEndpoint: string;       // e.g., "/api/chatwithwoodata/aiapis"
  apisEndpoint: string;         // e.g., "/api/chatwithwoodata/apis"
  titleEndpoint: string;        // e.g., "/api/chatwithwoodata/title"
  
  // Navigation paths (these MUST be different per chat type)
  basePath: string;             // e.g., "/chatwithwoodata"
  historyPath: string;          // e.g., "/chatwithwoodata/History"
  promptHistoryPath: string;    // e.g., "/chatwithwoodata/prompthistory"
  
  // Database identifier
  chatGroup: string;            // e.g., "Chat With Woodata"
  
  // Server actions module path (for dynamic imports)
  actionsPath: string;          // e.g., "@/app/(authenticated)/chatwithwoodata/actions"
  
  // Generate files module path (for dynamic imports)
  generateFilesPath: string;    // e.g., "@/app/(authenticated)/chatwithwoodata/generatefiles"
};
```

## Step 1.2: Create Configuration Factory
**File:** `components/chat/config.ts`

```typescript
// ===========================================
// CHAT CONFIGURATION FACTORY
// ===========================================

import { ChatConfig } from './types';

// -----------------------------------------------------
// CONFIGURE EACH CHAT TYPE HERE
// -----------------------------------------------------
export const CHAT_CONFIGS: Record<string, ChatConfig> = {
  woodata: {
    chatType: 'woodata',
    displayName: 'WooCommerce Data',
    apiBase: '/api/chatwithwoodata',
    loadChatEndpoint: '/api/chatwithwoodata/loadchat',
    aiApisEndpoint: '/api/chatwithwoodata/aiapis',
    apisEndpoint: '/api/chatwithwoodata/apis',
    titleEndpoint: '/api/chatwithwoodata/title',
    basePath: '/chatwithwoodata',
    historyPath: '/chatwithwoodata/History',
    promptHistoryPath: '/chatwithwoodata/prompthistory',
    chatGroup: 'Chat With Woodata',
    actionsPath: '@/app/(authenticated)/chatwithwoodata/actions',
    generateFilesPath: '@/app/(authenticated)/chatwithwoodata/generatefiles',
  },
  
  restapi: {
    chatType: 'restapi',
    displayName: 'REST API Data',
    apiBase: '/api/ChatwithRestAPI',
    loadChatEndpoint: '/api/ChatwithRestAPI/loadchat',
    aiApisEndpoint: '/api/ChatwithRestAPI/aiapis',
    apisEndpoint: '/api/ChatwithRestAPI/apis',
    titleEndpoint: '/api/ChatwithRestAPI/title',
    basePath: '/ChatwithRestAPI',
    historyPath: '/ChatwithRestAPI/History',
    promptHistoryPath: '/ChatwithRestAPI/prompthistory',
    chatGroup: 'Chat With Rest API',
    actionsPath: '@/app/(authenticated)/ChatwithRestAPI/actions',
    generateFilesPath: '@/app/(authenticated)/ChatwithRestAPI/generatefiles',
  },
  
  shopify: {
    chatType: 'shopify',
    displayName: 'Shopify Data',
    apiBase: '/api/chatwithshopify',
    loadChatEndpoint: '/api/chatwithshopify/loadchat',
    aiApisEndpoint: '/api/chatwithshopify/aiapis',
    apisEndpoint: '/api/chatwithshopify/apis',
    titleEndpoint: '/api/chatwithshopify/title',
    basePath: '/chatwithshopify',
    historyPath: '/chatwithshopify/History',
    promptHistoryPath: '/chatwithshopify/prompthistory',
    chatGroup: 'Chat With Shopify',
    actionsPath: '@/app/(authenticated)/chatwithshopify/actions',
    generateFilesPath: '@/app/(authenticated)/chatwithshopify/generatefiles',
  },
};

// -----------------------------------------------------
// HELPER FUNCTION TO GET CONFIG
// -----------------------------------------------------
export function getChatConfig(chatType: string): ChatConfig {
  const config = CHAT_CONFIGS[chatType];
  if (!config) {
    throw new Error(`Unknown chat type: ${chatType}`);
  }
  return config;
}

// -----------------------------------------------------
// LIST OF ALL CHAT TYPES (for navigation, etc.)
// -----------------------------------------------------
export const CHAT_TYPE_LIST = [
  { type: 'woodata', name: 'Chat with WooCommerce', path: '/chatwithwoodata' },
  { type: 'restapi', name: 'Chat with REST API', path: '/ChatwithRestAPI' },
  { type: 'shopify', name: 'Chat with Shopify', path: '/chatwithshopify' },
];
```

---

# PART 2: SHARED UI COMPONENTS

## Step 2.1: Generic ChatInput Component
**File:** `components/chat/ChatInput.tsx`

### Current Hardcoded Values (MUST BE REPLACED):

| Line | Current Hardcoded | Replace With |
|------|-------------------|--------------|
| 72-73 | `api: "/api/chatwithwoodata"` | `api: config.apiBase` |
| 177 | `fetch("/api/chatwithwoodata/aiapis")` | `fetch(config.aiApisEndpoint)` |
| 181 | `fetch("/api/chatwithwoodata/apis")` | `fetch(config.apisEndpoint)` |

### Props Interface:
```typescript
type ChatInputProps = {
  chatUuid: string;
  config: ChatConfig;  // ADD THIS
  onNewMessage?: (role: "user" | "assistant", content: any) => void;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};
```

### Code Changes Required:
```typescript
// Replace line 72-86 with:
const {
  messages,
  sendMessage: chatSendMessage,
  status,
} = useChat({
  transport: new DefaultChatTransport({
    api: config.apiBase,  // USE CONFIG
    prepareSendMessagesRequest: ({ id, messages }) => ({
      body: {
        messages,
        id,
        chatUuid,
        chatId: chatUuid,
        settings: {
          model: aiApis[selectedModelIdx]?.model,
          site_url: apis[selectedApiIdx]?.site_url,
        },
      },
    }),
  }),
  // ... rest of code
});

// Replace useEffect (lines 176-184) with:
useEffect(() => {
  fetch(config.aiApisEndpoint)  // USE CONFIG
    .then((res) => res.json())
    .then((data) => setAiApis(Array.isArray(data) ? data : []));

  fetch(config.apisEndpoint)  // USE CONFIG
    .then((res) => res.json())
    .then((data) => setApis(Array.isArray(data) ? data : []));
}, [config.aiApisEndpoint, config.apisEndpoint]);  // ADD DEPENDENCIES
```

---

## Step 2.2: Generic ChatHeader Component
**File:** `components/chat/ChatHeader.tsx`

### Current Hardcoded Values (MUST BE REPLACED):

| Line | Current Hardcoded | Replace With |
|------|-------------------|--------------|
| 43 | `fetch(\`/api/chatwithwoodata/title?chatId=${chatUuid}\`)` | `fetch(\`${config.titleEndpoint}?chatId=${chatUuid}\`)` |
| 54 | `fetch("/api/chatwithwoodata/title", ...)` | `fetch(config.titleEndpoint, ...)` |
| 66 | `fetch("/api/chatwithwoodata/title", ...)` | `fetch(config.titleEndpoint, ...)` |
| 81 | `fetch("/api/chatwithwoodata/title", ...)` | `fetch(config.titleEndpoint, ...)` |
| 134 | `router.push(\`/chatwithwoodata/${newId}\`)` | `router.push(\`${config.basePath}/${newId}\`)` |
| 252 | `router.push("/chatwithwoodata/prompthistory")` | `router.push(config.promptHistoryPath)` |
| 253 | `router.push("/chatwithwoodata/History")` | `router.push(config.historyPath)` |

### Props Interface:
```typescript
type ChatHeaderProps = {
  chatUuid: string;
  config: ChatConfig;  // ADD THIS
};
```

---

## Step 2.3: Generic ChatBody Component
**File:** `components/chat/ChatBody.tsx`

### Current Issue:
This component has hardcoded imports for generatefiles:
```typescript
// Line 24-27 (example from chatwithwoodata)
import { generatePDF } from "@/app/(authenticated)/chatwithwoodata/generatefiles/downloadPDF";
import { downloadCSV } from "@/app/(authenticated)/chatwithwoodata/generatefiles/generateCSV";
import { downloadDOC } from "@/app/(authenticated)/chatwithwoodata/generatefiles/generateDOCX";
```

### Solution Options:

**Option A (Recommended): Pass as Props**
```typescript
type ChatBodyProps = {
  chatUuid: string;
  config: ChatConfig;
  messages: Message[];
  isLoading?: boolean;
  errorMessage?: string | null;
  // Pass download functions as props
  generatePDF?: typeof import('@/app/(authenticated)/chatwithwoodata/generatefiles/downloadPDF').generatePDF;
  downloadCSV?: typeof import('@/app/(authenticated)/chatwithwoodata/generatefiles/generateCSV').downloadCSV;
  // ... etc
};
```

**Option B: Use dynamic imports with config**
```typescript
// Inside component
const generateFiles = useMemo(() => {
  // Dynamic import based on config
  return config.generateFilesPath;
}, [config]);
```

---

## Step 2.4: Generic ChatHistory Component  
**File:** `components/chat/ChatHistory.tsx`

### Current Hardcoded Values (MUST BE REPLACED):

| Line | Current Hardcoded | Replace With |
|------|-------------------|--------------|
| 21-24 | `import { getChatHistory, deleteChat, toggleBookmark } from "@/app/(authenticated)/chatwithwoodata/actions"` | Dynamic import based on config |
| 131 | `router.push(\`/chatwithwoodata/${newChatId}\`)` | `router.push(\`${config.basePath}/${newChatId}\`)` |
| 253 | `href={\`/chatwithwoodata/${chat.id}\`}` | `href={\`${config.basePath}/${chat.id}\`}` |

### Props Interface:
```typescript
type ChatHistoryProps = {
  config: ChatConfig;  // ADD THIS
};
```

### Implementation Note:
You'll need to dynamically import the actions:
```typescript
// Inside component
const actions = await import(config.actionsPath);
const { getChatHistory, deleteChat, toggleBookmark } = actions;
```

---

# PART 3: MAIN PAGE COMPONENT

## Step 3.1: Generic Chat Page Wrapper
**File:** `components/chat/ChatPageWrapper.tsx`

This is the main component that orchestrates everything.

```typescript
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChatConfig, getChatConfig } from "./config";
import ChatHeader from "./ChatHeader";
import ChatBody from "./ChatBody";
import ChatInput from "./ChatInput";

type Message = {
  role: "user" | "assistant" | "error";
  content: any;
};

// This component receives chatType as a prop or from URL
type ChatPageWrapperProps = {
  chatType: 'woodata' | 'restapi' | 'shopify';  // REQUIRED PROP
};

export default function ChatPageWrapper({ chatType }: ChatPageWrapperProps) {
  const params = useParams();
  const chatUuid = params.chatUuid as string;
  
  // Get configuration based on chatType
  const config = getChatConfig(chatType);
  
  // Chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load chat history from API
  useEffect(() => {
    const fetchChat = async () => {
      try {
        setErrorMessage(null);
        
        // USE CONFIG
        const res = await fetch(
          `${config.loadChatEndpoint}?chatUuid=${chatUuid}`,
          { method: "GET" }
        );

        if (!res.ok) {
          setErrorMessage("Failed to load chat history.");
          return;
        }

        const data = await res.json();
        
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Load chat error:", err);
        setErrorMessage("Unable to load chat. Please try again.");
      }
    };

    fetchChat();
  }, [chatUuid, config.loadChatEndpoint]);

  // Handle new messages (streaming)
  const handleNewMessage = (role: "user" | "assistant", content: any) => {
    setMessages((prev) => {
      const lastMsg = prev[prev.length - 1];
      
      // streaming text support
      if (
        role === "assistant" &&
        typeof content === "string" &&
        lastMsg?.role === "assistant" &&
        typeof lastMsg.content === "string"
      ) {
        const updated = [...prev];
        updated[updated.length - 1].content = content;
        return updated;
      }
      
      return [...prev, { role, content }];
    });
  };

  return (
    <main className="flex flex-col min-h-screen bg-background">
      {/* PASS CONFIG TO ALL CHILDREN */}
      <ChatHeader chatUuid={chatUuid} config={config} />
      
      <ChatBody
        chatUuid={chatUuid}
        config={config}
        messages={messages}
        isLoading={isLoading}
        errorMessage={errorMessage}
      />
      
      <ChatInput
        chatUuid={chatUuid}
        config={config}
        onNewMessage={handleNewMessage}
        setIsLoading={setIsLoading}
        setErrorMessage={setErrorMessage}
      />
    </main>
  );
}
```

---

# PART 4: PAGE FILE UPDATES

## Step 4.1: Update chatwithwoodata Page
**File:** `app/(authenticated)/chatwithwoodata/[chatUuid]/page.tsx`

**BEFORE:**
```typescript
import ChatHeader from "@/app/(authenticated)/chatwithwoodata/_components/chat-header";
import ChatBody from "@/app/(authenticated)/chatwithwoodata/_components/chat-body";
import ChatInput from "@/app/(authenticated)/chatwithwoodata/_components/chat-input";
```

**AFTER:**
```typescript
import ChatPageWrapper from "@/components/chat/ChatPageWrapper";

export default function ChatPage() {
  return <ChatPageWrapper chatType="woodata" />;
}
```

## Step 4.2: Update ChatwithRestAPI Page
**File:** `app/(authenticated)/ChatwithRestAPI/[chatUuid]/page.tsx`

**AFTER:**
```typescript
import ChatPageWrapper from "@/components/chat/ChatPageWrapper";

export default function ChatPage() {
  return <ChatPageWrapper chatType="restapi" />;
}
```

## Step 4.3: Update chatwithshopify Page
**File:** `app/(authenticated)/chatwithshopify/[chatUuid]/page.tsx`

**AFTER:**
```typescript
import ChatPageWrapper from "@/components/chat/ChatPageWrapper";

export default function ChatPage() {
  return <ChatPageWrapper chatType="shopify" />;
}
```

---

# PART 5: ROOT REDIRECT PAGES

## Step 5.1: Update Root Redirect Pages
Each chat type has a root page that redirects to a new UUID.

**File:** `app/(authenticated)/chatwithwoodata/page.tsx`
```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function ChatRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    // This can stay as-is since it's just a redirect
    const newUuid = uuidv4();
    router.replace(`/chatwithwoodata/${newUuid}`);
  }, [router]);

  return <div className="text-start text-gray-500 pt-2">Redirecting...</div>;
}
```

**Same for:** `ChatwithRestAPI/page.tsx` and `chatwithshopify/page.tsx`

These don't need changes - they're just simple redirects.

---

# PART 6: HISTORY PAGES

## Step 6.1: Update History Pages
**File:** `app/(authenticated)/chatwithwoodata/History/page.tsx`

**AFTER (Example for each chat type):**
```typescript
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ChatConfig, getChatConfig } from "@/components/chat/config";

export default function ChatHistoryPage({ params }: { params: { type?: string } }) {
  // Determine chat type from URL or prop
  const chatType = 'woodata'; // Or get from params
  const config = getChatConfig(chatType);
  
  // Rest of code uses config for paths and actions...
}
```

---

# PART 7: ACTIONS.TS UPDATES

## Step 7.1: Make Actions More Generic
The actions.ts files have minor differences. Here's how to handle them:

**Option A: Keep Separate (Recommended for Safety)**
- Keep the 3 separate actions.ts files
- Each has different `chat_group` value in database
- This is SAFER because database schema depends on these

**Option B: Make Single Generic Actions**
If you want to merge:

```typescript
// Create: lib/chat/actions.ts (NEW SHARED FILE)
export async function saveChatTitleWithGroup(
  chatUuid: string, 
  title: string, 
  chatGroup: string,
  chat_share_url?: string
) {
  // ... same code, but chatGroup is a parameter
  chat_group: chatGroup,  // USE PARAMETER INSTEAD OF HARDCODE
}

// Then in each old actions.ts, create thin wrappers:
import { saveChatTitleWithGroup } from "@/lib/chat/actions";

export async function saveChatTitle(chatUuid: string, title: string, chat_share_url?: string) {
  return saveChatTitleWithGroup(chatUuid, title, "Chat With Woodata", chat_share_url);
}
```

---

# IMPLEMENTATION ORDER

## Phase 1: Create Foundation
1. [ ] Create `components/chat/types.ts`
2. [ ] Create `components/chat/config.ts`
3. [ ] Test configuration works

## Phase 2: Create Generic Components
4. [ ] Create `components/chat/ChatInput.tsx` (with config prop)
5. [ ] Create `components/chat/ChatHeader.tsx` (with config prop)
6. [ ] Create `components/chat/ChatBody.tsx` (with config prop)
7. [ ] Test each component in isolation

## Phase 3: Create Wrapper
8. [ ] Create `components/chat/ChatPageWrapper.tsx`
9. [ ] Test with one chat type (e.g., chatwithwoodata)

## Phase 4: Update Pages
10. [ ] Update `chatwithwoodata/[chatUuid]/page.tsx`
11. [ ] Update `ChatwithRestAPI/[chatUuid]/page.tsx`
12. [ ] Update `chatwithshopify/[chatUuid]/page.tsx`

## Phase 5: Update History
13. [ ] Update `chatwithwoodata/History/page.tsx`
14. [ ] Update `ChatwithRestAPI/History/page.tsx`
15. [ ] Update `chatwithshopify/History/page.tsx`

## Phase 6: Cleanup (Optional)
16. [ ] Remove duplicate `_components` folders (after testing)
17. [ ] Or keep them as aliases for backward compatibility

---

# WHAT NOT TO CHANGE

### DO NOT CHANGE:
1. **API Route Files** - These MUST stay separate:
   - `app/(authenticated)/api/chatwithwoodata/route.ts`
   - `app/(authenticated)/api/ChatwithRestAPI/route.ts`
   - `app/(authenticated)/api/chatwithshopify/route.ts`
   
   These use DIFFERENT MCP tools and cannot be unified.

2. **generatefiles folders** - Keep separate per chat type:
   - `chatwithwoodata/generatefiles/`
   - `ChatwithRestAPI/generatefiles/`
   - `chatwithshopify/generatefiles/`

3. **Database schema** - The `chat_group` field differentiates chats

---

# FILES TO CREATE

```
components/chat/
├── types.ts           # Step 1.1
├── config.ts          # Step 1.2
├── ChatInput.tsx      # Step 2.1
├── ChatHeader.tsx     # Step 2.2
├── ChatBody.tsx       # Step 2.3
├── ChatHistory.tsx    # Step 2.4
└── ChatPageWrapper.tsx # Step 3.1
```

---

# FILES TO MODIFY

```
app/(authenticated)/chatwithwoodata/[chatUuid]/page.tsx          # Step 4.1
app/(authenticated)/ChatwithRestAPI/[chatUuid]/page.tsx          # Step 4.2  
app/(authenticated)/chatwithshopify/[chatUuid]/page.tsx          # Step 4.3
app/(authenticated)/chatwithwoodata/History/page.tsx              # Step 6.1
app/(authenticated)/ChatwithRestAPI/History/page.tsx              # Step 6.1
app/(authenticated)/chatwithshopify/History/page.tsx               # Step 6.1
```

---

# SUMMARY

| Category | Keep Separate | Make Common |
|----------|--------------|-------------|
| API Routes | ✅ YES | ❌ NO - Different MCP tools |
| UI Components | ❌ NO | ✅ YES - ChatInput, ChatHeader, ChatBody |
| Page Wrappers | ❌ NO | ✅ YES - ChatPageWrapper |
| History Pages | ❌ NO | ✅ YES - ChatHistory |
| actions.ts | ⚠️ OPTIONAL | Could keep separate for safety |
| generatefiles | ✅ YES | ❌ NO - Can stay separate |
| Database | ✅ YES | ❌ NO - chat_group field needed |
