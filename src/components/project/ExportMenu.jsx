/**
 * ExportMenu Component
 * Reusable dropdown menu for exporting project data in various formats
 */
import { Download, FileSpreadsheet, FileText, Presentation } from 'lucide-react'
import { PillButton } from '@/components/ui/shared'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LANGUAGES } from '@/lib/constants'

export function ExportMenu({
    targetLanguages = [],
    onExportExcel,
    onExportDocx,
    onExportPptx,
    style = {}
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <PillButton
                    variant="outline"
                    style={{ height: '32px', fontSize: '12px', padding: '0 16px', ...style }}
                >
                    <Download style={{ width: '14px', height: '14px', marginRight: '4px' }} /> Export
                </PillButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {/* Excel Export */}
                <DropdownMenuItem onClick={onExportExcel} className="cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    <span>Excel (All)</span>
                </DropdownMenuItem>

                {/* Word Export - per language */}
                {targetLanguages.length > 0 && (
                    <DropdownMenuItem disabled className="opacity-50 font-semibold text-xs pt-2 pb-1">
                        Word
                    </DropdownMenuItem>
                )}
                {targetLanguages.map(lang => (
                    <DropdownMenuItem
                        key={`docx-${lang}`}
                        onClick={() => onExportDocx?.(lang)}
                        className="cursor-pointer pl-6"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        <span>{LANGUAGES[lang]?.label || lang}</span>
                    </DropdownMenuItem>
                ))}

                {/* PowerPoint Export - per language */}
                {targetLanguages.length > 0 && (
                    <DropdownMenuItem disabled className="opacity-50 font-semibold text-xs pt-2 pb-1">
                        PowerPoint
                    </DropdownMenuItem>
                )}
                {targetLanguages.map(lang => (
                    <DropdownMenuItem
                        key={`pptx-${lang}`}
                        onClick={() => onExportPptx?.(lang)}
                        className="cursor-pointer pl-6"
                    >
                        <Presentation className="w-4 h-4 mr-2" />
                        <span>{LANGUAGES[lang]?.label || lang}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
