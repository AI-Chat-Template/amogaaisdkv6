import wooFlow from "./woo_n8n_integration_temp.json";
import wooSyncFlow from "./woo_n8n_sync_temp.json";
import shopifyFlow from "./shopify_n8n_integration_temp.json";
import shopifySyncFlow from "./shopify_n8n_sync_temp.json";

export function replacePlaceholders(
  jsonObject: Record<string, unknown>,
  replacements: Record<string, string>
): Record<string, unknown> {
  let jsonString = JSON.stringify(jsonObject);

  Object.keys(replacements).forEach((key) => {
    jsonString = jsonString.replace(new RegExp(key, "g"), replacements[key]);
  });

  const updatedWooFlow = JSON.parse(jsonString);

  return updatedWooFlow;
}

export function getShopifyWorkflowTemplate(
  workflowName: string,
  businessNumber: string,
  shopifyCredentialID: string,
  shopifyCredentialName: string
) {

  const replacements = {
    "<business_number>": businessNumber,
    "<postgrest_url>": "https://supabase-postgrest.morr.biz",
    "<postgrest_auth>":
      "Beare eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.UOsPiVnTkJuT37ftvDycaJfzcMprK4rsBkLPflhd_3E",
    "<shopifyCredentialName>": shopifyCredentialName,
    "<shopifyCredentialID>": shopifyCredentialID,
    "<authParam>" : "apikey"
  };

  const updatedWooFlow = replacePlaceholders(shopifyFlow, replacements);

  return {
    ...updatedWooFlow,
    name: workflowName || updatedWooFlow.name,
  };
}

export function getShopifySyncWorkflowTemplate(
  businessNumber: string,
  shopifyCredentialID: string,
  shopifyCredentialName: string
) {
  const replacements = {
    "<business_number>": businessNumber,
    "<postgrest_url>": "https://supabase-postgrest.morr.biz",
    "<postgrest_auth>":
      "Beare eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.UOsPiVnTkJuT37ftvDycaJfzcMprK4rsBkLPflhd_3E",
    "<shopifyCredentialName>": shopifyCredentialName,
    "<shopifyCredentialID>": shopifyCredentialID,
    "<authParam>" : "apikey"
  };

  const updatedWooFlow = replacePlaceholders(shopifySyncFlow, replacements);

  return {
    ...updatedWooFlow,
  };
}

export function getWooCommerceWorkflowTemplate(
  workflowName: string,
  businessNumber: string,
  wooCredentialID: string,
  wooCredentialName: string
) {
  console.log(
    "make api",
    businessNumber,
    "woo",
    wooCredentialID,
    "wooo",
    wooCredentialName
  );
  const replacements = {
    "<business_number>": businessNumber,
    "<postgrest_url>": "https://supabase-postgrest.morr.biz",
    "<postgrest_auth>":
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.UOsPiVnTkJuT37ftvDycaJfzcMprK4rsBkLPflhd_3E",
    "<wooCredentialName>": wooCredentialName,
    "<wooCredentialID>": wooCredentialID,
  };

  const updatedWooFlow = replacePlaceholders(wooFlow, replacements);

  return {
    ...updatedWooFlow,
    name: workflowName || updatedWooFlow.name,
  };
}

export function getWooCommerceSyncWorkflowTemplate(
  businessNumber: string,
  wooCredentialID: string,
  wooCredentialName: string
) {
  console.log(
    "make api",
    businessNumber,
    "woo",
    wooCredentialID,
    "wooo",
    wooCredentialName
  );
  const replacements = {
    "<business_number>": businessNumber,
    "<postgrest_url>": "https://supabase-postgrest.morr.biz",
    "<postgrest_auth>":
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.UOsPiVnTkJuT37ftvDycaJfzcMprK4rsBkLPflhd_3E",
    "<wooCredentialName>": wooCredentialName,
    "<wooCredentialID>": wooCredentialID,
    "<authParam>" : "apikey"
  };

  const updatedWooFlow = replacePlaceholders(wooSyncFlow, replacements);

  return {
    ...updatedWooFlow,
  };
}
