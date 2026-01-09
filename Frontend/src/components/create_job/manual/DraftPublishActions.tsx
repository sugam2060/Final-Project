import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface DraftPublishActionsProps {
  onSaveDraft: () => void
  onPublish: () => void
  onCancel?: () => void
  isSubmitting?: boolean
  isSavingDraft?: boolean
  isPublishing?: boolean
  currentStatus?: "draft" | "published" | "closed" | "expired"
}

/**
 * DraftPublishActions Component
 * 
 * Action buttons for saving draft and publishing job postings.
 * 
 * Features:
 * - Separate loading states for draft and publish
 * - Cancel option
 * - Accessibility support
 */
export const DraftPublishActions = memo(function DraftPublishActions({
  onSaveDraft,
  onPublish,
  onCancel,
  isSubmitting = false,
  isSavingDraft = false,
  isPublishing = false,
  currentStatus,
}: DraftPublishActionsProps) {
  const isAnyLoading = isSubmitting || isSavingDraft || isPublishing

  return (
    <div className="flex justify-end gap-4 pt-4" role="group" aria-label="Job posting actions">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isAnyLoading}
          aria-label="Cancel"
        >
          Cancel
        </Button>
      )}
      <Button
        type="button"
        variant="secondary"
        onClick={onSaveDraft}
        disabled={isAnyLoading}
        aria-label="Save as draft"
        aria-busy={isSavingDraft}
      >
        {isSavingDraft && <Spinner className="h-4 w-4 mr-2" aria-hidden="true" />}
        Save as Draft
      </Button>
      <Button
        type="button"
        onClick={onPublish}
        disabled={isAnyLoading}
        aria-label="Publish job"
        aria-busy={isPublishing}
      >
        {isPublishing && <Spinner className="h-4 w-4 mr-2" aria-hidden="true" />}
        Publish
      </Button>
    </div>
  )
})

