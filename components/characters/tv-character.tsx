"use client"

import { MeshGradient } from "@paper-design/shaders-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

export function TVCharacter() {
  const colors = ["#FFB3D9", "#87CEEB", "#4A90E2", "#2C3E50", "#1A1A2E"]

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
    const rect = document.querySelector("#tv-character")?.getBoundingClientRect()
    if (rect) {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = (mousePosition.x - centerX) * 0.06
      const deltaY = (mousePosition.y - centerY) * 0.06
      const maxOffset = 6
      setEyeOffset({
        x: Math.max(-maxOffset, Math.min(maxOffset, deltaX)),
        y: Math.max(-maxOffset, Math.min(maxOffset, deltaY)),
      })
    }
  }, [mousePosition])

  return (
    <motion.div
      id="tv-character"
      className="relative w-full max-w-[280px] aspect-square mx-auto"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
    >
      {/* Antenna */}
      <motion.div
        className="absolute -top-8 left-1/2 w-1 h-10 bg-slate-400 rounded-full origin-bottom"
        style={{ x: "-50%" }}
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
      </motion.div>

      {/* TV Body Container */}
      <div className="relative w-full h-full bg-slate-800 rounded-[2rem] p-4 shadow-xl border-b-8 border-r-4 border-slate-900">
        {/* Screen Area (Masked Mesh Gradient) */}
        <div className="relative w-full h-full bg-black rounded-[1.5rem] overflow-hidden border-4 border-slate-700 shadow-inner">
          <div className="absolute inset-0 opacity-80">
            <MeshGradient colors={colors} speed={0.5} />
          </div>

          {/* Scanlines Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30" />

          {/* Face Container */}
          <div className="absolute inset-0 flex items-center justify-center gap-8">
            <motion.div
              className="w-12 h-12 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
              animate={{ x: eyeOffset.x, y: eyeOffset.y, scaleY: [1, 0.1, 1] }}
              transition={{
                x: { type: "spring", stiffness: 150, damping: 15 },
                y: { type: "spring", stiffness: 150, damping: 15 },
                scaleY: { duration: 0.2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 },
              }}
            />
            <motion.div
              className="w-12 h-12 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
              animate={{ x: eyeOffset.x, y: eyeOffset.y, scaleY: [1, 0.1, 1] }}
              transition={{
                x: { type: "spring", stiffness: 150, damping: 15 },
                y: { type: "spring", stiffness: 150, damping: 15 },
                scaleY: { duration: 0.2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 },
              }}
            />
          </div>

          {/* Mouth/Expression */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 w-8 h-4 border-b-4 border-white rounded-full opacity-80"
            animate={{ scaleX: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>

        {/* Controls */}
        <div className="absolute right-[-12px] top-12 flex flex-col gap-2">
          <div className="w-3 h-6 bg-slate-600 rounded-r-md" />
          <div className="w-3 h-6 bg-slate-600 rounded-r-md" />
        </div>
      </div>
    </motion.div>
  )
}
