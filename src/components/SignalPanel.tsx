import { Calculator, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import type { AISignalResponse, RiskProfile, SignalBias, TimeframeKey } from '../types/market';

interface SignalPanelProps {
  signal: AISignalResponse | null;
  loading: boolean;
  error: string | null;
  timeframe: TimeframeKey;
  riskProfile: RiskProfile;
  onRiskProfileChange: (profile: RiskProfile) => void;
  useSearchGrounding: boolean;
  onSearchGroundingChange: (enabled: boolean) => void;
  onGenerate: () => void;
  onSendToCalculator: (signal: AISignalResponse) => void;
}

const RISK_PROFILES: RiskProfile[] = ['Conservative', 'Balanced', 'Aggressive'];

function getBiasClasses(bias: SignalBias): string {
  switch (bias) {
    case 'STRONG BUY':
    case 'BUY':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'STRONG SELL':
    case 'SELL':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-amber-600 dark:text-amber-400';
  }
}

export function SignalPanel({
  signal,
  loading,
  error,
  timeframe,
  riskProfile,
  onRiskProfileChange,
  useSearchGrounding,
  onSearchGroundingChange,
  onGenerate,
  onSendToCalculator,
}: SignalPanelProps) {
  return (
    <aside
      aria-label="Google AI XAUUSD Signal Analytics"
      className="flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] rounded-lg overflow-hidden"
    >
      {/* Header Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Google AI Signal Engine
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              XAUUSD · {timeframe.toUpperCase()} · Quantitative + Macro Synthesis
            </p>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {loading ? 'Analyzing...' : signal ? 'Refresh Signal' : 'Generate Signal'}
          </button>
        </div>

        {/* Profile & Search Grounding Options */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div
            role="group"
            aria-label="Signal Risk Profile"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800"
          >
            {RISK_PROFILES.map((profile) => {
              const active = riskProfile === profile;
              return (
                <button
                  key={profile}
                  type="button"
                  onClick={() => onRiskProfileChange(profile)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {profile}
                </button>
              );
            })}
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useSearchGrounding}
              onChange={(e) => onSearchGroundingChange(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500"
            />
            <span>Live News Grounding</span>
          </label>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 overflow-y-auto space-y-5">
        {error && (
          <div className="p-3 border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 rounded-md text-xs text-red-700 dark:text-red-300 space-y-2">
            <p>{error}</p>
            <button
              type="button"
              onClick={onGenerate}
              className="px-3 py-1 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {loading && !signal && (
          <div className="space-y-4 animate-pulse">
            <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
              <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
              <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
              <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>
            <div className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
          </div>
        )}

        {!loading && !signal && !error && (
          <div className="py-10 px-4 text-center space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No Active Signal Generated
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Run Gemini AI synthesis over live XAUUSD multi-timeframe indicators, ATR volatility,
              classic pivot structure, and real-time macro catalysts.
            </p>
            <button
              type="button"
              onClick={onGenerate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Generate XAUUSD Signal
            </button>
          </div>
        )}

        {signal && (
          <div className={`space-y-5 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            {/* Primary Signal Verdict */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {signal.setupType} · {signal.riskProfile}
                </div>
                <div className={`text-2xl font-display font-bold tracking-tight ${getBiasClasses(signal.bias)}`}>
                  {signal.bias}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  Spot ${signal.spotPriceAtSignal.toFixed(2)} ·{' '}
                  {new Date(signal.generatedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-xs text-slate-500 dark:text-slate-400">Confidence</div>
                <div className="text-2xl font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                  {signal.confidence}%
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  R:R {signal.riskRewardRatio}
                </div>
              </div>
            </div>

            {/* Execution Levels */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Execution Parameters
                </h3>
                <button
                  type="button"
                  onClick={() => onSendToCalculator(signal)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                >
                  <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
                  Size Position
                </button>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                <div className="p-3 bg-white dark:bg-[#0E131D]">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Entry Zone</div>
                  <div className="text-sm font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                    ${signal.entryZoneMin.toFixed(2)} – ${signal.entryZoneMax.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-[#0E131D]">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Stop Loss</div>
                  <div className="text-sm font-mono font-semibold tabular-nums text-red-600 dark:text-red-400 mt-0.5">
                    ${signal.stopLoss.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-[#0E131D]">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Take Profit 1</div>
                  <div className="text-sm font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${signal.takeProfit1.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-[#0E131D]">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Take Profit 2</div>
                  <div className="text-sm font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${signal.takeProfit2.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Thesis */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Quantitative Thesis
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {signal.technicalSummary}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Invalidation:
                </span>{' '}
                {signal.invalidationCondition}
              </p>
            </div>

            {/* Confluence Table */}
            {signal.confluenceFactors.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confluence Matrix
                </h3>
                <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {signal.confluenceFactors.map((cf, idx) => (
                        <tr key={idx} className="h-8">
                          <td className="px-3 text-slate-600 dark:text-slate-300">{cf.factor}</td>
                          <td className="px-3 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {cf.reading}
                          </td>
                          <td
                            className={`px-3 text-right font-medium ${
                              cf.impact === 'BULLISH'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : cf.impact === 'BEARISH'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {cf.impact}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Macro Catalysts & Sources */}
            {signal.macroCatalysts.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Macro & Fundamental Drivers
                </h3>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc pl-4">
                  {signal.macroCatalysts.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {signal.sources.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Grounded Market Sources
                </div>
                <div className="flex flex-col gap-1">
                  {signal.sources.map((src) => (
                    <a
                      key={src.uri}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{src.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
