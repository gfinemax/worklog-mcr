"use client"

import { MeshGradient } from "@paper-design/shaders-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

export function RobotMascot() {
  // Added white for highlights and a deeper blue for contrast, while keeping the cyan theme
  const colors = [
    "#67e8f9", // Cyan 300
    "#22d3ee", // Cyan 400
    "#cffafe", // Cyan 100 (Highlight)
    "#0891b2", // Cyan 600 (Shadow)
    "#ffffff", // White (Specular)
  ]

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [featureOffset, setFeatureOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const element = document.querySelector("#robot-mascot")
    if (element) {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const deltaX = (mousePosition.x - centerX) * 0.12
      const deltaY = (mousePosition.y - centerY) * 0.12

      const maxOffset = 15
      setFeatureOffset({
        x: Math.max(-maxOffset, Math.min(maxOffset, deltaX)),
        y: Math.max(-maxOffset, Math.min(maxOffset, deltaY)),
      })
    }
  }, [mousePosition])

  return (
    <motion.div
      id="robot-mascot"
      className="relative w-64 h-64 mx-auto"
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
    >
      {/* Left Antenna */}
      <motion.div
        className="absolute -top-12 left-10 w-4 h-20 bg-slate-900 rounded-full origin-bottom -z-10"
        animate={{ rotate: [-5, -15, -5] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <motion.div
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
          initial={{ backgroundColor: "#22d3ee", boxShadow: "0 0 10px rgba(34,211,238,0.6)" }}
          animate={{
            backgroundColor: ["#22d3ee", "#ffffff", "#22d3ee", "#0891b2", "#22d3ee"],
            boxShadow: [
              "0 0 10px rgba(34,211,238,0.6)", // Normal glow
              "0 0 30px rgba(255,255,255,0.8)", // Bright flash
              "0 0 10px rgba(34,211,238,0.6)", // Normal glow
              "0 0 5px rgba(8,145,178,0.4)", // Dimmer glow
              "0 0 10px rgba(34,211,238,0.6)", // Back to normal
            ],
          }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Right Antenna */}
      <motion.div
        className="absolute -top-12 right-10 w-4 h-20 bg-slate-900 rounded-full origin-bottom -z-10"
        animate={{ rotate: [5, 15, 5] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
      >
        <motion.div
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
          initial={{ backgroundColor: "#22d3ee", boxShadow: "0 0 10px rgba(34,211,238,0.6)" }}
          animate={{
            backgroundColor: ["#22d3ee", "#ffffff", "#22d3ee", "#0891b2", "#22d3ee"],
            boxShadow: [
              "0 0 10px rgba(34,211,238,0.6)",
              "0 0 30px rgba(255,255,255,0.8)",
              "0 0 10px rgba(34,211,238,0.6)",
              "0 0 5px rgba(8,145,178,0.4)",
              "0 0 10px rgba(34,211,238,0.6)",
            ],
          }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
        />
      </motion.div>

      {/* Feet */}
      <div className="absolute -bottom-3 left-16 w-7 h-9 bg-slate-900 rounded-full -rotate-[20deg] -z-10" />
      <div className="absolute -bottom-3 right-16 w-7 h-9 bg-slate-900 rounded-full rotate-[20deg] -z-10" />

      {/* Body (Mesh Gradient) */}
      <div className="relative w-full h-full rounded-full overflow-hidden border-[3px] border-cyan-200/50 shadow-[0_0_50px_rgba(34,211,238,0.6)] z-10">
        <MeshGradient colors={colors} speed={0.8} />

        <div className="absolute top-3 left-8 w-24 h-12 bg-white/50 rounded-full blur-lg rotate-[-20deg]" />
      </div>

      {/* Face Screen - Static relative to body now */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[82%] h-[76%] bg-black/90 rounded-[48%] z-20 shadow-[inset_0_0_20px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
        {/* Face Elements Group - Moves with Mouse */}
        <motion.div
          className="relative w-full h-full flex items-center justify-center"
          animate={{
            x: featureOffset.x,
            y: featureOffset.y,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        >
          {/* Left Eye (Orange Circle) */}
          <div className="absolute left-[22%] top-[32%]">
            <motion.div
              className="w-9 h-9 border-[5px] border-[#ff9f43] rounded-full shadow-[0_0_10px_rgba(255,159,67,0.5)]"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 0.2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 4 }}
            />
          </div>

          {/* Right Eye (Wink < Shape) */}
          <div className="absolute right-[22%] top-[32%]">
            <div className="w-9 h-9 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 36 36" className="drop-shadow-[0_0_5px_rgba(255,159,67,0.5)]">
                <path
                  d="M26 8 L10 18 L26 28"
                  fill="none"
                  stroke="#ff9f43"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Mouth (Banana Smile) */}
          <div className="absolute top-[52%] left-1/2 -translate-x-1/2">
            <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-[0_0_8px_rgba(163,230,53,0.6)]">
              <path
                d="M8 14 C8 14 14 34 24 34 C34 34 40 14 40 14 C40 14 34 24 24 24 C14 24 8 14 8 14 Z"
                fill="#a3e635" // Lime-400
                stroke="none"
              />
            </svg>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
