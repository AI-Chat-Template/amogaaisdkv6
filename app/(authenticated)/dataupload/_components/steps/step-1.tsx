import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { UpdateDataUploadSchema } from "../../_lib/validations";
import { DataUploadStatuses } from "../../type";
import useSWR from "swr";
import { Loader } from "lucide-react";

type Template = {
  data_upload_setup_id: number;
  template_name: string;
  data_table_name: string;
  file_csv_field_json: JSON;
  template_file_fields_json: Record<
    string,
    { field_name: string; required?: boolean | undefined }
  >;
};

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((res) => {
      if (res.error) throw res.error;
      return res.data;
    });

export default function Step1({
  form,
  handleFileChange,
  selectedTemplate,
  setSelectedTemplate,
}: {
  form: UseFormReturn<UpdateDataUploadSchema, unknown, undefined>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedTemplate: Template | undefined;
  setSelectedTemplate: React.Dispatch<
    React.SetStateAction<Template | undefined>
  >;
}) {
  const {
    data: availableTemplates,
    error,
    isLoading,
  } = useSWR<Template[]>(
    `/api/upload-data/templates?data_upload_group=Data Upload`,
    fetcher
  );

  const handleTemplateChange = (value: string) => {
    const template = availableTemplates?.find(
      (t) => String(t.data_upload_setup_id) === value
    );
    if (template && setSelectedTemplate) {
      setSelectedTemplate(template);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="template_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select template</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleTemplateChange(value);
                  }}
                  //   defaultValue={field.value}
                  value={String(selectedTemplate?.data_upload_setup_id)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {isLoading && (
                        <Loader
                          className="mr-2 size-4 animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      {error && error}
                      {(availableTemplates ?? []).map((item) => (
                        <SelectItem
                          key={item.data_upload_setup_id}
                          value={item.data_upload_setup_id.toString()}
                          className="capitalize"
                        >
                          {item.template_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="capitalize">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {DataUploadStatuses.map((item) => (
                        <SelectItem
                          key={item}
                          value={item}
                          className="capitalize"
                        >
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Upload File</FormLabel>
            <FormControl>
              <Input type="file" accept=".csv" onChange={handleFileChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>
      </div>
    </div>
  );
}
