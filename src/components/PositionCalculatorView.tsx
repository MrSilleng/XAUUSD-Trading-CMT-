import { useEffect, useState } from 'react';
import type { AISignalResponse } from '../types/market';

export interface CalculatorPreset {
  entry: number;
  sl: number;
  tp: number;
  label: string;
}

interface PositionCalculatorViewProps {
  currentPrice: number;
  activeSignal: AISignalResponse | null;
  presetLevels?: CalculatorPreset | null;
}

export function PositionCalculatorView({
  currentPrice,
  activeSignal,
  presetLevels,
}: PositionCalculatorViewProps) {
  const [balance, setBalance] = useState<string>('25000');
  const [riskPct, setRiskPct] = useState<string>('1.0');
  const [entryPrice, setEntryPrice] = useState<string>(
    presetLevels
      ? presetLevels.entry.toFixed(2)
      : activeSignal
      ? activeSignal.entryPrice.toFixed(2)
      : currentPrice
      ? currentPrice.toFixed(2)
      : '2650.00'
  );
  const [stopLoss, setStopLoss] = useState<string>(
    presetLevels
      ? presetLevels.sl.toFixed(2)
      : activeSignal
      ? activeSignal.stopLoss.toFixed(2)
      : currentPrice
      ? (currentPrice - 15).toFixed(2)
      : '2635.00'
  );
  const [takeProfit, setTakeProfit] = useState<string>(
    presetLevels
      ? presetLevels.tp.toFixed(2)
      : activeSignal
      ? activeSignal.takeProfit1.toFixed(2)
      : currentPrice
      ? (currentPrice + 32).toFixed(2)
      : '2682.00'
  );

  useEffect(() => {
    if (presetLevels) {
      setEntryPrice(presetLevels.entry.toFixed(2));
      setStopLoss(presetLevels.sl.toFixed(2));
      setTakeProfit(presetLevels.tp.toFixed(2));
    } else if (activeSignal) {
      setEntryPrice(activeSignal.entryPrice.toFixed(2));
      setStopLoss(activeSignal.stopLoss.toFixed(2));
      setTakeProfit(activeSignal.takeProfit1.toFixed(2));
    }
  }, [activeSignal, presetLevels]);

  const balNum = Math.max(0, Number(balance) || 0);
  const riskNum = Math.max(0, Math.min(100, Number(riskPct) || 0));
  const entryNum = Number(entryPrice) || 0;
  const slNum = Number(stopLoss) || 0;
  const tpNum = Number(takeProfit) || 0;

  // XAUUSD standard lot = 100 troy ounces ($1 price move = $100 per 1.00 lot)
  const stopDistance = Math.abs(entryNum - slNum);
  const tpDistance = Math.abs(tpNum - entryNum);
  const dollarRisk = balNum * (riskNum / 100);
  const ounces = stopDistance > 0 ? dollarRisk / stopDistance : 0;
  const standardLots = ounces / 100;
  const projectedProfit = ounces * tpDistance;
  const rrRatio = stopDistance > 0 ? tpDistance / stopDistance : 0;
  const direction =
    entryNum > slNum ? 'Long (Buy)' : entryNum < slNum ? 'Short (Sell)' : 'Invalid Stop';

  const loadCurrentSpot = () => {
    if (!currentPrice) return;
    setEntryPrice(currentPrice.toFixed(2));
    setStopLoss((currentPrice - 12).toFixed(2));
    setTakeProfit((currentPrice + 26).toFixed(2));
  };

  const loadSignalLevels = () => {
    if (!activeSignal) return;
    setEntryPrice(activeSignal.entryPrice.toFixed(2));
    setStopLoss(activeSignal.stopLoss.toFixed(2));
    setTakeProfit(activeSignal.takeProfit1.toFixed(2));
  };

  return (
    <section
      aria-label="XAUUSD Position Size & Risk Calculator"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      {/* Left Input Form */}
      <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              XAUUSD Position Calculator
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              1.00 Standard Lot = 100 Troy Oz ($100 per $1.00 move)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadCurrentSpot}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Use Live Spot (${currentPrice.toFixed(2)})
          </button>
          {activeSignal && (
            <button
              type="button"
              onClick={loadSignalLevels}
              className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
            >
              Load Active AI Signal
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Account Equity ($)
            </span>
            <input
              type="number"
              min="0"
              step="100"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Risk Per Trade (%)
            </span>
            <input
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </label>

          <label className="block space-y-1.5 col-span-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Entry Price ($/oz)
            </span>
            <input
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Stop Loss ($/oz)
            </span>
            <input
              type="number"
              step="0.01"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Take Profit ($/oz)
            </span>
            <input
              type="number"
              step="0.01"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </label>
        </div>
      </div>

      {/* Right Sizing Outputs */}
      <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] rounded-lg overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Recommended Lot Allocation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direction: {direction} · Stop Distance ${stopDistance.toFixed(2)}/oz ({Math.round(stopDistance * 10)} pips)
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Standard Lots</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {standardLots.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
          <div className="p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Capital at Risk</div>
            <div className="text-lg font-mono font-semibold tabular-nums text-red-600 dark:text-red-400 mt-1">
              -${dollarRisk.toFixed(2)}
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Target Profit</div>
            <div className="text-lg font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
              +${projectedProfit.toFixed(2)}
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Position Volume</div>
            <div className="text-lg font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-1">
              {ounces.toFixed(1)} oz
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Risk : Reward</div>
            <div className="text-lg font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-1">
              1 : {rrRatio.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="p-5 flex-1">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Risk Tier Sensitivity Table
          </h3>
          <table className="w-full text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr className="h-9">
                <th className="text-left font-medium">Risk Tier</th>
                <th className="text-right font-medium">Dollar Risk</th>
                <th className="text-right font-medium">Standard Lots</th>
                <th className="text-right font-medium">Units (Troy Oz)</th>
                <th className="text-right font-medium">Target Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[0.5, 1.0, 1.5, 2.0].map((tier) => {
                const dRisk = balNum * (tier / 100);
                const oz = stopDistance > 0 ? dRisk / stopDistance : 0;
                const lots = oz / 100;
                const gain = oz * tpDistance;
                return (
                  <tr key={tier} className="h-10">
                    <td className="font-mono font-medium text-slate-900 dark:text-slate-100">
                      {tier.toFixed(1)}%
                    </td>
                    <td className="text-right font-mono tabular-nums text-red-600 dark:text-red-400">
                      -${dRisk.toFixed(2)}
                    </td>
                    <td className="text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {lots.toFixed(2)}
                    </td>
                    <td className="text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {oz.toFixed(1)} oz
                    </td>
                    <td className="text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      +${gain.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
