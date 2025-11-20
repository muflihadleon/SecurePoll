"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMetaMaskEthersSigner } from "./metamask/useMetaMaskEthersSigner";

export type PollListItem = {
  address: string;
  name: string;
  details: string;
  endTime: bigint;
  voteCount: bigint;
  isOpen: boolean;
  owner: string;
};

export const usePollList = () => {
  const { ethersReadonlyProvider, chainId, isConnected } =
    useMetaMaskEthersSigner();

  const [polls, setPolls] = useState<PollListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [factoryAddress, setFactoryAddress] = useState<string | undefined>(
    undefined
  );

  // Load factory address from deployments or environment
  useEffect(() => {
    // In production, this would come from deployments JSON or env vars
    // For now, we'll try to load from localStorage or use a placeholder
    const stored = localStorage.getItem("pollFactoryAddress");
    if (stored) {
      setFactoryAddress(stored);
    }
  }, []);

  const loadPolls = useCallback(async () => {
    if (!ethersReadonlyProvider || !chainId || !factoryAddress || !isConnected) {
      setPolls([]);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      // Factory contract ABI
      const factoryABI = [
        "function getAllPolls() external view returns (address[])",
      ];

      const factory = new ethers.Contract(
        factoryAddress,
        factoryABI,
        ethersReadonlyProvider
      );

      const pollAddresses: string[] = await factory.getAllPolls();

      // For each poll, get metadata
      const pollABI = [
        "function getInfo() external view returns (address owner, string memory name, string memory details, uint256 endTime, uint256 startTime, bool isOpen)",
        "function getVoteCount() external view returns (uint256)",
      ];

      const pollPromises = pollAddresses.map(async (address) => {
        const pollContract = new ethers.Contract(
          address,
          pollABI,
          ethersReadonlyProvider
        );

        const [info, voteCount] = await Promise.all([
          pollContract.getInfo(),
          pollContract.getVoteCount(),
        ]);

        return {
          address,
          name: info.name,
          details: info.details,
          endTime: info.endTime,
          voteCount: voteCount,
          isOpen: info.isOpen,
          owner: info.owner,
        };
      });

      const loadedPolls = await Promise.all(pollPromises);
      setPolls(loadedPolls);
    } catch (e: any) {
      console.error("Error loading polls:", e);
      setError(e.message || "Failed to load polls");
      setPolls([]);
    } finally {
      setIsLoading(false);
    }
  }, [ethersReadonlyProvider, chainId, factoryAddress, isConnected]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  const refresh = useCallback(() => {
    loadPolls();
  }, [loadPolls]);

  return {
    polls,
    isLoading,
    error,
    refresh,
    factoryAddress,
    setFactoryAddress,
  };
};




