"use client";
import { useDialog } from "@/hooks/use-dialog-model";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export function DialogModel() {
  const { isOpen, onClose, data } = useDialog();

  if (!data) return null;
  return (
    <Dialog onOpenChange={onClose} open={isOpen} defaultOpen={isOpen}>
      {/* <DialogTrigger asChild>
        <Button variant="outline">Click Here</Button>
      </DialogTrigger> */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{data?.title}</DialogTitle>
          <DialogDescription>{data?.description}</DialogDescription>
        </DialogHeader>
        <hr />
        <div className="flex items-center space-x-2">
          <p>{data?.content}</p>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              data?.cancelCallback();
            }}
          >
            {data?.cancelMessage}
          </Button>
          {data?.okMessage && (
            <Button
              variant="default"
              onClick={() => {
                onClose();
                data?.okCallback();
              }}
            >
              {data.okMessage}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
