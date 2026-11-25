import { useEffect, useRef, useState } from 'react';
import { BarChart3, Layers } from 'lucide-react';
import type {
  AISignalResponse,
  Candle,
  TimeframeKey,
  TradingViewFeedSymbol,
} from '../types/market';
import type { SmcOverlayResult, SmcSettings } from '../lib/smcEngine';
import { SmcChartCanvas } from './SmcChartCanvas';

interface TradingViewChartProps {
  timeframe: TimeframeKey;
  onTimeframeChange: (tf: TimeframeKey) => void;
  tvSymbol: TradingViewFeedSymbol;
  onTvSymbolChange: (symbol: TradingViewFeedSymbol) => void;
  theme: 'dark' | 'light';
  candles: Candle[];
  smc: SmcOverlayResult;
  smcSettings: SmcSettings;
  onSmcSettingsChange: (next: SmcSettings) => void;
  activeSignal: AISignalResponse | null;
}

const TV_INTERVAL_MAP: Record<TimeframeKey, string> = {
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
};

const TIMEFRAMES: { key: TimeframeKey; label: string }[] = [
  { key: '5m', label: '5m' },
  { key: '15m', label: '15m' },
  { key: '30m', label: '30m' },
  { key: '1h', label: '1H' },
  { key: '4h', label: '4H' },
  { key: '1d', label: '1D' },
];

const FEED_SYMBOLS: { value: TradingViewFeedSymbol; label: string }[] = [
  { value: 'OANDA:XAUUSD', label: 'OANDA · XAUUSD' },
  { value: 'FOREXCOM:XAUUSD', label: 'FOREX.com · XAUUSD' },
  { value: 'TVC:GOLD', label: 'TVC · GOLD' },
  { value: 'BINANCE:PAXGUSDT', label: 'Binance · PAXG/USD' },
];

export function TradingViewChart({
  timeframe,
  onTimeframeChange,
  tvSymbol,
  onTvSymbolChange,
  theme,
  candles,
  smc,
  smcSettings,
  onSmcSettingsChange,
  activeSignal,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chartMode, setChartMode] = useState<'smc' | 'tradingview'>('smc');
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    if (chartMode !== 'tradingview' || !containerRef.current) return;

    const host = containerRef.current;
    host.innerHTML = '';
    setWidgetReady(false);

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetInner = document.createElement('div');
    widgetInner.className = 'tradingview-widget-container__widget';
    widgetInner.style.height = '100%';
    widgetInner.style.width = '100%';
    widgetContainer.appendChild(widgetInner);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => setWidgetReady(true);

    const config = {
      autosize: true,
      symbol: tvSymbol,
      interval: TV_INTERVAL_MAP[timeframe],
      timezone: 'Etc/UTC',
      theme,
      style: '1',
      locale: 'en',
      allow_symbol_change: true,
      hide_side_toolbar: false,
      withdateranges: true,
      save_image: false,
      calendar: false,
      studies: ['STD;EMA', 'STD;RSI'],
      support_host: 'https://www.tradingview.com',
    };

    script.innerHTML = JSON.stringify(config);
    widgetContainer.appendChild(script);
    host.appendChild(widgetContainer);

    return () => {
      host.innerHTML = '';
    };
  }, [chartMode, tvSymbol, timeframe, theme]);

  return (
    <section
      aria-label="XAUUSD Chart Viewport"
      className="flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] rounded-lg overflow-hidden"
    >
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          {chartMode === 'tradingview' && (
            <>
              <label htmlFor="tv-feed-select" className="sr-only">
                TradingView Symbol Feed
              </label>
              <select
                id="tv-feed-select"
                value={tvSymbol}
                onChange={(e) => onTvSymbolChange(e.target.value as TradingViewFeedSymbol)}
                className="h-9 px-3 text-xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {FEED_SYMBOLS.map((feed) => (
                  <option key={feed.value} value={feed.value}>
                    {feed.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <div
            role="group"
            aria-label="Chart Timeframe"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800"
          >
            {TIMEFRAMES.map((tf) => {
              const active = timeframe === tf.key;
              return (
                <button
                  key={tf.key}
                  type="button"
                  onClick={() => onTimeframeChange(tf.key)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    active
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

          {chartMode === 'smc' && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Structure:</span>
              <span
                className={`font-semibold ${
                  smc.summary.trendLabel === 'BULLISH'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : smc.summary.trendLabel === 'BEARISH'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {smc.summary.trendLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span>{smc.summary.zonePosition}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {smc.summary.activeBullOBs} Bull OB / {smc.summary.activeBearOBs} Bear OB /{' '}
                {smc.summary.activeFVGs} FVG
              </span>
            </div>
          )}
        </div>

        {/* Chart Mode Switch */}
        <div
          role="group"
          aria-label="Chart Display Mode"
          className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800"
        >
          <button
            type="button"
            onClick={() => setChartMode('smc')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              chartMode === 'smc'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            SMC Indicator
          </button>
          <button
            type="button"
            onClick={() => setChartMode('tradingview')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              chartMode === 'tradingview'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
            TradingView Live
          </button>
        </div>
      </div>

      {/* Main Chart Surface */}
      <div className="relative w-full h-[530px] lg:h-[590px] bg-slate-50 dark:bg-[#0E131D]">
        {chartMode === 'smc' ? (
          <SmcChartCanvas
            candles={candles}
            timeframe={timeframe}
            theme={theme}
            smc={smc}
            settings={smcSettings}
            onSettingsChange={onSmcSettingsChange}
            activeAiSignal={activeSignal}
          />
        ) : (
          <>
            {!widgetReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 pointer-events-none">
                <span>Loading TradingView chart for {tvSymbol}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Switch to SMC Indicator anytime to view all 45 Pine Script lines and zones
                </span>
              </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
          </>
        )}
      </div>
    </section>
  );
}
