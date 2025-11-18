"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { usePoll } from "@/hooks/usePoll";
import { usePollAggregate } from "@/hooks/usePollAggregate";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useParams } from "next/navigation";

export const PollResults = () => {
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
    isRequestingAggregation,
    isDecrypting,
    aggregatedResult,
    message,
    requestAggregation,
    decryptAggregatedResults,
    loadMetadata,
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

  const {
    processAndCommitAggregate,
    isProcessing: isProcessingAggregate,
    message: aggregateMessage,
  } = usePollAggregate({
    pollAddress,
    instance: fhevmInstance,
  });

  // Check if user has voted (for non-owners) - MUST be before any conditional returns
  const [hasVoted, setHasVoted] = useState(false);
  useEffect(() => {
    if (!pollAddress || !ethersReadonlyProvider || !ethersSigner) return;

    const checkVote = async () => {
      try {
        const pollABI = [
          "function getVoteCount() external view returns (uint256)",
          "function votes(uint256) external view returns (address voter, bytes32[] votes, bytes[] inputProofs, uint256 timestamp, bool isProcessed)",
        ];

        const contract = new ethers.Contract(
          pollAddress,
          pollABI,
          ethersReadonlyProvider
        );

        const voteCount = Number(await contract.getVoteCount());
        const userAddress = ethersSigner.address.toLowerCase();

        for (let i = 0; i < voteCount; i++) {
          try {
            const vote = await contract.votes(i);
            if (vote.voter.toLowerCase() === userAddress) {
              setHasVoted(true);
              return;
            }
          } catch {
            continue;
          }
        }
        setHasVoted(false);
      } catch (error) {
        console.error("Error checking vote:", error);
      }
    };

    checkVote();
  }, [pollAddress, ethersReadonlyProvider, ethersSigner]);

  // Early return after all hooks
  if (!metadata) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-cyan-400 font-mono font-bold">LOADING...</div>
        </div>
      </div>
    );
  }

  const isOwner =
    ethersSigner &&
    ethersSigner.address.toLowerCase() === metadata.owner.toLowerCase();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative mb-8 bg-gradient-to-r from-slate-900 via-purple-900/20 to-slate-900 border-2 border-cyan-500/30 p-8">
        <h1 className="text-4xl font-black text-white mb-4">{metadata.name}</h1>
        <p className="text-gray-300 mb-6">{metadata.details}</p>
        <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
          <span>
            <span className="text-cyan-400">■</span> TOTAL_VOTES: {Number(voteCount)}
          </span>
          <span>•</span>
          <span>
            <span className="text-magenta-400">■</span> STATUS: {metadata.isOpen ? "ACTIVE" : "CLOSED"}
          </span>
        </div>
      </div>

      {isOwner ? (
        <div className="space-y-6">
          {!aggregatedResult && (
            <div className="bg-slate-900/80 border-l-4 border-cyan-500 p-8">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400 mb-4 neon-glow-cyan">
                STEP_01: REQUEST_AGGREGATION
              </h2>
              <p className="text-gray-300 mb-6 font-mono text-sm">
                &gt; REQUEST_AGGREGATION_TO_COMPUTE_STATS<br/>
                &gt; COPROCESSORS_WILL_HANDLE_ENCRYPTED_DATA
              </p>
              <button
                onClick={requestAggregation}
                disabled={isRequestingAggregation || Number(voteCount) === 0}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold uppercase tracking-wider hover:from-cyan-500 hover:to-blue-500 transition-all neon-border-cyan disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequestingAggregation ? "[REQUESTING...]" : "[REQUEST_AGGREGATION]"}
              </button>
              {message && (
                <div className="mt-4 p-4 bg-cyan-500/10 border-l-4 border-cyan-500 text-cyan-400 font-mono text-sm">
                  {message}
                </div>
              )}
            </div>
          )}

          {!aggregatedResult && (
            <div className="bg-slate-900/80 border-l-4 border-magenta-500 p-8">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-magenta-400 to-purple-400 mb-4 neon-glow-magenta">
                STEP_02: PROCESS_&_COMMIT (LOCAL_TEST)
              </h2>
              <p className="text-gray-300 mb-6 font-mono text-sm">
                &gt; IN_LOCAL_MOCK_MODE_MANUAL_PROCESSING_REQUIRED<br/>
                &gt; CLICK_BELOW_TO_COMPUTE_AND_COMMIT_AGGREGATES
              </p>
              <button
                onClick={async () => {
                  await processAndCommitAggregate();
                  setTimeout(() => {
                    if (loadMetadata) loadMetadata();
                  }, 2000);
                }}
                disabled={isProcessingAggregate || Number(voteCount) === 0}
                className="px-6 py-3 bg-gradient-to-r from-magenta-600 to-purple-600 text-white font-mono font-bold uppercase tracking-wider hover:from-magenta-500 hover:to-purple-500 transition-all neon-border-magenta disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingAggregate ? "[PROCESSING...]" : "[PROCESS_&_COMMIT_AGGREGATE]"}
              </button>
              {aggregateMessage && (
                <div className={`mt-4 p-4 border-l-4 font-mono text-sm ${
                  aggregateMessage.includes("✅") || aggregateMessage.includes("完成") || aggregateMessage.includes("成功")
                    ? "bg-magenta-500/10 border-magenta-500 text-magenta-400"
                    : aggregateMessage.includes("❌") || aggregateMessage.includes("失败")
                    ? "bg-red-500/10 border-red-500 text-red-400"
                    : "bg-purple-500/10 border-purple-500 text-purple-400"
                }`}>
                  {aggregateMessage}
                </div>
              )}
            </div>
          )}

          {!aggregatedResult && (
            <div className="bg-slate-900/80 border-l-4 border-purple-500 p-8">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-4">
                STEP_03: DECRYPT_AGGREGATED_RESULTS
              </h2>
              <p className="text-gray-300 mb-6 font-mono text-sm">
                &gt; AFTER_AGGREGATION_COMPLETE_DECRYPT_RESULTS<br/>
                &gt; SIGNATURE_REQUIRED_FOR_AUTHORIZATION
              </p>
              <button
                onClick={decryptAggregatedResults}
                disabled={isDecrypting}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-mono font-bold uppercase tracking-wider hover:from-purple-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDecrypting ? "[DECRYPTING...]" : "[DECRYPT_RESULTS]"}
              </button>
              {message && !aggregateMessage && (
                <div className={`mt-4 p-4 border-l-4 font-mono text-sm ${
                  message.includes("成功") || message.includes("完成") || message.includes("success") || message.includes("Success") || message.includes("completed")
                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                    : message.includes("失败") || message.includes("错误") || message.includes("failed") || message.includes("error")
                    ? "bg-red-500/10 border-red-500 text-red-400"
                    : "bg-purple-500/10 border-purple-500 text-purple-400"
                }`}>
                  {message}
                </div>
              )}
            </div>
          )}

          {aggregatedResult && (
            <div className="bg-slate-900/80 border-2 border-cyan-500/30 p-8">
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400 mb-6 neon-glow-cyan">
                POLL_RESULTS
              </h2>

              <div className="mb-8 p-6 bg-gradient-to-r from-cyan-500/20 to-magenta-500/20 border border-cyan-500/50">
                <p className="text-xl font-bold text-white">
                  TOTAL_VOTES: <span className="text-cyan-400 text-3xl">{Number(aggregatedResult.totalVotes)}</span>
                </p>
              </div>

              <div className="space-y-8">
                {aggregatedResult.averages.map((avg, index) => (
                  <div key={index} className="bg-slate-800/50 border-l-4 border-magenta-500 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-black text-white">
                        OPTION_{String(index + 1).padStart(2, '0')}
                      </h3>
                      <div className="text-right">
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400">
                          {avg.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">AVERAGE</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative w-full bg-slate-900 h-6 mb-4 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-magenta-500 transition-all duration-500"
                        style={{ width: `${(avg / 5) * 100}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-end pr-3">
                        <span className="text-xs font-bold text-white font-mono">
                          {((avg / 5) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Scale Labels */}
                    <div className="flex justify-between text-xs text-gray-500 mb-4 font-mono">
                      <span>1_STRONGLY_DISAGREE</span>
                      <span>3_NEUTRAL</span>
                      <span>5_STRONGLY_AGREE</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-cyan-500/10 border border-cyan-500/30 p-4">
                        <div className="text-cyan-400 font-mono font-bold mb-1">
                          TOTAL_SUM
                        </div>
                        <div className="text-3xl font-black text-cyan-300">
                          {Number(aggregatedResult.optionSums[index])}
                        </div>
                      </div>
                      <div className="bg-magenta-500/10 border border-magenta-500/30 p-4">
                        <div className="text-magenta-400 font-mono font-bold mb-1">
                          VOTE_COUNT
                        </div>
                        <div className="text-3xl font-black text-magenta-300">
                          {Number(aggregatedResult.optionCounts[index])}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : hasVoted ? (
        <div className="bg-slate-900/80 border-2 border-cyan-500/30 p-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl text-white mb-4 font-bold">
              YOU_HAVE_VOTED
            </p>
            <p className="text-gray-400 mb-4 font-mono text-sm">
              RESULTS_VISIBLE_TO_OWNER_ONLY
            </p>
            <p className="text-cyan-400 font-mono">
              TOTAL_VOTES: {Number(voteCount)}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/80 border-2 border-magenta-500/30 p-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-magenta-500/20 border-2 border-magenta-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-magenta-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-xl text-white mb-4 font-bold">
              YOU_HAVENT_VOTED_YET
            </p>
            <p className="text-gray-400 mb-6 font-mono text-sm">
              TOTAL_VOTES: {Number(voteCount)}
            </p>
            <a
              href={`/poll/${pollAddress}`}
              className="inline-block px-8 py-4 bg-gradient-to-r from-magenta-600 to-purple-600 text-white font-mono font-bold uppercase tracking-wider hover:from-magenta-500 hover:to-purple-500 transition-all neon-border-magenta"
            >
              [VOTE_NOW]
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
