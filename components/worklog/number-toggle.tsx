"use client"

import { cn } from "@/lib/utils"

interface NumberToggleProps {
    value: number
    selected: boolean
    onClick: () => void
}

export function NumberToggle({ value, selected, onClick }: NumberToggleProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full border border-black text-[10px] transition-colors",
                selected ? "bg-black text-white font-bold" : "bg-white text-black hover:bg-gray-100"
            )}
        >
            {value}
        </button>
    )
}
