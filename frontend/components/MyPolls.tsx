"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import Link from "next/link";

export const MyPolls = () => {
  const { ethersReadonlyProvider, accounts, isConnected } = useMetaMaskEthersSigner();
  const [myPolls, setMyPolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [factoryAddress, setFactoryAddress] = useState<string | undefined>();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pollFactoryAddress");
      if (stored) {
        setFactoryAddress(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (!ethersReadonlyProvider || !accounts || accounts.length === 0 || !factoryAddress || !isConnected) {
      setMyPolls([]);
      return;
    }

    const loadMyPolls = async () => {
      setIsLoading(true);
      try {
        const factoryABI = [
          "function getPollsByOwner(address _owner) external view returns (address[])",
        ];

        const factory = new ethers.Contract(
          factoryAddress,
          factoryABI,
          ethersReadonlyProvider
        );

        const pollAddresses: string[] = await factory.getPollsByOwner(accounts[0]);

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
          };
        });

        const loadedPolls = await Promise.all(pollPromises);
        setMyPolls(loadedPolls);
      } catch (e: any) {
        console.error("Error loading my polls:", e);
        setMyPolls([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMyPolls();
  }, [ethersReadonlyProvider, accounts, factoryAddress, isConnected]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-700">Please connect your wallet to view your polls</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
        My Polls
      </h1>

      {myPolls.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-700 font-semibold mb-4">You haven't created any polls yet.</p>
          <Link
            href="/create"
            className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-bold"
          >
            Create Your First Poll
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myPolls.map((poll) => (
            <Link
              key={poll.address}
              href={`/poll/${poll.address}/results`}
              className="block bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-100 hover:border-orange-400 transition-all hover:shadow-xl"
            >
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">{poll.name}</h2>
              <p className="text-gray-700 mb-4 line-clamp-2 font-medium">{poll.details}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-bold">Votes: {Number(poll.voteCount)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  poll.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {poll.isOpen ? "Open" : "Closed"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};




