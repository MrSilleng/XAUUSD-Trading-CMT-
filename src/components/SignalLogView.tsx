import { useMemo, useState } from 'react';
import { Download, Search, Trash2 } from 'lucide-react';
import type { AISignalResponse } from '../types/market';

interface SignalLogViewProps {
  signals: AISignalResponse[];
  currentPrice: number;
  onSelectSignal: (signal: AISignalResponse) => void;
  onClearLog: () => void;
}

export function SignalLogView({
  signals,
  currentPrice,
  onSelectSignal,
  onClearLog,
}: SignalLogViewProps) {
  const [filterBias, setFilterBias] = useState<'ALL' | 'BUY' | 'SELL' | 'NEUTRAL'>('ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return signals.filter((sig) => {
      const matchesBias =
        filterBias === 'ALL' ||
        (filterBias === 'BUY' && (sig.bias === 'BUY' || sig.bias === 'STRONG BUY')) ||
        (filterBias === 'SELL' && (sig.bias === 'SELL' || sig.bias === 'STRONG SELL')) ||
        (filterBias === 'NEUTRAL' && sig.bias === 'NEUTRAL');

      const q = query.trim().toLowerCase();
      const matchesQuery =
        q === '' ||
        sig.setupType.toLowerCase().includes(q) ||
        sig.timeframe.toLowerCase().includes(q) ||
        sig.bias.toLowerCase().includes(q);

      return matchesBias && matchesQuery;
    });
  }, [signals, filterBias, query]);

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const headers = [
      'GeneratedAt',
      'Timeframe',
      'RiskProfile',
      'Bias',
      'Confidence',
      'SpotAtSignal',
      'EntryPrice',
      'StopLoss',
      'TakeProfit1',
      'TakeProfit2',
      'RiskReward',
      'SetupType',
    ];
    const rows = filtered.map((s) =>
      [
        s.generatedAt,
        s.timeframe,
        s.riskProfile,
        s.bias,
        s.confidence,
        s.spotPriceAtSignal,
        s.entryPrice,
        s.stopLoss,
        s.takeProfit1,
        s.takeProfit2,
        s.riskRewardRatio,
        `"${s.setupType.replace(/"/g, '""')}"`,
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xauusd-ai-signals-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      aria-label="Generated AI Signal History"
      className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] rounded-lg overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            AI Signal Performance Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit trail of Gemini XAUUSD signals benchmarked against live spot (${currentPrice.toFixed(2)})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search setup or timeframe..."
              className="h-9 pl-8 pr-3 text-xs bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </div>

          <div
            role="group"
            aria-label="Filter signals by directional bias"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800"
          >
            {(['ALL', 'BUY', 'SELL', 'NEUTRAL'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setFilterBias(b)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  filterBias === b
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export CSV
          </button>

          {signals.length > 0 && (
            <button
              type="button"
              onClick={onClearLog}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 px-6 text-center space-y-2">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {signals.length === 0
              ? 'No signals generated yet'
              : 'No signals match your current filter'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {signals.length === 0
              ? 'Generate an AI signal from the Terminal view to record entry, stop loss, take profit, and live spot drift.'
              : 'Try clearing the search query or switching the bias filter.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
              <tr className="h-10">
                <th className="px-4 font-medium">Timestamp</th>
                <th className="px-4 font-medium">TF</th>
                <th className="px-4 font-medium">Bias</th>
                <th className="px-4 font-medium">Setup</th>
                <th className="px-4 font-medium text-right">Conf</th>
                <th className="px-4 font-medium text-right">Entry</th>
                <th className="px-4 font-medium text-right">Stop Loss</th>
                <th className="px-4 font-medium text-right">TP1</th>
                <th className="px-4 font-medium text-right">Live Drift</th>
                <th className="px-4 font-medium text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.map((sig) => {
                const isBuy = sig.bias === 'BUY' || sig.bias === 'STRONG BUY';
                const isSell = sig.bias === 'SELL' || sig.bias === 'STRONG SELL';
                const rawDiff = currentPrice - sig.entryPrice;
                const directionalMove = isSell ? -rawDiff : isBuy ? rawDiff : 0;

                return (
                  <tr
                    key={sig.id}
                    className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {new Date(sig.generatedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {sig.timeframe.toUpperCase()}
                    </td>
                    <td
                      className={`px-4 font-semibold ${
                        isBuy
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isSell
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {sig.bias}
                    </td>
                    <td className="px-4 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                      {sig.setupType}
                    </td>
                    <td className="px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {sig.confidence}%
                    </td>
                    <td className="px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      ${sig.entryPrice.toFixed(2)}
                    </td>
                    <td className="px-4 text-right font-mono tabular-nums text-red-600 dark:text-red-400">
                      ${sig.stopLoss.toFixed(2)}
                    </td>
                    <td className="px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      ${sig.takeProfit1.toFixed(2)}
                    </td>
                    <td
                      className={`px-4 text-right font-mono tabular-nums ${
                        sig.bias === 'NEUTRAL'
                          ? 'text-slate-400'
                          : directionalMove >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {sig.bias === 'NEUTRAL'
                        ? '—'
                        : `${directionalMove >= 0 ? '+' : ''}${directionalMove.toFixed(2)}`}
                    </td>
                    <td className="px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectSignal(sig)}
                        className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                      >
                        Load
                      </button>
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
