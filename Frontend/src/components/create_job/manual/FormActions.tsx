import { memo } from "react"
import { Button } from "@/components/ui/button"

interface FormActionsProps {
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
}

/**
 * FormActions Component
 * 
 * Standard form action buttons (Cancel and Submit).
 * 
 * Features:
 * - Loading states
 * - Customizable labels
 * - Accessibility support
 */
export const FormActions = memo(function FormActions({
  onCancel,
  submitLabel = "Submit Job",
  cancelLabel = "Cancel",
  isSubmitting = false,
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-4 pt-4" role="group" aria-label="Form actions">
      {onCancel && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label={cancelLabel}
        >
          {cancelLabel}
        </Button>
      )}
      <Button 
        type="submit" 
        disabled={isSubmitting}
        aria-label={submitLabel}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : submitLabel}
      </Button>
    </div>
  )
})

