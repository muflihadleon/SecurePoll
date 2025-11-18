"use client";

import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";

export const WalletConnect = () => {
  const { isConnected, connect, error: metaMaskError } = useMetaMask();
  const { accounts, chainId } = useMetaMaskEthersSigner();

  const handleConnect = () => {
    connect();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && accounts && accounts.length > 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-cyan-500/50 neon-border-cyan">
          <div className="w-2 h-2 bg-cyan-400 animate-pulse"></div>
          <span className="text-xs font-mono font-bold text-cyan-400">
            {formatAddress(accounts[0])}
          </span>
        </div>
        {chainId && (
          <div className="px-3 py-2 bg-slate-800 border border-magenta-500/50">
            <span className="text-xs font-mono font-bold text-magenta-400">
              CHAIN:{chainId === 31337 ? "LOCAL" : chainId}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="group relative px-5 py-2 bg-slate-800 border-2 border-cyan-500 text-cyan-400 font-mono font-bold uppercase text-sm tracking-wider hover:bg-cyan-500 hover:text-black transition-all duration-300 neon-border-cyan"
    >
      <span className="relative z-10 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        [CONNECT]
      </span>
      {metaMaskError && (
        <div className="absolute -bottom-8 left-0 right-0 text-xs text-red-400 text-center font-mono">
          ERROR: {metaMaskError.message}
        </div>
      )}
    </button>
  );
};
