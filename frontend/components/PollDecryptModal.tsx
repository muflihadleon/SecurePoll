"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { usePoll } from "@/hooks/usePoll";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";

interface PollDecryptModalProps {
  pollAddress: `0x${string}`;
  isOpen: boolean;
  onClose: () => void;
  pollName: string;
}

export const PollDecryptModal = ({
  pollAddress,
  isOpen,
  onClose,
  pollName,
}: PollDecryptModalProps) => {
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
    status: fhevmStatus,
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

  const [optionCount, setOptionCount] = useState<number>(0);
  const [needsSignature, setNeedsSignature] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false);

  // Load option count
  useEffect(() => {
    if (!pollAddress || !ethersReadonlyProvider) return;

    const loadOptionCount = async () => {
      try {
        const pollABI = [
          "function optionCount() external view returns (uint8)",
        ];
        const contract = new ethers.Contract(
          pollAddress,
          pollABI,
          ethersReadonlyProvider
        );
        const count = await contract.optionCount();
        setOptionCount(Number(count));
      } catch (error) {
        console.error("Error loading option count:", error);
      }
    };

    loadOptionCount();
  }, [pollAddress, ethersReadonlyProvider]);

  if (!isOpen) return null;

  const isOwner =
    ethersSigner &&
    metadata &&
    ethersSigner.address.toLowerCase() === metadata.owner.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-orange-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-orange-100 px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{pollName}</h2>
            <p className="text-sm text-gray-600 mt-1 font-semibold">
              {metadata ? `Total Votes: ${Number(voteCount)}` : "Loading..."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-50 rounded-xl transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!metadata ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-lg text-gray-700 font-bold">Loading poll data...</div>
              </div>
            </div>
          ) : !aggregatedResult ? (
            <div className="space-y-6">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                <h3 className="text-lg font-extrabold text-orange-900 mb-2">
                  🔒 Encrypted Results
                </h3>
                <p className="text-orange-800 mb-4 font-semibold">
                  Poll votes are encrypted using FHEVM. To view aggregated
                  statistics, you need to:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-orange-800 mb-6 font-medium">
                  <li>Request aggregation (owner only)</li>
                  <li>Wait for coprocessors to process the data</li>
                  <li>Decrypt the aggregated results</li>
                </ol>

                {isOwner && (
                  <div className="space-y-4">
                    <button
                      onClick={requestAggregation}
                      disabled={isRequestingAggregation || Number(voteCount) === 0}
                      className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold"
                    >
                      {isRequestingAggregation
                        ? "Requesting Aggregation..."
                        : "Request Aggregation"}
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {needsSignature && !isDecrypting && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                      <p className="text-sm text-yellow-800 mb-3 font-semibold">
                        <strong>⚠️ Signature Required:</strong> You need to sign a message to decrypt the results.
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={async () => {
                      setIsSigning(true);
                      setNeedsSignature(true);
                      try {
                        await decryptAggregatedResults();
                        setTimeout(() => {
                          if (loadMetadata) loadMetadata();
                        }, 1000);
                      } finally {
                        setIsSigning(false);
                      }
                    }}
                    disabled={isDecrypting || isSigning}
                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold"
                  >
                    {isSigning
                      ? "Waiting for signature..."
                      : isDecrypting
                      ? "Decrypting..."
                      : "Decrypt Results"}
                  </button>
                </div>

                {message && (
                  <div
                    className={`mt-4 p-4 rounded-xl border-2 ${
                      message.includes("success") || message.includes("completed")
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : message.includes("error") || message.includes("failed")
                        ? "bg-red-50 text-red-800 border-red-300"
                        : "bg-orange-50 text-orange-800 border-orange-300"
                    }`}
                  >
                    {message}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-extrabold text-emerald-800">
                    Decryption Successful!
                  </p>
                </div>
                <p className="text-sm text-emerald-700 font-semibold">
                  Total Votes:{" "}
                  <strong>{Number(aggregatedResult.totalVotes)}</strong>
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-extrabold text-gray-900">
                  Option Statistics
                </h3>
                {aggregatedResult.averages.map((avg, index) => (
                  <div
                    key={index}
                    className="border-2 border-orange-100 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-extrabold text-gray-900">
                        Option {index + 1}
                      </h4>
                      <div className="text-right">
                        <div className="text-3xl font-extrabold text-orange-600">
                          {avg.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 font-semibold">Average</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-6 mb-3">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                        style={{ width: `${(avg / 5) * 100}%` }}
                      >
                        <span className="text-xs font-extrabold text-white">
                          {((avg / 5) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Scale Labels */}
                    <div className="flex justify-between text-xs text-gray-600 mb-2 font-semibold">
                      <span>1 (Strongly Disagree)</span>
                      <span>3 (Neutral)</span>
                      <span>5 (Strongly Agree)</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                        <div className="text-orange-600 font-extrabold">
                          Total Sum
                        </div>
                        <div className="text-2xl font-extrabold text-orange-700">
                          {Number(aggregatedResult.optionSums[index])}
                        </div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                        <div className="text-red-600 font-extrabold">
                          Vote Count
                        </div>
                        <div className="text-2xl font-extrabold text-red-700">
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
      </div>
    </div>
  );
};




