"use client";

import Link from "next/link";
import { WalletConnect } from "./WalletConnect";

export const Navbar = () => {
  return (
    <nav className="mb-8 border-b border-cyan-500/30 bg-slate-900/50 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-magenta-500 clip-path-polygon relative neon-border-cyan">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-xl">S</span>
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-magenta-400 to-purple-400 neon-glow-cyan">
                SECUREPOLL
              </h1>
              <p className="text-xs text-cyan-400 font-mono tracking-widest mt-0.5">&lt;ENCRYPTED_VOTING/&gt;</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/my-polls"
              className="group relative px-5 py-2 bg-transparent border-2 border-cyan-500 text-cyan-400 font-mono font-bold uppercase text-sm tracking-wider hover:bg-cyan-500 hover:text-black transition-all duration-300 clip-path-octagon"
            >
              <span className="relative z-10">[MY_POLLS]</span>
            </Link>
            <Link
              href="/create"
              className="group relative px-5 py-2 bg-gradient-to-r from-magenta-600 to-purple-600 text-white font-mono font-bold uppercase text-sm tracking-wider hover:from-magenta-500 hover:to-purple-500 transition-all duration-300 neon-border-magenta"
            >
              <span className="relative z-10">[+CREATE]</span>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
};
