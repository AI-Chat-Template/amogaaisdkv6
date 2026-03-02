import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { EmojiPicker } from "@ferrucc-io/emoji-picker";

const EmojiPickerComponent = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="text-muted-foreground cursor-pointer">
          <Smile className="h-5 w-5" />
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border-none" side="top">
        <span className="text-muted-foreground cursor-pointer">
          {" "}
          <EmojiPicker>
            {" "}
            <EmojiPicker.Header>
              {" "}
              <EmojiPicker.Input placeholder="Search emoji" />{" "}
            </EmojiPicker.Header>{" "}
            <EmojiPicker.Group>
              {" "}
              <EmojiPicker.List />{" "}
            </EmojiPicker.Group>{" "}
          </EmojiPicker>{" "}
        </span>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPickerComponent;
