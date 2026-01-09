import { Button } from "@/components/ui/button"

interface FormActionsProps {
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
}

export function FormActions({
  onCancel,
  submitLabel = "Submit Job",
  cancelLabel = "Cancel",
  isSubmitting = false,
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-4 pt-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : submitLabel}
      </Button>
    </div>
  )
}

