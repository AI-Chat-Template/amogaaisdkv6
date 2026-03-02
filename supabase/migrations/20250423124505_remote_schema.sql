

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."dynamic_table_filter"("filters" "jsonb", "select_fields" "text", "table_name" "text", "extra_condition" "text" DEFAULT 'true'::"text") RETURNS SETOF "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  main_cond   text := 'true';
  always_cond text := '';
  col         text;
  val         text;
  combo       jsonb;
  combo_cond  text;
  sql         text;
BEGIN

  -- Default extra_condition to 'true' if null or empty
  IF trim(extra_condition) IS NULL OR trim(extra_condition) = '' THEN
    extra_condition := 'true';
  END IF;

  -- 1) ignore_empty
  IF filters ? 'ignore_empty' THEN
    FOR col IN SELECT jsonb_array_elements_text(filters->'ignore_empty') LOOP
      main_cond := main_cond
        || format(' AND (%I IS NOT NULL AND %I <> '''')', col, col);
    END LOOP;
  END IF;

  -- 2) ignore_prefix
  IF filters ? 'ignore_prefix' THEN
    FOR col IN SELECT jsonb_object_keys(filters->'ignore_prefix') LOOP
      FOR val IN SELECT jsonb_array_elements_text(filters->'ignore_prefix'->col) LOOP
        main_cond := main_cond
          || format(' AND NOT %I LIKE %L', col, val || '%');
      END LOOP;
    END LOOP;
  END IF;

  -- 3) ignore_values
  IF filters ? 'ignore_values' THEN
    FOR col IN SELECT jsonb_object_keys(filters->'ignore_values') LOOP
      FOR val IN SELECT jsonb_array_elements_text(filters->'ignore_values'->col) LOOP
        main_cond := main_cond
          || format(' AND %I <> %L', col, val);
      END LOOP;
    END LOOP;
  END IF;

  -- 4) ignore_combinations
  IF filters ? 'ignore_combinations' THEN
    FOR combo IN
      SELECT * FROM jsonb_array_elements(filters->'ignore_combinations')
    LOOP
      combo_cond := '';
      FOR col IN SELECT jsonb_object_keys(combo) LOOP
        combo_cond := combo_cond
          || format(' AND %I = %L', col, combo->>col);
      END LOOP;
      combo_cond := substring(combo_cond FROM 6);  -- strip leading ' AND '
      main_cond := main_cond
        || format(' AND NOT (%s)', combo_cond);
    END LOOP;
  END IF;

  -- 5) never_ignore
  IF filters ? 'never_ignore' THEN
    FOR col IN SELECT jsonb_object_keys(filters->'never_ignore') LOOP
      FOR val IN
        SELECT jsonb_array_elements_text(filters->'never_ignore'->col)
      LOOP
        always_cond := always_cond
          || format(' OR %I = %L', col, val);
      END LOOP;
    END LOOP;
  END IF;

  -- 6) combine main vs always‑include
  IF always_cond <> '' THEN
    always_cond := substring(always_cond FROM 5);  -- strip leading ' OR '
    main_cond := format('(%s) OR (%s)', main_cond, always_cond);
  END IF;

  -- 7) build and run the final SQL
  --
  --    We wrap your comma‑list in a subselect, then turn each row into JSON:
  sql := format(
    'SELECT to_jsonb(sub) 
       FROM (
         SELECT %s
           FROM %s AS rbu
          WHERE %s AND (%s)
       ) AS sub',
    select_fields,
    table_name,
    extra_condition,
    main_cond
  );

  RETURN QUERY EXECUTE sql;
END;
$$;


ALTER FUNCTION "public"."dynamic_table_filter"("filters" "jsonb", "select_fields" "text", "table_name" "text", "extra_condition" "text") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."dynamic_table_filter_query"("filters" "jsonb", "select_fields" "text", "table_name" "text", "extra_condition" "text" DEFAULT 'true'::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  main_cond   text := 'true';
  always_cond text := '';
  col         text;
  val         text;
  combo       jsonb;
  combo_cond  text;
  sql         text;
BEGIN

  -- Default extra_condition to 'true' if null or empty
  IF trim(extra_condition) IS NULL OR trim(extra_condition) = '' THEN
    extra_condition := 'true';
  END IF;

  -- 1) ignore_empty
  IF filters ? 'ignore_empty' THEN
    FOR col IN SELECT jsonb_array_elements_text(filters->'ignore_empty') LOOP
      main_cond := main_cond
        || format(' AND (%I IS NOT NULL AND %I <> '''')', col, col);
    END LOOP;
  END IF;

  -- 2) ignore_prefix
  IF filters ? 'ignore_prefix' THEN
    FOR col IN SELECT jsonb_object_keys(filters->'ignore_prefix') LOOP
      FOR val IN SELECT jsonb_array_elements_text(filters->'ignore_prefix'->col) LOOP
        main_cond := main_cond
          || format(' AND NOT %I LIKE %L', col, val || '%');
      END LOOP;
    END LOOP;
  END IF;

  -- 3) ignore_values
  IF filters ? 'ignore_values' THEN
    FOR col IN SELECT jsonb_object_keys(filters->'ignore_values') LOOP
      FOR val IN SELECT jsonb_array_elements_text(filters->'ignore_values'->col) LOOP
        main_cond := main_cond
          || format(' AND %I <> %L', col, val);
      END LOOP;
    END LOOP;
  END IF;

  -- 4) ignore_combinations
  IF filters ? 'ignore_combinations' THEN
    FOR combo IN
      SELECT * FROM jsonb_array_elements(filters->'ignore_combinations')
    LOOP
      combo_cond := '';
      FOR col IN SELECT jsonb_object_keys(combo) LOOP
        combo_cond := combo_cond
          || format(' AND %I = %L', col, combo->>col);
      END LOOP;
      combo_cond := substring(combo_cond FROM 6);  -- strip leading ' AND '
      main_cond := main_cond
        || format(' AND NOT (%s)', combo_cond);
    END LOOP;
  END IF;

  -- 5) never_ignore
  IF filters ? 'never_ignore' THEN
    FOR col IN SELECT jsonb_object_keys(filters->'never_ignore') LOOP
      FOR val IN
        SELECT jsonb_array_elements_text(filters->'never_ignore'->col)
      LOOP
        always_cond := always_cond
          || format(' OR %I = %L', col, val);
      END LOOP;
    END LOOP;
  END IF;

  -- 6) combine main vs always‑include
  IF always_cond <> '' THEN
    always_cond := substring(always_cond FROM 5);  -- strip leading ' OR '
    main_cond := format('(%s) OR (%s)', main_cond, always_cond);
  END IF;

  -- 7) build and run the final SQL
  --
  --    We wrap your comma‑list in a subselect, then turn each row into JSON:
  sql := format(
    'SELECT to_jsonb(sub) 
       FROM (
         SELECT %s
           FROM %s AS rbu
          WHERE %s AND (%s)
       ) AS sub',
    select_fields,
    table_name,
    extra_condition,
    main_cond
  );

  RETURN sql;
END;
$$;


ALTER FUNCTION "public"."dynamic_table_filter_query"("filters" "jsonb", "select_fields" "text", "table_name" "text", "extra_condition" "text") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."get_current_timeout"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- current_setting('statement_timeout') returns a string like '30min' or '0'
  RETURN current_setting('statement_timeout');
END;$$;


ALTER FUNCTION "public"."get_current_timeout"() OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."simulate_sleep"("seconds" integer) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  PERFORM pg_sleep(seconds);
  RETURN format('Slept for %s seconds.', seconds);
END;$$;


ALTER FUNCTION "public"."simulate_sleep"("seconds" integer) OWNER TO "supabase_admin";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bom" (
    "bom_id" bigint NOT NULL,
    "mydoc_id" bigint,
    "mydoc_list_id" bigint,
    "file_upload_id" bigint,
    "data_upload_id" bigint,
    "status" "text",
    "progress_status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp with time zone,
    "updated_date" timestamp with time zone,
    "data_source_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "bom_product_id" bigint,
    "bom_product_code" "text",
    "bom_product_number" "text",
    "ref_bom_product_code" "text",
    "ref_bom_product_number" "text",
    "bom_product_specification_json" "jsonb",
    "semi_finished_goods" boolean,
    "manufacturing" boolean,
    "bom_product_group_json" "jsonb",
    "bom_type" "text",
    "bom_group" "text",
    "bom_category" "text",
    "bom_name" "text",
    "bom_ref_name" "text",
    "bom_title" "text",
    "bom_ref_title" "text",
    "bom_code" "text",
    "bom_refcode" "text",
    "bom_no" "text",
    "ref_bom_no" "text",
    "bom_short_description" "text",
    "bom_description" "text",
    "bom_start_date" timestamp with time zone,
    "bom_end_date" timestamp with time zone,
    "bom_plan_cost" numeric,
    "bom_actual_cost" numeric,
    "bom_publish_status" "text",
    "bom_publish_date" timestamp with time zone,
    "bom_publish_url" "text",
    "bom_visits" "text",
    "bom_submissions" "text",
    "bom_shareurl" "text",
    "bom_shorturl" "text",
    "bom_addon_coloumn_json" "jsonb",
    "bom_addon_data_json" "jsonb",
    "bom_entries_product" "text",
    "bom_api" "jsonb",
    "bom_entries_api" "jsonb",
    "bom_content_api" "jsonb",
    "bom_fields_json" "jsonb",
    "bom_fields_script" "jsonb",
    "bom_parts_json" "jsonb",
    "bom_sfg_parts_json" "jsonb",
    "bom_costing_json" "jsonb",
    "bom_workcenter_json" "jsonb",
    "bom_mfgflow_json" "jsonb",
    "bom_version_no" "text",
    "bom_version_date" timestamp with time zone,
    "bom_version_json" "jsonb",
    "price" numeric,
    "discount_percent" numeric,
    "offer_price" numeric,
    "sale_price" numeric,
    "cogm_price" numeric,
    "cogs_price" numeric,
    "landing_price" numeric,
    "recent_purchase_price" numeric,
    "moving_average_price" numeric,
    "fifo_price" numeric,
    "lifo_price" numeric,
    "list_price" numeric,
    "custom_price_one" numeric,
    "custom_price_two" numeric,
    "template" boolean,
    "template_name" "text",
    "tabbed_form" boolean,
    "no_of_tabs" "text",
    "tab_name" "text",
    "tab_number" "text",
    "tab_order" "text",
    "tab_field_order" "jsonb",
    "page_name" "text",
    "menu_title" "text",
    "form" boolean,
    "form_name" "text",
    "form_url" "text",
    "form_short_url" "text",
    "form_iframe_code" "text",
    "chat_form" boolean,
    "chat_form_name" "text",
    "chat_form_url" "text",
    "chat_form_short_url" "text",
    "chatform_iframe_code" "text",
    "app_name" "text",
    "app_code" "text",
    "database_name" "text",
    "data_table_name" "text",
    "data_api_name" "text",
    "data_api_url" "text",
    "data_api_key" "text",
    "content" "text",
    "content_json" "jsonb",
    "content_html" "text",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_no_one" numeric,
    "custom_no_two" numeric,
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "plan_id" "text",
    "plan_name" "text",
    "plan_code" "text",
    "plan_phase_id" "text",
    "task_id" "text",
    "task_name" "text",
    "task_code" "text",
    "ref_plan_name" "text",
    "ref_phase_name" "text",
    "ref_task_title" "text",
    "ref_task_code" "text",
    "msg_id" "text",
    "msg_code" "text",
    "file_one" "bytea",
    "file_two" "bytea",
    "file_url" "text",
    "file_json" "jsonb",
    "flow_json" "jsonb",
    "progress_json" "jsonb",
    "status_log_json" "jsonb",
    "user_log_json" "jsonb",
    "business_log_json" "jsonb",
    "agent_json" "jsonb",
    "prompt_json" "jsonb",
    "response_json" "jsonb",
    "timeline_json" "jsonb"
);


ALTER TABLE "public"."bom" OWNER TO "supabase_admin";


CREATE SEQUENCE IF NOT EXISTS "public"."bom_bom_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."bom_bom_id_seq" OWNER TO "supabase_admin";


ALTER SEQUENCE "public"."bom_bom_id_seq" OWNED BY "public"."bom"."bom_id";



ALTER TABLE "public"."bom" ALTER COLUMN "bom_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bom_bom_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."bom_item" (
    "bom_item_id" bigint NOT NULL,
    "bom_id" bigint,
    "mydoc_id" bigint,
    "mydoc_list_id" bigint,
    "file_upload_id" bigint,
    "data_upload_id" bigint,
    "status" "text",
    "progress_status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp with time zone,
    "updated_date" timestamp with time zone,
    "data_source_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "product_name" "text",
    "product_ref_name" "text",
    "product_title" "text",
    "product_ref_title" "text",
    "product_code" "text",
    "product_refcode" "text",
    "product_short_description" "text",
    "product_description" "text",
    "product_start_date" timestamp with time zone,
    "product_end_date" timestamp with time zone,
    "product_version_no" "text",
    "product_version_date" timestamp with time zone,
    "product_version_json" "jsonb",
    "product_type" "text",
    "product_group" "text",
    "product_category" "text",
    "product_org_json" "jsonb",
    "product_group_json" "jsonb",
    "product_category_json" "jsonb",
    "recommendation_json" "jsonb",
    "related_json" "jsonb",
    "offers_json" "jsonb",
    "supply_type" "text",
    "supply_group" "text",
    "supply_category" "text",
    "suppliers_json" "jsonb",
    "manage_stock" boolean,
    "control_stock" boolean,
    "manage_expiry_date" boolean,
    "hsn_number" "text",
    "product_number" "text",
    "manage_sku" boolean,
    "manage_serial_number" boolean,
    "prefix_code" "text",
    "suffix_code" "text",
    "code_generation_json" "jsonb",
    "sku_number" "text",
    "ref_product_number" "text",
    "ref_product_code" "text",
    "ref_supply_code" "text",
    "price" numeric,
    "discount_percent" numeric,
    "offer_price" numeric,
    "sale_price" numeric,
    "cogm_price" numeric,
    "cogs_price" numeric,
    "landing_price" numeric,
    "recent_purchase_price" numeric,
    "moving_average_price" numeric,
    "fifo_price" numeric,
    "lifo_price" numeric,
    "list_price" numeric,
    "custom_price_one" numeric,
    "custom_price_two" numeric,
    "qty" numeric,
    "uom" "text",
    "amount" numeric,
    "overrun_percent" numeric,
    "wastage_percent" numeric,
    "bom_product_id" bigint,
    "bom_product_code" "text",
    "bom_product_number" "text",
    "ref_bom_product_code" "text",
    "ref_bom_product_number" "text",
    "bom_product_specification_json" "jsonb",
    "semi_finished_goods" boolean,
    "manufacturing" boolean,
    "bom_type" "text",
    "bom_group" "text",
    "bom_category" "text",
    "bom_name" "text",
    "bom_ref_name" "text",
    "bom_title" "text",
    "bom_ref_title" "text",
    "bom_code" "text",
    "bom_refcode" "text",
    "bom_no" "text",
    "ref_bom_no" "text",
    "bom_item_short_description" "text",
    "bom_item_description" "text",
    "bom_item_start_date" timestamp with time zone,
    "bom_item_end_date" timestamp with time zone,
    "bom_item_plan_cost" numeric,
    "bom_item_actual_cost" numeric,
    "bom_item_workcenter_json" "jsonb",
    "bom_item_mfgflow_json" "jsonb",
    "bom_item_version_no" "text",
    "bom_item_version_date" timestamp with time zone,
    "bom_item_version_json" "jsonb",
    "template" boolean,
    "template_name" "text",
    "tabbed_form" boolean,
    "no_of_tabs" "text",
    "tab_name" "text",
    "tab_number" "text",
    "tab_order" "text",
    "tab_field_order" "jsonb",
    "page_name" "text",
    "menu_title" "text",
    "form" boolean,
    "form_name" "text",
    "form_url" "text",
    "form_short_url" "text",
    "form_iframe_code" "text",
    "chat_form" boolean,
    "chat_form_name" "text",
    "chat_form_url" "text",
    "chat_form_short_url" "text",
    "chatform_iframe_code" "text",
    "app_name" "text",
    "app_code" "text",
    "database_name" "text",
    "data_table_name" "text",
    "data_api_name" "text",
    "data_api_url" "text",
    "data_api_key" "text",
    "content" "text",
    "content_json" "jsonb",
    "content_html" "text",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_no_one" numeric,
    "custom_no_two" numeric,
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "ledgers_json" "jsonb",
    "accounts_json" "jsonb",
    "workcenter_json" "jsonb",
    "mfg_flow_json" "jsonb",
    "quality_json" "jsonb"
);


ALTER TABLE "public"."bom_item" OWNER TO "supabase_admin";


CREATE SEQUENCE IF NOT EXISTS "public"."bom_item_bom_item_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."bom_item_bom_item_id_seq" OWNER TO "supabase_admin";


ALTER SEQUENCE "public"."bom_item_bom_item_id_seq" OWNED BY "public"."bom_item"."bom_item_id";



ALTER TABLE "public"."bom_item" ALTER COLUMN "bom_item_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bom_item_bom_item_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."bom_maker" (
    "bom_maker_id" bigint NOT NULL,
    "mydoc_id" bigint,
    "mydoc_list_id" bigint,
    "file_upload_id" bigint,
    "status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp with time zone,
    "updated_date" timestamp with time zone,
    "data_source_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "data_upload_name" "text",
    "data_upload_ref_name" "text",
    "data_upload_title" "text",
    "data_upload_ref_title" "text",
    "data_upload_code" "text",
    "data_upload_refcode" "text",
    "data_upload_short_description" "text",
    "data_upload_description" "text",
    "data_upload_start_date" timestamp with time zone,
    "data_upload_end_date" timestamp with time zone,
    "data_upload_publish_status" "text",
    "data_upload_publish_date" timestamp with time zone,
    "data_upload_publish_url" "text",
    "data_upload_visits" "text",
    "data_upload_submissions" "text",
    "data_upload_shareurl" "text",
    "data_upload_shorturl" "text",
    "data_upload_addon_coloumn_json" "jsonb",
    "data_upload_entries_table" "text",
    "data_upload_entries_table_api" "text",
    "data_upload_entries_api" "text",
    "data_upload_fields_json" "jsonb",
    "data_upload_fields_script" "jsonb",
    "data_upload_version_no" "text",
    "data_upload_version_date" timestamp with time zone,
    "raw_bom_name" "text",
    "ref_raw_bom_name" "text",
    "final_bom_template" "text",
    "final_bom_setup" "text",
    "final_bom_filters_json" "jsonb",
    "final_bom_file_url" "text",
    "bom_name" "text",
    "bom_number" "text",
    "bom_code" "text",
    "bom_group" "text",
    "bom_type" "text",
    "ref_bom_name" "text",
    "ref_bom_code" "text",
    "ref_bom_number" "text",
    "template" boolean,
    "template_name" "text",
    "tabbed_form" boolean,
    "no_of_tabs" "text",
    "tab_name" "text",
    "tab_number" "text",
    "tab_order" "text",
    "tab_field_order" "jsonb",
    "page_name" "text",
    "menu_title" "text",
    "form" boolean,
    "form_name" "text",
    "form_url" "text",
    "form_short_url" "text",
    "form_iframe_code" "text",
    "chat_form" boolean,
    "chat_form_name" "text",
    "chat_form_url" "text",
    "chat_form_short_url" "text",
    "chatform_iframe_code" "text",
    "app_name" "text",
    "app_code" "text",
    "database_name" "text",
    "data_table_name" "text",
    "data_api_name" "text",
    "data_api_url" "text",
    "data_api_key" "text",
    "content" "text",
    "content_json" "jsonb",
    "content_html" "text",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_no_one" numeric,
    "custom_no_two" numeric,
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "plan_id" "text",
    "plan_name" "text",
    "plan_code" "text",
    "plan_phase_id" "text",
    "task_id" "text",
    "task_name" "text",
    "task_code" "text",
    "ref_plan_name" "text",
    "ref_phase_name" "text",
    "ref_task_title" "text",
    "ref_task_code" "text",
    "msg_id" "text",
    "msg_code" "text",
    "file_one" "bytea",
    "file_two" "bytea",
    "file_url" "text",
    "file_json" "jsonb",
    "flow_json" "jsonb",
    "progress_json" "jsonb",
    "status_log_json" "jsonb",
    "user_log_json" "jsonb",
    "business_log_json" "jsonb",
    "agent_json" "jsonb",
    "prompt_json" "jsonb",
    "response_json" "jsonb",
    "timeline_json" "jsonb",
    "error_logs" "jsonb",
    "bom_filter_setup_json" "jsonb",
    "raw_bom_filter_setup_json" "jsonb"
);


ALTER TABLE "public"."bom_maker" OWNER TO "supabase_admin";


CREATE SEQUENCE IF NOT EXISTS "public"."bom_maker_bom_maker_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."bom_maker_bom_maker_id_seq" OWNER TO "supabase_admin";


ALTER SEQUENCE "public"."bom_maker_bom_maker_id_seq" OWNED BY "public"."bom_maker"."bom_maker_id";



ALTER TABLE "public"."bom_maker" ALTER COLUMN "bom_maker_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bom_maker_bom_maker_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."data_group" (
    "data_group_id" bigint NOT NULL,
    "data_group_type" "text",
    "code" "text",
    "ref_code" "text",
    "for_code" "text",
    "data_group_category" "text",
    "data_group_name" "text",
    "name" "text",
    "ref_name" "text",
    "for_name" "text",
    "short_description" "text",
    "description" "text",
    "remarks" "text",
    "data_model_json" "jsonb",
    "data_combination_json" "jsonb",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_number_one" "text",
    "custom_number_two" "text",
    "custom_file_one" "text",
    "custom_file_two" "text",
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "created_date" timestamp with time zone DEFAULT "now"(),
    "updated_date" timestamp with time zone DEFAULT "now"(),
    "for_user_id" "text",
    "for_user_name" "text",
    "status" "text"
);


ALTER TABLE "public"."data_group" OWNER TO "supabase_admin";


CREATE SEQUENCE IF NOT EXISTS "public"."data_group_data_group_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."data_group_data_group_id_seq" OWNER TO "supabase_admin";


ALTER SEQUENCE "public"."data_group_data_group_id_seq" OWNED BY "public"."data_group"."data_group_id";



ALTER TABLE "public"."data_group" ALTER COLUMN "data_group_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."data_group_data_group_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."data_upload" (
    "data_upload_id" bigint NOT NULL,
    "mydoc_id" bigint,
    "mydoc_list_id" bigint,
    "file_upload_id" bigint,
    "status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp with time zone,
    "updated_date" timestamp with time zone,
    "data_source_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "data_upload_name" "text",
    "data_upload_ref_name" "text",
    "data_upload_title" "text",
    "data_upload_ref_title" "text",
    "data_upload_code" "text",
    "data_upload_refcode" "text",
    "data_upload_short_description" "text",
    "data_upload_description" "text",
    "data_upload_start_date" timestamp with time zone,
    "data_upload_end_date" timestamp with time zone,
    "data_upload_publish_status" "text",
    "data_upload_publish_date" timestamp with time zone,
    "data_upload_publish_url" "text",
    "data_upload_visits" "text",
    "data_upload_submissions" "text",
    "data_upload_shareurl" "text",
    "data_upload_shorturl" "text",
    "data_upload_addon_coloumn_json" "jsonb",
    "data_upload_entries_table" "text",
    "data_upload_entries_table_api" "text",
    "data_upload_entries_api" "text",
    "data_upload_fields_json" "jsonb",
    "data_upload_fields_script" "jsonb",
    "data_upload_version_no" "text",
    "data_upload_version_date" timestamp with time zone,
    "template" boolean,
    "template_name" "text",
    "tabbed_form" boolean,
    "no_of_tabs" "text",
    "tab_name" "text",
    "tab_number" "text",
    "tab_order" "text",
    "tab_field_order" "jsonb",
    "page_name" "text",
    "menu_title" "text",
    "form" boolean,
    "form_name" "text",
    "form_url" "text",
    "form_short_url" "text",
    "form_iframe_code" "text",
    "chat_form" boolean,
    "chat_form_name" "text",
    "chat_form_url" "text",
    "chat_form_short_url" "text",
    "chatform_iframe_code" "text",
    "app_name" "text",
    "app_code" "text",
    "database_name" "text",
    "data_table_name" "text",
    "data_api_name" "text",
    "data_api_url" "text",
    "data_api_key" "text",
    "content" "text",
    "content_json" "jsonb",
    "content_html" "text",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_no_one" numeric,
    "custom_no_two" numeric,
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "plan_id" "text",
    "plan_name" "text",
    "plan_code" "text",
    "plan_phase_id" "text",
    "task_id" "text",
    "task_name" "text",
    "task_code" "text",
    "ref_plan_name" "text",
    "ref_phase_name" "text",
    "ref_task_title" "text",
    "ref_task_code" "text",
    "msg_id" "text",
    "msg_code" "text",
    "file_one" "bytea",
    "file_two" "bytea",
    "file_url" "text",
    "file_json" "jsonb",
    "flow_json" "jsonb",
    "progress_json" "jsonb",
    "status_log_json" "jsonb",
    "user_log_json" "jsonb",
    "business_log_json" "jsonb",
    "agent_json" "jsonb",
    "prompt_json" "jsonb",
    "response_json" "jsonb",
    "timeline_json" "jsonb",
    "file_name" "text",
    "file_uuid" "uuid",
    "template_id" bigint,
    "data_upload_group" "text",
    "month" "text",
    "year" "text",
    "financial_year" "text",
    "financial_period" "text",
    "data_upload_uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."data_upload" OWNER TO "supabase_admin";


ALTER TABLE "public"."data_upload" ALTER COLUMN "data_upload_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."data_upload_data_upload_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."data_upload_setup" (
    "data_upload_setup_id" bigint NOT NULL,
    "status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp with time zone,
    "updated_date" timestamp with time zone,
    "data_source_name" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "template" boolean,
    "template_name" "text",
    "template_file_url" "text",
    "template_file_fields_json" "jsonb",
    "upload_file_name" "text",
    "app_name" "text",
    "app_code" "text",
    "page_name" "text",
    "database_name" "text",
    "data_table_name" "text",
    "data_api_name" "text",
    "data_api_url" "text",
    "data_api_key" "text",
    "data_entries_table" "text",
    "data_entries_table_api" "text",
    "data_entries_api" "text",
    "file_csv_field_json" "jsonb",
    "file_json" "jsonb",
    "version_no" "text",
    "version_date" timestamp with time zone,
    "file_api" "text",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_no_one" numeric,
    "custom_no_two" numeric,
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "data_upload_title" "text",
    "ref_data" "text",
    "ref_data_no" "text",
    "data_upload_type" "text",
    "data_upload_group" "text",
    "data_upload_category" "text",
    "plan_id" "text",
    "plan_name" "text",
    "plan_phase_id" "text",
    "task_id" "text",
    "task_name" "text",
    "ref_plan_name" "text",
    "ref_phase_name" "text",
    "ref_task_title" "text",
    "msg_id" "text",
    "doc_file_one" "bytea",
    "doc_file_two" "bytea",
    "doc_file_url" "text",
    "doc_file_json" "jsonb",
    "flow_json" "jsonb",
    "progress_json" "jsonb",
    "status_log_json" "jsonb",
    "user_log_json" "jsonb",
    "business_log_json" "jsonb",
    "agent_json" "jsonb",
    "prompt_json" "jsonb",
    "response_json" "jsonb",
    "timeline_json" "jsonb",
    "file_csv_field_mapto_table_json" "jsonb"
);


ALTER TABLE "public"."data_upload_setup" OWNER TO "supabase_admin";


ALTER TABLE "public"."data_upload_setup" ALTER COLUMN "data_upload_setup_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."data_upload_setup_data_upload_setup_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."file_upload" (
    "file_upload_id" bigint NOT NULL,
    "mydoc_id" bigint,
    "mydoc_list_id" bigint,
    "status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp with time zone DEFAULT "now"(),
    "updated_date" timestamp with time zone DEFAULT "now"(),
    "data_source_name" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "file_name" "text",
    "file_code" "text",
    "file_description" "text",
    "tabbed_form" boolean,
    "template" boolean,
    "template_name" "text",
    "chat_form" boolean,
    "chatform_name" "text",
    "chatform_url" "text",
    "app_name" "text",
    "app_code" "text",
    "page_name" "text",
    "database_name" "text",
    "data_table_name" "text",
    "data_api_name" "text",
    "data_api_url" "text",
    "data_api_key" "text",
    "file_entries_table" "text",
    "file_entries_table_api" "text",
    "file_entries_api" "text",
    "publish_status" "text",
    "file_publish_date" timestamp with time zone,
    "file_publish_url" "text",
    "content" "text",
    "content_html" "text",
    "content_json" "jsonb",
    "doc_json" "jsonb",
    "visits" "text",
    "submissions" "text",
    "shareurl" "text",
    "shorturl" "text",
    "chatformshorturl" "text",
    "form_iframe_code" "text",
    "chatform_iframe_code" "text",
    "no_of_tabs" "text",
    "tab_name" "text",
    "tab_number" "text",
    "tab_order" "text",
    "tab_field_order" "jsonb",
    "file_fields_json" "jsonb",
    "file_fields_script" "jsonb",
    "version_no" "text",
    "version_date" timestamp with time zone,
    "file_api" "text",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_no_one" numeric,
    "custom_no_two" numeric,
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "file_no" "text",
    "ref_file" "text",
    "ref_file_no" "text",
    "file_group" "text",
    "plan_id" "text",
    "plan_name" "text",
    "plan_phase_id" "text",
    "task_id" "text",
    "task_name" "text",
    "ref_plan_name" "text",
    "ref_phase_name" "text",
    "ref_task_title" "text",
    "msg_id" "text",
    "doc_file_one" "bytea",
    "doc_file_two" "bytea",
    "doc_file_url" "text",
    "doc_file_json" "jsonb",
    "flow_json" "jsonb",
    "progress_json" "jsonb",
    "status_log_json" "jsonb",
    "user_log_json" "jsonb",
    "business_log_json" "jsonb",
    "agent_json" "jsonb",
    "prompt_json" "jsonb",
    "response_json" "jsonb",
    "timeline_json" "jsonb",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text"
);


ALTER TABLE "public"."file_upload" OWNER TO "supabase_admin";


ALTER TABLE "public"."file_upload" ALTER COLUMN "file_upload_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."file_upload_file_upload_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."final_bom" (
    "final_bom_id" bigint NOT NULL,
    "mydoc_id" bigint,
    "mydoc_list_id" bigint,
    "file_upload_id" bigint,
    "data_upload_id" bigint,
    "status" "text",
    "progress_status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp with time zone,
    "updated_date" timestamp with time zone,
    "data_source_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "bom_product_id" bigint,
    "bom_product_code" "text",
    "bom_product_number" "text",
    "ref_bom_product_code" "text",
    "ref_bom_product_number" "text",
    "bom_product_specification_json" "jsonb",
    "semi_finished_goods" boolean,
    "manufacturing" boolean,
    "bom_product_group_json" "jsonb",
    "bom_type" "text",
    "bom_group" "text",
    "bom_category" "text",
    "bom_name" "text",
    "bom_ref_name" "text",
    "bom_title" "text",
    "bom_ref_title" "text",
    "bom_code" "text",
    "bom_refcode" "text",
    "bom_no" "text",
    "ref_bom_no" "text",
    "bom_short_description" "text",
    "bom_description" "text",
    "bom_start_date" timestamp with time zone,
    "bom_end_date" timestamp with time zone,
    "bom_plan_cost" numeric,
    "bom_actual_cost" numeric,
    "bom_publish_status" "text",
    "bom_publish_date" timestamp with time zone,
    "bom_publish_url" "text",
    "bom_visits" "text",
    "bom_submissions" "text",
    "bom_shareurl" "text",
    "bom_shorturl" "text",
    "bom_addon_coloumn_json" "jsonb",
    "bom_addon_data_json" "jsonb",
    "bom_entries_product" "text",
    "bom_api" "jsonb",
    "bom_entries_api" "jsonb",
    "bom_content_api" "jsonb",
    "bom_fields_json" "jsonb",
    "bom_fields_script" "jsonb",
    "bom_parts_json" "jsonb",
    "bom_sfg_parts_json" "jsonb",
    "bom_costing_json" "jsonb",
    "bom_workcenter_json" "jsonb",
    "bom_mfgflow_json" "jsonb",
    "bom_version_no" "text",
    "bom_version_date" timestamp with time zone,
    "bom_version_json" "jsonb",
    "price" numeric,
    "discount_percent" numeric,
    "offer_price" numeric,
    "sale_price" numeric,
    "cogm_price" numeric,
    "cogs_price" numeric,
    "landing_price" numeric,
    "recent_purchase_price" numeric,
    "moving_average_price" numeric,
    "fifo_price" numeric,
    "lifo_price" numeric,
    "list_price" numeric,
    "custom_price_one" numeric,
    "custom_price_two" numeric,
    "template" boolean,
    "template_name" "text",
    "tabbed_form" boolean,
    "no_of_tabs" "text",
    "tab_name" "text",
    "tab_number" "text",
    "tab_order" "text",
    "tab_field_order" "jsonb",
    "page_name" "text",
    "menu_title" "text",
    "form" boolean,
    "form_name" "text",
    "form_url" "text",
    "form_short_url" "text",
    "form_iframe_code" "text",
    "chat_form" boolean,
    "chat_form_name" "text",
    "chat_form_url" "text",
    "chat_form_short_url" "text",
    "chatform_iframe_code" "text",
    "app_name" "text",
    "app_code" "text",
    "database_name" "text",
    "data_table_name" "text",
    "data_api_name" "text",
    "data_api_url" "text",
    "data_api_key" "text",
    "content" "text",
    "content_json" "jsonb",
    "content_html" "text",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_no_one" numeric,
    "custom_no_two" numeric,
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "plan_id" "text",
    "plan_name" "text",
    "plan_code" "text",
    "plan_phase_id" "text",
    "task_id" "text",
    "task_name" "text",
    "task_code" "text",
    "ref_plan_name" "text",
    "ref_phase_name" "text",
    "ref_task_title" "text",
    "ref_task_code" "text",
    "msg_id" "text",
    "msg_code" "text",
    "file_one" "bytea",
    "file_two" "bytea",
    "file_url" "text",
    "file_json" "jsonb",
    "flow_json" "jsonb",
    "progress_json" "jsonb",
    "status_log_json" "jsonb",
    "user_log_json" "jsonb",
    "business_log_json" "jsonb",
    "agent_json" "jsonb",
    "prompt_json" "jsonb",
    "response_json" "jsonb",
    "timeline_json" "jsonb",
    "filter_json" "jsonb",
    "master_json" "jsonb",
    "bom_items_json" "jsonb",
    "department" "text",
    "frame" "text",
    "engine" "text",
    "mission" "text",
    "variant" "text",
    "model" "text",
    "plant" "text",
    "family" "text",
    "type" "text",
    "source" "text",
    "nature" "text",
    "combination" "text",
    "department_json" "jsonb",
    "frame_json" "jsonb",
    "engine_json" "jsonb",
    "mission_json" "jsonb",
    "variant_json" "jsonb",
    "model_json" "jsonb",
    "plant_json" "jsonb",
    "family_json" "jsonb",
    "type_json" "jsonb",
    "source_json" "jsonb",
    "nature_json" "jsonb",
    "combination_json" "jsonb"
);


ALTER TABLE "public"."final_bom" OWNER TO "supabase_admin";


CREATE SEQUENCE IF NOT EXISTS "public"."final_bom_final_bom_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."final_bom_final_bom_id_seq" OWNER TO "supabase_admin";


ALTER SEQUENCE "public"."final_bom_final_bom_id_seq" OWNED BY "public"."final_bom"."final_bom_id";



ALTER TABLE "public"."final_bom" ALTER COLUMN "final_bom_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."final_bom_final_bom_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."final_bom_item" (
    "final_bom_item_id" bigint NOT NULL,
    "final_bom_id" bigint,
    "mydoc_id" bigint,
    "mydoc_list_id" bigint,
    "file_upload_id" bigint,
    "data_upload_id" bigint,
    "status" "text",
    "progress_status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp with time zone,
    "updated_date" timestamp with time zone,
    "data_source_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "product_name" "text",
    "product_ref_name" "text",
    "product_title" "text",
    "product_ref_title" "text",
    "product_code" "text",
    "product_refcode" "text",
    "product_short_description" "text",
    "product_description" "text",
    "product_start_date" timestamp with time zone,
    "product_end_date" timestamp with time zone,
    "product_version_no" "text",
    "product_version_date" timestamp with time zone,
    "product_version_json" "jsonb",
    "product_type" "text",
    "product_group" "text",
    "product_category" "text",
    "product_org_json" "jsonb",
    "product_group_json" "jsonb",
    "product_category_json" "jsonb",
    "recommendation_json" "jsonb",
    "related_json" "jsonb",
    "offers_json" "jsonb",
    "supply_type" "text",
    "supply_group" "text",
    "supply_category" "text",
    "suppliers_json" "jsonb",
    "manage_stock" boolean,
    "control_stock" boolean,
    "manage_expiry_date" boolean,
    "hsn_number" "text",
    "product_number" "text",
    "manage_sku" boolean,
    "manage_serial_number" boolean,
    "prefix_code" "text",
    "suffix_code" "text",
    "code_generation_json" "jsonb",
    "sku_number" "text",
    "ref_product_number" "text",
    "ref_product_code" "text",
    "ref_supply_code" "text",
    "price" numeric,
    "discount_percent" numeric,
    "offer_price" numeric,
    "sale_price" numeric,
    "cogm_price" numeric,
    "cogs_price" numeric,
    "landing_price" numeric,
    "recent_purchase_price" numeric,
    "moving_average_price" numeric,
    "fifo_price" numeric,
    "lifo_price" numeric,
    "list_price" numeric,
    "custom_price_one" numeric,
    "custom_price_two" numeric,
    "qty" numeric,
    "uom" "text",
    "amount" numeric,
    "overrun_percent" numeric,
    "wastage_percent" numeric,
    "bom_product_id" bigint,
    "bom_product_code" "text",
    "bom_product_number" "text",
    "ref_bom_product_code" "text",
    "ref_bom_product_number" "text",
    "bom_product_specification_json" "jsonb",
    "semi_finished_goods" boolean,
    "manufacturing" boolean,
    "bom_type" "text",
    "bom_group" "text",
    "bom_category" "text",
    "bom_name" "text",
    "bom_ref_name" "text",
    "bom_title" "text",
    "bom_ref_title" "text",
    "bom_code" "text",
    "bom_refcode" "text",
    "bom_no" "text",
    "ref_bom_no" "text",
    "bom_item_short_description" "text",
    "bom_item_description" "text",
    "bom_item_start_date" timestamp with time zone,
    "bom_item_end_date" timestamp with time zone,
    "bom_item_plan_cost" numeric,
    "bom_item_actual_cost" numeric,
    "bom_item_workcenter_json" "jsonb",
    "bom_item_mfgflow_json" "jsonb",
    "bom_item_version_no" "text",
    "bom_item_version_date" timestamp with time zone,
    "bom_item_version_json" "jsonb",
    "template" boolean,
    "template_name" "text",
    "tabbed_form" boolean,
    "no_of_tabs" "text",
    "tab_name" "text",
    "tab_number" "text",
    "tab_order" "text",
    "tab_field_order" "jsonb",
    "page_name" "text",
    "menu_title" "text",
    "form" boolean,
    "form_name" "text",
    "form_url" "text",
    "form_short_url" "text",
    "form_iframe_code" "text",
    "chat_form" boolean,
    "chat_form_name" "text",
    "chat_form_url" "text",
    "chat_form_short_url" "text",
    "chatform_iframe_code" "text",
    "app_name" "text",
    "app_code" "text",
    "database_name" "text",
    "data_table_name" "text",
    "data_api_name" "text",
    "data_api_url" "text",
    "data_api_key" "text",
    "content" "text",
    "content_json" "jsonb",
    "content_html" "text",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_no_one" numeric,
    "custom_no_two" numeric,
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "ledgers_json" "jsonb",
    "accounts_json" "jsonb",
    "workcenter_json" "jsonb",
    "mfg_flow_json" "jsonb",
    "quality_json" "jsonb",
    "filter_json" "jsonb",
    "master_json" "jsonb",
    "bom_items_json" "jsonb",
    "department" "text",
    "frame" "text",
    "engine" "text",
    "mission" "text",
    "variant" "text",
    "model" "text",
    "plant" "text",
    "family" "text",
    "type" "text",
    "source" "text",
    "nature" "text",
    "combination" "text",
    "department_json" "jsonb",
    "frame_json" "jsonb",
    "engine_json" "jsonb",
    "mission_json" "jsonb",
    "variant_json" "jsonb",
    "model_json" "jsonb",
    "plant_json" "jsonb",
    "family_json" "jsonb",
    "type_json" "jsonb",
    "source_json" "jsonb",
    "nature_json" "jsonb",
    "combination_json" "jsonb",
    "c_l" "text",
    "c_part_no" "text",
    "c_part_name" "text",
    "c_c" "text",
    "c_d" "text",
    "c_sec" "text",
    "c_item" "text",
    "c_sgr" "text",
    "c_loc1_c" "text",
    "c_loc2_c" "text",
    "c_loc3" "text",
    "c_loc3_c" "text",
    "c_share" "text",
    "c_p_mp_code" "text",
    "c_l1_part_no" "text",
    "c_b" "text",
    "c_sfx" "text",
    "c_line_no" "text",
    "c_e_f" "text",
    "c_inproc" "text",
    "c_gr" "text",
    "c_parent_part_no" "text",
    "c_p_mp_part" "text",
    "c_qty_l1" "text",
    "c_parent_seq" "text",
    "c_seq" "text",
    "c_mp" "text",
    "c_sgrseq" "text",
    "c_op" "text",
    "c_env" "text",
    "c_sn" "text",
    "c_hns" "text",
    "c_hg_target_weight" "text",
    "c_basic_part_no" "text",
    "c_appl_dc_no" "text",
    "c_dwg_issue_dc_no" "text",
    "c_femd" "text",
    "c_sw" "text",
    "c_begin" timestamp with time zone,
    "c_end" timestamp with time zone,
    "c_loc1_a" "text",
    "c_loc2_a" "text",
    "c_loc3_a" "text",
    "c_31xajb6" "text",
    "c_31xajc6" "text",
    "c_31xajd5" "text",
    "c_31xzea1" "text",
    "c_31xzeb2" "text",
    "c_31xzec1" "text",
    "c_31xzed6" "text",
    "c_31xzee7" "text",
    "c_31xzeh5" "text",
    "raw_bom_upload_id" bigint,
    "c_loc1" "text",
    "c_loc2" "text",
    "c_tsvpeh0" "text",
    "c_tsvpek0" "text",
    "c_tsvpel5" "text",
    "c_tsvpen5" "text",
    "c_tsvsna2" "text",
    "c_tsvsnb2" "text",
    "c_tsvsnc5" "text",
    "c_6g0peb4" "text",
    "c_6g0peb8" "text",
    "c_6g0peb9" "text",
    "c_6g0pec1" "text",
    "c_6g0sna3" "text",
    "c_6g0sna4" "text",
    "c_6g0sna8" "text",
    "c_6g2pc00" "text",
    "c_6g2pc10" "text",
    "c_6g2sc20" "text",
    "c_6g8pmp7" "text",
    "c_6g8pmw4" "text",
    "c_6g8smp7" "text",
    "c_plant" "text",
    "c_family" "text",
    "c_type" "text",
    "c_source" "text",
    "c_nature_e_f_mission" "text",
    "c_32naea7" "text",
    "c_32naec4" "text",
    "c_32naec9" "text",
    "c_32naee0" "text",
    "c_32naee5" "text",
    "c_32naef0" "text",
    "c_32nana3" "text",
    "c_32nanb1" "text",
    "c_32nanb6" "text",
    "c_6saaea0" "text",
    "c_6saaea4" "text",
    "c_6saaea5" "text",
    "c_6saaea8" "text",
    "c_6saaeb1" "text",
    "c_6saaeb5" "text",
    "c_6saana1" "text",
    "c_6saana5" "text",
    "c_6scamw7" "text",
    "c_6sdac00" "text",
    "c_6sdac10" "text",
    "c_6sdac20" "text",
    "c_6sdac30" "text",
    "c_combination" "text",
    "c_v_cvt" "text",
    "c_vx_mt" "text",
    "c_vx_cvt" "text",
    "c_zx_mt" "text",
    "c_zx_cvt" "text",
    "c_v_mt" "text",
    "c_tre_mt" "text",
    "c_co_mt" "text",
    "c_co_cvt" "text",
    "c_t11vyf5" "text",
    "c_t11vyg5" "text",
    "c_t11vyh5" "text",
    "c_t11vyt9" "text",
    "c_t11vyu5" "text",
    "c_t11vyu7" "text",
    "c_t11vyv5" "text",
    "c_t11vyv6" "text",
    "c_t11vyv8" "text",
    "c_t11vyw5" "text",
    "c_t11vyw6" "text",
    "c_t11vyw8" "text",
    "c_t11vyx5" "text",
    "c_t11vyx6" "text",
    "c_t11vyx8" "text",
    "c_t11vyy5" "text",
    "c_t11vyz5" "text",
    "c_t11vy05" "text",
    "c_t11vy15" "text",
    "c_62hvyb8" "text",
    "c_62hvyb9" "text",
    "c_62hvye7" "text",
    "c_62hvye8" "text",
    "c_62hvye9" "text",
    "c_62hvyf5" "text",
    "c_62hvyf8" "text",
    "c_62hvyf9" "text",
    "c_62hvyg5" "text",
    "c_62hvyg6" "text",
    "c_62hvyg7" "text",
    "c_62hvyg8" "text",
    "c_62hvyg9" "text",
    "c_62hvyh5" "text",
    "c_62hvyh6" "text",
    "c_t11vxb7" "text",
    "c_t11vxc5" "text",
    "c_t11vxd6" "text",
    "c_62hvxa5" "text",
    "c_62hvxa7" "text",
    "c_62hvxa9" "text",
    "c_63bvcj0" "text",
    "c_63bvcx0" "text",
    "c_63bvc70" "text",
    "c_t11wyf5" "text",
    "c_t11wyg5" "text",
    "c_t11wyh5" "text",
    "c_t11wyp8" "text",
    "c_t11wyp9" "text",
    "c_t11wyq8" "text",
    "c_t11wyq9" "text",
    "c_t11wys8" "text",
    "c_t11wys9" "text",
    "c_t11wyt7" "text",
    "c_t11wyt8" "text",
    "c_t11wyt9" "text",
    "c_t11wyu5" "text",
    "c_t11wyu7" "text",
    "c_t11wyv5" "text",
    "c_t11wyv6" "text",
    "c_t11wyv8" "text",
    "c_t11wyw5" "text",
    "c_t11wyw6" "text",
    "c_t11wyw8" "text",
    "c_t11wyx5" "text",
    "c_t11wyx6" "text",
    "c_t11wyx8" "text",
    "c_62hwyb8" "text",
    "c_62hwyb9" "text",
    "c_62hwye7" "text",
    "c_62hwye8" "text",
    "c_62hwye9" "text",
    "c_62hwyf5" "text",
    "c_62hwyf8" "text",
    "c_62hwyf9" "text",
    "c_62hwyg5" "text",
    "c_62hwyg6" "text",
    "c_62hwyg7" "text",
    "c_63bwcv4" "text",
    "c_63bwcw4" "text",
    "c_63bwc43" "text",
    "c_63bwc53" "text",
    "c_63bwc93" "text",
    "c_t09vee6" "text",
    "c_t09vee7" "text",
    "c_t09vef5" "text",
    "c_t09vef6" "text",
    "c_t09vna9" "text",
    "c_62wvea9" "text",
    "c_62wveb5" "text",
    "c_62wvna7" "text",
    "c_63nven0" "text",
    "c_63nvez0" "text",
    "c_t11vef4" "text",
    "c_t11veg2" "text",
    "c_t11veg9" "text",
    "c_t11vel0" "text",
    "c_t11vem5" "text",
    "c_t11ven0" "text",
    "c_t11ven5" "text",
    "c_t11vnc8" "text",
    "c_t11vnd7" "text",
    "c_t11vnf5" "text",
    "c_62hvec2" "text",
    "c_62hvec3" "text",
    "c_62hvec4" "text",
    "c_62hvec7" "text",
    "c_62hvec8" "text",
    "c_62hvec9" "text",
    "c_62hved0" "text",
    "c_62hvnc7" "text",
    "c_62hvnc8" "text",
    "c_62hvnc9" "text",
    "c_63bvcb0" "text",
    "c_63bvcd0" "text",
    "c_63bvc90" "text",
    "c_63pvmm6" "text",
    "c_sv_mt" "text",
    "c_rs_cvt" "text",
    "c_comfort_cvt" "text",
    "c_eleg_cvt" "text",
    "c_31xzef6" "text",
    "c_31xzeg2" "text",
    "c_31xzej5" "text",
    "c_31xzne9" "text",
    "c_31xznh1" "text",
    "c_6rpzea0" "text",
    "c_6rpzea4" "text",
    "c_6rpzea5" "text",
    "c_6rpzea8" "text",
    "c_6rpzea9" "text",
    "c_6rpzeb0" "text",
    "c_6rpzna4" "text",
    "c_6rpznb5" "text",
    "c_6rrzma2" "text",
    "c_6rszcn1" "text",
    "c_6rszc01" "text",
    "c_31xzjb6" "text",
    "c_31xzjc6" "text",
    "c_31xzjd5" "text",
    "c_31xzje5" "text",
    "c_31xzjf5" "text",
    "c_6rpzja5" "text",
    "c_6rpzja6" "text",
    "c_6rszcj1" "text",
    "c_6rpaja5" "text",
    "c_6rpaja6" "text",
    "c_6rsacj1" "text"
);


ALTER TABLE "public"."final_bom_item" OWNER TO "supabase_admin";


CREATE SEQUENCE IF NOT EXISTS "public"."final_bom_item_final_bom_item_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."final_bom_item_final_bom_item_id_seq" OWNER TO "supabase_admin";


ALTER SEQUENCE "public"."final_bom_item_final_bom_item_id_seq" OWNED BY "public"."final_bom_item"."final_bom_item_id";



ALTER TABLE "public"."final_bom_item" ALTER COLUMN "final_bom_item_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."final_bom_item_final_bom_item_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."final_bom_upload" (
    "final_bom_upload_id" bigint NOT NULL,
    "status" "text",
    "progress_status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "created_date" timestamp with time zone,
    "updated_date" timestamp with time zone,
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "c_l" "text",
    "c_part_no" "text",
    "c_part_name" "text",
    "c_c" "text",
    "c_d" "text",
    "c_sec" "text",
    "c_item" "text",
    "c_sgr" "text",
    "c_type" "text",
    "c_source" "text",
    "c_nature_e_f_mission" "text",
    "c_loc1" "text",
    "c_loc1_c" "text",
    "c_loc2" "text",
    "c_loc2_c" "text",
    "c_loc3" "text",
    "c_loc3_c" "text",
    "c_tsvpeh0" "text",
    "c_tsvpek0" "text",
    "c_tsvpel5" "text",
    "c_tsvpen5" "text",
    "c_tsvsna2" "text",
    "c_tsvsnb2" "text",
    "c_tsvsnc5" "text",
    "c_6g0peb4" "text",
    "c_6g0peb8" "text",
    "c_6g0peb9" "text",
    "c_6g0pec1" "text",
    "c_6g0sna3" "text",
    "c_6g0sna4" "text",
    "c_6g0sna8" "text",
    "c_6g2pc00" "text",
    "c_6g2pc10" "text",
    "c_6g2sc20" "text",
    "c_6g8pmp7" "text",
    "c_6g8pmw4" "text",
    "c_6g8smp7" "text",
    "c_share" "text",
    "c_plant" "text",
    "c_family" "text",
    "c_p_mp_code" "text",
    "c_l1_part_no" "text",
    "c_b" "text",
    "c_sfx" "text",
    "c_line_no" "text",
    "c_e_f" "text",
    "c_inproc" "text",
    "c_gr" "text",
    "c_parent_part_no" "text",
    "c_p_mp_part" "text",
    "c_qty_l1" "text",
    "c_parent_seq" "text",
    "c_seq" "text",
    "c_mp" "text",
    "c_sgrseq" "text",
    "c_op" "text",
    "c_env" "text",
    "c_sn" "text",
    "c_hns" "text",
    "c_hg_target_weight" "text",
    "c_basic_part_no" "text",
    "c_appl_dc_no" "text",
    "c_dwg_issue_dc_no" "text",
    "c_femd" "text",
    "c_sw" "text",
    "c_begin" "text",
    "c_end" "text",
    "c_combination" "text",
    "c_s_mt" "text",
    "c_vx_mt" "text",
    "c_s_cvt" "text",
    "c_vx_cvt" "text",
    "c_trend_mt" "text",
    "c_comf_mt" "text",
    "c_comf_cvt" "text",
    "c_32naea7" "text",
    "c_32naec4" "text",
    "c_32naec9" "text",
    "c_32naee0" "text",
    "c_32naee5" "text",
    "c_32naef0" "text",
    "c_32nana3" "text",
    "c_32nanb1" "text",
    "c_32nanb6" "text",
    "c_6saaea0" "text",
    "c_6saaea4" "text",
    "c_6saaea5" "text",
    "c_6saaea8" "text",
    "c_6saaeb1" "text",
    "c_6saaeb5" "text",
    "c_6saana1" "text",
    "c_6saana5" "text",
    "c_6scamw7" "text",
    "c_6sdac00" "text",
    "c_6sdac10" "text",
    "c_6sdac20" "text",
    "c_6sdac30" "text",
    "c_v_cvt" "text",
    "c_zx_mt" "text",
    "c_zx_cvt" "text",
    "c_v_mt" "text",
    "c_tre_mt" "text",
    "c_co_mt" "text",
    "c_co_cvt" "text",
    "c_nature_e_frame_mission" "text",
    "c_t11vyf5" "text",
    "c_t11vyg5" "text",
    "c_t11vyh5" "text",
    "c_t11vyt9" "text",
    "c_t11vyu5" "text",
    "c_t11vyu7" "text",
    "c_t11vyv5" "text",
    "c_t11vyv6" "text",
    "c_t11vyv8" "text",
    "c_t11vyw5" "text",
    "c_t11vyw6" "text",
    "c_t11vyw8" "text",
    "c_t11vyx5" "text",
    "c_t11vyx6" "text",
    "c_t11vyx8" "text",
    "c_t11vyy5" "text",
    "c_t11vyz5" "text",
    "c_t11vy05" "text",
    "c_t11vy15" "text",
    "c_62hvyb8" "text",
    "c_62hvyb9" "text",
    "c_62hvye7" "text",
    "c_62hvye8" "text",
    "c_62hvye9" "text",
    "c_62hvyf5" "text",
    "c_62hvyf8" "text",
    "c_62hvyf9" "text",
    "c_62hvyg5" "text",
    "c_62hvyg6" "text",
    "c_62hvyg7" "text",
    "c_62hvyg8" "text",
    "c_62hvyg9" "text",
    "c_62hvyh5" "text",
    "c_62hvyh6" "text",
    "c_loc1_a" "text",
    "c_loc2_a" "text",
    "c_loc3_a" "text",
    "c_lx_a" "text",
    "c_lxsp_a" "text",
    "c_ex_a" "text",
    "c_dx_ge5" "text",
    "c_lx_ge5" "text",
    "c_sp_ge5" "text",
    "c_spo_g" "text",
    "c_dx_u_cvt" "text",
    "c_lx_u_cvt" "text",
    "c_sp_u_cvt" "text",
    "c_spo_u_cvt" "text",
    "c_t11vxb7" "text",
    "c_t11vxc5" "text",
    "c_t11vxd6" "text",
    "c_62hvxa5" "text",
    "c_62hvxa7" "text",
    "c_62hvxa9" "text",
    "c_63bvcj0" "text",
    "c_63bvcx0" "text",
    "c_63bvc70" "text",
    "c_sport" "text",
    "c_ex" "text",
    "c_tour" "text",
    "c_t11wyf5" "text",
    "c_t11wyg5" "text",
    "c_t11wyh5" "text",
    "c_t11wyp8" "text",
    "c_t11wyp9" "text",
    "c_t11wyq8" "text",
    "c_t11wyq9" "text",
    "c_t11wys8" "text",
    "c_t11wys9" "text",
    "c_t11wyt7" "text",
    "c_t11wyt8" "text",
    "c_t11wyt9" "text",
    "c_t11wyu5" "text",
    "c_t11wyu7" "text",
    "c_t11wyv5" "text",
    "c_t11wyv6" "text",
    "c_t11wyv8" "text",
    "c_t11wyw5" "text",
    "c_t11wyw6" "text",
    "c_t11wyw8" "text",
    "c_t11wyx5" "text",
    "c_t11wyx6" "text",
    "c_t11wyx8" "text",
    "c_62hwyb8" "text",
    "c_62hwyb9" "text",
    "c_62hwye7" "text",
    "c_62hwye8" "text",
    "c_62hwye9" "text",
    "c_62hwyf5" "text",
    "c_62hwyf8" "text",
    "c_62hwyf9" "text",
    "c_62hwyg5" "text",
    "c_62hwyg6" "text",
    "c_62hwyg7" "text",
    "c_63bwcv4" "text",
    "c_63bwcw4" "text",
    "c_63bwc43" "text",
    "c_63bwc53" "text",
    "c_63bwc93" "text",
    "c_country" "text",
    "c_hev_vcvt_r" "text",
    "c_hev_zxcvt_r" "text",
    "c_hev_cvt_r" "text",
    "c_t11vef4" "text",
    "c_t11veg2" "text",
    "c_t11veg9" "text",
    "c_t11vel0" "text",
    "c_t11vem5" "text",
    "c_t11ven0" "text",
    "c_t11ven5" "text",
    "c_t11vnc8" "text",
    "c_t11vnd7" "text",
    "c_t11vnf5" "text",
    "c_62hvec2" "text",
    "c_62hvec3" "text",
    "c_62hvec4" "text",
    "c_62hvec7" "text",
    "c_62hvec8" "text",
    "c_62hvec9" "text",
    "c_62hved0" "text",
    "c_62hvnc7" "text",
    "c_62hvnc8" "text",
    "c_62hvnc9" "text",
    "c_63bvcb0" "text",
    "c_63bvcd0" "text",
    "c_63bvc90" "text",
    "c_63pvmm6" "text",
    "c_sv_mt" "text",
    "c_rs_cvt" "text",
    "c_comfort_cvt" "text",
    "c_eleg_cvt" "text",
    "c_31xzea1" "text",
    "c_31xzeb2" "text",
    "c_31xzec1" "text",
    "c_31xzed6" "text",
    "c_31xzee7" "text",
    "c_31xzef6" "text",
    "c_31xzeg2" "text",
    "c_31xzeh5" "text",
    "c_31xzej5" "text",
    "c_31xzne9" "text",
    "c_31xznh1" "text",
    "c_6rpzea0" "text",
    "c_6rpzea4" "text",
    "c_6rpzea5" "text",
    "c_6rpzea8" "text",
    "c_6rpzea9" "text",
    "c_6rpzeb0" "text",
    "c_6rpzna4" "text",
    "c_6rpznb5" "text",
    "c_6rrzma2" "text",
    "c_6rszcn1" "text",
    "c_6rszc01" "text",
    "c_vmt_r" "text",
    "c_vxmt_r" "text",
    "c_zxmt_r" "text",
    "c_vcvt_r" "text",
    "c_vxcvt_r" "text",
    "c_zxcvt_r" "text",
    "c_svmt_r" "text",
    "c_zx_dt_cvt_r" "text",
    "c_zxcvt_r_b" "text",
    "c_eg_cvt_r" "text",
    "c_cm_mt_r" "text",
    "c_31xzjb6" "text",
    "c_31xzjc6" "text",
    "c_31xzjd5" "text",
    "c_31xzje5" "text",
    "c_31xzjf5" "text",
    "c_6rpzja5" "text",
    "c_6rpzja6" "text",
    "c_6rszcj1" "text",
    "c_x_cvt" "text",
    "c_z_cvt" "text",
    "c_z_plus_cvt" "text",
    "c_z_bs_cvt" "text",
    "c_z_plus_bs_cvt" "text",
    "c_z_plus_br_cvt" "text",
    "c_31xajb6" "text",
    "c_31xajc6" "text",
    "c_31xajd5" "text",
    "c_6rpaja5" "text",
    "c_6rpaja6" "text",
    "c_6rsacj1" "text"
);


ALTER TABLE "public"."final_bom_upload" OWNER TO "supabase_admin";


CREATE SEQUENCE IF NOT EXISTS "public"."final_bom_upload_final_bom_upload_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."final_bom_upload_final_bom_upload_id_seq" OWNER TO "supabase_admin";


ALTER SEQUENCE "public"."final_bom_upload_final_bom_upload_id_seq" OWNED BY "public"."final_bom_upload"."final_bom_upload_id";



ALTER TABLE "public"."final_bom_upload" ALTER COLUMN "final_bom_upload_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."final_bom_upload_final_bom_upload_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."group" (
    "group_id" bigint NOT NULL,
    "status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp with time zone DEFAULT "now"(),
    "updated_date" timestamp with time zone DEFAULT "now"(),
    "data_source_name" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "group_type" "text",
    "group_title" "text",
    "group_description" "text",
    "group_remark" "text",
    "group_alias" "text",
    "custom_text_one" "text",
    "custom_no_one" numeric,
    "custom_no_two" numeric
);


ALTER TABLE "public"."group" OWNER TO "supabase_admin";


ALTER TABLE "public"."group" ALTER COLUMN "group_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."group_group_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."month_stock_upload" (
    "month_stock_id" bigint NOT NULL,
    "mydoc_id" integer,
    "mydoc_no" integer,
    "mydoc_list_id" integer,
    "mydoc_list_no" integer,
    "file_upload_id" integer,
    "file_upload_no" integer,
    "data_upload_id" integer,
    "data_upload_no" integer,
    "status" "text",
    "process_status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp with time zone,
    "updated_date" timestamp with time zone,
    "data_source_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "inventory_movement_group" "text",
    "inventory_movement_category" "text",
    "voudher_type" "text",
    "voucher_group" "text",
    "voucher_category" "text",
    "month_stock_name" "text",
    "month_stockref_name" "text",
    "month_stock_title" "text",
    "month_stock_ref_title" "text",
    "month_stock_code" "text",
    "month_stock_refcode" "text",
    "month_stock_short_description" "text",
    "month_stock_description" "text",
    "ledger_name" "text",
    "ledger_code" "text",
    "ledger_number" "text",
    "ref_ledger_code" "text",
    "ref_ledger_number" "text",
    "month_stock_start_date" "date",
    "month_stock_end_date" "date",
    "month_stock_month" "text",
    "month_stock_year" "text",
    "month_fy_period" "text",
    "month_fy_year" "text",
    "month_stock_publish_status" "text",
    "month_stock_publish_date" "date",
    "month_stock_publish_url" "text",
    "month_stock_visits" "text",
    "month_stock_submissions" "text",
    "month_stock_shareurl" "text",
    "month_stock_shorturl" "text",
    "month_stock_addon_coloumn_json" "jsonb",
    "month_stock_entries_table" "text",
    "month_stock_entries_table_api" "text",
    "month_stock_entries_api" "text",
    "month_stock_fields_json" "jsonb",
    "month_stock_fields_script" "jsonb",
    "month_stock_version_no" "text",
    "month_stock_version_date" timestamp with time zone,
    "model" "text",
    "variant" "text",
    "frame" "text",
    "engine" "text",
    "mission" "text",
    "product_id" integer,
    "product_no" "text",
    "product_name" "text",
    "product_ref_name" "text",
    "product_title" "text",
    "product_ref_title" "text",
    "product_ref_no" "text",
    "product_code" "text",
    "product_refcode" "text",
    "product_short_description" "text",
    "product_description" "text",
    "product_start_date" "date",
    "product_end_date" "date",
    "product_type" "text",
    "product_group" "text",
    "product_category" "text",
    "product_org_json" "jsonb",
    "recommendation_json" "jsonb",
    "related_json" "jsonb",
    "offers_json" "jsonb",
    "uom" "text",
    "uom_conversion_json" "text",
    "supply_type" "text",
    "supply_group" "text",
    "supply_category" "text",
    "source_type" "text",
    "source_group" "text",
    "source_category" "text",
    "manage_stock" "text",
    "control_stock" "text",
    "manage_expiry_date" "date",
    "hsn_number" "text",
    "product_number" "text",
    "manage_sku" "text",
    "manage_serial_number" "text",
    "prefix_code" "text",
    "suffix_code" "text",
    "code_generation_json" "jsonb",
    "sku_number" "text",
    "ref_product_number" "text",
    "ref_product_code" "text",
    "ref_supply_code" "text",
    "price" integer,
    "discount_percent" integer,
    "offer_price" integer,
    "sale_price" integer,
    "cogm_price" integer,
    "cogs_price" integer,
    "landing_price" integer,
    "recent_purchase_price" integer,
    "moving_average_price" integer,
    "fifo_price" integer,
    "lifo_price" integer,
    "list_price" integer,
    "custom_price_one" integer,
    "custom_price_two" integer,
    "price_timeline_json" integer,
    "parts_list_json" "jsonb",
    "parts_sub_json" "jsonb",
    "tax_structure_json" "jsonb",
    "product_image" "text",
    "product_image_link" "text",
    "product_small_image" "text",
    "product_small_image_link" "text",
    "bar_code_image" "text",
    "bar_code_image_link" "text",
    "incoming_qc_required" "text",
    "outgoing__qc_required" "text",
    "product_size_json" "jsonb",
    "product_variant_json" "jsonb",
    "product_packing_json" "jsonb",
    "product_shipping_json" "jsonb",
    "minimum_stock_level" integer,
    "maximum_stock_level" integer,
    "reorder_stock_level" integer,
    "openining_stock" integer,
    "stock_in" integer,
    "stock_out" integer,
    "stock_reserved" integer,
    "stock_in_store" integer,
    "stock_available" integer,
    "re_order_alert" integer,
    "from_ledger_name" "text",
    "from_ledger_code" "text",
    "from_ledger_number" "text",
    "part_no" "text",
    "part_clr" "text",
    "inv_loc" "text",
    "inv_category" "text",
    "supplier" "text",
    "value" "text",
    "material" "text",
    "opening_stock" "text",
    "total_receipt_qty" integer,
    "total_issue_qty" integer,
    "closing_stock" integer,
    "rejection" integer,
    "custom_bun" "text",
    "delivered" integer,
    "opening_value" integer,
    "total_receipt_value" integer,
    "total_issue_value" integer,
    "closing_value" integer,
    "currency" "text",
    "ref_currency" "text",
    "from_currency" "text",
    "to_currency" "text",
    "qty" integer,
    "amount" integer,
    "ref_price" integer,
    "ref_qty" integer,
    "ref_amount" integer,
    "tax_percent" integer,
    "tax" integer,
    "tax_amount" integer,
    "bill_qty" integer,
    "stock_in_qty" integer,
    "stock_out_qty" integer,
    "opening_qty" integer,
    "recevied_qty" integer,
    "reject_qty" integer,
    "issue_qty" integer,
    "closing_qty" integer,
    "custom_one_qty" integer,
    "custom_two_qty" integer,
    "custom_three_qty" integer,
    "debit" integer,
    "credit" integer,
    "ref_debit" integer,
    "ref_credit" integer,
    "narration" integer,
    "ref_narration" integer,
    "cost_center" "text",
    "profit_center" "text",
    "ref_ledger_trans_no" "text",
    "ref_trans_date" "date",
    "ref_plant" "text",
    "ref_vendor" "text",
    "partner_name" "text",
    "partner_ledger_name" "text",
    "partner_ledger_no" "text",
    "template" boolean,
    "template_name" "text",
    "tabbed_form" boolean,
    "no_of_tabs" "text",
    "tab_name" "text",
    "tab_number" "text",
    "tab_order" "text",
    "tab_field_order" "jsonb",
    "page_name" "text",
    "menu_title" "text",
    "form" boolean,
    "form_name" "text",
    "form_url" "text",
    "form_short_url" "text",
    "form_iframe_code" "text",
    "chat_form" boolean,
    "chat_form_name" "text",
    "chat_form_url" "text",
    "chat_form_short_url" "text",
    "chatform_iframe_code" "text",
    "app_name" "text",
    "app_code" "text",
    "database_name" "text",
    "data_table_name" "text",
    "data_api_name" "text",
    "data_api_url" "text",
    "data_api_key" "text",
    "content" "text",
    "content_json" "jsonb",
    "content_html" "text",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_no_one" numeric,
    "custom_no_two" numeric,
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "plan_id" "text",
    "plan_name" "text",
    "plan_code" "text",
    "plan_phase_id" "text",
    "task_id" "text",
    "task_name" "text",
    "task_code" "text",
    "ref_plan_name" "text",
    "ref_phase_name" "text",
    "ref_task_title" "text",
    "ref_task_code" "text",
    "msg_id" "text",
    "msg_code" "text",
    "file_one" "bytea",
    "file_two" "bytea",
    "file_url" "text",
    "file_json" "jsonb",
    "flow_json" "jsonb",
    "progress_json" "jsonb",
    "status_log_json" "jsonb",
    "user_log_json" "jsonb",
    "business_log_json" "jsonb",
    "agent_json" "jsonb",
    "prompt_json" "jsonb",
    "response_json" "jsonb",
    "timeline_json" "jsonb",
    "ledger_json" "jsonb",
    "ledger_posting_json" "jsonb",
    "financial_year_json" "jsonb",
    "datasource_ref_json" "jsonb",
    "process_logs_json" "jsonb",
    "plant_json" "jsonb",
    "tax_json" "jsonb",
    "landing_cost_json" "jsonb",
    "data_upload_uuid" "uuid" DEFAULT "gen_random_uuid"(),
    "consumption_qty" numeric,
    "consumption_value" numeric,
    "reject_value" numeric,
    "received_value" numeric
);


ALTER TABLE "public"."month_stock_upload" OWNER TO "supabase_admin";


ALTER TABLE "public"."month_stock_upload" ALTER COLUMN "month_stock_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."month_stock_upload_month_stock_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."mydoc_content" (
    "mydoc_content_id" bigint NOT NULL,
    "mydoc_list_id" bigint,
    "doc_name" "text",
    "template_name" "text",
    "component_type" "text",
    "mydoc_field_id" bigint,
    "field_name" "text",
    "field_label" "text",
    "field_order" numeric,
    "version_no" numeric,
    "content" "text",
    "field_content" "text",
    "field_json" "jsonb",
    "field_html" "text",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_text_three" "text",
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "custom_no_one" numeric,
    "custom_no_two" numeric,
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text"
);


ALTER TABLE "public"."mydoc_content" OWNER TO "supabase_admin";


ALTER TABLE "public"."mydoc_content" ALTER COLUMN "mydoc_content_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."mydoc_content_mydoc_content_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."mydoc_fields" (
    "mydoc_field_id" bigint NOT NULL,
    "mydoc_id" bigint,
    "doc_name" "text",
    "template_name" "text",
    "component_type" "text",
    "field_name" "text",
    "field_label" "text",
    "field_order" "text",
    "version_no" "text",
    "content" "text",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_text_three" "text",
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "custom_no_one" numeric,
    "custom_no_two" numeric,
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text"
);


ALTER TABLE "public"."mydoc_fields" OWNER TO "supabase_admin";


ALTER TABLE "public"."mydoc_fields" ALTER COLUMN "mydoc_field_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."mydoc_fields_mydoc_field_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."mydoc_list" (
    "mydoc_list_id" bigint NOT NULL,
    "mydoc_id" bigint,
    "status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp with time zone,
    "updated_date" timestamp with time zone,
    "data_source_name" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "doc_name" "text",
    "doc_code" "text",
    "doc_description" "text",
    "tabbed_form" boolean,
    "template" boolean,
    "template_name" "text",
    "chat_form" boolean,
    "chatform_name" "text",
    "chatform_url" "text",
    "app_name" "text",
    "app_code" "text",
    "page_name" "text",
    "database_name" "text",
    "data_table_name" "text",
    "data_api_name" "text",
    "data_api_url" "text",
    "data_api_key" "text",
    "doc_entries_table" "text",
    "doc_entries_table_api" "text",
    "doc_entries_api" "text",
    "publish_status" "text",
    "doc_publish_date" timestamp with time zone,
    "doc_publish_url" "text",
    "content" "text",
    "content_html" "text",
    "content_json" "jsonb",
    "doc_json" "jsonb",
    "visits" bigint,
    "submissions" bigint,
    "shareurl" "text",
    "shorturl" "text",
    "chatformshorturl" "text",
    "form_iframe_code" "text",
    "chatform_iframe_code" "text",
    "no_of_tabs" "text",
    "tab_name" "text",
    "tab_number" bigint,
    "tab_order" bigint,
    "tab_field_order" "jsonb",
    "doc_fields_json" "jsonb",
    "doc_fields_script" "jsonb",
    "version_no" bigint,
    "version_date" timestamp with time zone,
    "mydoc_api" "text",
    "custom_one" "text",
    "custom_two" "text",
    "custom_no_one" bigint,
    "custom_no_two" bigint,
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "doc_no" "text",
    "ref_doc" "text",
    "ref_doc_no" "text",
    "doc_group" "text",
    "plan_id" "text",
    "plan_name" "text",
    "plan_phase_id" "text",
    "task_id" "text",
    "task_name" "text",
    "ref_plan_name" "text",
    "ref_phase_name" "text",
    "ref_task_title" "text",
    "msg_id" "text",
    "doc_file_one" "bytea",
    "doc_file_two" "text",
    "doc_file_url" "text",
    "doc_file_json" "jsonb",
    "flow_json" "jsonb",
    "progress_json" "jsonb",
    "status_log_json" "jsonb",
    "user_log_json" "jsonb",
    "business_log_json" "jsonb",
    "agent_json" "jsonb",
    "prompt_json" "jsonb",
    "response_json" "jsonb",
    "timeline_json" "jsonb",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text"
);


ALTER TABLE "public"."mydoc_list" OWNER TO "supabase_admin";


ALTER TABLE "public"."mydoc_list" ALTER COLUMN "mydoc_list_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."mydoc_list_mydoc_list_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."mydocs" (
    "mydoc_id" bigint NOT NULL,
    "status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp without time zone DEFAULT "now"(),
    "updated_date" timestamp without time zone,
    "data_source_name" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" integer,
    "for_user_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "doc_name" "text",
    "doc_code" "text",
    "doc_description" "text",
    "tabbed_form" boolean,
    "template" boolean,
    "template_name" "text",
    "chat_form" boolean,
    "chatform_name" "text",
    "chatform_url" "text",
    "app_name" "text",
    "app_code" "text",
    "page_name" "text",
    "database_name" "text",
    "data_table_name" "text",
    "data_api_name" "text",
    "data_api_url" "text",
    "data_api_key" "text",
    "doc_entries_table" "text",
    "doc_entries_table_api" "text",
    "doc_entries_api" "text",
    "publish_status" "text",
    "doc_publish_date" timestamp without time zone,
    "doc_publish_url" "text",
    "content" "text",
    "content_json" "json",
    "doc_json" "json",
    "visits" integer,
    "submissions" integer,
    "shareurl" "text",
    "shorturl" "text",
    "chatformshorturl" "text",
    "form_iframe_code" "text",
    "chatform_iframe_code" "text",
    "no_of_tabs" "text",
    "tab_name" "text",
    "tab_number" integer,
    "tab_order" integer,
    "tab_field_order" "json",
    "doc_fields_json" "json",
    "doc_fields_script" "json",
    "version_no" integer,
    "version_date" timestamp without time zone,
    "custom_one" "text",
    "custom_two" "text",
    "custom_no_one" integer,
    "custom_no_two" integer,
    "mydoc_api" "text",
    "doc_file_one" "bytea",
    "doc_file_two" "text",
    "doc_file_url" "text",
    "doc_file_json" "json",
    "flow_json" "jsonb",
    "progress_json" "jsonb",
    "status_log_json" "jsonb",
    "user_log_json" "jsonb",
    "business_log_json" "jsonb",
    "agent_json" "jsonb",
    "prompt_json" "jsonb",
    "response_json" "jsonb",
    "timeline_json" "jsonb",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text"
);


ALTER TABLE "public"."mydocs" OWNER TO "supabase_admin";


ALTER TABLE "public"."mydocs" ALTER COLUMN "mydoc_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."mydocs_mydoc_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."page_list" (
    "pagelist_id" bigint NOT NULL,
    "status" "text",
    "page_name" "text",
    "page_url" "text",
    "page_link" "text",
    "app_name" "text",
    "role_json" "json",
    "customtext_one" "text",
    "customtext_two" "text",
    "customtext_three" "text",
    "customjson_one" "text",
    "customjson_two" "text",
    "customjson_three" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "created_date" timestamp with time zone DEFAULT "now"(),
    "updated_date" timestamp with time zone,
    "flow_json" "jsonb",
    "progress_json" "jsonb",
    "status_log_json" "jsonb",
    "user_log_json" "jsonb",
    "business_log_json" "jsonb",
    "agent_json" "jsonb",
    "prompt_json" "jsonb",
    "response_json" "jsonb",
    "timeline_json" "jsonb",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text"
);


ALTER TABLE "public"."page_list" OWNER TO "supabase_admin";


ALTER TABLE "public"."page_list" ALTER COLUMN "pagelist_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."page_list_pagelist_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."product" (
    "product_id" bigint NOT NULL,
    "mydoc_id" bigint,
    "mydoc_list_id" bigint,
    "file_upload_id" bigint,
    "data_upload_id" bigint,
    "status" "text",
    "progress_status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "ref_user_id" "text",
    "ref_user_name" "text",
    "created_date" timestamp with time zone,
    "updated_date" timestamp with time zone,
    "data_source_name" "text",
    "business_code" "text",
    "business_name" "text",
    "business_number" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "product_name" "text",
    "product_ref_name" "text",
    "product_title" "text",
    "product_ref_title" "text",
    "product_code" "text",
    "product_refcode" "text",
    "product_short_description" "text",
    "product_description" "text",
    "product_start_date" timestamp with time zone,
    "product_end_date" timestamp with time zone,
    "product_publish_status" "text",
    "product_publish_date" timestamp with time zone,
    "product_publish_url" "text",
    "product_visits" "text",
    "product_submissions" "text",
    "product_shareurl" "text",
    "product_shorturl" "text",
    "product_addon_column_json" "jsonb",
    "product_addon_data_json" "jsonb",
    "product_entries_product" "text",
    "product_api" "jsonb",
    "product_entries_api" "jsonb",
    "product_content_api" "jsonb",
    "product_fields_json" "jsonb",
    "product_fields_script" "jsonb",
    "product_version_no" "text",
    "product_version_date" timestamp with time zone,
    "product_version_json" "jsonb",
    "product_type" "text",
    "product_group" "text",
    "product_category" "text",
    "product_org_json" "jsonb",
    "recommendation_json" "jsonb",
    "related_json" "jsonb",
    "offers_json" "jsonb",
    "uom" "text",
    "uom_conversion_json" "json",
    "supply_type" "text",
    "supply_group" "text",
    "supply_category" "text",
    "manage_stock" boolean,
    "control_stock" boolean,
    "manage_expiry_date" boolean,
    "hsn_number" "text",
    "product_number" "text",
    "manage_sku" boolean,
    "manage_serial_number" boolean,
    "prefix_code" "text",
    "suffix_code" "text",
    "code_generation_json" "jsonb",
    "sku_number" "text",
    "ref_product_number" "text",
    "ref_product_code" "text",
    "ref_supply_code" "text",
    "price" numeric,
    "discount_percent" numeric,
    "offer_price" numeric,
    "sale_price" numeric,
    "cogm_price" numeric,
    "cogs_price" numeric,
    "landing_price" numeric,
    "recent_purchase_price" numeric,
    "moving_average_price" numeric,
    "fifo_price" numeric,
    "lifo_price" numeric,
    "list_price" numeric,
    "custom_price_one" numeric,
    "custom_price_two" numeric,
    "price_timeline_json" "jsonb",
    "parts_list_json" "jsonb",
    "parts_sub_json" "jsonb",
    "tax_structure_json" "jsonb",
    "product_image" "bytea",
    "product_image_link" "text",
    "product_small_image" "bytea",
    "product_small_image_link" "text",
    "bar_code_image" "bytea",
    "bar_code_image_link" "text",
    "incoming_qc_required" boolean,
    "outgoing__qc_required" boolean,
    "product_size_json" "json",
    "product_variant_json" "json",
    "product_packing_json" "json",
    "product_shipping_json" "json",
    "minimum_stock_level" numeric,
    "maximum_stock_level" numeric,
    "reorder_stock_level" numeric,
    "openining_stock" numeric,
    "stock_in" numeric,
    "stock_out" numeric,
    "stock_reserved" numeric,
    "stock_in_store" numeric,
    "stock_available" numeric,
    "re_order_alert" boolean,
    "template" boolean,
    "template_name" "text",
    "tabbed_form" boolean,
    "no_of_tabs" "text",
    "tab_name" "text",
    "tab_number" "text",
    "tab_order" "text",
    "tab_field_order" "jsonb",
    "page_name" "text",
    "menu_title" "text",
    "form" boolean,
    "form_name" "text",
    "form_url" "text",
    "form_short_url" "text",
    "form_iframe_code" "text",
    "chat_form" boolean,
    "chat_form_name" "text",
    "chat_form_url" "text",
    "chat_form_short_url" "text",
    "chatform_iframe_code" "text",
    "app_name" "text",
    "app_code" "text",
    "database_name" "text",
    "data_table_name" "text",
    "data_api_name" "text",
    "data_api_url" "text",
    "data_api_key" "text",
    "content" "text",
    "content_json" "jsonb",
    "content_html" "text",
    "custom_text_one" "text",
    "custom_text_two" "text",
    "custom_no_one" numeric,
    "custom_no_two" numeric,
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "plan_id" "text",
    "plan_name" "text",
    "plan_code" "text",
    "plan_phase_id" "text",
    "task_id" "text",
    "task_name" "text",
    "task_code" "text",
    "ref_plan_name" "text",
    "ref_phase_name" "text",
    "ref_task_title" "text",
    "ref_task_code" "text",
    "msg_id" "text",
    "msg_code" "text",
    "file_one" "bytea",
    "file_two" "bytea",
    "file_url" "text",
    "file_json" "jsonb",
    "ledgers_json" "jsonb",
    "accounts_json" "jsonb",
    "workcenter_json" "jsonb",
    "mfg_flow_json" "jsonb",
    "quality_json" "jsonb",
    "flow_json" "jsonb",
    "costcenter_json" "jsonb",
    "progress_json" "jsonb",
    "status_log_json" "jsonb",
    "user_log_json" "jsonb",
    "business_log_json" "jsonb",
    "agent_json" "jsonb",
    "prompt_json" "jsonb",
    "response_json" "jsonb",
    "timeline_json" "jsonb"
);


ALTER TABLE "public"."product" OWNER TO "supabase_admin";


CREATE SEQUENCE IF NOT EXISTS "public"."product_product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."product_product_id_seq" OWNER TO "supabase_admin";


ALTER SEQUENCE "public"."product_product_id_seq" OWNED BY "public"."product"."product_id";



ALTER TABLE "public"."product" ALTER COLUMN "product_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_product_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."raw_bom_upload" (
    "raw_bom_upload_id" bigint NOT NULL,
    "status" "text",
    "progress_status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "created_date" timestamp with time zone,
    "updated_date" timestamp with time zone,
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "c_l" "text",
    "c_part_no" "text",
    "c_part_name" "text",
    "c_c" "text",
    "c_d" "text",
    "c_sec" "text",
    "c_item" "text",
    "c_sgr" "text",
    "c_loc1" "text",
    "c_loc1_c" "text",
    "c_loc2" "text",
    "c_loc2_c" "text",
    "c_loc3" "text",
    "c_loc3_c" "text",
    "c_tsvpeh0" "text",
    "c_tsvpek0" "text",
    "c_tsvpel5" "text",
    "c_tsvpen5" "text",
    "c_tsvsna2" "text",
    "c_tsvsnb2" "text",
    "c_tsvsnc5" "text",
    "c_6g0peb4" "text",
    "c_6g0peb8" "text",
    "c_6g0peb9" "text",
    "c_6g0pec1" "text",
    "c_6g0sna3" "text",
    "c_6g0sna4" "text",
    "c_6g0sna8" "text",
    "c_6g2pc00" "text",
    "c_6g2pc10" "text",
    "c_6g2sc20" "text",
    "c_6g8pmp7" "text",
    "c_6g8pmw4" "text",
    "c_6g8smp7" "text",
    "c_share" "text",
    "c_plant" "text",
    "c_family" "text",
    "c_p_mp_code" "text",
    "c_l1_part_no" "text",
    "c_b" "text",
    "c_sfx" "text",
    "c_line_no" "text",
    "c_e_f" "text",
    "c_inproc" "text",
    "c_gr" "text",
    "c_parent_part_no" "text",
    "c_p_mp_part" "text",
    "c_qty_l1" "text",
    "c_parent_seq" "text",
    "c_seq" "text",
    "c_mp" "text",
    "c_sgrseq" "text",
    "c_op" "text",
    "c_env" "text",
    "c_sn" "text",
    "c_hns" "text",
    "c_hg_target_weight" "text",
    "c_basic_part_no" "text",
    "c_appl_dc_no" "text",
    "c_dwg_issue_dc_no" "text",
    "c_femd" "text",
    "c_sw" "text",
    "c_begin" "text",
    "c_end" "text",
    "c_type" "text",
    "c_source" "text",
    "c_nature_e_f_mission" "text",
    "c_32naea7" "text",
    "c_32naec4" "text",
    "c_32naec9" "text",
    "c_32naee0" "text",
    "c_32naee5" "text",
    "c_32naef0" "text",
    "c_32nana3" "text",
    "c_32nanb1" "text",
    "c_32nanb6" "text",
    "c_6saaea0" "text",
    "c_6saaea4" "text",
    "c_6saaea5" "text",
    "c_6saaea8" "text",
    "c_6saaeb1" "text",
    "c_6saaeb5" "text",
    "c_6saana1" "text",
    "c_6saana5" "text",
    "c_6scamw7" "text",
    "c_6sdac00" "text",
    "c_6sdac10" "text",
    "c_6sdac20" "text",
    "c_6sdac30" "text",
    "c_combination" "text",
    "c_v_cvt" "text",
    "c_vx_mt" "text",
    "c_vx_cvt" "text",
    "c_zx_mt" "text",
    "c_zx_cvt" "text",
    "c_v_mt" "text",
    "c_tre_mt" "text",
    "c_co_mt" "text",
    "c_co_cvt" "text",
    "c_t11vyf5" "text",
    "c_t11vyg5" "text",
    "c_t11vyh5" "text",
    "c_t11vyt9" "text",
    "c_t11vyu5" "text",
    "c_t11vyu7" "text",
    "c_t11vyv5" "text",
    "c_t11vyv6" "text",
    "c_t11vyv8" "text",
    "c_t11vyw5" "text",
    "c_t11vyw6" "text",
    "c_t11vyw8" "text",
    "c_t11vyx5" "text",
    "c_t11vyx6" "text",
    "c_t11vyx8" "text",
    "c_t11vyy5" "text",
    "c_t11vyz5" "text",
    "c_t11vy05" "text",
    "c_t11vy15" "text",
    "c_62hvyb8" "text",
    "c_62hvyb9" "text",
    "c_62hvye7" "text",
    "c_62hvye8" "text",
    "c_62hvye9" "text",
    "c_62hvyf5" "text",
    "c_62hvyf8" "text",
    "c_62hvyf9" "text",
    "c_62hvyg5" "text",
    "c_62hvyg6" "text",
    "c_62hvyg7" "text",
    "c_62hvyg8" "text",
    "c_62hvyg9" "text",
    "c_62hvyh5" "text",
    "c_62hvyh6" "text",
    "c_loc1_a" "text",
    "c_loc2_a" "text",
    "c_loc3_a" "text",
    "c_t11vxb7" "text",
    "c_t11vxc5" "text",
    "c_t11vxd6" "text",
    "c_62hvxa5" "text",
    "c_62hvxa7" "text",
    "c_62hvxa9" "text",
    "c_63bvcj0" "text",
    "c_63bvcx0" "text",
    "c_63bvc70" "text",
    "c_t11wyf5" "text",
    "c_t11wyg5" "text",
    "c_t11wyh5" "text",
    "c_t11wyp8" "text",
    "c_t11wyp9" "text",
    "c_t11wyq8" "text",
    "c_t11wyq9" "text",
    "c_t11wys8" "text",
    "c_t11wys9" "text",
    "c_t11wyt7" "text",
    "c_t11wyt8" "text",
    "c_t11wyt9" "text",
    "c_t11wyu5" "text",
    "c_t11wyu7" "text",
    "c_t11wyv5" "text",
    "c_t11wyv6" "text",
    "c_t11wyv8" "text",
    "c_t11wyw5" "text",
    "c_t11wyw6" "text",
    "c_t11wyw8" "text",
    "c_t11wyx5" "text",
    "c_t11wyx6" "text",
    "c_t11wyx8" "text",
    "c_62hwyb8" "text",
    "c_62hwyb9" "text",
    "c_62hwye7" "text",
    "c_62hwye8" "text",
    "c_62hwye9" "text",
    "c_62hwyf5" "text",
    "c_62hwyf8" "text",
    "c_62hwyf9" "text",
    "c_62hwyg5" "text",
    "c_62hwyg6" "text",
    "c_62hwyg7" "text",
    "c_63bwcv4" "text",
    "c_63bwcw4" "text",
    "c_63bwc43" "text",
    "c_63bwc53" "text",
    "c_63bwc93" "text",
    "c_t09vee6" "text",
    "c_t09vee7" "text",
    "c_t09vef5" "text",
    "c_t09vef6" "text",
    "c_t09vna9" "text",
    "c_62wvea9" "text",
    "c_62wveb5" "text",
    "c_62wvna7" "text",
    "c_63nven0" "text",
    "c_63nvez0" "text",
    "c_t11vef4" "text",
    "c_t11veg2" "text",
    "c_t11veg9" "text",
    "c_t11vel0" "text",
    "c_t11vem5" "text",
    "c_t11ven0" "text",
    "c_t11ven5" "text",
    "c_t11vnc8" "text",
    "c_t11vnd7" "text",
    "c_t11vnf5" "text",
    "c_62hvec2" "text",
    "c_62hvec3" "text",
    "c_62hvec4" "text",
    "c_62hvec7" "text",
    "c_62hvec8" "text",
    "c_62hvec9" "text",
    "c_62hved0" "text",
    "c_62hvnc7" "text",
    "c_62hvnc8" "text",
    "c_62hvnc9" "text",
    "c_63bvcb0" "text",
    "c_63bvcd0" "text",
    "c_63bvc90" "text",
    "c_63pvmm6" "text",
    "c_sv_mt" "text",
    "c_rs_cvt" "text",
    "c_comfort_cvt" "text",
    "c_eleg_cvt" "text",
    "c_31xzea1" "text",
    "c_31xzeb2" "text",
    "c_31xzec1" "text",
    "c_31xzed6" "text",
    "c_31xzee7" "text",
    "c_31xzef6" "text",
    "c_31xzeg2" "text",
    "c_31xzeh5" "text",
    "c_31xzej5" "text",
    "c_31xzne9" "text",
    "c_31xznh1" "text",
    "c_6rpzea0" "text",
    "c_6rpzea4" "text",
    "c_6rpzea5" "text",
    "c_6rpzea8" "text",
    "c_6rpzea9" "text",
    "c_6rpzeb0" "text",
    "c_6rpzna4" "text",
    "c_6rpznb5" "text",
    "c_6rrzma2" "text",
    "c_6rszcn1" "text",
    "c_6rszc01" "text",
    "c_31xzjb6" "text",
    "c_31xzjc6" "text",
    "c_31xzjd5" "text",
    "c_31xzje5" "text",
    "c_31xzjf5" "text",
    "c_6rpzja5" "text",
    "c_6rpzja6" "text",
    "c_6rszcj1" "text",
    "c_31xajb6" "text",
    "c_31xajc6" "text",
    "c_31xajd5" "text",
    "c_6rpaja5" "text",
    "c_6rpaja6" "text",
    "c_6rsacj1" "text",
    "data_upload_id" bigint,
    "data_upload_uuid" "uuid" DEFAULT "gen_random_uuid"()
);


ALTER TABLE "public"."raw_bom_upload" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."raw_bom_upload_3tx_rh_id" (
    "raw_bom_upload_3tx_rh_id" integer NOT NULL,
    "status" "text",
    "progress_status" "text",
    "created_user_id" bigint,
    "created_user_name" "text",
    "created_date" timestamp with time zone DEFAULT "now"(),
    "updated_date" timestamp with time zone DEFAULT "now"(),
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "for_user_id" "text",
    "for_user_name" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text",
    "c_l" "text",
    "c_part_no" "text",
    "c_part_name" "text",
    "c_c" "text",
    "c_d" "text",
    "c_sec" "text",
    "c_item" "text",
    "c_sgr" "text",
    "c_t11vef4" "text",
    "c_t11veg2" "text",
    "c_t11veg9" "text",
    "c_t11vel0" "text",
    "c_t11vem5" "text",
    "c_t11ven0" "text",
    "c_t11ven5" "text",
    "c_t11vnc8" "text",
    "c_t11vnd7" "text",
    "c_t11vnf5" "text",
    "c_62hvec2" "text",
    "c_62hvec3" "text",
    "c_62hvec4" "text",
    "c_62hvec7" "text",
    "c_62hvec8" "text",
    "c_62hvec9" "text",
    "c_62hved0" "text",
    "c_62hvnc7" "text",
    "c_62hvnc8" "text",
    "c_62hvnc9" "text",
    "c_63bvcb0" "text",
    "c_63bvcd0" "text",
    "c_63bvc90" "text",
    "c_63pvmm6" "text",
    "c_loc1" "text",
    "c_loc1_c" "text",
    "c_loc2" "text",
    "c_loc2_c" "text",
    "c_loc3" "text",
    "c_loc3_c" "text",
    "c_share" "text",
    "c_plant" "text",
    "c_family" "text",
    "c_p_mp_code" "text",
    "c_l1_part_no" "text",
    "c_b" "text",
    "c_sfx" "text",
    "c_line_no" "text",
    "c_e_f" "text",
    "c_inproc" "text",
    "c_gr" "text",
    "c_parent_part_no" "text",
    "c_p_mp_part" "text",
    "c_qty_l1" "text",
    "c_parent_seq" "text",
    "c_seq" "text",
    "c_mp" "text",
    "c_sgrseq" "text",
    "c_begin" "text",
    "c_end" "text",
    "c_op" "text",
    "c_env" "text",
    "c_sn" "text",
    "c_hns" "text",
    "c_hg_target_weight" "text",
    "c_basic_part_no" "text",
    "c_appl_dc_no" "text",
    "c_dwg_issue_dc_no" "text",
    "c_femd" "text",
    "c_sw" "text",
    "file_uuid" "uuid",
    "data_upload_uuid" "uuid",
    "data_upload_id" bigint
);


ALTER TABLE "public"."raw_bom_upload_3tx_rh_id" OWNER TO "supabase_admin";


CREATE SEQUENCE IF NOT EXISTS "public"."raw_bom_upload_3tx_rh_id_raw_bom_upload_3tx_rh_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."raw_bom_upload_3tx_rh_id_raw_bom_upload_3tx_rh_id_seq" OWNER TO "supabase_admin";


ALTER SEQUENCE "public"."raw_bom_upload_3tx_rh_id_raw_bom_upload_3tx_rh_id_seq" OWNED BY "public"."raw_bom_upload_3tx_rh_id"."raw_bom_upload_3tx_rh_id";



CREATE SEQUENCE IF NOT EXISTS "public"."raw_bom_upload_raw_bom_upload_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."raw_bom_upload_raw_bom_upload_id_seq" OWNER TO "supabase_admin";


ALTER SEQUENCE "public"."raw_bom_upload_raw_bom_upload_id_seq" OWNED BY "public"."raw_bom_upload"."raw_bom_upload_id";



ALTER TABLE "public"."raw_bom_upload" ALTER COLUMN "raw_bom_upload_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."raw_bom_upload_raw_bom_upload_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."role_list" (
    "role_list_id" bigint NOT NULL,
    "status" "text",
    "role_title" "text",
    "ref_role" "text",
    "tp_role" "text",
    "description" "text",
    "icon" "text",
    "created_date" timestamp with time zone DEFAULT "now"(),
    "created_user_name" "text",
    "created_user_id" bigint,
    "app_name" "text",
    "for_business_code" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "ref_business_code" "text",
    "ref_business_name" "text",
    "ref_business_number" "text"
);


ALTER TABLE "public"."role_list" OWNER TO "supabase_admin";


ALTER TABLE "public"."role_list" ALTER COLUMN "role_list_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."role_list_role_list_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_catalog" (
    "user_catalog_id" bigint NOT NULL,
    "status" "text",
    "description" "text",
    "user_note" "text",
    "icon" "text",
    "document_no" "text",
    "document_status" "text",
    "user_status" "text",
    "user_group_list" "text",
    "flow_routing" "text",
    "progress_status" "text",
    "performance_status" "text",
    "profile_rating_note" "text",
    "contact_user" "text",
    "personal_user" "text",
    "business_user" "text",
    "prefix_title" "text",
    "first_name" "text",
    "last_name" "text",
    "gender" "text",
    "date_of_birth" timestamp with time zone,
    "user_email" "text",
    "user_mobile" "text",
    "user_otp" "text",
    "user_name" "text",
    "password" "text",
    "retype_password" "text",
    "avatar_url" "text",
    "profile_pic_url" "text",
    "profile_url" "text",
    "roles" "text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "business_role_title" "text",
    "business_roles" "text",
    "designation" "text",
    "department" "text",
    "branch" "text",
    "business_category" "text",
    "business_size" "text",
    "for_business_name" "text",
    "for_business_number" "text",
    "business_name" "text",
    "company_name" "text",
    "business_registration_type" "text",
    "business_registration_no" "text",
    "business_registration_file" "text",
    "business_tagline" "text",
    "business_intro" "text",
    "business_description" "text",
    "business_short_description" "text",
    "business_profile_url" "text",
    "business_logo_url" "text",
    "business_website" "text",
    "business_address_1" "text",
    "business_address_2" "text",
    "business_country" "text",
    "business_state" "text",
    "business_city" "text",
    "business_area" "text",
    "business_postcode" "text",
    "business_geo_lat" "text",
    "business_geo_long" "text",
    "business_geo_map_url" "text",
    "billing_first_name" "text",
    "billing_last_name" "text",
    "billing_company" "text",
    "billing_phone" "text",
    "billing_email" "text",
    "billing_address_1" "text",
    "billing_address_2" "text",
    "billing_country" "text",
    "billing_state" "text",
    "billing_city" "text",
    "billing_postcode" "text",
    "shipping_first_name" "text",
    "shipping_last_name" "text",
    "shipping_company" "text",
    "shipping_phone" "text",
    "shipping_email" "text",
    "shipping_address_1" "text",
    "shipping_address_2" "text",
    "shipping_country" "text",
    "shipping_state" "text",
    "shipping_city" "text",
    "shipping_postcode" "text",
    "paying_customer" "text",
    "new_user_join" "text",
    "vacaton_mode" "text",
    "working_days" "text",
    "opening_time" timestamp with time zone,
    "closing_time" timestamp with time zone,
    "geo_lat" "text",
    "geo_long" "text",
    "geo_map_url" "text",
    "social_login_used" "text",
    "social_login_provider" "text",
    "social_login_username" "text",
    "loggedin_status" "text",
    "business" "text",
    "business_number" "text",
    "ref_business" "text",
    "ref_business_number" "text",
    "ref_user" "text",
    "ref_appname" "text",
    "ref_app_id" bigint,
    "ref_datetime" timestamp with time zone,
    "created_user_name" "text",
    "created_user_id" bigint,
    "created_datetime" timestamp with time zone,
    "app_name" "text",
    "business_email" "text",
    "business_phone_no" "text",
    "billing_address_text" "text",
    "shipping_address_text" "text",
    "registration_number" "text",
    "passport_number" "text",
    "identity_number" "text",
    "tin_number" "text",
    "sst_number" "text",
    "tourism_tax_number" "text",
    "msic_number" "text",
    "classification_code" "text",
    "digital_signature" "text",
    "digital_signature_file" "text",
    "import_license_no" "text",
    "export_license_no" "text",
    "emailverify" boolean DEFAULT false,
    "mobileverify" boolean DEFAULT false,
    "whatsappverify" boolean DEFAULT false,
    "reset_token" "text",
    "reset_token_expiry" timestamp with time zone,
    "signup_social_login" "text",
    "preferred_login_mode" "text",
    "card_type" "text",
    "html_content" "text",
    "custom_one" "text",
    "custom_two" "text",
    "custom_three" "text",
    "custom_text_area" "text",
    "custom_json_one" "jsonb",
    "custom_json_two" "jsonb",
    "custom_json_three" "jsonb",
    "api_connection_one" "text",
    "api_connection_json" "jsonb",
    "roles_json" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "flow_json" "jsonb",
    "progress_json" "jsonb",
    "status_log_json" "jsonb",
    "user_log_json" "jsonb",
    "business_log_json" "jsonb",
    "agent_json" "jsonb",
    "prompt_json" "jsonb",
    "response_json" "jsonb",
    "timeline_json" "jsonb",
    "for_business_code" "text"
);


ALTER TABLE "public"."user_catalog" OWNER TO "supabase_admin";


ALTER TABLE "public"."user_catalog" ALTER COLUMN "user_catalog_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_catalog_user_catalog_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."raw_bom_upload_3tx_rh_id" ALTER COLUMN "raw_bom_upload_3tx_rh_id" SET DEFAULT "nextval"('"public"."raw_bom_upload_3tx_rh_id_raw_bom_upload_3tx_rh_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."bom_item"
    ADD CONSTRAINT "bom_item_pkey" PRIMARY KEY ("bom_item_id");



ALTER TABLE ONLY "public"."bom_maker"
    ADD CONSTRAINT "bom_maker_pkey" PRIMARY KEY ("bom_maker_id");



ALTER TABLE ONLY "public"."bom"
    ADD CONSTRAINT "bom_pkey" PRIMARY KEY ("bom_id");



ALTER TABLE ONLY "public"."data_group"
    ADD CONSTRAINT "data_group_pkey" PRIMARY KEY ("data_group_id");



ALTER TABLE ONLY "public"."data_upload"
    ADD CONSTRAINT "data_upload_pkey" PRIMARY KEY ("data_upload_uuid");



ALTER TABLE ONLY "public"."data_upload_setup"
    ADD CONSTRAINT "data_upload_setup_pkey" PRIMARY KEY ("data_upload_setup_id");



ALTER TABLE ONLY "public"."file_upload"
    ADD CONSTRAINT "file_upload_pkey" PRIMARY KEY ("file_upload_id");



ALTER TABLE ONLY "public"."final_bom_item"
    ADD CONSTRAINT "final_bom_item_pkey" PRIMARY KEY ("final_bom_item_id");



ALTER TABLE ONLY "public"."final_bom"
    ADD CONSTRAINT "final_bom_pkey" PRIMARY KEY ("final_bom_id");



ALTER TABLE ONLY "public"."final_bom_upload"
    ADD CONSTRAINT "final_bom_upload_pkey" PRIMARY KEY ("final_bom_upload_id");



ALTER TABLE ONLY "public"."group"
    ADD CONSTRAINT "group_pkey" PRIMARY KEY ("group_id");



ALTER TABLE ONLY "public"."month_stock_upload"
    ADD CONSTRAINT "month_stock_upload_month_stock_id_key" UNIQUE ("month_stock_id");



ALTER TABLE ONLY "public"."month_stock_upload"
    ADD CONSTRAINT "month_stock_upload_pkey" PRIMARY KEY ("month_stock_id");



ALTER TABLE ONLY "public"."mydoc_content"
    ADD CONSTRAINT "mydoc_content_pkey" PRIMARY KEY ("mydoc_content_id");



ALTER TABLE ONLY "public"."mydoc_fields"
    ADD CONSTRAINT "mydoc_fields_pkey" PRIMARY KEY ("mydoc_field_id");



ALTER TABLE ONLY "public"."mydoc_list"
    ADD CONSTRAINT "mydoc_list_pkey" PRIMARY KEY ("mydoc_list_id");



ALTER TABLE ONLY "public"."mydocs"
    ADD CONSTRAINT "mydocs_pkey" PRIMARY KEY ("mydoc_id");



ALTER TABLE ONLY "public"."page_list"
    ADD CONSTRAINT "page_list_pkey" PRIMARY KEY ("pagelist_id");



ALTER TABLE ONLY "public"."product"
    ADD CONSTRAINT "product_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."raw_bom_upload_3tx_rh_id"
    ADD CONSTRAINT "raw_bom_upload_3tx_rh_id_pkey" PRIMARY KEY ("raw_bom_upload_3tx_rh_id");



ALTER TABLE ONLY "public"."raw_bom_upload"
    ADD CONSTRAINT "raw_bom_upload_pkey" PRIMARY KEY ("raw_bom_upload_id");



ALTER TABLE ONLY "public"."role_list"
    ADD CONSTRAINT "role_list_pkey" PRIMARY KEY ("role_list_id");



ALTER TABLE ONLY "public"."user_catalog"
    ADD CONSTRAINT "user_catalog_pkey" PRIMARY KEY ("user_catalog_id");



ALTER TABLE ONLY "public"."user_catalog"
    ADD CONSTRAINT "user_catalog_user_email_key" UNIQUE ("user_email");



ALTER TABLE ONLY "public"."user_catalog"
    ADD CONSTRAINT "user_catalog_user_mobile_key" UNIQUE ("user_mobile");



CREATE POLICY "Policy with security definer functions" ON "public"."file_upload" USING ((("business_number" = (("current_setting"('request.headers'::"text", true))::"json" ->> 'business_number'::"text")) OR ("created_user_id" = ((("current_setting"('request.headers'::"text", true))::"json" ->> 'user_id'::"text"))::bigint) OR ((("current_setting"('request.headers'::"text", true))::"json" ->> 'user_role'::"text") = 'admin'::"text")));



CREATE POLICY "Policy with security definer functions" ON "public"."product" USING ((("for_business_number" = (("current_setting"('request.headers'::"text", true))::"json" ->> 'business_number'::"text")) OR ((("current_setting"('request.headers'::"text", true))::"json" ->> 'user_role'::"text") = 'admin'::"text")));



CREATE POLICY "Policy with security definer functions" ON "public"."user_catalog" USING ((("for_business_number" = (("current_setting"('request.headers'::"text", true))::"json" ->> 'business_number'::"text")) OR ((("current_setting"('request.headers'::"text", true))::"json" ->> 'user_role'::"text") = 'admin'::"text")));



ALTER TABLE "public"."file_upload" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_catalog" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

































































































































































































































GRANT ALL ON FUNCTION "public"."dynamic_table_filter"("filters" "jsonb", "select_fields" "text", "table_name" "text", "extra_condition" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."dynamic_table_filter"("filters" "jsonb", "select_fields" "text", "table_name" "text", "extra_condition" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."dynamic_table_filter"("filters" "jsonb", "select_fields" "text", "table_name" "text", "extra_condition" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dynamic_table_filter"("filters" "jsonb", "select_fields" "text", "table_name" "text", "extra_condition" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."dynamic_table_filter_query"("filters" "jsonb", "select_fields" "text", "table_name" "text", "extra_condition" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."dynamic_table_filter_query"("filters" "jsonb", "select_fields" "text", "table_name" "text", "extra_condition" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."dynamic_table_filter_query"("filters" "jsonb", "select_fields" "text", "table_name" "text", "extra_condition" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dynamic_table_filter_query"("filters" "jsonb", "select_fields" "text", "table_name" "text", "extra_condition" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_timeout"() TO "postgres";
GRANT ALL ON FUNCTION "public"."get_current_timeout"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_timeout"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_timeout"() TO "service_role";



GRANT ALL ON FUNCTION "public"."simulate_sleep"("seconds" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."simulate_sleep"("seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."simulate_sleep"("seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."simulate_sleep"("seconds" integer) TO "service_role";
























GRANT ALL ON TABLE "public"."bom" TO "postgres";
GRANT ALL ON TABLE "public"."bom" TO "anon";
GRANT ALL ON TABLE "public"."bom" TO "authenticated";
GRANT ALL ON TABLE "public"."bom" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bom_bom_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."bom_bom_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bom_bom_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bom_bom_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bom_bom_id_seq1" TO "postgres";
GRANT ALL ON SEQUENCE "public"."bom_bom_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."bom_bom_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bom_bom_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."bom_item" TO "postgres";
GRANT ALL ON TABLE "public"."bom_item" TO "anon";
GRANT ALL ON TABLE "public"."bom_item" TO "authenticated";
GRANT ALL ON TABLE "public"."bom_item" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bom_item_bom_item_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."bom_item_bom_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bom_item_bom_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bom_item_bom_item_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bom_item_bom_item_id_seq1" TO "postgres";
GRANT ALL ON SEQUENCE "public"."bom_item_bom_item_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."bom_item_bom_item_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bom_item_bom_item_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."bom_maker" TO "postgres";
GRANT ALL ON TABLE "public"."bom_maker" TO "anon";
GRANT ALL ON TABLE "public"."bom_maker" TO "authenticated";
GRANT ALL ON TABLE "public"."bom_maker" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bom_maker_bom_maker_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."bom_maker_bom_maker_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bom_maker_bom_maker_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bom_maker_bom_maker_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bom_maker_bom_maker_id_seq1" TO "postgres";
GRANT ALL ON SEQUENCE "public"."bom_maker_bom_maker_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."bom_maker_bom_maker_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bom_maker_bom_maker_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."data_group" TO "postgres";
GRANT ALL ON TABLE "public"."data_group" TO "anon";
GRANT ALL ON TABLE "public"."data_group" TO "authenticated";
GRANT ALL ON TABLE "public"."data_group" TO "service_role";



GRANT ALL ON SEQUENCE "public"."data_group_data_group_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."data_group_data_group_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."data_group_data_group_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."data_group_data_group_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."data_group_data_group_id_seq1" TO "postgres";
GRANT ALL ON SEQUENCE "public"."data_group_data_group_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."data_group_data_group_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."data_group_data_group_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."data_upload" TO "postgres";
GRANT ALL ON TABLE "public"."data_upload" TO "anon";
GRANT ALL ON TABLE "public"."data_upload" TO "authenticated";
GRANT ALL ON TABLE "public"."data_upload" TO "service_role";



GRANT ALL ON SEQUENCE "public"."data_upload_data_upload_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."data_upload_data_upload_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."data_upload_data_upload_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."data_upload_data_upload_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."data_upload_setup" TO "postgres";
GRANT ALL ON TABLE "public"."data_upload_setup" TO "anon";
GRANT ALL ON TABLE "public"."data_upload_setup" TO "authenticated";
GRANT ALL ON TABLE "public"."data_upload_setup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."data_upload_setup_data_upload_setup_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."data_upload_setup_data_upload_setup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."data_upload_setup_data_upload_setup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."data_upload_setup_data_upload_setup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."file_upload" TO "postgres";
GRANT ALL ON TABLE "public"."file_upload" TO "anon";
GRANT ALL ON TABLE "public"."file_upload" TO "authenticated";
GRANT ALL ON TABLE "public"."file_upload" TO "service_role";



GRANT ALL ON SEQUENCE "public"."file_upload_file_upload_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."file_upload_file_upload_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."file_upload_file_upload_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."file_upload_file_upload_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."final_bom" TO "postgres";
GRANT ALL ON TABLE "public"."final_bom" TO "anon";
GRANT ALL ON TABLE "public"."final_bom" TO "authenticated";
GRANT ALL ON TABLE "public"."final_bom" TO "service_role";



GRANT ALL ON SEQUENCE "public"."final_bom_final_bom_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."final_bom_final_bom_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."final_bom_final_bom_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."final_bom_final_bom_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."final_bom_final_bom_id_seq1" TO "postgres";
GRANT ALL ON SEQUENCE "public"."final_bom_final_bom_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."final_bom_final_bom_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."final_bom_final_bom_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."final_bom_item" TO "postgres";
GRANT ALL ON TABLE "public"."final_bom_item" TO "anon";
GRANT ALL ON TABLE "public"."final_bom_item" TO "authenticated";
GRANT ALL ON TABLE "public"."final_bom_item" TO "service_role";



GRANT ALL ON SEQUENCE "public"."final_bom_item_final_bom_item_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."final_bom_item_final_bom_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."final_bom_item_final_bom_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."final_bom_item_final_bom_item_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."final_bom_item_final_bom_item_id_seq1" TO "postgres";
GRANT ALL ON SEQUENCE "public"."final_bom_item_final_bom_item_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."final_bom_item_final_bom_item_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."final_bom_item_final_bom_item_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."final_bom_upload" TO "postgres";
GRANT ALL ON TABLE "public"."final_bom_upload" TO "anon";
GRANT ALL ON TABLE "public"."final_bom_upload" TO "authenticated";
GRANT ALL ON TABLE "public"."final_bom_upload" TO "service_role";



GRANT ALL ON SEQUENCE "public"."final_bom_upload_final_bom_upload_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."final_bom_upload_final_bom_upload_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."final_bom_upload_final_bom_upload_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."final_bom_upload_final_bom_upload_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."final_bom_upload_final_bom_upload_id_seq1" TO "postgres";
GRANT ALL ON SEQUENCE "public"."final_bom_upload_final_bom_upload_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."final_bom_upload_final_bom_upload_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."final_bom_upload_final_bom_upload_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."group" TO "postgres";
GRANT ALL ON TABLE "public"."group" TO "anon";
GRANT ALL ON TABLE "public"."group" TO "authenticated";
GRANT ALL ON TABLE "public"."group" TO "service_role";



GRANT ALL ON SEQUENCE "public"."group_group_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."group_group_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."group_group_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."group_group_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."month_stock_upload" TO "postgres";
GRANT ALL ON TABLE "public"."month_stock_upload" TO "anon";
GRANT ALL ON TABLE "public"."month_stock_upload" TO "authenticated";
GRANT ALL ON TABLE "public"."month_stock_upload" TO "service_role";



GRANT ALL ON SEQUENCE "public"."month_stock_upload_month_stock_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."month_stock_upload_month_stock_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."month_stock_upload_month_stock_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."month_stock_upload_month_stock_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."mydoc_content" TO "postgres";
GRANT ALL ON TABLE "public"."mydoc_content" TO "anon";
GRANT ALL ON TABLE "public"."mydoc_content" TO "authenticated";
GRANT ALL ON TABLE "public"."mydoc_content" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mydoc_content_mydoc_content_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."mydoc_content_mydoc_content_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mydoc_content_mydoc_content_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mydoc_content_mydoc_content_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."mydoc_fields" TO "postgres";
GRANT ALL ON TABLE "public"."mydoc_fields" TO "anon";
GRANT ALL ON TABLE "public"."mydoc_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."mydoc_fields" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mydoc_fields_mydoc_field_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."mydoc_fields_mydoc_field_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mydoc_fields_mydoc_field_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mydoc_fields_mydoc_field_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."mydoc_list" TO "postgres";
GRANT ALL ON TABLE "public"."mydoc_list" TO "anon";
GRANT ALL ON TABLE "public"."mydoc_list" TO "authenticated";
GRANT ALL ON TABLE "public"."mydoc_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mydoc_list_mydoc_list_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."mydoc_list_mydoc_list_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mydoc_list_mydoc_list_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mydoc_list_mydoc_list_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."mydocs" TO "postgres";
GRANT ALL ON TABLE "public"."mydocs" TO "anon";
GRANT ALL ON TABLE "public"."mydocs" TO "authenticated";
GRANT ALL ON TABLE "public"."mydocs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mydocs_mydoc_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."mydocs_mydoc_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mydocs_mydoc_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mydocs_mydoc_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."page_list" TO "postgres";
GRANT ALL ON TABLE "public"."page_list" TO "anon";
GRANT ALL ON TABLE "public"."page_list" TO "authenticated";
GRANT ALL ON TABLE "public"."page_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."page_list_pagelist_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."page_list_pagelist_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."page_list_pagelist_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."page_list_pagelist_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."product" TO "postgres";
GRANT ALL ON TABLE "public"."product" TO "anon";
GRANT ALL ON TABLE "public"."product" TO "authenticated";
GRANT ALL ON TABLE "public"."product" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_product_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."product_product_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_product_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_product_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_product_id_seq1" TO "postgres";
GRANT ALL ON SEQUENCE "public"."product_product_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_product_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_product_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."raw_bom_upload" TO "postgres";
GRANT ALL ON TABLE "public"."raw_bom_upload" TO "anon";
GRANT ALL ON TABLE "public"."raw_bom_upload" TO "authenticated";
GRANT ALL ON TABLE "public"."raw_bom_upload" TO "service_role";



GRANT ALL ON TABLE "public"."raw_bom_upload_3tx_rh_id" TO "postgres";
GRANT ALL ON TABLE "public"."raw_bom_upload_3tx_rh_id" TO "anon";
GRANT ALL ON TABLE "public"."raw_bom_upload_3tx_rh_id" TO "authenticated";
GRANT ALL ON TABLE "public"."raw_bom_upload_3tx_rh_id" TO "service_role";



GRANT ALL ON SEQUENCE "public"."raw_bom_upload_3tx_rh_id_raw_bom_upload_3tx_rh_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."raw_bom_upload_3tx_rh_id_raw_bom_upload_3tx_rh_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."raw_bom_upload_3tx_rh_id_raw_bom_upload_3tx_rh_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."raw_bom_upload_3tx_rh_id_raw_bom_upload_3tx_rh_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."raw_bom_upload_raw_bom_upload_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."raw_bom_upload_raw_bom_upload_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."raw_bom_upload_raw_bom_upload_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."raw_bom_upload_raw_bom_upload_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."raw_bom_upload_raw_bom_upload_id_seq1" TO "postgres";
GRANT ALL ON SEQUENCE "public"."raw_bom_upload_raw_bom_upload_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."raw_bom_upload_raw_bom_upload_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."raw_bom_upload_raw_bom_upload_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."role_list" TO "postgres";
GRANT ALL ON TABLE "public"."role_list" TO "anon";
GRANT ALL ON TABLE "public"."role_list" TO "authenticated";
GRANT ALL ON TABLE "public"."role_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."role_list_role_list_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."role_list_role_list_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."role_list_role_list_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."role_list_role_list_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_catalog" TO "postgres";
GRANT ALL ON TABLE "public"."user_catalog" TO "anon";
GRANT ALL ON TABLE "public"."user_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."user_catalog" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_catalog_user_catalog_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "public"."user_catalog_user_catalog_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_catalog_user_catalog_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_catalog_user_catalog_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
