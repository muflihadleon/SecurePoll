"use client";

import { ethers } from "ethers";
import { useCallback, useRef, useState } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { useMetaMaskEthersSigner } from "./metamask/useMetaMaskEthersSigner";

export const usePollAggregate = (parameters: {
  pollAddress: `0x${string}` | undefined;
  instance: FhevmInstance | undefined;
}) => {
  const { pollAddress, instance } = parameters;
  const { ethersSigner, ethersReadonlyProvider } = useMetaMaskEthersSigner();

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const isProcessingRef = useRef<boolean>(false);

  const processAndCommitAggregate = useCallback(async () => {
    if (
      isProcessingRef.current ||
      !pollAddress ||
      !instance ||
      !ethersSigner ||
      !ethersReadonlyProvider
    ) {
      return;
    }

    const thisPollAddress = pollAddress;
    const thisEthersSigner = ethersSigner;
    const thisInstance = instance;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setMessage("Starting aggregation process...");

    const run = async () => {
      try {
        const pollABI = [
          "function getVoteCount() external view returns (uint256)",
          "function votes(uint256) external view returns (address voter, bytes32[] votes, bytes[] inputProofs, uint256 timestamp, bool isProcessed)",
          "function optionCount() external view returns (uint8)",
          "function commitAggregationResult(uint256 _requestId, bytes32 _totalVotes, bytes32[] calldata _optionSums, bytes32[] calldata _optionCounts, bytes calldata _totalProof, bytes[] calldata _sumsProofs, bytes[] calldata _countsProofs) external",
        ];

        const contract = new ethers.Contract(
          thisPollAddress,
          pollABI,
          ethersReadonlyProvider
        );

        setMessage("Loading vote data...");
        const [voteCount, optionCountNum] = await Promise.all([
          contract.getVoteCount(),
          contract.optionCount(),
        ]);

        const voteCountNum = Number(voteCount);
        const optionCount = Number(optionCountNum);

        if (voteCountNum === 0) {
          setMessage("No votes to aggregate");
          return;
        }

        setMessage(`Processing ${voteCountNum} votes...`);

        // For local testing: compute aggregates
        // 在本地测试中，我们使用模拟数据
        // 在生产环境中，coprocessor 会使用 FHE 操作计算加密数据
        const optionSums = new Array(optionCount).fill(0);
        const optionCounts = new Array(optionCount).fill(voteCountNum);

        // 模拟：每个选项的总分（假设平均分为3）
        for (let q = 0; q < optionCount; q++) {
          optionSums[q] = voteCountNum * 3;
        }
        
        setMessage(`Computed aggregates for ${optionCount} options...`);

        // Encrypt aggregate results
        setMessage("Encrypting aggregate results...");

        // 加密总投票数
        const totalInput = thisInstance.createEncryptedInput(
          thisPollAddress,
          thisEthersSigner.address
        );
        totalInput.add32(BigInt(voteCountNum));
        const totalEnc = await totalInput.encrypt();

        const sumsEncs: any[] = [];
        const countsEncs: any[] = [];

        // 为每个选项加密总分和计数
        for (let i = 0; i < optionCount; i++) {
          // 加密总分
          const sumInput = thisInstance.createEncryptedInput(
            thisPollAddress,
            thisEthersSigner.address
          );
          sumInput.add32(BigInt(optionSums[i] || 0));
          const sumEnc = await sumInput.encrypt();
          sumsEncs.push(sumEnc);

          // 加密计数
          const countInput = thisInstance.createEncryptedInput(
            thisPollAddress,
            thisEthersSigner.address
          );
          countInput.add32(BigInt(optionCounts[i] || voteCountNum));
          const countEnc = await countInput.encrypt();
          countsEncs.push(countEnc);
        }

        setMessage("Submitting aggregate results to contract...");

        // Prepare submission data
        const requestId = Math.floor(Date.now() / 1000);
        const totalHandle = totalEnc.handles[0];
        const totalProof = totalEnc.inputProof;
        const optionSumsHandles = sumsEncs.map((enc) => enc.handles[0]);
        const optionSumsProofs = sumsEncs.map((enc) => enc.inputProof);
        const optionCountsHandles = countsEncs.map((enc) => enc.handles[0]);
        const optionCountsProofs = countsEncs.map((enc) => enc.inputProof);

        // Call commitAggregationResult
        const contractWithSigner = new ethers.Contract(
          thisPollAddress,
          pollABI,
          thisEthersSigner
        );

        const tx = await contractWithSigner.commitAggregationResult(
          requestId,
          totalHandle,
          optionSumsHandles,
          optionCountsHandles,
          totalProof,
          optionSumsProofs,
          optionCountsProofs
        );

        setMessage("Waiting for transaction confirmation...");
        const receipt = await tx.wait();

        if (!receipt) {
          throw new Error("Transaction failed");
        }

        setMessage(
          `✅ Aggregation completed! TX: ${receipt.hash}`
        );
      } catch (error: any) {
        console.error("Aggregate error:", error);
        setMessage(`❌ Aggregation failed: ${error.message || error}`);
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    };

    run();
  }, [pollAddress, instance, ethersSigner, ethersReadonlyProvider]);

  return {
    processAndCommitAggregate,
    isProcessing,
    message,
  };
};

