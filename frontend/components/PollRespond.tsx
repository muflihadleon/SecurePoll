"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { usePoll } from "@/hooks/usePoll";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useParams } from "next/navigation";

export const PollRespond = () => {
  const params = useParams();
  const pollAddress = params?.address as `0x${string}` | undefined;

  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const {
    metadata,
    voteCount,
    isSubmitting,
    message,
    encryptionProgress,
    submitVotes,
  } = usePoll({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    pollAddress,
  });

  const [optionCount, setOptionCount] = useState<number>(0);
  const [options, setOptions] = useState<string[]>([]);
  const [votes, setVotes] = useState<number[]>([]);

  useEffect(() => {
    if (!pollAddress || !ethersReadonlyProvider) return;

    const loadOptionCount = async () => {
      try {
        const pollABI = [
          "function optionCount() external view returns (uint8)",
        ];

        const pollContract = new ethers.Contract(
          pollAddress,
          pollABI,
          ethersReadonlyProvider
        );

        const count = await pollContract.optionCount();
        const countNum = Number(count);
        setOptionCount(countNum);

        const placeholderOptions = Array.from(
          { length: countNum },
          (_, i) => `OPTION ${String(i + 1).padStart(2, '0')}`
        );
        setOptions(placeholderOptions);
        setVotes(new Array(countNum).fill(0));
      } catch (error) {
        console.error("Error loading option count:", error);
      }
    };

    loadOptionCount();
  }, [pollAddress, ethersReadonlyProvider]);

  const handleVoteChange = (index: number, value: number) => {
    const newVotes = [...votes];
    newVotes[index] = value;
    setVotes(newVotes);
  };

  const handleSubmit = async () => {
    if (votes.some((v) => v === 0)) {
      alert("PLEASE_VOTE_ON_ALL_OPTIONS");
      return;
    }

    await submitVotes(votes);
  };

  if (!metadata || optionCount === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-slate-800 border-t-magenta-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
            </div>
          </div>
          <div className="mt-6 text-lg text-cyan-400 font-mono font-bold tracking-wider animate-pulse">
            &gt; LOADING_POLL_DATA...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Card */}
      <div className="relative mb-8 bg-gradient-to-r from-slate-900 via-purple-900/20 to-slate-900 border-2 border-cyan-500/30 p-8 overflow-hidden group hover:border-cyan-500/60 transition-all duration-300">
        {/* Animated Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        
        <div className="relative z-10">
          {/* Poll Title */}
          <div className="mb-6">
            <div className="inline-block px-4 py-1 bg-cyan-500/20 border border-cyan-500/50 mb-3">
              <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">SECURE_POLL</span>
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-white mb-4 leading-tight">
              {metadata.name}
            </h1>
            <p className="text-xl text-gray-300 font-light leading-relaxed max-w-3xl">
              {metadata.details}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-8 pt-6 border-t border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-mono">DEADLINE</div>
                <div className="text-sm font-bold text-white">
                  {new Date(Number(metadata.endTime) * 1000).toLocaleDateString('zh-CN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-magenta-500/20 border border-magenta-500/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-magenta-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-mono">TOTAL_VOTES</div>
                <div className="text-sm font-bold text-white">
                  <span className="text-2xl text-magenta-400">{Number(voteCount)}</span> participants
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voting Interface */}
      <div className="relative bg-slate-900/80 border-2 border-magenta-500/30 p-10 backdrop-blur-md">
        {/* Title */}
        <div className="mb-10">
          <h2 className="text-4xl font-black mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-magenta-400 neon-glow-cyan">
              CAST_YOUR_VOTE
            </span>
          </h2>
          <p className="text-gray-400 font-mono text-sm">
            SELECT 1-5 FOR EACH OPTION (1=STRONGLY_DISAGREE, 5=STRONGLY_AGREE)
          </p>
        </div>

        {/* Options */}
        <div className="space-y-8 mb-10">
          {options.map((option, index) => (
            <div key={index} className="group">
              {/* Option Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-magenta-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-black text-cyan-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {option}
                  </h3>
                </div>
              </div>

              {/* Voting Buttons */}
              <div className="ml-16">
                <div className="flex items-center gap-3 mb-3">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleVoteChange(index, value)}
                      disabled={isSubmitting}
                      className={`relative flex-1 h-20 border-2 transition-all duration-300 group/btn overflow-hidden ${
                        votes[index] === value
                          ? "bg-gradient-to-br from-cyan-500 to-magenta-500 border-cyan-400 scale-105 shadow-lg shadow-cyan-500/50"
                          : "bg-slate-800/50 border-slate-600 hover:border-cyan-500/50 hover:scale-105"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {/* Button Background Effect */}
                      <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700`}></div>
                      
                      {/* Button Content */}
                      <div className="relative z-10 flex flex-col items-center justify-center h-full">
                        <span className={`text-3xl font-black ${
                          votes[index] === value ? "text-white" : "text-gray-400 group-hover/btn:text-cyan-400"
                        }`}>
                          {value}
                        </span>
                      </div>

                      {/* Selected Indicator */}
                      {votes[index] === value && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Scale Labels */}
                <div className="flex justify-between text-xs text-gray-500 font-mono px-2">
                  <span>STRONGLY_DISAGREE</span>
                  <span>NEUTRAL</span>
                  <span>STRONGLY_AGREE</span>
                </div>
              </div>

              {/* Divider */}
              {index < options.length - 1 && (
                <div className="mt-8 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
              )}
            </div>
          ))}
        </div>

        {/* Encryption Progress */}
        {encryptionProgress.total > 0 && (
          <div className="mb-8 bg-slate-800/50 border-2 border-cyan-500/30 p-6">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-cyan-400 font-bold font-mono">
                  ENCRYPTING_VOTES...
                </span>
              </div>
              <span className="text-gray-400 font-mono">
                {encryptionProgress.current} / {encryptionProgress.total}
              </span>
            </div>
            <div className="relative w-full bg-slate-900 h-3 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-magenta-500 transition-all duration-300 rounded-full"
                style={{
                  width: `${(encryptionProgress.current / encryptionProgress.total) * 100}%`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mb-8 p-6 border-l-4 font-mono ${
              message.includes("success") || message.includes("completed")
                ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                : message.includes("error") || message.includes("failed")
                ? "bg-red-500/10 border-red-500 text-red-400"
                : "bg-magenta-500/10 border-magenta-500 text-magenta-400"
            }`}
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 text-sm leading-relaxed break-all">
                {message}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-8 border-t-2 border-slate-700/50">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || votes.some((v) => v === 0)}
            className="flex-1 relative px-8 py-5 bg-gradient-to-r from-magenta-600 via-purple-600 to-cyan-600 text-white font-black text-lg uppercase tracking-wider overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-2xl hover:shadow-magenta-500/50"
          >
            {/* Button Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            
            {/* Button Content */}
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  SUBMITTING...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  SUBMIT_ENCRYPTED_VOTES
                </>
              )}
            </span>
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 relative bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-magenta-500/10 border border-cyan-500/30 p-6">
          <div className="absolute top-3 left-3">
            <svg className="w-8 h-8 text-cyan-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="ml-14 space-y-2 text-sm text-cyan-300">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">●</span>
              <span>YOUR VOTES ARE ENCRYPTED USING FHEVM TECHNOLOGY</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">●</span>
              <span>ONLY AGGREGATED STATS CAN BE DECRYPTED BY POLL OWNER</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-magenta-400">●</span>
              <span>YOUR INDIVIDUAL VOTES REMAIN PERMANENTLY PRIVATE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
