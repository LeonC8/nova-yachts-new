import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Check } from "lucide-react"

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
}

export function SuccessModal({ open, onClose }: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md flex flex-col items-center py-12">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h2>
        <p className="text-gray-500 text-center">
          Thank you for your inquiry. We'll get back to you as soon as possible.
        </p>
      </DialogContent>
    </Dialog>
  )
} 