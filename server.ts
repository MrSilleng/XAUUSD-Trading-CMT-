import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  computeSmcOverlay,
  DEFAULT_SMC_SETTINGS,
} from './src/lib/smcEngine.ts';
import type {
  AISignalResponse,
  Candle,
  GroundingSource,
  KeyLevelsSnapshot,
  MacroBenchmark,
  MarketSnapshotResponse,
  RiskProfile,
  TechnicalIndicators,
  TimeframeKey,
  TimeframeSnapshot,
} from './src/types/market.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ---------- Quantitative Indicator Math ----------

function computeEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(values[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(2));
}

function computeMACD(closes: number[]): { line: number; signal: number; histogram: number } {
  if (closes.length < 35) {
    return { line: 0, signal: 0, histogram: 0 };
  }
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  const macdSeries = ema12.map((val, idx) => val - ema26[idx]);
  const signalSeries = computeEMA(macdSeries, 9);
  const line = macdSeries[macdSeries.length - 1];
  const signal = signalSeries[signalSeries.length - 1];
  return {
    line: Number(line.toFixed(2)),
    signal: Number(signal.toFixed(2)),
    histogram: Number((line - signal).toFixed(2)),
  };
}

function computeATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 0;
  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    trueRanges.push(tr);
  }
  const slice = trueRanges.slice(-period);
  const atr = slice.reduce((acc, v) => acc + v, 0) / Math.max(1, slice.length);
  return Number(atr.toFixed(2));
}

function computeBollinger(closes: number[], period = 20, stdDevMult = 2) {
  const slice = closes.slice(-period);
  if (slice.length === 0) {
    return { upper: 0, middle: 0, lower: 0, widthPct: 0 };
  }
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / slice.length;
  const sd = Math.sqrt(variance);
  const upper = mean + stdDevMult * sd;
  const lower = mean - stdDevMult * sd;
  const widthPct = mean > 0 ? ((upper - lower) / mean) * 100 : 0;
  return {
    upper: Number(upper.toFixed(2)),
    middle: Number(mean.toFixed(2)),
    lower: Number(lower.toFixed(2)),
    widthPct: Number(widthPct.toFixed(2)),
  };
}

function computeIndicators(candles: Candle[]): TechnicalIndicators {
  const closes = candles.map((c) => c.close);
  const lastPrice = closes[closes.length - 1] ?? 0;

  const ema20Arr = computeEMA(closes, 20);
  const ema50Arr = computeEMA(closes, 50);
  const ema200Arr = computeEMA(closes, Math.min(200, Math.max(50, closes.length)));

  const ema20 = Number((ema20Arr[ema20Arr.length - 1] ?? lastPrice).toFixed(2));
  const ema50 = Number((ema50Arr[ema50Arr.length - 1] ?? lastPrice).toFixed(2));
  const ema200 = Number((ema200Arr[ema200Arr.length - 1] ?? lastPrice).toFixed(2));

  const rsi14 = computeRSI(closes, 14);
  const macd = computeMACD(closes);
  const atr14 = computeATR(candles, 14);
  const bb = computeBollinger(closes, 20, 2);

  // Classic Pivot Points using previous window of candles
  const pivotWindow = candles.slice(-24);
  const pHigh = Math.max(...pivotWindow.map((c) => c.high));
  const pLow = Math.min(...pivotWindow.map((c) => c.low));
  const pClose = pivotWindow[pivotWindow.length - 1]?.close ?? lastPrice;
  const p = (pHigh + pLow + pClose) / 3;
  const r1 = 2 * p - pLow;
  const s1 = 2 * p - pHigh;
  const r2 = p + (pHigh - pLow);
  const s2 = p - (pHigh - pLow);

  let trendSummary: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (lastPrice > ema20 && ema20 > ema50) trendSummary = 'BULLISH';
  else if (lastPrice < ema20 && ema20 < ema50) trendSummary = 'BEARISH';

  let momentumSummary: TechnicalIndicators['momentumSummary'] = 'NEUTRAL';
  if (rsi14 >= 70) momentumSummary = 'OVERBOUGHT';
  else if (rsi14 <= 30) momentumSummary = 'OVERSOLD';
  else if (rsi14 > 54 && macd.histogram > 0) momentumSummary = 'BULLISH';
  else if (rsi14 < 46 && macd.histogram < 0) momentumSummary = 'BEARISH';

  return {
    ema20,
    ema50,
    ema200,
    rsi14,
    macdLine: macd.line,
    macdSignal: macd.signal,
    macdHistogram: macd.histogram,
    atr14,
    bbUpper: bb.upper,
    bbMiddle: bb.middle,
    bbLower: bb.lower,
    bbWidthPct: bb.widthPct,
    pivot: {
      p: Number(p.toFixed(2)),
      r1: Number(r1.toFixed(2)),
      r2: Number(r2.toFixed(2)),
      s1: Number(s1.toFixed(2)),
      s2: Number(s2.toFixed(2)),
    },
    trendSummary,
    momentumSummary,
  };
}

// ---------- Market Data Fetchers with Short Cache ----------

const TIMEFRAME_MAP: Record<
  TimeframeKey,
  { binance: string; yahooInterval: string; yahooRange: string }
> = {
  '5m': { binance: '5m', yahooInterval: '5m', yahooRange: '5d' },
  '15m': { binance: '15m', yahooInterval: '15m', yahooRange: '5d' },
  '30m': { binance: '30m', yahooInterval: '30m', yahooRange: '10d' },
  '1h': { binance: '1h', yahooInterval: '60m', yahooRange: '1mo' },
  '4h': { binance: '4h', yahooInterval: '60m', yahooRange: '3mo' },
  '1d': { binance: '1d', yahooInterval: '1d', yahooRange: '1y' },
};

async function fetchYahooCandles(
  symbol: string,
  interval: string,
  range: string
): Promise<{ candles: Candle[]; metaPrice?: number; prevClose?: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?interval=${interval}&range=${range}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AurumQuant/1.0)',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: { regularMarketPrice?: number; chartPreviousClose?: number };
          timestamp?: number[];
          indicators?: {
            quote?: Array<{
              open?: Array<number | null>;
              high?: Array<number | null>;
              low?: Array<number | null>;
              close?: Array<number | null>;
              volume?: Array<number | null>;
            }>;
          };
        }>;
      };
    };

    const result = data.chart?.result?.[0];
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) return null;
    const quote = result.indicators.quote[0];
    const candles: Candle[] = [];
    for (let i = 0; i < result.timestamp.length; i++) {
      const o = quote.open?.[i];
      const h = quote.high?.[i];
      const l = quote.low?.[i];
      const c = quote.close?.[i];
      const v = quote.volume?.[i] ?? 0;
      if (o != null && h != null && l != null && c != null && Number.isFinite(c)) {
        candles.push({
          time: result.timestamp[i],
          open: Number(o.toFixed(2)),
          high: Number(h.toFixed(2)),
          low: Number(l.toFixed(2)),
          close: Number(c.toFixed(2)),
          volume: Number(v),
        });
      }
    }
    if (candles.length < 20) return null;
    return {
      candles,
      metaPrice: result.meta?.regularMarketPrice,
      prevClose: result.meta?.chartPreviousClose,
    };
  } catch {
    return null;
  }
}

async function fetchBinancePaxgCandles(
  interval: string,
  limit = 160
): Promise<Candle[] | null> {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=${interval}&limit=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<Array<string | number>>;
    if (!Array.isArray(rows) || rows.length < 20) return null;
    return rows.map((row) => ({
      time: Math.floor(Number(row[0]) / 1000),
      open: Number(Number(row[1]).toFixed(2)),
      high: Number(Number(row[2]).toFixed(2)),
      low: Number(Number(row[3]).toFixed(2)),
      close: Number(Number(row[4]).toFixed(2)),
      volume: Number(Number(row[5]).toFixed(2)),
    }));
  } catch {
    return null;
  }
}

function aggregate4hCandles(hourly: Candle[]): Candle[] {
  const result: Candle[] = [];
  for (let i = 0; i < hourly.length; i += 4) {
    const chunk = hourly.slice(i, i + 4);
    if (chunk.length === 0) continue;
    result.push({
      time: chunk[0].time,
      open: chunk[0].open,
      high: Math.max(...chunk.map((c) => c.high)),
      low: Math.min(...chunk.map((c) => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((acc, c) => acc + c.volume, 0),
    });
  }
  return result;
}

async function getCandlesForTimeframe(
  timeframe: TimeframeKey
): Promise<{ candles: Candle[]; sourceFeed: string }> {
  const cfg = TIMEFRAME_MAP[timeframe];

  // Primary: Yahoo XAUUSD=X (Spot Gold)
  const yahooSpot = await fetchYahooCandles('XAUUSD=X', cfg.yahooInterval, cfg.yahooRange);
  if (yahooSpot && yahooSpot.candles.length >= 40) {
    const candles =
      timeframe === '4h' ? aggregate4hCandles(yahooSpot.candles) : yahooSpot.candles;
    return { candles: candles.slice(-260), sourceFeed: 'Spot Gold (XAU/USD)' };
  }

  // Secondary: Binance PAXGUSDT (1:1 Physical London Good Delivery Gold 24/7)
  const binanceCandles = await fetchBinancePaxgCandles(cfg.binance, 260);
  if (binanceCandles && binanceCandles.length >= 40) {
    return { candles: binanceCandles, sourceFeed: 'Physical Gold Spot (PAXG/USD)' };
  }

  // Tertiary: COMEX Gold Futures GC=F
  const yahooFutures = await fetchYahooCandles('GC=F', cfg.yahooInterval, cfg.yahooRange);
  if (yahooFutures && yahooFutures.candles.length >= 40) {
    const candles =
      timeframe === '4h' ? aggregate4hCandles(yahooFutures.candles) : yahooFutures.candles;
    return { candles: candles.slice(-260), sourceFeed: 'COMEX Gold (GC=F)' };
  }

  throw new Error('Live XAUUSD market data feeds are temporarily unreachable.');
}

async function fetchKeyLevels(): Promise<KeyLevelsSnapshot> {
  try {
    let dailyCandles = (await fetchYahooCandles('XAUUSD=X', '1d', '1mo'))?.candles;
    if (!dailyCandles || dailyCandles.length < 10) {
      dailyCandles = (await fetchBinancePaxgCandles('1d', 30)) ?? undefined;
    }
    if (!dailyCandles || dailyCandles.length < 2) return {};

    const today = dailyCandles[dailyCandles.length - 1];
    const prevDay = dailyCandles[dailyCandles.length - 2];

    const getWeekKey = (unixSec: number) => {
      const d = new Date(unixSec * 1000);
      const day = d.getUTCDay();
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
      return monday.toISOString().slice(0, 10);
    };

    const currentWeekKey = getWeekKey(today.time);
    const currentWeekBars = dailyCandles.filter((c) => getWeekKey(c.time) === currentWeekKey);
    const priorBars = dailyCandles.filter((c) => getWeekKey(c.time) !== currentWeekKey);
    const prevWeekKey = priorBars.length > 0 ? getWeekKey(priorBars[priorBars.length - 1].time) : null;
    const prevWeekBars = prevWeekKey
      ? priorBars.filter((c) => getWeekKey(c.time) === prevWeekKey)
      : [];

    return {
      dailyHigh: today.high,
      dailyLow: today.low,
      pdh: prevDay.high,
      pdl: prevDay.low,
      weeklyHigh:
        currentWeekBars.length > 0
          ? Math.max(...currentWeekBars.map((b) => b.high))
          : today.high,
      weeklyLow:
        currentWeekBars.length > 0
          ? Math.min(...currentWeekBars.map((b) => b.low))
          : today.low,
      pwh:
        prevWeekBars.length > 0
          ? Math.max(...prevWeekBars.map((b) => b.high))
          : undefined,
      pwl:
        prevWeekBars.length > 0
          ? Math.min(...prevWeekBars.map((b) => b.low))
          : undefined,
    };
  } catch {
    return {};
  }
}

async function fetchMacroBenchmarks(): Promise<MacroBenchmark[]> {
  const targets = [
    { symbol: 'DX-Y.NYB', label: 'US Dollar Index (DXY)' },
    { symbol: '^TNX', label: 'US 10Y Treasury Yield' },
    { symbol: 'GC=F', label: 'COMEX Gold Futures' },
  ];

  const settled = await Promise.all(
    targets.map(async (t): Promise<MacroBenchmark | null> => {
      const data = await fetchYahooCandles(t.symbol, '1d', '5d');
      if (!data || data.candles.length < 2) return null;
      const last = data.metaPrice ?? data.candles[data.candles.length - 1].close;
      const prev = data.candles[data.candles.length - 2].close;
      const changePct = prev > 0 ? ((last - prev) / prev) * 100 : 0;
      return {
        symbol: t.symbol,
        label: t.label,
        price: Number(last.toFixed(2)),
        changePct: Number(changePct.toFixed(2)),
      };
    })
  );

  return settled.filter((item): item is MacroBenchmark => item !== null);
}

const snapshotCache = new Map<TimeframeKey, { data: MarketSnapshotResponse; expiresAt: number }>();

async function buildMarketSnapshot(timeframe: TimeframeKey): Promise<MarketSnapshotResponse> {
  const cached = snapshotCache.get(timeframe);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const allTimeframesList: TimeframeKey[] = ['5m', '15m', '30m', '1h', '4h', '1d'];

  const [{ candles, sourceFeed }, macro, keyLevels, allTfRaw] = await Promise.all([
    getCandlesForTimeframe(timeframe),
    fetchMacroBenchmarks(),
    fetchKeyLevels(),
    Promise.all(
      allTimeframesList.map(async (tf) => {
        if (tf === timeframe) return null;
        try {
          const res = await getCandlesForTimeframe(tf);
          return { tf, candles: res.candles };
        } catch {
          return null;
        }
      })
    ),
  ]);

  const buildTfSnapshot = (tf: TimeframeKey, tfCandles: Candle[]): TimeframeSnapshot => {
    const ind = computeIndicators(tfCandles);
    const smc = computeSmcOverlay(tfCandles, tf, DEFAULT_SMC_SETTINGS, keyLevels);
    const live = smc.summary.liveSetup;
    const last = tfCandles[tfCandles.length - 1];
    const prev = tfCandles[Math.max(0, tfCandles.length - 2)];
    const chgPct = prev.close > 0 ? ((last.close - prev.close) / prev.close) * 100 : 0;

    return {
      timeframe: tf,
      price: last.close,
      changePct: Number(chgPct.toFixed(2)),
      rsi14: ind.rsi14,
      macdHistogram: ind.macdHistogram,
      ema20: ind.ema20,
      ema50: ind.ema50,
      atr14: ind.atr14,
      bias: ind.trendSummary,
      smcBias: live.bias,
      signalAction: live.action,
      entryPrice: live.entry,
      stopLoss: live.sl,
      takeProfit1: live.tp1,
      takeProfit2: live.tp2,
      confirmationPct: live.confirmationPct,
      winRatePct: live.winRatePct,
      wins: live.wins,
      losses: live.losses,
      qualified75: live.qualified75,
    };
  };

  const indicators = computeIndicators(candles);
  const lastCandle = candles[candles.length - 1];
  const lookbackIdx = Math.max(0, candles.length - 24);
  const prevRef = candles[lookbackIdx].open;
  const change = lastCandle.close - prevRef;
  const changePct = prevRef > 0 ? (change / prevRef) * 100 : 0;
  const recent24 = candles.slice(-24);
  const high24h = Math.max(...recent24.map((c) => c.high));
  const low24h = Math.min(...recent24.map((c) => c.low));

  const currentTfSnapshot = buildTfSnapshot(timeframe, candles);
  currentTfSnapshot.changePct = Number(changePct.toFixed(2));

  const timeframes: TimeframeSnapshot[] = allTimeframesList
    .map((tf) => {
      if (tf === timeframe) return currentTfSnapshot;
      const found = allTfRaw.find((item) => item?.tf === tf);
      return found ? buildTfSnapshot(tf, found.candles) : null;
    })
    .filter((item): item is TimeframeSnapshot => item !== null);

  const response: MarketSnapshotResponse = {
    symbol: 'XAUUSD',
    sourceFeed,
    timeframe,
    price: Number(lastCandle.close.toFixed(2)),
    previousClose: Number(prevRef.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePct: Number(changePct.toFixed(2)),
    high24h: Number(high24h.toFixed(2)),
    low24h: Number(low24h.toFixed(2)),
    updatedAt: new Date().toISOString(),
    candles,
    indicators,
    macro,
    timeframes,
    keyLevels,
  };

  snapshotCache.set(timeframe, { data: response, expiresAt: Date.now() + 12_000 });
  return response;
}

// ---------- Express App & API Routes ----------

const app = express();
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/market/xauusd', async (req: Request, res: Response) => {
  const tfParam = String(req.query.timeframe || '15m') as TimeframeKey;
  const timeframe: TimeframeKey = tfParam in TIMEFRAME_MAP ? tfParam : '15m';

  try {
    const snapshot = await buildMarketSnapshot(timeframe);
    res.json(snapshot);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load live XAUUSD data';
    res.status(502).json({ error: message });
  }
});

app.post('/api/ai/signal', async (req: Request, res: Response) => {
  const timeframeRaw = String(req.body?.timeframe || '15m') as TimeframeKey;
  const timeframe: TimeframeKey = timeframeRaw in TIMEFRAME_MAP ? timeframeRaw : '15m';
  const riskProfileRaw = String(req.body?.riskProfile || 'Balanced') as RiskProfile;
  const riskProfile: RiskProfile =
    riskProfileRaw === 'Conservative' || riskProfileRaw === 'Aggressive'
      ? riskProfileRaw
      : 'Balanced';
  const useSearchGrounding = Boolean(req.body?.useSearchGrounding ?? true);
  const smcContextText =
    typeof req.body?.smcContext === 'string' ? req.body.smcContext : '';

  try {
    const snapshot = await buildMarketSnapshot(timeframe);
    const ai = createGeminiClient();
    const modelName = 'gemini-4-hydrogen';

    // Step 1 (optional): Google Search Grounding for live gold/DXY/Fed catalysts
    let macroContextSummary = 'Live search grounding disabled for this signal.';
    let sources: GroundingSource[] = [];

    if (useSearchGrounding) {
      try {
        const searchResponse = await ai.models.generateContent({
          model: modelName,
          contents:
            `Summarize the latest market catalysts affecting XAUUSD (spot gold price), US Dollar Index (DXY), Federal Reserve rate expectations, and geopolitical safe-haven demand today (${new Date().toISOString().slice(0, 10)}). Keep it factual, concise, and focused on price drivers in 4 bullet points.`,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        if (searchResponse.text) {
          macroContextSummary = searchResponse.text;
        }

        const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(chunks)) {
          const seen = new Set<string>();
          for (const chunk of chunks) {
            const uri = chunk.web?.uri;
            const title = chunk.web?.title;
            if (uri && title && !seen.has(uri)) {
              seen.add(uri);
              sources.push({ title, uri });
            }
          }
          sources = sources.slice(0, 5);
        }
      } catch (searchErr) {
        console.warn('Search grounding fallback:', searchErr);
        macroContextSummary = 'Live web catalyst search unavailable; using quantitative & macro price feeds.';
      }
    }

    // Step 2: Quantitative + Macro Signal Synthesis with strict JSON schema
    const recentCandles = snapshot.candles.slice(-20).map((c) => ({
      t: new Date(c.time * 1000).toISOString().slice(11, 16),
      o: c.open,
      h: c.high,
      l: c.low,
      c: c.close,
    }));

    const analysisPrompt = `
You are an institutional quantitative XAU/USD (Spot Gold) strategist.
Analyze the following REAL-TIME market data and synthesize a precise, actionable trading signal tailored to the ${riskProfile} risk profile on the ${timeframe} timeframe.

CURRENT MARKET SNAPSHOT (${snapshot.sourceFeed}):
- Spot Price: $${snapshot.price.toFixed(2)}
- 24h Change: ${snapshot.change >= 0 ? '+' : ''}${snapshot.change.toFixed(2)} (${snapshot.changePct.toFixed(2)}%)
- 24h High / Low: $${snapshot.high24h.toFixed(2)} / $${snapshot.low24h.toFixed(2)}

TECHNICAL INDICATORS (${timeframe}):
- EMA 20: $${snapshot.indicators.ema20.toFixed(2)}
- EMA 50: $${snapshot.indicators.ema50.toFixed(2)}
- EMA 200: $${snapshot.indicators.ema200.toFixed(2)}
- Trend Structure: ${snapshot.indicators.trendSummary}
- RSI (14): ${snapshot.indicators.rsi14} (${snapshot.indicators.momentumSummary})
- MACD (12,26,9): Line ${snapshot.indicators.macdLine}, Signal ${snapshot.indicators.macdSignal}, Histogram ${snapshot.indicators.macdHistogram}
- ATR (14): $${snapshot.indicators.atr14.toFixed(2)}
- Bollinger Bands (20,2): Upper $${snapshot.indicators.bbUpper}, Mid $${snapshot.indicators.bbMiddle}, Lower $${snapshot.indicators.bbLower} (Width ${snapshot.indicators.bbWidthPct}%)
- Classic Pivots: R2 $${snapshot.indicators.pivot.r2} | R1 $${snapshot.indicators.pivot.r1} | P $${snapshot.indicators.pivot.p} | S1 $${snapshot.indicators.pivot.s1} | S2 $${snapshot.indicators.pivot.s2}
- Key Daily/Weekly Levels: PDH $${snapshot.keyLevels.pdh ?? 'N/A'} | PDL $${snapshot.keyLevels.pdl ?? 'N/A'} | PWH $${snapshot.keyLevels.pwh ?? 'N/A'} | PWL $${snapshot.keyLevels.pwl ?? 'N/A'}

SMC / ICT INDICATOR CONTEXT:
${smcContextText || 'Standard SMC structure evaluation'}

MULTI-TIMEFRAME ALIGNMENT:
${snapshot.timeframes
  .map(
    (tf) =>
      `- ${tf.timeframe}: Price $${tf.price}, EMA20 $${tf.ema20}, EMA50 $${tf.ema50}, RSI ${tf.rsi14}, MACD Hist ${tf.macdHistogram}, Bias ${tf.bias}`
  )
  .join('\n')}

MACRO BENCHMARKS:
${snapshot.macro.map((m) => `- ${m.label}: ${m.price} (${m.changePct >= 0 ? '+' : ''}${m.changePct}%)`).join('\n') || 'Not available'}

LIVE MACRO NEWS CONTEXT:
${macroContextSummary}

RECENT 20 CANDLES (OHLC):
${JSON.stringify(recentCandles)}

RULES:
1. All price levels (entryPrice, entryZoneMin, entryZoneMax, stopLoss, takeProfit1, takeProfit2) MUST be realistic relative to current Spot Price ($${snapshot.price.toFixed(2)}) and ATR ($${snapshot.indicators.atr14.toFixed(2)}).
2. If bias is BUY or STRONG BUY: stopLoss < entryPrice < takeProfit1 < takeProfit2.
3. If bias is SELL or STRONG SELL: stopLoss > entryPrice > takeProfit1 > takeProfit2.
4. If bias is NEUTRAL (consolidation/range-bound): provide breakout trigger levels around current pivot/Bollinger range.
5. For Conservative profile, widen SL using 1.5x-2.0x ATR and target conservative S/R levels; for Aggressive profile, use tighter 0.8x-1.2x ATR entry refinement.
6. Confidence must be an integer 0-100 reflecting genuine multi-timeframe & indicator alignment.
`;

    const signalResponse = await ai.models.generateContent({
      model: modelName,
      contents: analysisPrompt,
      config: {
        systemInstruction:
          'You are an institutional commodities and FX quantitative analyst specializing in XAUUSD. Always respond strictly in valid JSON matching the requested schema. Be concise, objective, and mathematically consistent.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bias: {
              type: Type.STRING,
              description: 'One of: STRONG BUY, BUY, NEUTRAL, SELL, STRONG SELL',
            },
            confidence: {
              type: Type.INTEGER,
              description: 'Signal confidence score from 0 to 100',
            },
            entryPrice: { type: Type.NUMBER },
            entryZoneMin: { type: Type.NUMBER },
            entryZoneMax: { type: Type.NUMBER },
            stopLoss: { type: Type.NUMBER },
            takeProfit1: { type: Type.NUMBER },
            takeProfit2: { type: Type.NUMBER },
            riskRewardRatio: {
              type: Type.STRING,
              description: 'Formatted risk-to-reward ratio, e.g. 1 : 2.3',
            },
            setupType: {
              type: Type.STRING,
              description: 'Short label for the technical setup, e.g. EMA Pullback Continuation',
            },
            technicalSummary: {
              type: Type.STRING,
              description: '2-3 crisp sentences explaining price structure, momentum, and key levels.',
            },
            macroCatalysts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 4 concise macro/fundamental drivers impacting XAUUSD right now.',
            },
            confluenceFactors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  factor: { type: Type.STRING },
                  reading: { type: Type.STRING },
                  impact: {
                    type: Type.STRING,
                    description: 'BULLISH, BEARISH, or NEUTRAL',
                  },
                },
                required: ['factor', 'reading', 'impact'],
              },
            },
            invalidationCondition: {
              type: Type.STRING,
              description: 'Exact price/candle close condition that invalidates this trade thesis.',
            },
          },
          required: [
            'bias',
            'confidence',
            'entryPrice',
            'entryZoneMin',
            'entryZoneMax',
            'stopLoss',
            'takeProfit1',
            'takeProfit2',
            'riskRewardRatio',
            'setupType',
            'technicalSummary',
            'macroCatalysts',
            'confluenceFactors',
            'invalidationCondition',
          ],
        },
      },
    });

    const parsed = JSON.parse((signalResponse.text ?? '{}').trim());

    const allowedBiases = new Set(['STRONG BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG SELL']);
    const normalizedBias = allowedBiases.has(parsed.bias) ? parsed.bias : 'NEUTRAL';

    const result: AISignalResponse = {
      id: `sig_${Date.now()}`,
      symbol: 'XAUUSD',
      timeframe,
      riskProfile,
      bias: normalizedBias,
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
      spotPriceAtSignal: snapshot.price,
      entryPrice: Number(Number(parsed.entryPrice).toFixed(2)),
      entryZoneMin: Number(Number(parsed.entryZoneMin).toFixed(2)),
      entryZoneMax: Number(Number(parsed.entryZoneMax).toFixed(2)),
      stopLoss: Number(Number(parsed.stopLoss).toFixed(2)),
      takeProfit1: Number(Number(parsed.takeProfit1).toFixed(2)),
      takeProfit2: Number(Number(parsed.takeProfit2).toFixed(2)),
      riskRewardRatio: String(parsed.riskRewardRatio || '1 : 2.0'),
      setupType: String(parsed.setupType || 'Quantitative Confluence'),
      technicalSummary: String(parsed.technicalSummary || ''),
      macroCatalysts: Array.isArray(parsed.macroCatalysts) ? parsed.macroCatalysts : [],
      confluenceFactors: Array.isArray(parsed.confluenceFactors) ? parsed.confluenceFactors : [],
      invalidationCondition: String(parsed.invalidationCondition || ''),
      sources,
      generatedAt: new Date().toISOString(),
      modelUsed: modelName,
    };

    res.json(result);
  } catch (err: unknown) {
    console.error('Gemini AI Signal Error:', err);
    const rawMsg = err instanceof Error ? err.message : 'Failed to generate AI signal.';
    let status = 500;
    let userMessage = rawMsg;

    if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('400')) {
      status = 400;
      userMessage =
        'Gemini API key appears invalid. Please verify GEMINI_API_KEY in Settings > Secrets.';
    } else if (rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('403')) {
      status = 403;
      userMessage =
        'Gemini API permission denied. Please check your GEMINI_API_KEY in Settings > Secrets.';
    } else if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('429')) {
      status = 429;
      userMessage =
        'Gemini API rate limit reached. Please retry in a moment or check your quota in Settings > Secrets.';
    }

    res.status(status).json({ error: userMessage });
  }
});

// ---------- Vite Dev Middleware / Static Prod Server ----------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aurum Quant server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
