// Image Translation - Currently Unavailable
import { PageContainer } from "@/components/ui/shared"
import { PageHeader } from "@/components/ui/common"
import { ImageOff } from "lucide-react"

export default function ImageTranslation() {
    return (
        <PageContainer>
            <PageHeader
                description="Upload images and extract text for translation"
            >
                Image Translation
            </PageHeader>

            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <ImageOff className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Feature Unavailable</h3>
                <p className="text-slate-500 max-w-md">
                    Image translation is currently disabled for maintenance. Please check back later.
                </p>
            </div>
        </PageContainer>
    )
}
