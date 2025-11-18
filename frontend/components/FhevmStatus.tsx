"use client";

import { useEffect, useMemo } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";

export const FhevmStatus = () => {
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    ethersReadonlyProvider,
  } = useMetaMaskEthersSigner();

  const { status, error } = useFhevm({
    provider: provider,
    chainId: chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: true,
  });

  useEffect(() => {
    // trace current readonly node (useful to debug wrong-network)
    if (ethersReadonlyProvider && chainId) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      (async () => {
        try {
          // best effort, ignore errors
          const bn = await (ethersReadonlyProvider as any).getBlockNumber?.();
          console.log(`[FhevmStatus] chainId=${chainId} blockNumber=${bn}`);
        } catch {}
      })();
    }
  }, [ethersReadonlyProvider, chainId]);

  const badge = useMemo(() => {
    switch (status) {
      case "idle":
        return { color: "text-gray-400 border-gray-500", text: "IDLE" };
      case "loading":
        return { color: "text-cyan-400 border-cyan-500", text: "LOADING" };
      case "ready":
        return { color: "text-green-400 border-green-500", text: "READY" };
      case "error":
        return { color: "text-red-400 border-red-500", text: "ERROR" };
      default:
        return { color: "text-gray-400 border-gray-500", text: String(status) };
    }
  }, [status]);

  const shortAccount =
    accounts && accounts.length > 0
      ? `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`
      : "DISCONNECTED";

  return (
    <div className="container mx-auto px-6 mb-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div
          className={`px-3 py-1 border ${badge.color} font-mono text-xs uppercase`}
        >
          FHEVM: {badge.text}
        </div>
        <div className="px-3 py-1 border border-cyan-500 text-cyan-400 font-mono text-xs uppercase">
          Chain: {chainId ?? "N/A"}
        </div>
        <div className="px-3 py-1 border border-magenta-500 text-magenta-400 font-mono text-xs uppercase">
          Wallet: {isConnected ? shortAccount : "DISCONNECTED"}
        </div>
        {status === "error" && error && (
          <div className="px-3 py-1 border border-red-500 text-red-400 font-mono text-xs truncate max-w-full">
            {error.message ?? String(error)}
          </div>
        )}
      </div>
    </div>
  );
};


