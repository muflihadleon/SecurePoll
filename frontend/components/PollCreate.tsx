"use client";

import { useState } from "react";
import { usePollCreate } from "@/hooks/usePollCreate";
import { useRouter } from "next/navigation";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { FactoryAddressSetup } from "./FactoryAddressSetup";

export const PollCreate = () => {
  const router = useRouter();
  const { createPoll, isCreating, message, factoryAddress, setFactoryAddress } = usePollCreate();
  const { isConnected: walletConnected } = useMetaMaskEthersSigner();

  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [endTime, setEndTime] = useState("");
  const [options, setOptions] = useState<{ text: string; id: number }[]>([
    { text: "", id: 1 },
  ]);

  const handleAddOption = () => {
    setOptions([...options, { text: "", id: Date.now() }]);
  };

  const handleRemoveOption = (id: number) => {
    if (options.length > 1) {
      setOptions(options.filter((o) => o.id !== id));
    }
  };

  const handleOptionChange = (id: number, text: string) => {
    setOptions(
      options.map((o) => (o.id === id ? { ...o, text } : o))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !details.trim()) {
      alert("REQUIRED_FIELDS_MISSING");
      return;
    }

    const validOptions = options.filter((o) => o.text.trim());
    if (validOptions.length === 0) {
      alert("ADD_AT_LEAST_ONE_OPTION");
      return;
    }

    const endTimeTimestamp = Math.floor(new Date(endTime).getTime() / 1000);
    if (endTimeTimestamp <= Math.floor(Date.now() / 1000)) {
      alert("INVALID_END_TIME");
      return;
    }

    const pollAddress = await createPoll({
      name: name.trim(),
      details: details.trim(),
      endTime: endTimeTimestamp,
      optionCount: validOptions.length,
    });

    if (pollAddress) {
      router.push(`/poll/${pollAddress}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400 mb-8 tracking-wider neon-glow-cyan">
        &gt; CREATE_NEW_POLL
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Poll Name */}
        <div className="bg-slate-900/50 border-l-4 border-cyan-500 p-6 backdrop-blur-sm">
          <label className="block text-sm font-mono font-bold text-cyan-400 mb-3 tracking-wider">
            [POLL_NAME] *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/50 text-white font-mono focus:border-cyan-500 focus:outline-none neon-border-cyan"
            placeholder="Enter poll name..."
            required
          />
        </div>

        {/* Description */}
        <div className="bg-slate-900/50 border-l-4 border-magenta-500 p-6 backdrop-blur-sm">
          <label className="block text-sm font-mono font-bold text-magenta-400 mb-3 tracking-wider">
            [DESCRIPTION] *
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-magenta-500/50 text-white font-mono focus:border-magenta-500 focus:outline-none resize-none neon-border-magenta"
            rows={4}
            placeholder="Describe your poll..."
            required
          />
        </div>

        {/* End Time */}
        <div className="bg-slate-900/50 border-l-4 border-purple-500 p-6 backdrop-blur-sm">
          <label className="block text-sm font-mono font-bold text-purple-400 mb-3 tracking-wider">
            [END_TIME] *
          </label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-purple-500/50 text-white font-mono focus:border-purple-500 focus:outline-none"
            required
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        {/* Options */}
        <div className="bg-slate-900/50 border-l-4 border-cyan-500 p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-mono font-bold text-cyan-400 tracking-wider">
              [OPTIONS_LIKERT_1-5] *
            </label>
            <button
              type="button"
              onClick={handleAddOption}
              className="px-4 py-2 bg-transparent border border-cyan-500 text-cyan-400 font-mono font-bold uppercase text-xs tracking-wider hover:bg-cyan-500 hover:text-black transition-all"
            >
              [+ADD]
            </button>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={option.id} className="flex gap-3 items-center">
                <span className="text-cyan-400 font-mono font-bold text-sm w-8">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) =>
                    handleOptionChange(option.id, e.target.value)
                  }
                  className="flex-1 px-4 py-3 bg-slate-800 border border-cyan-500/30 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(option.id)}
                    className="px-4 py-3 bg-transparent border border-red-500 text-red-400 hover:bg-red-500 hover:text-black transition-all font-mono font-bold text-xs"
                  >
                    [X]
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30">
            <p className="text-sm text-cyan-300 font-mono">
              &gt; ENCRYPTION_ENABLED: FHEVM<br/>
              &gt; PRIVACY_MODE: MAXIMUM<br/>
              &gt; INDIVIDUAL_VOTES: ENCRYPTED<br/>
              &gt; AGGREGATE_STATS: DECRYPTABLE_BY_OWNER
            </p>
          </div>
        </div>

        {/* Connection Status */}
        {!walletConnected && (
          <div className="p-4 bg-yellow-500/10 border-l-4 border-yellow-500">
            <p className="text-sm text-yellow-400 font-mono font-bold">
              ⚠ WARNING: WALLET_NOT_CONNECTED
            </p>
          </div>
        )}

        {walletConnected && (
          <FactoryAddressSetup
            factoryAddress={factoryAddress}
            onSetAddress={(address) => {
              setFactoryAddress(address);
              if (typeof window !== "undefined") {
                localStorage.setItem("pollFactoryAddress", address);
              }
            }}
          />
        )}

        {message && (
          <div
            className={`p-4 border-l-4 font-mono ${
              message.includes("success")
                ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                : message.includes("Factory address")
                ? "bg-purple-500/10 border-purple-500 text-purple-400"
                : "bg-red-500/10 border-red-500 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isCreating}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-magenta-600 to-purple-600 text-white font-mono font-bold uppercase tracking-wider hover:from-magenta-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed neon-border-magenta"
          >
            {isCreating ? "[CREATING...]" : "[DEPLOY_POLL]"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-4 bg-transparent border-2 border-gray-600 text-gray-400 font-mono font-bold uppercase tracking-wider hover:bg-gray-600 hover:text-white transition-all"
          >
            [CANCEL]
          </button>
        </div>
      </form>
    </div>
  );
};
