"use client";

import { useState } from "react";

export const FactoryAddressSetup = ({
  factoryAddress,
  onSetAddress,
}: {
  factoryAddress: string | undefined;
  onSetAddress: (address: string) => void;
}) => {
  const [inputAddress, setInputAddress] = useState(
    factoryAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );
  const [isSetting, setIsSetting] = useState(false);

  const handleSet = () => {
    if (!inputAddress || !inputAddress.startsWith("0x")) {
      alert("INVALID_ADDRESS_FORMAT");
      return;
    }

    setIsSetting(true);
    try {
      localStorage.setItem("pollFactoryAddress", inputAddress);
      onSetAddress(inputAddress);
      alert("FACTORY_ADDRESS_SET");
    } catch (error) {
      alert("ERROR_SETTING_ADDRESS");
    } finally {
      setIsSetting(false);
    }
  };

  if (factoryAddress) {
    return (
      <div className="p-4 bg-cyan-500/10 border-l-4 border-cyan-500">
        <p className="text-sm text-cyan-400 font-mono font-bold">
          ✓ FACTORY_CONFIGURED: {factoryAddress}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-magenta-500/10 border-l-4 border-magenta-500">
      <p className="text-sm text-magenta-400 mb-3 font-mono font-bold">
        ℹ FACTORY_ADDRESS_REQUIRED
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputAddress}
          onChange={(e) => setInputAddress(e.target.value)}
          placeholder="0x5FbDB2315678afecb367f032d93F642f64180aa3"
          className="flex-1 px-4 py-2 bg-slate-800 border border-magenta-500/50 text-white font-mono text-sm focus:border-magenta-500 focus:outline-none"
        />
        <button
          onClick={handleSet}
          disabled={isSetting}
          className="px-6 py-2 bg-transparent border border-magenta-500 text-magenta-400 font-mono font-bold uppercase text-xs tracking-wider hover:bg-magenta-500 hover:text-black transition-all disabled:opacity-50"
        >
          {isSetting ? "[...]" : "[SET]"}
        </button>
      </div>
      <p className="text-xs text-magenta-300 mt-2 font-mono">
        DEFAULT: 0x5FbDB2315678afecb367f032d93F642f64180aa3
      </p>
    </div>
  );
};
