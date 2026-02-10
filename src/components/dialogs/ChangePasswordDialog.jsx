// ChangePasswordDialog - Allows users to change their password
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/context/DevAuthContext"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from '@/lib/firebase' // Direct auth access needed for reauth if required

// ... (imports remain same except pb)

export default function ChangePasswordDialog({ open, onOpenChange }) {
    const { user } = useAuth()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (newPassword.length < 8) {
            toast.error('New password must be at least 8 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match')
            return
        }

        setIsLoading(true)
        try {
            // Firebase requires re-authentication for sensitive operations like password change
            // verifying the "current password" is correct.
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(user.email, currentPassword);

            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            toast.success('Password changed successfully!')

            // Reset form
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            onOpenChange(false)
        } catch (error) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast.error('Current password is incorrect')
            } else if (error.code === 'auth/requires-recent-login') {
                toast.error('Session expired. Please log in again.')
            } else {
                toast.error('Failed to change password. ' + error.message)
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Update your account password. Make sure it's at least 8 characters long.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                        <p className="text-xs text-muted-foreground">
                            Must be at least 8 characters
                        </p>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
