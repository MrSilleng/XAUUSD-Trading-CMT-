import { useState } from 'react';
import type { TimeframeKey, TimeframeSnapshot } from '../types/market';

interface MultiTimeframeViewProps {
  timeframes: TimeframeSnapshot[];
  activeTimeframe: TimeframeKey;
  onSelectTimeframe: (tf: TimeframeKey) => void;
  onLoadToCalculator?: (tf: TimeframeSnapshot) => void;
  compact?: boolean;
}

export function MultiTimeframeView({
  timeframes,
  activeTimeframe,
  onSelectTimeframe,
  onLoadToCalculator,
  compact = false,
}: MultiTimeframeViewProps) {
  const [only75Plus, setOnly75Plus] = useState<boolean>(false);

  const bullishCount = timeframes.filter((t) => t.smcBias === 'BULLISH').length;
  const bearishCount = timeframes.filter((t) => t.smcBias === 'BEARISH').length;
  const qualifiedCount = timeframes.filter((t) => t.confirmationPct >= 75).length;

  const consensus =
    bullishCount > bearishCount
      ? 'Bullish Alignment'
      : bearishCount > bullishCount
      ? 'Bearish Alignment'
      : 'Balanced / Mixed';

  const displayed = only75Plus
    ? timeframes.filter((t) => t.confirmationPct >= 75)
    : timeframes;

  return (
    <section
      aria-label="All-Timeframe Bullish/Bearish & Trade Setup Matrix"
      className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] rounded-lg overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            All-Timeframe Signal & Confirmation Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Live Bullish / Bearish bias, Entry, Stop Loss, Take Profit, Confirmation %, and historical TP1 Win Rate across all timeframes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Consensus:{' '}
            <span
              className={`font-semibold ${
                bullishCount > bearishCount
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : bearishCount > bullishCount
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {consensus}
            </span>{' '}
            <span className="text-slate-400">·</span>{' '}
            <span className="font-mono tabular-nums">
              {bullishCount} Bullish / {bearishCount} Bearish · {qualifiedCount}/{timeframes.length} ≥75%
            </span>
          </div>

          <div
            role="group"
            aria-label="Filter setups by 75% confirmation threshold"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800"
          >
            <button
              type="button"
              onClick={() => setOnly75Plus(false)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                !only75Plus
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All Timeframes
            </button>
            <button
              type="button"
              onClick={() => setOnly75Plus(true)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                only75Plus
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              ≥ 75% Only
            </button>
          </div>
        </div>
      </div>

      {timeframes.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Loading multi-timeframe signals...
        </div>
      ) : displayed.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            No timeframe currently meets the ≥ 75% confirmation threshold
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Switch to All Timeframes to inspect current Bullish/Bearish bias and live confluence scores below 75%.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
              <tr className="h-10">
                <th className="px-4 font-medium">TF</th>
                <th className="px-4 font-medium">Direction</th>
                <th className="px-4 font-medium">Signal</th>
                <th className="px-4 font-medium text-right">Entry Price</th>
                <th className="px-4 font-medium text-right">Stop Loss</th>
                <th className="px-4 font-medium text-right">TP1</th>
                <th className="px-4 font-medium text-right">TP2</th>
                <th className="px-4 font-medium text-right">Confirmation</th>
                <th className="px-4 font-medium text-right">Win Rate (TP1)</th>
                {!compact && <th className="px-4 font-medium text-right">RSI (14)</th>}
                <th className="px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {displayed.map((tf) => {
                const isSelected = tf.timeframe === activeTimeframe;
                const isBull = tf.smcBias === 'BULLISH';
                const totalTrades = tf.wins + tf.losses;
                const meets75Conf = tf.confirmationPct >= 75;
                const meets75Win = totalTrades > 0 ? tf.winRatePct >= 75 : false;

                return (
                  <tr
                    key={tf.timeframe}
                    className={`h-11 transition-colors ${
                      isSelected
                        ? 'bg-amber-50/60 dark:bg-amber-950/15'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {tf.timeframe.toUpperCase()}
                    </td>
                    <td
                      className={`px-4 font-semibold ${
                        isBull
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tf.smcBias}
                    </td>
                    <td
                      className={`px-4 font-mono font-semibold ${
                        tf.signalAction === 'BUY'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : tf.signalAction === 'SELL'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {tf.signalAction === 'NEUTRAL' ? 'WAIT (<75%)' : tf.signalAction}
                    </td>
                    <td className="px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      ${tf.entryPrice.toFixed(2)}
                    </td>
                    <td className="px-4 text-right font-mono tabular-nums text-red-600 dark:text-red-400">
                      ${tf.stopLoss.toFixed(2)}
                    </td>
                    <td className="px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      ${tf.takeProfit1.toFixed(2)}
                    </td>
                    <td className="px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      ${tf.takeProfit2.toFixed(2)}
                    </td>
                    <td
                      className={`px-4 text-right font-mono font-semibold tabular-nums ${
                        meets75Conf
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {tf.confirmationPct}%{meets75Conf ? ' · ≥75%' : ''}
                    </td>
                    <td
                      className={`px-4 text-right font-mono tabular-nums ${
                        meets75Win
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {totalTrades > 0
                        ? `${tf.winRatePct}% (${tf.wins}W/${tf.losses}L)`
                        : 'No closed trades'}
                    </td>
                    {!compact && (
                      <td className="px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {tf.rsi14.toFixed(1)}
                      </td>
                    )}
                    <td className="px-4 text-right">
                      <div className="inline-flex items-center gap-3">
                        {onLoadToCalculator && (
                          <button
                            type="button"
                            onClick={() => onLoadToCalculator(tf)}
                            className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:underline whitespace-nowrap shrink-0"
                          >
                            Size
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectTimeframe(tf.timeframe)}
                          className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
                        >
                          {isSelected ? 'Active' : 'Chart'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
