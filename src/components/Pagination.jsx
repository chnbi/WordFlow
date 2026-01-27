// Pagination - Reusable pagination component
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export default function Pagination({
    currentPage = 1,
    totalItems = 0,
    itemsPerPage = 25,
    onPageChange,
    onItemsPerPageChange,
    showItemsPerPage = true,
}) {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    const canGoPrevious = currentPage > 1
    const canGoNext = currentPage < totalPages

    return (
        <div className="flex items-center justify-between px-2 py-4 border-t">
            <div className="flex items-center gap-6">
                {/* Items per page selector */}
                {showItemsPerPage && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rows per page</span>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) => onItemsPerPageChange?.(parseInt(value))}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Page info */}
                <div className="text-sm text-muted-foreground">
                    {startItem}-{endItem} of {totalItems}
                </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(1)}
                    disabled={!canGoPrevious}
                    className="h-8 w-8 p-0"
                >
                    <ChevronsLeft className="h-4 w-4" />
                    <span className="sr-only">First page</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(currentPage - 1)}
                    disabled={!canGoPrevious}
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
                </Button>

                <div className="text-sm font-medium mx-4">
                    Page {currentPage} of {totalPages || 1}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(currentPage + 1)}
                    disabled={!canGoNext}
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(totalPages)}
                    disabled={!canGoNext}
                    className="h-8 w-8 p-0"
                >
                    <ChevronsRight className="h-4 w-4" />
                    <span className="sr-only">Last page</span>
                </Button>
            </div>
        </div>
    )
}
