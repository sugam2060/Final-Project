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

export function DraftPublishActions({
  onSaveDraft,
  onPublish,
  onCancel,
  isSubmitting = false,
  isSavingDraft = false,
  isPublishing = false,
  currentStatus,
}: DraftPublishActionsProps) {
  return (
    <div className="flex justify-end gap-4 pt-4">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      )}
      <Button
        type="button"
        variant="secondary"
        onClick={onSaveDraft}
        disabled={isSubmitting}
      >
        {isSavingDraft ? (
          <>
            <Spinner className="h-4 w-4 mr-2" />
            Saving...
          </>
        ) : null}
        Save as Draft
      </Button>
      <Button
        type="button"
        onClick={onPublish}
        disabled={isSubmitting}
      >
        {isPublishing ? (
          <>
            <Spinner className="h-4 w-4 mr-2" />
            Publishing...
          </>
        ) : null}
        Publish
      </Button>
    </div>
  )
}

