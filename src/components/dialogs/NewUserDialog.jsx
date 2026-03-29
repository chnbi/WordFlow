import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/context/DevAuthContext"
import { ROLES, getRoleLabel } from "@/lib/permissions"

export default function NewUserDialog({ open, onOpenChange, onSuccess }) {
    const { signUp } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: ROLES.EDITOR,
    })

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.email || !form.password || !form.name) {
            toast.error("Please fill in all required fields")
            return
        }

        if (form.password.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        setIsSubmitting(true)
        try {
            await signUp(form.email, form.password, {
                name: form.name,
                role: form.role,
            })
            toast.success(`User "${form.name}" created successfully`)
            setForm({ name: "", email: "", password: "", role: ROLES.EDITOR })
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            if (error.code === "auth/email-already-in-use") {
                toast.error("This email is already registered")
            } else if (error.code === "auth/weak-password") {
                toast.error("Password is too weak")
            } else {
                toast.error(error.message || "Failed to create user")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                        Add a new team member to WordFlow.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                            id="name"
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                            id="password"
                            type="password"
                            value={form.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            placeholder="Min 6 characters"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ROLES.EDITOR}>{getRoleLabel(ROLES.EDITOR)}</SelectItem>
                                <SelectItem value={ROLES.MANAGER}>{getRoleLabel(ROLES.MANAGER)}</SelectItem>
                                <SelectItem value={ROLES.ADMIN}>{getRoleLabel(ROLES.ADMIN)}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
