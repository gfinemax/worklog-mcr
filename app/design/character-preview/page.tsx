import { TVCharacter } from "@/components/characters/tv-character"
import { MicBuddy } from "@/components/characters/mic-buddy"
import { CamBot } from "@/components/characters/cam-bot"

export default function CharacterPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Character Concepts</h1>
      <p className="text-center text-slate-400 mb-12">Select a character style for the login screen</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Option 1 */}
        <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="w-full h-[320px] flex items-center justify-center">
            <TVCharacter />
          </div>
          <h2 className="text-xl font-bold text-blue-400">Option 1: TV Monitor</h2>
          <p className="text-sm text-slate-400 text-center">
            A classic monitor character with a mesh gradient screen face. Friendly, informative, and fits the MCR
            context perfectly.
          </p>
        </div>

        {/* Option 2 */}
        <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="w-full h-[320px] flex items-center justify-center">
            <MicBuddy />
          </div>
          <h2 className="text-xl font-bold text-purple-400">Option 2: Mic Buddy</h2>
          <p className="text-sm text-slate-400 text-center">
            A stylized microphone character. Represents audio/broadcasting. Has a sleek, modern look with a softer
            personality.
          </p>
        </div>

        {/* Option 3 */}
        <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="w-full h-[320px] flex items-center justify-center">
            <CamBot />
          </div>
          <h2 className="text-xl font-bold text-blue-500">Option 3: Cam Bot</h2>
          <p className="text-sm text-slate-400 text-center">
            A camera lens inspired character. Highly technical, observant, and "focused". Uses the mesh gradient as the
            lens reflection.
          </p>
        </div>
      </div>
    </div>
  )
}
