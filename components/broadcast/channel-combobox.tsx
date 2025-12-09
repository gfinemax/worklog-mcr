"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const STORAGE_KEY = "custom-broadcast-channels"
const DEFAULT_CHANNELS = ["SPORTS+", "ON", "M", "DRAMA", "Every1"]

function getStoredChannels(): string[] {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

function saveChannels(channels: string[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(channels))
}

interface ChannelComboboxProps {
    value: string  // comma-separated string for multiple values
    onValueChange: (value: string) => void
    placeholder?: string
    multiple?: boolean
}

export function ChannelCombobox({
    value,
    onValueChange,
    placeholder = "채널 선택",
    multiple = false
}: ChannelComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const [customChannels, setCustomChannels] = React.useState<string[]>([])

    // Parse value into array for multiple mode
    const selectedChannels = React.useMemo(() => {
        if (!value) return []
        return value.split(',').map(v => v.trim()).filter(Boolean)
    }, [value])

    // Load custom channels from localStorage on mount
    React.useEffect(() => {
        setCustomChannels(getStoredChannels())
    }, [])

    const allChannels = React.useMemo(() => {
        const combined = [...DEFAULT_CHANNELS, ...customChannels]
        return [...new Set(combined)]
    }, [customChannels])

    const handleSelect = (selectedValue: string) => {
        if (multiple) {
            let newSelection: string[]
            if (selectedChannels.includes(selectedValue)) {
                // Remove if already selected
                newSelection = selectedChannels.filter(ch => ch !== selectedValue)
            } else {
                // Add to selection
                newSelection = [...selectedChannels, selectedValue]
            }
            onValueChange(newSelection.join(', '))
        } else {
            onValueChange(selectedValue)
            setOpen(false)
        }
        setInputValue("")
    }

    const handleRemove = (channelToRemove: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const newSelection = selectedChannels.filter(ch => ch !== channelToRemove)
        onValueChange(newSelection.join(', '))
    }

    const handleAddCustom = () => {
        const trimmed = inputValue.trim()
        if (!trimmed) return

        // Add to custom channels if not exists
        if (!allChannels.includes(trimmed)) {
            const newCustomChannels = [...customChannels, trimmed]
            setCustomChannels(newCustomChannels)
            saveChannels(newCustomChannels)
        }

        handleSelect(trimmed)
    }

    const filteredChannels = allChannels.filter(ch =>
        ch.toLowerCase().includes(inputValue.toLowerCase())
    )

    const showAddOption = inputValue.trim() !== "" &&
        !allChannels.some(ch => ch.toLowerCase() === inputValue.trim().toLowerCase())

    const displayValue = () => {
        if (multiple) {
            if (selectedChannels.length === 0) return placeholder
            return null // Will show badges instead
        }
        return value || placeholder
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between min-h-[40px] h-auto",
                        multiple && selectedChannels.length > 0 && "py-1.5"
                    )}
                >
                    {multiple && selectedChannels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {selectedChannels.map(ch => (
                                <Badge
                                    key={ch}
                                    variant="secondary"
                                    className="mr-1 px-2 py-0.5"
                                >
                                    {ch}
                                    <button
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onClick={(e) => handleRemove(ch, e)}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <span className={!value ? "text-muted-foreground" : ""}>
                            {displayValue()}
                        </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="채널 검색 또는 입력..."
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {showAddOption ? (
                                <button
                                    className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent rounded flex items-center gap-2"
                                    onClick={handleAddCustom}
                                >
                                    <Plus className="h-4 w-4" />
                                    "{inputValue}" 추가
                                </button>
                            ) : (
                                "채널을 찾을 수 없습니다."
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {filteredChannels.map((channel) => {
                                const isSelected = multiple
                                    ? selectedChannels.includes(channel)
                                    : value === channel
                                return (
                                    <CommandItem
                                        key={channel}
                                        value={channel}
                                        onSelect={() => handleSelect(channel)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                isSelected ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {channel}
                                        {customChannels.includes(channel) && (
                                            <span className="ml-auto text-xs text-muted-foreground">커스텀</span>
                                        )}
                                    </CommandItem>
                                )
                            })}
                            {showAddOption && filteredChannels.length > 0 && (
                                <CommandItem onSelect={handleAddCustom}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    "{inputValue}" 추가
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
