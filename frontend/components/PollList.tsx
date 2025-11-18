"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { usePollList } from "@/hooks/usePollList";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import Link from "next/link";
import { PollDecryptModal } from "./PollDecryptModal";

export const PollList = () => {
  const { polls, isLoading, error, refresh } = usePollList();
  const { ethersReadonlyProvider, accounts } = useMetaMaskEthersSigner();
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [selectedPoll, setSelectedPoll] = useState<{
    address: `0x${string}`;
    name: string;
  } | null>(null);

  // Check which polls user has voted on
  useEffect(() => {
    if (!ethersReadonlyProvider || !accounts || accounts.length === 0 || polls.length === 0) {
      return;
    }

    const checkUserVotes = async () => {
      const userAddress = accounts[0].toLowerCase();
      const votes: Record<string, boolean> = {};

      const pollABI = [
        "function getVoteCount() external view returns (uint256)",
        "function votes(uint256) external view returns (address voter, bytes32[] votes, bytes[] inputProofs, uint256 timestamp, bool isProcessed)",
        "event VoteSubmitted(uint256 indexed voteId, address indexed voter, uint256 timestamp)",
      ];

      for (const poll of polls) {
        try {
          const contract = new ethers.Contract(
            poll.address,
            pollABI,
            ethersReadonlyProvider
          );

          try {
            const currentBlock = await (ethersReadonlyProvider as unknown as ethers.Provider).getBlockNumber();
            const events = await contract.queryFilter(
              contract.filters.VoteSubmitted(null, userAddress),
              0,
              currentBlock
            );
            votes[poll.address] = events.length > 0;
          } catch {
            const voteCount = Number(await contract.getVoteCount());
            let hasVoted = false;
            for (let i = 0; i < voteCount && i < 50; i++) {
              try {
                const vote = await contract.votes(i);
                if (vote.voter?.toLowerCase() === userAddress) {
                  hasVoted = true;
                  break;
                }
              } catch {
                continue;
              }
            }
            votes[poll.address] = hasVoted;
          }
        } catch (e) {
          votes[poll.address] = false;
        }
      }

      setUserVotes(votes);
    };

    checkUserVotes();
  }, [ethersReadonlyProvider, accounts, polls]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-700 border-t-cyan-500 animate-spin"></div>
          <div className="mt-4 text-center text-cyan-400 font-mono font-bold tracking-wider">LOADING_DATA...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-900/30 border-2 border-red-500 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-mono font-bold text-red-400 mb-2 tracking-wider">ERROR_LOADING_POLLS</h3>
          <p className="text-gray-400 mb-6 font-mono">{error}</p>
        </div>
        <button
          onClick={refresh}
          className="px-8 py-3 bg-transparent border-2 border-red-500 text-red-400 font-mono font-bold uppercase tracking-wider hover:bg-red-500 hover:text-black transition-all"
        >
          [RETRY]
        </button>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-8">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <div className="w-32 h-32 mx-auto bg-slate-800 border-2 border-cyan-500 flex items-center justify-center neon-border-cyan">
              <svg className="w-16 h-16 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400 mb-3 tracking-wider neon-glow-cyan">
            NO_POLLS_FOUND
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed font-mono">
            &gt; INITIATE_FIRST_ENCRYPTED_POLL<br/>
            &gt; VOTES_SECURED_BY_FHEVM<br/>
            &gt; MAXIMUM_PRIVACY_GUARANTEED
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-magenta-600 to-purple-600 text-white font-mono font-bold uppercase tracking-wider hover:from-magenta-500 hover:to-purple-500 transition-all neon-border-magenta"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            [CREATE_POLL]
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-magenta-400 to-purple-400 mb-3 tracking-wider neon-glow-cyan">
              &gt; ACTIVE_POLLS
            </h1>
            <p className="text-gray-400 text-lg font-mono">//_ ENCRYPTED_VOTING_SYSTEM _v2.0</p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-magenta-600 to-purple-600 text-white font-mono font-bold uppercase tracking-wider hover:from-magenta-500 hover:to-purple-500 transition-all neon-border-magenta"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            [NEW_POLL]
          </Link>
        </div>
      </div>

      {/* Poll List - Table View */}
      <div className="space-y-4">
        {polls.map((poll, index) => {
          const hasVoted = userVotes[poll.address] || false;
          return (
            <div
              key={poll.address}
              className="group block bg-slate-900/50 border-l-4 border-cyan-500 hover:border-magenta-500 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="p-6 flex items-center justify-between gap-6">
                {/* Index */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-slate-800 border border-cyan-500/50 flex items-center justify-center">
                    <span className="text-cyan-400 font-mono font-black text-lg">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-mono font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                      {poll.name}
                    </h2>
                    {poll.isOpen ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 border border-cyan-500 text-cyan-400 text-xs font-mono font-bold">
                        <span className="w-2 h-2 bg-cyan-400 animate-pulse"></span>
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-800 border border-gray-600 text-gray-400 text-xs font-mono font-bold">
                        CLOSED
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 mb-3 line-clamp-1 font-mono text-sm">
                    {poll.details}
                  </p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-500 font-mono">
                      <span className="text-cyan-400">■</span>
                      <span className="font-bold">DEADLINE:</span>
                      <span>{new Date(Number(poll.endTime) * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 font-mono">
                      <span className="text-magenta-400">■</span>
                      <span className="font-bold">VOTES:</span>
                      <span className="text-magenta-400 font-black">{Number(poll.voteCount)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  {hasVoted && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedPoll({
                          address: poll.address as `0x${string}`,
                          name: poll.name,
                        });
                      }}
                      className="px-4 py-2 bg-transparent border border-cyan-500 text-cyan-400 font-mono font-bold uppercase text-xs tracking-wider hover:bg-cyan-500 hover:text-black transition-all"
                    >
                      [DECRYPT]
                    </button>
                  )}
                  <Link
                    href={`/poll/${poll.address}`}
                    className="px-6 py-2 bg-slate-800 border border-magenta-500/50 text-magenta-400 font-mono font-bold uppercase text-xs tracking-wider hover:bg-magenta-500 hover:text-black transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hasVoted ? "[VIEW]" : "[VOTE_NOW]"}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Decrypt Modal */}
      {selectedPoll && (
        <PollDecryptModal
          pollAddress={selectedPoll.address}
          isOpen={!!selectedPoll}
          onClose={() => setSelectedPoll(null)}
          pollName={selectedPoll.name}
        />
      )}
    </div>
  );
};
