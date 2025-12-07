"use client"

import { useActionState } from "react"
import { adminLogin } from "../actions"
import { ShieldCheck } from "lucide-react"

export default function AdminLogin() {
  const [state, formAction, isPending] = useActionState(adminLogin, null)

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm p-8 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-cyan-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wider">SYSTEM CONFIG</h1>
          <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Authorized Personnel Only</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <input 
              name="password" 
              type="password" 
              placeholder="ACCESS CODE" 
              className="w-full bg-slate-900 border border-slate-700 text-center text-white font-mono tracking-[0.5em] py-3 rounded focus:outline-none focus:border-cyan-500 transition-colors placeholder:tracking-normal placeholder:font-sans"
              autoFocus
            />
          </div>
          
          {state?.error && (
            <div className="text-red-400 text-xs text-center font-mono">{state.error}</div>
          )}

          <button 
            disabled={isPending}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded transition-colors disabled:opacity-50"
          >
            {isPending ? "VERIFYING..." : "UNLOCK TERMINAL"}
          </button>
        </form>
      </div>
    </div>
  )
}

