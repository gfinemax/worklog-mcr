"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { TabsList, TabsTrigger } from "@radix-ui/react-tabs"

const FolderTabsList = React.forwardRef<
    React.ElementRef<typeof TabsList>,
    React.ComponentPropsWithoutRef<typeof TabsList>
>(({ className, ...props }, ref) => (
    <TabsList
        ref={ref}
        className={cn(
            "flex items-end w-full border-b border-slate-300 pl-0", // Removed padding-left to align with edge
            className
        )}
        {...props}
    />
))
FolderTabsList.displayName = TabsList.displayName

const FolderTabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsTrigger>,
    React.ComponentPropsWithoutRef<typeof TabsTrigger>
>(({ className, children, ...props }, ref) => (
    <TabsTrigger
        ref={ref}
        className={cn(
            "group relative h-10 px-6 flex items-center justify-center text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 select-none",
            "ml-[-15px] first:ml-0", // Overlap
            "data-[state=active]:z-10",
            "data-[state=inactive]:z-0 hover:z-[5]",
            className
        )}
        {...props}
    >
        {/* Border Layer (The outer shape) */}
        <div className={cn(
            "absolute inset-0 transition-all duration-200",
            "bg-transparent",
            "group-data-[state=active]:bg-slate-300", // Active border color
            "group-data-[state=active]:shadow-[0_-2px_6px_rgba(0,0,0,0.05)]",
        )}
            style={{
                clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 100%, 0 100%)",
                borderRadius: "12px 12px 0 0" // Increased rounding
            }}
        />

        {/* Background Layer (The inner shape, slightly smaller to reveal border) */}
        <div className={cn(
            "absolute inset-[1px] bottom-0 transition-all duration-200",
            // Inactive
            "bg-slate-100",
            "group-hover:bg-slate-200",
            // Active
            "group-data-[state=active]:bg-white",
            "group-data-[state=active]:mb-[-1px] group-data-[state=active]:pb-[2px]", // Cover bottom border
        )}
            style={{
                clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 100%, 0 100%)",
                borderRadius: "11px 11px 0 0"
            }}
        />

        {/* Content */}
        <span className={cn(
            "relative z-20 truncate max-w-[150px] transition-colors duration-200 mr-2", // Add margin right to account for slant
            "group-data-[state=active]:text-slate-900 group-data-[state=active]:font-bold",
            "group-data-[state=inactive]:text-slate-400 group-data-[state=inactive]:group-hover:text-slate-700",
        )}>
            {children}
        </span>

        {/* Bottom Hider for Active Tab (To seamlessly merge with content) */}
        <div className={cn(
            "absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white z-20 hidden",
            "group-data-[state=active]:block",
            "w-[calc(100%-15px)]" // Don't cover the slanted part's bottom right corner excessively
        )} />
    </TabsTrigger>
))
FolderTabsTrigger.displayName = TabsTrigger.displayName

export { FolderTabsList, FolderTabsTrigger }
