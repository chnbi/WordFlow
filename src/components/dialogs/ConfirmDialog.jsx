// ConfirmDialog - Reusable styled confirmation dialog
// Matches the design from prompt-library delete confirmation
import { Button } from "@/components/ui/button"
import { SecondaryButton } from "@/components/ui/shared"

/**
 * ConfirmDialog - A styled confirmation dialog matching the app's design
 * @param {boolean} open - Whether the dialog is open
 * @param {function} onClose - Called when dialog should close (cancel)
 * @param {function} onConfirm - Called when user confirms the action
 * @param {string} title - Dialog title (e.g., "Delete Items?")
 * @param {string} message - Dialog message/description
 * @param {string} confirmLabel - Label for confirm button (default: "Confirm")
 * @param {string} cancelLabel - Label for cancel button (default: "Cancel")
 * @param {string} variant - Button variant: "destructive" | "default" (default: "destructive")
 */
export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to continue?",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "destructive"
}) {
    if (!open) return null

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    padding: '32px',
                    maxWidth: '400px',
                    width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'hsl(222, 47%, 11%)'
                }}>
                    {title}
                </h3>
                <p style={{
                    fontSize: '14px',
                    color: 'hsl(220, 9%, 46%)',
                    marginBottom: '24px',
                    lineHeight: '1.5'
                }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <SecondaryButton onClick={onClose}>
                        {cancelLabel}
                    </SecondaryButton>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        className="rounded-xl"
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDialog
