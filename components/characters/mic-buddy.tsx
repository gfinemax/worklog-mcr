"use client"

import { MeshGradient } from "@paper-design/shaders-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

export function MicBuddy() {
  const colors = ["#4f46e5", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"]
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const rect = document.querySelector("#mic-buddy")?.getBoundingClientRect()
    if (rect) {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = (mousePosition.x - centerX) * 0.1
      const deltaY = (mousePosition.y - centerY) * 0.1
      const maxOffset = 8
      setEyeOffset({
        x: Math.max(-maxOffset, Math.min(maxOffset, deltaX)),
        y: Math.max(-maxOffset, Math.min(maxOffset, deltaY)),
      })
    }
  }, [mousePosition])

  return (
    <motion.div
      id="mic-buddy"
      className="relative w-full max-w-[240px] mx-auto aspect-[3/4]"
      animate={{ rotate: [-2, 2, -2] }}
      transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
    >
      {/* Mic Head */}
      <div className="relative w-full h-[70%] rounded-full overflow-hidden shadow-2xl border-4 border-slate-200/20">
        <div className="absolute inset-0 bg-slate-200">
          <MeshGradient colors={colors} speed={0.8} />
        </div>

        {/* Grid Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#000_2px,transparent_2px)] [background-size:16px_16px] opacity-20" />

        {/* Face */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
          <div className="flex gap-8 mb-4">
            <motion.div
              className="w-10 h-10 bg-white rounded-full shadow-lg relative"
              animate={{ x: eyeOffset.x, y: eyeOffset.y }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full" />
            </motion.div>
            <motion.div
              className="w-10 h-10 bg-white rounded-full shadow-lg relative"
              animate={{ x: eyeOffset.x, y: eyeOffset.y }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full" />
            </motion.div>
          </div>
          <div className="w-8 h-4 bg-black/20 rounded-full" />
        </div>
      </div>

      {/* Stand Neck */}
      <div className="w-1/3 h-[15%] mx-auto bg-gradient-to-b from-slate-300 to-slate-400" />

      {/* Base */}
      <div className="w-2/3 h-[10%] mx-auto bg-slate-800 rounded-t-full shadow-lg flex items-center justify-center">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
      </div>
    </motion.div>
  )
}
