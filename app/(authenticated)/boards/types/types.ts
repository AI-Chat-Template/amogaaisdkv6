export interface FormData {
  form_id: number;
  status: "active" | "inactive" | string;
  created_user_id: string;
  created_user_name: string;
  ref_user_id: string | null;
  ref_user_name: string | null;
  created_date: string;
  updated_date: string | null;
  data_source_name: string | null;
  for_business_code: string | null;
  for_business_name: string | null;
  for_business_number: string | null;
  for_user_id: string | null;
  for_user_name: string | null;
  business_code: string | null;
  business_name: string;
  business_number: string;
  form_name: string;
  form_code: string;
  form_description: string | null;
  tabbed_form: boolean | null;
  template: string;
  template_name: string | null;
  chat_form: boolean | null;
  chatform_name: string | null;
  chatform_url: string | null;
  app_name: string | null;
  app_code: string | null;
  page_name: string | null;
  database_name: string | null;
  data_table_name: string | null;
  data_api_name: string | null;
  data_api_url: string;
  data_api_key: string | null;
  form_entries_table: string | null;
  form_entries_table_api: string | null;
  form_entries_api: string | null;
  publish_status: string | null;
  form_publish_date: string | null;
  form_publish_url: string | null;
  content: string;
  content_json: string[];
  form_json: JSON;
  visits: number | null;
  submissions: number | null;
  share_url: string;
  shorturl: string | null;
  chatformshorturl: string | null;
  form_iframe_code: string | null;
  chatform_iframe_code: string | null;
  no_of_tabs: number | null;
  tab_name: string | null;
  tab_number: number | null;
  tab_order: number | null;
  tab_field_order: string;
  form_fields_json: string;
  form_fields_script: string | null;
  version_no: string;
  version_date: string | null;
  custom_one: string[];
  custom_two: string | null;
  custom_no_one: number | null;
  custom_no_two: number | null;
  form_api: string | null;
  form_success_url: string;
  form_success_message: string;
  form_group: string;
  share_json: string;
  users_json: JSON;
  workflow_json: string;
  onboard_json: string;
  custom_one_json: string;
  custom_two_json: string;
  form_icon: string | null;
  story_name: string | null;
  story_code: string | null;
  form_uuid: string;
  agent_uuid: string;
  chat_log_json: string;
  business_log_json: string;
  agent_json: string;
  agent_content_json: string;
  message_content_json: string;
  prompt_json: string;
  response_json: string;
  timeline_json: string;
  email_content_json: string;
  email_doc_json: string;
  db_connection_json: string;
  data_connection_json: JSON;
  doc_connection_json: string;
  api_connection_json: string;
  data_source_json: string;
  connection_logs: string;
  connection_success: string;
}

export interface BoardAPI {
  result: Result;
}

export interface Result {
  cards: Card[];
  charts: Chart[];
}

export interface Card {
  id: number;
  name: string;
  description: string;
  query: string;
  api: string;
}

export interface Chart {
  id: number;
  name: string;
  description: string;
  query: string;
  chartType: string;
  api?: string;
}
