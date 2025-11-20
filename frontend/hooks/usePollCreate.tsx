"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useMetaMaskEthersSigner } from "./metamask/useMetaMaskEthersSigner";

export type CreatePollParams = {
  name: string;
  details: string;
  endTime: number;
  optionCount: number;
};

export const usePollCreate = () => {
  const { ethersSigner, chainId, isConnected } = useMetaMaskEthersSigner();
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [factoryAddress, setFactoryAddress] = useState<string | undefined>(
    undefined
  );

  // Load factory address on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pollFactoryAddress");
      if (stored) {
        setFactoryAddress(stored);
      }
    }
  }, []);

  const createPoll = useCallback(
    async (params: CreatePollParams): Promise<string | null> => {
      // Check wallet connection
      if (!ethersSigner || !chainId || !isConnected) {
        setMessage("Please connect your wallet first");
        return null;
      }

      // Check factory address
      if (!factoryAddress) {
        setMessage("Factory address not configured. Please set it in browser console: localStorage.setItem('pollFactoryAddress', '0x...')");
        return null;
      }

      setIsCreating(true);
      setMessage("Creating poll...");

      try {
        // Factory contract ABI
        const factoryABI = [
          "function createPoll(string memory _name, string memory _details, uint256 _endTime, uint8 _optionCount) external returns (address pollAddress)",
          "event PollCreated(address indexed poll, address indexed owner, string name, uint256 endTime)",
        ];

        const factory = new ethers.Contract(
          factoryAddress,
          factoryABI,
          ethersSigner
        );

        setMessage("Sending transaction...");

        // Call createPoll
        const tx = await factory.createPoll(
          params.name,
          params.details,
          params.endTime,
          params.optionCount
        );

        setMessage("Waiting for confirmation...");
        const receipt = await tx.wait();

        if (!receipt) {
          setMessage("Transaction failed");
          return null;
        }

        // Extract poll address from event
        const event = receipt.logs.find((log: any) => {
          try {
            const parsed = factory.interface.parseLog(log);
            return parsed && parsed.name === "PollCreated";
          } catch {
            return false;
          }
        });

        let pollAddress: string | null = null;

        if (event) {
          const parsed = factory.interface.parseLog(event);
          if (parsed) {
            pollAddress = parsed.args.poll as string;
          }
        }

        // Fallback: try to get from transaction receipt
        if (!pollAddress && receipt.contractAddress) {
          pollAddress = receipt.contractAddress;
        }

        if (!pollAddress) {
          setMessage("Poll created but address not found");
          return null;
        }

        setMessage("Poll created successfully!");
        return pollAddress;
      } catch (error: any) {
        console.error("Create poll error:", error);
        setMessage(`Failed: ${error.message || error}`);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [ethersSigner, chainId, isConnected, factoryAddress]
  );

  return {
    createPoll,
    isCreating,
    message,
    factoryAddress,
    setFactoryAddress,
  };
};




