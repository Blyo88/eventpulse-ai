import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Badge variant="outline" className="border-blue-500 text-blue-400 text-xs tracking-widest uppercase">
          v0.1.0 — Sprint 1
        </Badge>

        <h1 className="text-4xl font-bold text-white tracking-tight">
          EventPulse <span className="text-blue-500">AI</span>
        </h1>

        <p className="text-gray-400 text-sm max-w-sm">
          Core System Online — Next.js · Supabase · Gemini
        </p>

        <div className="flex items-center gap-2 mt-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 text-xs font-mono">Database schema ready</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
      >
        Go to Dashboard
      </Button>
    </main>
  )
}
