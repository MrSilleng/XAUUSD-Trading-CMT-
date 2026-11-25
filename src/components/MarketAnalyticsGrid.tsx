import { RefreshCw } from 'lucide-react';
import type { MarketSnapshotResponse } from '../types/market';

interface MarketAnalyticsGridProps {
  snapshot: MarketSnapshotResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  section?: 'kpi' | 'tables' | 'all';
}

export function MarketAnalyticsGrid({
  snapshot,
  loading,
  error,
  onRefresh,
  section = 'all',
}: MarketAnalyticsGridProps) {
  if (error && !snapshot) {
    if (section === 'tables') return null;
    return (
      <div className="p-4 border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 rounded-lg flex items-center justify-between gap-4">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
        >
          Retry Feed
        </button>
      </div>
    );
  }

  if (!snapshot) {
    if (section === 'tables') return null;
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 space-y-2 animate-pulse">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const { indicators, macro } = snapshot;
  const isUp = snapshot.change >= 0;
  const rangeSpan = Math.max(0.01, snapshot.high24h - snapshot.low24h);
  const rangePct = Math.min(100, Math.max(0, ((snapshot.price - snapshot.low24h) / rangeSpan) * 100));

  const dxy = macro.find((m) => m.symbol === 'DX-Y.NYB');
  const us10y = macro.find((m) => m.symbol === '^TNX');

  const rsiColor =
    indicators.rsi14 >= 70 || indicators.rsi14 <= 30
      ? 'text-amber-600 dark:text-amber-400'
      : indicators.rsi14 >= 54
      ? 'text-emerald-600 dark:text-emerald-400'
      : indicators.rsi14 <= 46
      ? 'text-red-600 dark:text-red-400'
      : 'text-slate-600 dark:text-slate-400';

  const trendColor =
    indicators.trendSummary === 'BULLISH'
      ? 'text-emerald-600 dark:text-emerald-400'
      : indicators.trendSummary === 'BEARISH'
      ? 'text-red-600 dark:text-red-400'
      : 'text-amber-600 dark:text-amber-400';

  const showKpi = section === 'all' || section === 'kpi';
  const showTables = section === 'all' || section === 'tables';

  return (
    <div className="space-y-4">
      {showKpi && (
        <div className="grid grid-cols-2 lg:grid-cols-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          <div className="p-4 col-span-2 lg:col-span-1 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Spot XAU/USD</span>
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                aria-label="Refresh market feed"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="text-2xl font-mono font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
              ${snapshot.price.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              <span className={isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                {isUp ? '+' : ''}
                {snapshot.change.toFixed(2)} ({isUp ? '+' : ''}
                {snapshot.changePct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="p-4 flex flex-col justify-between gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Session Range</span>
            <div className="flex items-baseline justify-between gap-2 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100">
              <span>${snapshot.low24h.toFixed(2)}</span>
              <span className="text-slate-400">–</span>
              <span>${snapshot.high24h.toFixed(2)}</span>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-200"
                  style={{ width: `${rangePct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                Position: {rangePct.toFixed(0)}% of range
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col justify-between gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Momentum · RSI (14)
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                {indicators.rsi14.toFixed(2)}
              </span>
              <span className={`text-xs font-semibold ${rsiColor}`}>
                {indicators.momentumSummary}
              </span>
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              MACD Hist: {indicators.macdHistogram >= 0 ? '+' : ''}
              {indicators.macdHistogram.toFixed(2)}
            </div>
          </div>

          <div className="p-4 flex flex-col justify-between gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Trend & Volatility
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className={`text-base font-semibold ${trendColor}`}>
                {indicators.trendSummary}
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                ATR ${indicators.atr14.toFixed(2)}
              </span>
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              BB Width: {indicators.bbWidthPct.toFixed(2)}%
            </div>
          </div>

          <div className="p-4 flex flex-col justify-between gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Macro Benchmarks</span>
            <div className="space-y-1 text-xs font-mono tabular-nums">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">DXY</span>
                {dxy ? (
                  <span className="text-slate-900 dark:text-slate-100">
                    {dxy.price.toFixed(2)}{' '}
                    <span className={dxy.changePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                      ({dxy.changePct >= 0 ? '+' : ''}
                      {dxy.changePct.toFixed(2)}%)
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">US 10Y</span>
                {us10y ? (
                  <span className="text-slate-900 dark:text-slate-100">
                    {us10y.price.toFixed(2)}%{' '}
                    <span className={us10y.changePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                      ({us10y.changePct >= 0 ? '+' : ''}
                      {us10y.changePct.toFixed(2)}%)
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Feed: {snapshot.sourceFeed}
            </div>
          </div>
        </div>
      )}

      {showTables && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Moving Averages & Bands
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {snapshot.timeframe.toUpperCase()}
              </span>
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {[
                  {
                    label: 'EMA 20',
                    value: `$${indicators.ema20.toFixed(2)}`,
                    status: snapshot.price >= indicators.ema20 ? 'Above (Bullish)' : 'Below (Bearish)',
                    bull: snapshot.price >= indicators.ema20,
                  },
                  {
                    label: 'EMA 50',
                    value: `$${indicators.ema50.toFixed(2)}`,
                    status: snapshot.price >= indicators.ema50 ? 'Above (Bullish)' : 'Below (Bearish)',
                    bull: snapshot.price >= indicators.ema50,
                  },
                  {
                    label: 'EMA 200',
                    value: `$${indicators.ema200.toFixed(2)}`,
                    status: snapshot.price >= indicators.ema200 ? 'Above (Bullish)' : 'Below (Bearish)',
                    bull: snapshot.price >= indicators.ema200,
                  },
                  {
                    label: 'Bollinger Upper / Lower',
                    value: `$${indicators.bbUpper.toFixed(2)} / $${indicators.bbLower.toFixed(2)}`,
                    status:
                      snapshot.price > indicators.bbUpper
                        ? 'Upper Breakout'
                        : snapshot.price < indicators.bbLower
                        ? 'Lower Extension'
                        : 'Inside Envelope',
                    bull: snapshot.price >= indicators.bbMiddle,
                  },
                ].map((row) => (
                  <tr key={row.label} className="h-9">
                    <td className="px-4 text-slate-600 dark:text-slate-400">{row.label}</td>
                    <td className="px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {row.value}
                    </td>
                    <td
                      className={`px-4 text-right font-medium ${
                        row.bull
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Classic Session Pivot Levels
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">Support & Resistance</span>
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {[
                  { level: 'Resistance 2 (R2)', price: indicators.pivot.r2, role: 'Extended Supply' },
                  { level: 'Resistance 1 (R1)', price: indicators.pivot.r1, role: 'Primary Supply' },
                  { level: 'Central Pivot (P)', price: indicators.pivot.p, role: 'Equilibrium' },
                  { level: 'Support 1 (S1)', price: indicators.pivot.s1, role: 'Primary Demand' },
                  { level: 'Support 2 (S2)', price: indicators.pivot.s2, role: 'Extended Demand' },
                ].map((row) => {
                  const dist = row.price - snapshot.price;
                  return (
                    <tr key={row.level} className="h-9">
                      <td className="px-4 text-slate-600 dark:text-slate-400">{row.level}</td>
                      <td className="px-4 text-slate-500 dark:text-slate-400">{row.role}</td>
                      <td className="px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        ${row.price.toFixed(2)}
                      </td>
                      <td className="px-4 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {dist >= 0 ? '+' : ''}
                        {dist.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
