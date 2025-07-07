import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function GmailPrompt({ open, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={() => (window.location.href = "/settings?tab=gmail")}
    >
       <DialogContent className="w-full max-w-md">
         <DialogHeader>
           <DialogTitle>
             Connect your Gmail account
           </DialogTitle>
         </DialogHeader>
         <p className="text-sm text-muted-foreground text-center sm:text-left">
            Connecting your Gmail account allows you to send and receive emails directly from your inbox.
         </p>
         <div className="flex justify-end gap-3 mt-4">
           <Button onClick={() => (window.location.href = "/settings?tab=gmail")}>
             Connect Gmail  
           </Button>
         </div>
       </DialogContent>
    </Dialog>
  );
}
