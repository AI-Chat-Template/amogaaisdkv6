import "@shopify/shopify-api/adapters/web-api";

import { ApiVersion, DeliveryMethod, shopifyApi } from "@shopify/shopify-api";
import { PostgrestSessionStorage } from "./sessionStorage";

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY as string,
  scopes: (process.env.SHOPIFY_SCOPES || "").split(","),
  hostName: (process.env.NEXT_PUBLIC_APP_URL || "").replace(/https:\/\//, ""),
  isEmbeddedApp: false,
  apiVersion: ApiVersion.January25,
  SESSION_STORAGE: new PostgrestSessionStorage(),
  future: {
    lineItemBilling: true,
    customerAddressDefaultFix: true,
    unstable_managedPricingSupport: true,
  },
});

shopify.webhooks.addHandlers({
  APP_UNINSTALLED: [
    {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
      callback: async (
        topic: string,
        shop: string,
        webhookRequestBody: string
      ) => {
        console.log("App uninstalled", topic, shop, webhookRequestBody);
      },
    },
  ],
});

export default shopify;
