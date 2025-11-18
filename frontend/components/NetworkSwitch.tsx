"use client";

import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useState } from "react";

export const NetworkSwitch = () => {
  const { provider, chainId } = useMetaMaskEthersSigner();
  const { isConnected } = useMetaMask();
  const [isSwitching, setIsSwitching] = useState(false);

  const switchToLocalNetwork = async () => {
    if (!provider || !isConnected) {
      return;
    }

    setIsSwitching(true);
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x7a69",
                chainName: "Local Hardhat",
                nativeCurrency: {
                  name: "Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["http://localhost:8545"],
                blockExplorerUrls: [],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add local network:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isConnected || chainId === 31337) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-slate-900 border-2 border-yellow-500 neon-border-cyan p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-mono font-bold text-yellow-400 mb-1">
              ⚠ WRONG_NETWORK
            </h3>
            <p className="text-xs text-yellow-300 mb-3 font-mono">
              SWITCH_TO: HARDHAT_LOCAL (31337)
            </p>
            <button
              onClick={switchToLocalNetwork}
              disabled={isSwitching}
              className="w-full px-4 py-2 bg-transparent border border-yellow-500 text-yellow-400 font-mono font-bold uppercase text-xs tracking-wider hover:bg-yellow-500 hover:text-black transition-all disabled:opacity-50"
            >
              {isSwitching ? "[SWITCHING...]" : "[SWITCH_NETWORK]"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
