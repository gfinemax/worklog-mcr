"use client"

import { useRef } from "react"
import { Input } from "@/components/ui/input"

interface TimecodeInputProps {
    value: string
    onChange: (val: string) => void
    onComplete?: () => void
}

export function TimecodeInput({ value, onChange, onComplete }: TimecodeInputProps) {
    const inputs = useRef<(HTMLInputElement | null)[]>([])

    const handleChange = (index: number, val: string) => {
        if (!/^\d*$/.test(val)) return

        const parts = value.split(':')
        // Ensure we have 4 parts
        while (parts.length < 4) parts.push('00')

        parts[index] = val

        // Auto-advance if 2 digits
        if (val.length === 2 && index < 3) {
            inputs.current[index + 1]?.focus()
        }

        onChange(parts.join(':'))

        if (index === 3 && val.length === 2 && onComplete) {
            onComplete()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
            inputs.current[index - 1]?.focus()
        }
    }

    const parts = value.split(':')
    while (parts.length < 4) parts.push('00')

    return (
        <div className="flex items-center gap-1">
            {parts.map((part, index) => (
                <div key={index} className="flex items-center">
                    <Input
                        ref={el => { inputs.current[index] = el }}
                        className="w-12 text-center p-1 h-9 font-mono text-lg"
                        value={part}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => {
                            if (part.length === 1) {
                                handleChange(index, part.padStart(2, '0'))
                            }
                        }}
                        maxLength={2}
                        placeholder="00"
                    />
                    {index < 3 && <span className="mx-1 font-bold">:</span>}
                </div>
            ))}
        </div>
    )
}
