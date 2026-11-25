export type TimeframeKey = '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export type SignalBias = 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';

export type RiskProfile = 'Conservative' | 'Balanced' | 'Aggressive';

export type TradingViewFeedSymbol =
  | 'OANDA:XAUUSD'
  | 'FOREXCOM:XAUUSD'
  | 'TVC:GOLD'
  | 'BINANCE:PAXGUSDT';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  macdLine: number;
  macdSignal: number;
  macdHistogram: number;
  atr14: number;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  bbWidthPct: number;
  pivot: {
    p: number;
    r1: number;
    r2: number;
    s1: number;
    s2: number;
  };
  trendSummary: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  momentumSummary: 'OVERBOUGHT' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'OVERSOLD';
}

export interface MacroBenchmark {
  symbol: string;
  label: string;
  price: number;
  changePct: number;
}

export interface TimeframeSnapshot {
  timeframe: TimeframeKey;
  price: number;
  changePct: number;
  rsi14: number;
  macdHistogram: number;
  ema20: number;
  ema50: number;
  atr14: number;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  smcBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  signalAction: 'BUY' | 'SELL' | 'NEUTRAL';
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  confirmationPct: number;
  winRatePct: number;
  wins: number;
  losses: number;
  qualified75: boolean;
}

export interface KeyLevelsSnapshot {
  pdh?: number;
  pdl?: number;
  pwh?: number;
  pwl?: number;
  dailyHigh?: number;
  dailyLow?: number;
  weeklyHigh?: number;
  weeklyLow?: number;
}

export interface MarketSnapshotResponse {
  symbol: string;
  sourceFeed: string;
  timeframe: TimeframeKey;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  high24h: number;
  low24h: number;
  updatedAt: string;
  candles: Candle[];
  indicators: TechnicalIndicators;
  macro: MacroBenchmark[];
  timeframes: TimeframeSnapshot[];
  keyLevels: KeyLevelsSnapshot;
}

export interface SignalConfluenceFactor {
  factor: string;
  reading: string;
  impact: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AISignalResponse {
  id: string;
  symbol: string;
  timeframe: TimeframeKey;
  riskProfile: RiskProfile;
  bias: SignalBias;
  confidence: number;
  spotPriceAtSignal: number;
  entryPrice: number;
  entryZoneMin: number;
  entryZoneMax: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: string;
  setupType: string;
  technicalSummary: string;
  macroCatalysts: string[];
  confluenceFactors: SignalConfluenceFactor[];
  invalidationCondition: string;
  sources: GroundingSource[];
  generatedAt: string;
  modelUsed: string;
}
