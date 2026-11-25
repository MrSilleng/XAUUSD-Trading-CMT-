/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LogIn, LogOut, Moon, Sun } from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import {
  clearUserSignalsInFirestore,
  loadUserPreferences,
  saveSignalToFirestore,
  saveUserPreferences,
  subscribeUserSignals,
} from './lib/firebaseSync';
import { MarketAnalyticsGrid } from './components/MarketAnalyticsGrid';
import { MultiTimeframeView } from './components/MultiTimeframeView';
import {
  PositionCalculatorView,
  type CalculatorPreset,
} from './components/PositionCalculatorView';
import { SignalLogView } from './components/SignalLogView';
import { SignalPanel } from './components/SignalPanel';
import { TradingViewChart } from './components/TradingViewChart';
import {
  computeSmcOverlay,
  DEFAULT_SMC_SETTINGS,
  type SmcSettings,
} from './lib/smcEngine';
import type {
  AISignalResponse,
  MarketSnapshotResponse,
  RiskProfile,
  TimeframeKey,
  TimeframeSnapshot,
  TradingViewFeedSymbol,
} from './types/market';

type WorkspaceTab = 'terminal' | 'mtf' | 'calculator' | 'log';

const SIGNAL_LOG_STORAGE_KEY = 'aurum_quant_signal_log_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('terminal');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [timeframe, setTimeframe] = useState<TimeframeKey>('15m');
  const [tvSymbol, setTvSymbol] = useState<TradingViewFeedSymbol>('OANDA:XAUUSD');

  const [snapshot, setSnapshot] = useState<MarketSnapshotResponse | null>(null);
  const [marketLoading, setMarketLoading] = useState<boolean>(true);
  const [marketError, setMarketError] = useState<string | null>(null);

  const [riskProfile, setRiskProfile] = useState<RiskProfile>('Balanced');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [smcSettings, setSmcSettings] = useState<SmcSettings>(DEFAULT_SMC_SETTINGS);
  const [activeSignal, setActiveSignal] = useState<AISignalResponse | null>(null);
  const [calculatorPreset, setCalculatorPreset] = useState<CalculatorPreset | null>(null);
  const [signalLoading, setSignalLoading] = useState<boolean>(false);
  const [signalError, setSignalError] = useState<string | null>(null);

  const smcOverlay = useMemo(
    () =>
      computeSmcOverlay(
        snapshot?.candles ?? [],
        timeframe,
        smcSettings,
        snapshot?.keyLevels
      ),
    [snapshot?.candles, snapshot?.keyLevels, timeframe, smcSettings]
  );

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authBusy, setAuthBusy] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const prefsHydratedRef = useRef<boolean>(false);

  const [signalLog, setSignalLog] = useState<AISignalResponse[]>(() => {
    try {
      const saved = localStorage.getItem(SIGNAL_LOG_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AISignalResponse[]) : [];
    } catch {
      return [];
    }
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        prefsHydratedRef.current = false;
      }
    });
    return () => unsub();
  }, []);

  // Load user preferences & subscribe to Firestore signals when authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    let cancelled = false;
    loadUserPreferences(user.uid)
      .then((prefs) => {
        if (cancelled) return;
        if (prefs) {
          setRiskProfile(prefs.riskProfile);
          setTheme(prefs.theme);
          setTvSymbol(prefs.tvSymbol);
          setUseSearchGrounding(prefs.useSearchGrounding);
          setSmcSettings((prev) => ({ ...prev, minConf: prefs.minConf }));
        }
        prefsHydratedRef.current = true;
      })
      .catch((err) => {
        console.error('Failed to load Firestore preferences:', err);
        prefsHydratedRef.current = true;
      });

    const unsubSignals = subscribeUserSignals(
      user.uid,
      (cloudSignals) => {
        setSignalLog(cloudSignals);
      },
      (err) => {
        setSignalError(err.message);
      }
    );

    return () => {
      cancelled = true;
      unsubSignals();
    };
  }, [authReady, user]);

  // Persist preference changes to Firestore when signed in
  useEffect(() => {
    if (!authReady || !user || !prefsHydratedRef.current) return;
    const timer = window.setTimeout(() => {
      saveUserPreferences(user.uid, {
        riskProfile,
        theme,
        tvSymbol,
        minConf: smcSettings.minConf,
        useSearchGrounding,
      }).catch((err) => {
        console.error('Failed to save Firestore preferences:', err);
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [authReady, user, riskProfile, theme, tvSymbol, smcSettings.minConf, useSearchGrounding]);

  // Sync Tailwind .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Persist Signal Log locally when signed out
  useEffect(() => {
    if (user) return;
    try {
      localStorage.setItem(SIGNAL_LOG_STORAGE_KEY, JSON.stringify(signalLog.slice(0, 50)));
    } catch {
      // Ignore storage quota errors
    }
  }, [signalLog, user]);

  const fetchMarketSnapshot = useCallback(async (tf: TimeframeKey) => {
    setMarketLoading(true);
    setMarketError(null);
    try {
      const res = await fetch(`/api/market/xauusd?timeframe=${encodeURIComponent(tf)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load XAUUSD market snapshot.');
      }
      setSnapshot(data as MarketSnapshotResponse);
    } catch (err) {
      setMarketError(
        err instanceof Error ? err.message : 'Unable to reach live XAUUSD market feed.'
      );
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketSnapshot(timeframe);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMarketSnapshot(timeframe);
      }
    }, 15_000);
    return () => window.clearInterval(intervalId);
  }, [timeframe, fetchMarketSnapshot]);

  const handleGenerateSignal = useCallback(async () => {
    if (activeTab !== 'terminal') {
      setActiveTab('terminal');
    }
    setSignalLoading(true);
    setSignalError(null);
    try {
      const s = smcOverlay.summary;
      const smcLines: string[] = [
        `SMC Structure Bias: ${s.trendLabel}`,
        `Dealing Range Zone: ${s.zonePosition}`,
        `Active Order Blocks: ${s.activeBullOBs} Bullish, ${s.activeBearOBs} Bearish`,
        `Active FVGs: ${s.activeFVGs}`,
        `Active Liquidity Levels: ${s.activeBSL} BSL, ${s.activeSSL} SSL`,
      ];
      if (s.latestSignal) {
        smcLines.push(
          `Indicator Signal: ${s.latestSignal.dir === 1 ? 'BUY' : 'SELL'} (${s.latestSignal.confidence}% conf) Entry $${s.latestSignal.entry}, SL $${s.latestSignal.sl}, TP1 $${s.latestSignal.tp1} (${s.latestSignal.reasons.join(', ')})`
        );
      }

      const res = await fetch('/api/ai/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe,
          riskProfile,
          useSearchGrounding,
          smcContext: smcLines.join('\n'),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to generate Gemini AI signal.');
      }
      const generated = data as AISignalResponse;
      setActiveSignal(generated);
      if (user) {
        await saveSignalToFirestore(user.uid, generated);
      } else {
        setSignalLog((prev) => [generated, ...prev].slice(0, 50));
      }
    } catch (err) {
      setSignalError(
        err instanceof Error ? err.message : 'Error generating XAUUSD AI signal.'
      );
    } finally {
      setSignalLoading(false);
    }
  }, [activeTab, timeframe, riskProfile, useSearchGrounding, smcOverlay.summary, user]);

  const handleSignIn = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOut(auth);
      setSignalLog([]);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-Out failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleClearSignalLog = async () => {
    if (user) {
      const ids = signalLog.map((s) => s.id);
      await clearUserSignalsInFirestore(user.uid, ids);
    } else {
      setSignalLog([]);
    }
  };

  const handleSendToCalculator = (sig: AISignalResponse) => {
    setActiveSignal(sig);
    setCalculatorPreset({
      entry: sig.entryPrice,
      sl: sig.stopLoss,
      tp: sig.takeProfit1,
      label: `AI ${sig.timeframe.toUpperCase()}`,
    });
    setActiveTab('calculator');
  };

  const handleLoadTimeframeToCalculator = (tf: TimeframeSnapshot) => {
    setCalculatorPreset({
      entry: tf.entryPrice,
      sl: tf.stopLoss,
      tp: tf.takeProfit1,
      label: `${tf.timeframe.toUpperCase()} ${tf.smcBias}`,
    });
    setActiveTab('calculator');
  };

  const handleSelectLoggedSignal = (sig: AISignalResponse) => {
    setActiveSignal(sig);
    setTimeframe(sig.timeframe);
    setActiveTab('terminal');
  };

  const navItems: { id: WorkspaceTab; label: string }[] = [
    { id: 'terminal', label: 'Terminal' },
    { id: 'mtf', label: 'Multi-Timeframe' },
    { id: 'calculator', label: 'Position Sizing' },
    { id: 'log', label: 'Signal Log' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-sm">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <a
            href="#terminal"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('terminal');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0"
          >
            Aurum Quant
          </a>

          <nav
            aria-label="Primary Workspace Navigation"
            className="hidden md:flex items-center gap-6"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    isActive
                      ? 'border-amber-500 text-slate-900 dark:text-slate-50'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleGenerateSignal}
              disabled={signalLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {signalLoading ? 'Analyzing XAUUSD...' : 'Generate AI Signal'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center gap-4 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`text-xs font-medium whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                  isActive
                    ? 'border-amber-500 text-slate-900 dark:text-slate-50'
                    : 'border-transparent text-slate-600 dark:text-slate-400'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Workspace Context Utility Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100">XAU/USD</span>
            <span aria-hidden="true">·</span>
            <span>Spot Gold Analytics</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{timeframe.toUpperCase()}</span>
            {snapshot && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Updated{' '}
                  {new Date(snapshot.updatedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {authError && (
              <span className="text-xs text-red-600 dark:text-red-400">{authError}</span>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-300 hidden sm:inline">
                  {user.displayName || user.email} · Synced
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={authBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={authBusy || !authReady}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                {authBusy ? 'Signing In...' : 'Sign In with Google'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 whitespace-nowrap shrink-0"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Market KPI Strip */}
        <MarketAnalyticsGrid
          snapshot={snapshot}
          loading={marketLoading}
          error={marketError}
          onRefresh={() => fetchMarketSnapshot(timeframe)}
          section="kpi"
        />

        {/* Workspace Tab Views */}
        {activeTab === 'terminal' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
              <div className="xl:col-span-8">
                <TradingViewChart
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  tvSymbol={tvSymbol}
                  onTvSymbolChange={setTvSymbol}
                  theme={theme}
                  candles={snapshot?.candles ?? []}
                  smc={smcOverlay}
                  smcSettings={smcSettings}
                  onSmcSettingsChange={setSmcSettings}
                  activeSignal={activeSignal}
                />
              </div>

              <div className="xl:col-span-4 flex flex-col">
                <SignalPanel
                  signal={activeSignal}
                  loading={signalLoading}
                  error={signalError}
                  timeframe={timeframe}
                  riskProfile={riskProfile}
                  onRiskProfileChange={setRiskProfile}
                  useSearchGrounding={useSearchGrounding}
                  onSearchGroundingChange={setUseSearchGrounding}
                  onGenerate={handleGenerateSignal}
                  onSendToCalculator={handleSendToCalculator}
                />
              </div>
            </div>

            <MultiTimeframeView
              timeframes={snapshot?.timeframes ?? []}
              activeTimeframe={timeframe}
              onSelectTimeframe={(tf) => setTimeframe(tf)}
              onLoadToCalculator={handleLoadTimeframeToCalculator}
              compact
            />

            <MarketAnalyticsGrid
              snapshot={snapshot}
              loading={marketLoading}
              error={marketError}
              onRefresh={() => fetchMarketSnapshot(timeframe)}
              section="tables"
            />
          </div>
        )}

        {activeTab === 'mtf' && (
          <MultiTimeframeView
            timeframes={snapshot?.timeframes ?? []}
            activeTimeframe={timeframe}
            onSelectTimeframe={(tf) => {
              setTimeframe(tf);
              setActiveTab('terminal');
            }}
            onLoadToCalculator={handleLoadTimeframeToCalculator}
          />
        )}

        {activeTab === 'calculator' && (
          <PositionCalculatorView
            currentPrice={snapshot?.price ?? 0}
            activeSignal={activeSignal}
            presetLevels={calculatorPreset}
          />
        )}

        {activeTab === 'log' && (
          <SignalLogView
            signals={signalLog}
            currentPrice={snapshot?.price ?? 0}
            onSelectSignal={handleSelectLoggedSignal}
            onClearLog={handleClearSignalLog}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1520px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>Aurum Quant · XAUUSD Quantitative & AI Analytics</span>
          <span>
            Market analytics and AI-generated trade signals are for informational research only, not
            financial advice.
          </span>
        </div>
      </footer>
    </div>
  );
}
