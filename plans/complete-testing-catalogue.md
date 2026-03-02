# Complete Unit Testing Catalogue
## All Authenticated Pages and How to Test Each

---

## 📋 Page Inventory

### Core Business Modules

| # | Module | Page Path | Testable Elements |
|---|--------|-----------|-------------------|
| 1 | **Dashboard** | `/chatwithwoodata` | Chat components, AI integration |
| 2 | **Product2** | `/product2` | CRUD operations, WooCommerce sync |
| 3 | **Data Upload** | `/dataupload` | File upload, validation, progress |
| 4 | **Master Data** | `/masterdata` | CRUD, table operations |
| 5 | **My Contacts** | `/mycontacts` | Contact management |
| 6 | **Point of Sale** | `/pointOfSale` | Cart, checkout flow |
| 7 | **Files** | `/files` | File handling, chat with files |
| 8 | **Charts** | `/charts` | Data visualization |
| 9 | **Boards** | `/boards` | Board management |
| 10 | **Business Settings** | `/businesssettings` | Configuration forms |
| 11 | **Settings** | `/settings` | AI, Woo, Shopify settings |
| 12 | **Roles** | `/roles` | Role management |
| 13 | **Store Coupons** | `/storcoupons` | Coupon CRUD |
| 14 | **Store Customers** | `/storecustomers` | Customer management |
| 15 | **Store Products** | `/storeproducts` | Product management |
| 16 | **Store Users** | `/storeusers` | User management |
| 17 | **Store Stock Dashboard** | `/store-stock-dashboard` | Stock monitoring |
| 18 | **User Analytics** | `/useranalytics` | Analytics |
| 19 | **Data Upload Setup** | `/data-upload-setup` | Upload configuration |
| 20 | **Set Masters** | `/setmasters` | Master data setup |
| 21 | **Role Menu** | `/role-menu` | Menu permissions |
| 22 | **Profile** | `/profile` | User profile |
| 23 | **Store Settings** | `/store-settings` | Store configuration |
| 24 | **Theme** | `/Theme` | Theme customization |

---

## 🎯 How to Test Each Page

### 1. ChatWithWoodata (`/chatwithwoodata`)

**Testable Components:**
- [`app/(authenticated)/chatwithwoodata/_components/chat-input.tsx`](app/(authenticated)/chatwithwoodata/_components/chat-input.tsx:1) - Chat input
- [`app/(authenticated)/chatwithwoodata/_components/DataDisplay.tsx`](app/(authenticated)/chatwithwoodata/_components/DataDisplay.tsx:1) - Data display
- [`app/(authenticated)/chatwithwoodata/_components/ChartWithRef.tsx`](app/(authenticated)/chatwithwoodata/_components/ChartWithRef.tsx:1) - Charts

**Test Strategy:**
```typescript
// chat-input.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './chat-input';

describe('ChatInput', () => {
  it('should accept user input', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    
    expect(input).toHaveValue('Hello');
  });

  it('should call onSubmit on form submit', async () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    expect(onSubmit).toHaveBeenCalled();
  });
});
```

**Testable Logic:**
- [`lib/ai/utils.ts`](lib/ai/utils.ts:5) - `convertToUIMessages()`, `calculateAICost()`
- [`lib/ai/chart-helper.ts`](lib/ai/chart-helper.ts:1) - `createChartConfig()`, `chartTemplates`

---

### 2. Product2 (`/product2`)

**Testable Components:**
- [`app/(authenticated)/product2/_components/EditProduct.tsx`](app/(authenticated)/product2/_components/EditProduct.tsx:1)
- [`app/(authenticated)/product2/_components/NewProducts.tsx`](app/(authenticated)/product2/_components/NewProducts.tsx:1)

**Testable Actions:**
- [`app/(authenticated)/product2/actions.ts`](app/(authenticated)/product2/actions.ts:1) - Server Actions

```typescript
// product2/actions.test.ts
import { describe, it, expect, vi } from 'vitest';
import { 
  getWooCategories, 
  getWooProducts, 
  createWooProduct, 
  updateWooProduct,
  deleteWooProduct 
} from './actions';

vi.mock('@/lib/woocommerce', () => ({
  default: vi.fn(),
}));

describe('Product Actions', () => {
  describe('getWooCategories', () => {
    it('should return normalized categories', async () => {
      const mockApi = (await import('@/lib/woocommerce')).default;
      mockApi.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'Cat1', slug: 'cat1', parent: 0 }]
      });

      const result = await getWooCategories();
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'Cat1',
        slug: 'cat1',
        parent: 0
      });
    });

    it('should handle search parameter', async () => {
      const mockApi = (await import('@/lib/woocommerce')).default;
      mockApi.mockResolvedValue({ success: true, data: [] });

      await getWooCategories({ search: 'test' });
      expect(mockApi).toHaveBeenCalledWith(
        expect.stringContaining('search=test'),
        expect.any(Object)
      );
    });
  });

  describe('createWooProduct', () => {
    it('should create product with valid payload', async () => {
      const mockApi = (await import('@/lib/woocommerce')).default;
      mockApi.mockResolvedValue({
        success: true,
        data: { id: 123, name: 'Test Product', images: [] }
      });

      const result = await createWooProduct({
        name: 'Test Product',
        regular_price: '99.99'
      });

      expect(result.name).toBe('Test Product');
    });

    it('should throw on API failure', async () => {
      const mockApi = (await import('@/lib/woocommerce')).default;
      mockApi.mockResolvedValue({ success: false, error: 'API Error' });

      await expect(createWooProduct({ name: 'Test' }))
        .rejects.toThrow('Failed to create product');
    });
  });

  describe('updateWooProduct', () => {
    it('should handle stock_quantity as null', async () => {
      const mockApi = (await import('@/lib/woocommerce')).default;
      mockApi.mockResolvedValue({ success: true, data: {} });

      await updateWooProduct(123, { 
        name: 'Updated', 
        stock_quantity: null 
      });

      expect(mockApi).toHaveBeenCalledWith(
        expect.stringContaining('123'),
        expect.objectContaining({
          body: expect.objectContaining({
            stock_quantity: null
          })
        })
      );
    });
  });
});
```

---

### 3. Data Upload (`/dataupload`)

**Testable Components:**
- [`app/(authenticated)/dataupload/_components/steps/step-1.tsx`](app/(authenticated)/dataupload/_components/steps/step-1.tsx:1)
- [`app/(authenticated)/dataupload/_components/steps/step-2.tsx`](app/(authenticated)/dataupload/_components/steps/step-2.tsx:1)
- [`app/(authenticated)/dataupload/_components/steps/step-3.tsx`](app/(authenticated)/dataupload/_components/steps/step-3.tsx:1)
- [`app/(authenticated)/dataupload/_components/steps/step-4.tsx`](app/(authenticated)/dataupload/_components/steps/step-4.tsx:1)
- [`app/(authenticated)/dataupload/_components/progress-indicator.tsx`](app/(authenticated)/dataupload/_components/progress-indicator.tsx:1)

**Testable Actions & Validations:**
- [`app/(authenticated)/dataupload/_lib/actions.ts`](app/(authenticated)/dataupload/_lib/actions.ts:1)
- [`app/(authenticated)/dataupload/_lib/validations.ts`](app/(authenticated)/dataupload/_lib/validations.ts:1)
- [`app/(authenticated)/dataupload/_lib/queries.ts`](app/(authenticated)/dataupload/_lib/queries.ts:1)

```typescript
// dataupload/validations.test.ts
import { describe, it, expect } from 'vitest';
import { uploadDataSchema, uploadItemSchema } from './_lib/validations';

describe('Data Upload Validations', () => {
  describe('uploadDataSchema', () => {
    it('should validate correct data', () => {
      const valid = {
        name: 'Test Upload',
        description: 'Description',
        file: 'test.csv',
      };
      const result = uploadDataSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalid = { name: '' };
      const result = uploadDataSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('uploadItemSchema', () => {
    it('should validate item fields', () => {
      const valid = {
        sku: 'SKU001',
        name: 'Product',
        price: 100,
      };
      const result = uploadItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
```

---

### 4. Master Data (`/masterdata`)

**Testable Files:**
- [`app/(authenticated)/masterdata/_lib/actions.ts`](app/(authenticated)/masterdata/_lib/actions.ts:1)
- [`app/(authenticated)/masterdata/_lib/validations.ts`](app/(authenticated)/masterdata/_lib/validations.ts:1)
- [`app/(authenticated)/masterdata/_lib/queries.ts`](app/(authenticated)/masterdata/_lib/queries.ts:1)
- [`app/(authenticated)/masterdata/_components/update-sheet.tsx`](app/(authenticated)/masterdata/_components/update-sheet.tsx:1)

---

### 5. My Contacts (`/mycontacts`)

**Testable Files:**
- [`app/(authenticated)/mycontacts/_lib/actions.ts`](app/(authenticated)/mycontacts/_lib/actions.ts:1)
- [`app/(authenticated)/mycontacts/_lib/validations.ts`](app/(authenticated)/mycontacts/_lib/validations.ts:1)
- [`app/(authenticated)/mycontacts/_components/update-sheet.tsx`](app/(authenticated)/mycontacts/_components/update-sheet.tsx:1)

---

### 6. Point of Sale (`/pointOfSale`)

**Testable Components:**
- [`app/(authenticated)/pointOfSale/_components/POSClient.tsx`](app/(authenticated)/pointOfSale/_components/POSClient.tsx:1)
- [`app/(authenticated)/pointOfSale/_components/CustomerSelect.tsx`](app/(authenticated)/pointOfSale/_components/CustomerSelect.tsx:1)
- [`app/(authenticated)/pointOfSale/context/context.tsx`](app/(authenticated)/pointOfSale/context/context.tsx:1)

```typescript
// pointOfSale/context.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { POSProvider, usePOS } from './context/context';

describe('POS Context', () => {
  it('should add item to cart', () => {
    const { result } = renderHook(() => usePOS(), {
      wrapper: POSProvider,
    });

    act(() => {
      result.current.addToCart({
        id: 1,
        name: 'Product',
        price: 100,
        quantity: 1,
      });
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].name).toBe('Product');
  });

  it('should calculate total', () => {
    const { result } = renderHook(() => usePOS(), {
      wrapper: POSProvider,
    });

    act(() => {
      result.current.addToCart({ id: 1, name: 'P1', price: 100, quantity: 2 });
      result.current.addToCart({ id: 2, name: 'P2', price: 50, quantity: 1 });
    });

    expect(result.current.total).toBe(250);
  });
});
```

---

### 7. Files (`/files`)

**Testable Components:**
- [`app/(authenticated)/files/_components/Files.tsx`](app/(authenticated)/files/_components/Files.tsx:1)
- [`app/(authenticated)/files/_components/ChatwithFiles.tsx`](app/(authenticated)/files/_components/ChatwithFiles.tsx:1)
- [`app/(authenticated)/files/_components/RenderChatFile.tsx`](app/(authenticated)/files/_components/RenderChatFile.tsx:1)

**Testable Logic:**
- [`app/(authenticated)/files/lib/action.ts`](app/(authenticated)/files/lib/action.ts:1)
- [`app/(authenticated)/files/lib/queries.ts`](app/(authenticated)/files/lib/queries.ts:1)

---

### 8. Charts (`/charts`)

**Testable Components:**
- [`app/(authenticated)/charts/_components/Charts.tsx`](app/(authenticated)/charts/_components/Charts.tsx:1)
- [`app/(authenticated)/charts/_components/overview.tsx`](app/(authenticated)/charts/_components/overview.tsx:1)
- [`app/(authenticated)/charts/_components/recent-sales.tsx`](app/(authenticated)/charts/_components/recent-sales.tsx:1)

---

### 9. Boards (`/boards`)

**Testable Files:**
- [`app/(authenticated)/boards/lib/queries.ts`](app/(authenticated)/boards/lib/queries.ts:1)

---

### 10. Business Settings (`/businesssettings`)

**Testable Components:**
- [`app/(authenticated)/businesssettings/_components/BusinessSettingsForm.tsx`](app/(authenticated)/businesssettings/_components/BusinessSettingsForm.tsx:1)
- [`app/(authenticated)/businesssettings/_components/ShopifyForm.tsx`](app/(authenticated)/businesssettings/_components/ShopifyForm.tsx:1)
- [`app/(authenticated)/businesssettings/_components/WooCommerceForm.tsx`](app/(authenticated)/businesssettings/_components/WooCommerceForm.tsx:1)

**Testable Actions:**
- [`app/(authenticated)/businesssettings/actions.ts)/businesssettings/actions`](app/(authenticated.ts:1)

---

### 11. Settings (`/settings`)

**Testable Components:**
- [`app/(authenticated)/settings/_components/AISettings.tsx`](app/(authenticated)/settings/_components/AISettings.tsx:1)
- [`app/(authenticated)/settings/_components/NewSettings.tsx`](app/(authenticated)/settings/_components/NewSettings.tsx:1)
- [`app/(authenticated)/settings/_components/ShopifyForm.tsx`](app/(authenticated)/settings/_components/ShopifyForm.tsx:1)

**Testable Actions:**
- [`app/(authenticated)/settings/actions.ts`](app/(authenticated)/settings/actions.ts:1)

---

### 12. Roles (`/roles`)

**Testable Files:**
- [`app/(authenticated)/roles/_lib/actions.ts`](app/(authenticated)/roles/_lib/actions.ts:1)
- [`app/(authenticated)/roles/_lib/validations.ts`](app/(authenticated)/roles/_lib/validations.ts:1)
- [`app/(authenticated)/roles/_lib/queries.ts`](app/(authenticated)/roles/_lib/queries.ts:1)

---

### 13. Store Coupons (`/storcoupons`)

**Testable Files:**
- [`app/(authenticated)/api/storcoupons/route.ts`](app/(authenticated)/api/storcoupons/route.ts:1)
- [`app/(authenticated)/api/storcoupons/[id]/route.ts`](app/(authenticated)/api/storcoupons/[id]/route.ts:1)

---

### 14-17. Store Management (Customers, Products, Users)

| Module | Actions | Validations | Queries |
|--------|---------|-------------|---------|
| `/storecustomers` | [`actions.ts`](app/(authenticated)/storecustomers/_lib/actions.ts:1) | [`validations.ts`](app/(authenticated)/storecustomers/_lib/validations.ts:1) | [`queries.ts`](app/(authenticated)/storecustomers/_lib/queries.ts:1) |
| `/storeproducts` | [`actions.ts`](app/(authenticated)/storeproducts/_lib/actions.ts:1) | [`validations.ts`](app/(authenticated)/storeproducts/_lib/validations.ts:1) | [`queries.ts`](app/(authenticated)/storeproducts/_lib/queries.ts:1) |
| `/storeusers` | [`actions.ts`](app/(authenticated)/storeusers/_lib/actions.ts:1) | [`validations.ts`](app/(authenticated)/storeusers/_lib/validations.ts:1) | [`queries.ts`](app/(authenticated)/storeusers/_lib/queries.ts:1) |

---

### 18. Store Stock Dashboard (`/store-stock-dashboard`)

**Testable:**
- [`app/(authenticated)/store-stock-dashboard/(tabs)/actions.ts`](app/(authenticated)/store-stock-dashboard/(tabs)/actions.ts:1)
- [`app/(authenticated)/store-stock-dashboard/(tabs)/vouchers/actions.ts`](app/(authenticated)/store-stock-dashboard/(tabs)/vouchers/actions.ts:1)

---

### 19. Data Upload Setup (`/data-upload-setup`)

**Testable Files:**
- [`app/(authenticated)/data-upload-setup/_lib/actions.ts`](app/(authenticated)/data-upload-setup/_lib/actions.ts:1)
- [`app/(authenticated)/data-upload-setup/_lib/validations.ts`](app/(authenticated)/data-upload-setup/_lib/validations.ts:1)
- [`app/(authenticated)/data-upload-setup/_lib/queries.ts`](app/(authenticated)/data-upload-setup/_lib/queries.ts:1)

---

### 20. Set Masters (`/setmasters`)

**Testable Files:**
- [`app/(authenticated)/setmasters/_lib/actions.ts`](app/(authenticated)/setmasters/_lib/actions.ts:1)
- [`app/(authenticated)/setmasters/_lib/validations.ts`](app/(authenticated)/setmasters/_lib/validations.ts:1)
- [`app/(authenticated)/setmasters/_lib/queries.ts`](app/(authenticated)/setmasters/_lib/queries.ts:1)

---

### 21. Role Menu (`/role-menu`)

**Testable Components:**
- [`app/(authenticated)/role-menu/client.tsx`](app/(authenticated)/role-menu/client.tsx:1)

---

### 22. Profile (`/profile`)

**Testable Files:**
- [`app/(authenticated)/profile/_lib/action.ts`](app/(authenticated)/profile/_lib/action.ts:1)

---

### 23. Store Settings (`/store-settings`)

**Testable Components:**
- [`app/(authenticated)/store-settings/_components/BusinessSettingsForm.tsx`](app/(authenticated)/store-settings/_components/BusinessSettingsForm.tsx:1)
- [`app/(authenticated)/store-settings/_components/ShopifyForm.tsx`](app/(authenticated)/store-settings/_components/ShopifyForm.tsx:1)
- [`app/(authenticated)/store-settings/_components/WooCommerceForm.tsx`](app/(authenticated)/store-settings/_components/WooCommerceForm.tsx:1)

---

### 24. Theme (`/Theme`)

**Testable:** Theme switching components

---

## 🧪 Universal Test Patterns

### Mocking Supabase

```typescript
// __mocks__/supabase.ts
export const postgrest = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((cb) => cb({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  })),
};

export const createClient = vi.fn();
```

### Testing Table Components

```typescript
// Testing table columns
import { render, screen } from '@testing-library/react';
import { columns } from './table-columns';

describe('Table Columns', () => {
  it('should render column headers', () => {
    const { headers } = columns;
    expect(headers.length).toBeGreaterThan(0);
  });

  it('should have cell accessor', () => {
    const nameColumn = columns.find(c => c.accessorKey === 'name');
    expect(nameColumn).toBeDefined();
  });
});
```

---

## 📊 Testing Priority Matrix

| Priority | Module | LOC (approx) | Test Files Needed |
|----------|--------|--------------|-------------------|
| 🔴 HIGH | Product2 | 25,000 | 8-10 test files |
| 🔴 HIGH | Data Upload | 20,000 | 8-10 test files |
| 🔴 HIGH | Point of Sale | 15,000 | 6-8 test files |
| 🟡 MEDIUM | Master Data | 10,000 | 4-5 test files |
| 🟡 MEDIUM | My Contacts | 12,000 | 4-5 test files |
| 🟡 MEDIUM | Settings | 22,000 | 6-8 test files |
| 🟢 LOW | Charts | 8,000 | 3-4 test files |
| 🟢 LOW | Files | 16,000 | 4-5 test files |

---

## 🚀 Implementation Checklist

### Step 1: Install Dependencies
```bash
pnpm add -D vitest @vitest/ui @vitest/coverage-v8
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
pnpm add -D jsdom
pnpm add -D msw@latest
```

### Step 2: Create Configuration
- Create `vitest.config.ts`
- Create `vitest.setup.ts`
- Create `__mocks__/` directory

### Step 3: Test Each Module (In Order)
1. ✅ Utilities & Validations
2. ✅ Product2 Actions
3. ✅ Data Upload Actions
4. ✅ POS Context
5. ✅ All CRUD Modules

### Step 4: Run & Report
```bash
pnpm test:coverage
pnpm test:json
```

---

## 📈 Expected Coverage Goals

| Phase | Target Coverage | Modules |
|-------|----------------|---------|
| Phase 1 | 40% | Utils, Validations |
| Phase 2 | 60% | + Actions |
| Phase 3 | 80% | + Components |

---

*Document Version: 2.0 - Complete Testing Catalogue*  
*Created: 2026-02-20*
