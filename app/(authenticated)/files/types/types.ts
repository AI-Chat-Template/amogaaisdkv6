export interface FileMetadata {
  file_upload_id: number;
  mydoc_id: number | null;
  mydoc_list_id: number | null;
  status: string | null;

  created_user_id: number;
  created_user_name: string;
  ref_user_id: number | null;
  ref_user_name: string | null;

  created_date: string; // ISO date string
  updated_date: string;

  data_source_name: string | null;
  for_business_code: string | null;
  for_business_name: string | null;
  for_business_number: string | null;

  for_user_id: number | null;
  for_user_name: string | null;

  business_code: string | null;
  business_name: string | null;
  business_number: string | null;

  file_name: string;
  file_code: string | null;
  file_description: string | null;

  tabbed_form: string | null;
  template: string | null;
  template_name: string | null;

  chat_form: string | null;
  chatform_name: string | null;
  chatform_url: string | null;

  app_name: string | null;
  app_code: string | null;
  page_name: string | null;

  database_name: string | null;
  data_table_name: string | null;
  data_api_name: string | null;
  data_api_url: string | null;
  data_api_key: string | null;

  file_entries_table: string | null;
  file_entries_table_api: string | null;
  file_entries_api: string | null;

  publish_status: string | null;
  file_publish_date: string | null;
  file_publish_url: string;

  content: string | null;
  content_html: string | null;
  content_json: JSON | null;
  doc_json: JSON | null;

  visits: number | null;
  submissions: number | null;

  shareurl: string | null;
  shorturl: string | null;
  chatformshorturl: string | null;

  form_iframe_code: string | null;
  chatform_iframe_code: string | null;

  no_of_tabs: number | null;
  tab_name: string | null;
  tab_number: number | null;
  tab_order: number | null;
  tab_field_order: string | null;

  file_fields_json: JSON | null;
  file_fields_script: string | null;

  version_no: string | null;
  version_date: string | null;

  file_api: string | null;

  custom_text_one: string | null;
  custom_text_two: string | null;

  custom_no_one: number | null;
  custom_no_two: number | null;

  custom_json_one: string | null;
  custom_json_two: string | null;
  custom_json_three: string | null;

  file_no: string | null;
  ref_file: string | null;
  ref_file_no: string | null;
  file_group: string | null;

  plan_id: number | null;
  plan_name: string | null;
  plan_phase_id: number | null;

  task_id: number | null;
  task_name: string | null;

  ref_plan_name: string | null;
  ref_phase_name: string | null;
  ref_task_title: string | null;

  msg_id: number | null;

  doc_file_one: string | null;
  doc_file_two: string | null;
  doc_file_url: string | null;
  doc_file_json: JSON | null;

  flow_json: JSON | null;
  progress_json: JSON | null;
  status_log_json: JSON | null;
  user_log_json: JSON | null;
  business_log_json: JSON | null;
  agent_json: JSON | null;
  prompt_json: JSON | null;
  response_json: JSON | null;
  timeline_json: JSON | null;

  ref_business_code: string | null;
  ref_business_name: string | null;
  ref_business_number: string | null;

  file_uuid: string;
  file_type: "pdf" | string;
  folder_name: string;
  folder_group: string;
}

export interface FileData {
  data: FileMetadata;
}
