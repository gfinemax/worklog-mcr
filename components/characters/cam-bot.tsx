"use client"

import { MeshGradient } from "@paper-design/shaders-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

export function CamBot() {
  const colors = ["#3b82f6", "#60a5fa", "#93c5fd", "#2563eb", "#1d4ed8"]
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <motion.div
      className="relative w-full max-w-[280px] aspect-square mx-auto flex items-center justify-center"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
    >
      {/* Main Lens Body */}
      <div className="relative w-48 h-48 rounded-full bg-slate-800 p-2 shadow-2xl border-b-8 border-slate-900">
        <div className="w-full h-full rounded-full overflow-hidden relative border-4 border-slate-700">
          <MeshGradient colors={colors} speed={1.2} />

          {/* Lens Reflections */}
          <div className="absolute inset-0 rounded-full border-[20px] border-white/10" />
          <div className="absolute top-4 right-8 w-12 h-6 bg-white/30 rotate-[-45deg] rounded-full blur-sm" />

          {/* Central Eye/Iris */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-black/80 rounded-full flex items-center justify-center backdrop-blur-sm"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <div className="w-8 h-8 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_red]" />
          </motion.div>
        </div>

        {/* Recording Indicator */}
        <div className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-[0_0_10px_red] animate-pulse" />
      </div>

      {/* Floating Hands */}
      <motion.div
        className="absolute left-4 top-1/2 w-8 h-8 bg-slate-300 rounded-full"
        animate={{ x: [0, -5, 0], rotate: [-10, 10, -10] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.div
        className="absolute right-4 top-1/2 w-8 h-8 bg-slate-300 rounded-full"
        animate={{ x: [0, 5, 0], rotate: [10, -10, 10] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      />
    </motion.div>
  )
}
