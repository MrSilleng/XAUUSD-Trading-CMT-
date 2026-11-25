import type { Candle, TimeframeKey } from '../types/market';

export interface SmcSettings {
  swingLen: number;
  showSwings: boolean;
  classify: boolean;
  showBOS: boolean;
  showCHOCH: boolean;
  showMSS: boolean;
  showDisp: boolean;
  dispMult: number;

  showOB: boolean;
  showMit: boolean;
  showBreaker: boolean;
  showReclaimed: boolean;
  showRB: boolean;
  rbRatio: number;
  maxOB: number;
  maxRB: number;

  showFVG: boolean;
  showIFVG: boolean;
  fvgMinATR: number;
  fvgMax: number;

  showLiq: boolean;
  showPools: boolean;
  eqTol: number;
  showSweep: boolean;
  showStopHunt: boolean;
  shPen: number;
  showIDM: boolean;
  idmLen: number;
  liqMax: number;

  showSD: boolean;
  sdMax: number;
  showSR: boolean;
  srLen: number;
  showFlip: boolean;
  srMax: number;
  showPD: boolean;
  showOTE: boolean;
  oteLo: number;
  oteHi: number;
  showRange: boolean;
  rangeLen: number;
  rangeATR: number;

  showAsia: boolean;
  showLon: boolean;
  showNY: boolean;

  showPDHL: boolean;
  showPWHL: boolean;
  showDWHL: boolean;

  showSig: boolean;
  minConf: number;
  rr1: number;
  rr2: number;
  slBuf: number;
}

export const DEFAULT_SMC_SETTINGS: SmcSettings = {
  swingLen: 10,
  showSwings: true,
  classify: true,
  showBOS: true,
  showCHOCH: true,
  showMSS: true,
  showDisp: true,
  dispMult: 1.5,

  showOB: true,
  showMit: true,
  showBreaker: true,
  showReclaimed: true,
  showRB: true,
  rbRatio: 0.55,
  maxOB: 8,
  maxRB: 5,

  showFVG: true,
  showIFVG: true,
  fvgMinATR: 0.15,
  fvgMax: 12,

  showLiq: true,
  showPools: true,
  eqTol: 0.12,
  showSweep: true,
  showStopHunt: true,
  shPen: 0.1,
  showIDM: true,
  idmLen: 3,
  liqMax: 6,

  showSD: true,
  sdMax: 8,
  showSR: true,
  srLen: 20,
  showFlip: true,
  srMax: 6,
  showPD: true,
  showOTE: true,
  oteLo: 0.62,
  oteHi: 0.79,
  showRange: true,
  rangeLen: 20,
  rangeATR: 3.5,

  showAsia: true,
  showLon: true,
  showNY: true,

  showPDHL: true,
  showPWHL: true,
  showDWHL: true,

  showSig: true,
  minConf: 75,
  rr1: 1.0,
  rr2: 2.0,
  slBuf: 0.2,
};

export interface SmcBox {
  id: string;
  x1: number;
  x2: number;
  top: number;
  bot: number;
  extendRight: boolean;
  color: string;
  borderColor: string;
  borderStyle?: 'solid' | 'dotted' | 'dashed';
  text?: string;
  textColor?: string;
  textAlign?: 'left' | 'right' | 'center';
  kind: 'OB' | 'MB' | 'BREAKER' | 'RECLAIMED' | 'RB' | 'FVG' | 'IFVG' | 'SD' | 'POOL' | 'RANGE' | 'SESSION' | 'OTE' | 'PREM' | 'DISC';
}

export interface SmcLine {
  id: string;
  x1: number;
  x2: number;
  y: number;
  extendRight: boolean;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  width: number;
  label?: string;
  labelColor?: string;
  kind: 'BOS' | 'CHOCH' | 'BSL' | 'SSL' | 'SR' | 'IDM' | 'EQ' | 'SESSION' | 'KEYLEVEL' | 'TRADE';
}

export interface SmcLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  position: 'above' | 'below';
  color: string;
  bgColor?: string;
  kind: 'SWING' | 'MSS' | 'SWEEP' | 'HUNT' | 'IDM' | 'SIGNAL';
}

export interface SmcTradeSignal {
  barIndex: number;
  time: number;
  dir: 1 | -1;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  confidence: number;
  reasons: string[];
}

export interface KeyLevelsInput {
  pdh?: number;
  pdl?: number;
  pwh?: number;
  pwl?: number;
  dailyHigh?: number;
  dailyLow?: number;
  weeklyHigh?: number;
  weeklyLow?: number;
}

export interface SmcLiveSetup {
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  action: 'BUY' | 'SELL' | 'NEUTRAL';
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  confirmationPct: number;
  winRatePct: number;
  wins: number;
  losses: number;
  qualified75: boolean;
}

export interface SmcOverlayResult {
  boxes: SmcBox[];
  lines: SmcLine[];
  labels: SmcLabel[];
  displacementBars: Record<number, 1 | -1>;
  signals: SmcTradeSignal[];
  latestTrend: 1 | -1 | 0;
  summary: {
    trendLabel: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    activeBullOBs: number;
    activeBearOBs: number;
    activeFVGs: number;
    activeBSL: number;
    activeSSL: number;
    zonePosition: 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM';
    latestSignal: SmcTradeSignal | null;
    liveSetup: SmcLiveSetup;
    keyLevels: KeyLevelsInput;
  };
}

// Colors matching the Pine Script palette
const C = {
  bullOB: 'rgba(8, 153, 129, 0.18)',
  bullOBBorder: 'rgba(8, 153, 129, 0.72)',
  bullOBText: '#10b981',
  bearOB: 'rgba(242, 54, 69, 0.18)',
  bearOBBorder: 'rgba(242, 54, 69, 0.72)',
  bearOBText: '#f43f5e',
  rb: 'rgba(255, 152, 0, 0.20)',
  rbBorder: 'rgba(255, 152, 0, 0.72)',
  rbText: '#fb923c',
  fvgBull: 'rgba(0, 230, 118, 0.14)',
  fvgBullBorder: 'rgba(0, 230, 118, 0.55)',
  fvgBullText: '#34d399',
  fvgBear: 'rgba(255, 23, 68, 0.14)',
  fvgBearBorder: 'rgba(255, 23, 68, 0.55)',
  fvgBearText: '#fb7185',
  ifvg: 'rgba(179, 136, 255, 0.18)',
  ifvgBorder: 'rgba(179, 136, 255, 0.75)',
  ifvgText: '#c4b5fd',
  demand: 'rgba(76, 175, 80, 0.16)',
  demandBorder: 'rgba(76, 175, 80, 0.65)',
  demandText: '#4ade80',
  supply: 'rgba(233, 30, 99, 0.16)',
  supplyBorder: 'rgba(233, 30, 99, 0.65)',
  supplyText: '#f472b6',
  sup: '#00c853',
  res: '#ff5252',
  bsl: '#ff7043',
  ssl: '#26c6da',
  pool: 'rgba(255, 213, 79, 0.18)',
  poolBorder: 'rgba(255, 213, 79, 0.65)',
  poolText: '#fde047',
  bos: '#3b82f6',
  choch: '#f59e0b',
  mss: '#e040fb',
  hh: '#10b981',
  ll: '#f43f5e',
  prem: 'rgba(242, 54, 69, 0.06)',
  disc: 'rgba(8, 153, 129, 0.06)',
  eq: '#94a3b8',
  ote: 'rgba(250, 204, 21, 0.14)',
  oteBorder: 'rgba(250, 204, 21, 0.55)',
  range: 'rgba(148, 163, 184, 0.08)',
  rangeBorder: 'rgba(148, 163, 184, 0.45)',
  sweep: '#7e57c2',
  hunt: '#d500f9',
  idm: '#fbc02d',
  asia: '#ab47bc',
  lon: '#42a5f5',
  ny: '#ffa726',
  pd: '#e2e8f0',
  dw: '#90a4ae',
};

function computeAtrSeries(candles: Candle[], period = 14): number[] {
  const n = candles.length;
  const trs: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      trs[i] = candles[i].high - candles[i].low;
    } else {
      trs[i] = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      );
    }
  }
  const atrs: number[] = new Array(n).fill(0);
  let rma = 0;
  for (let i = 0; i < n; i++) {
    if (i < period) {
      rma += trs[i];
      atrs[i] = rma / (i + 1);
    } else if (i === period) {
      rma = (rma + trs[i]) / (period + 1);
      atrs[i] = rma;
    } else {
      rma = (atrs[i - 1] * (period - 1) + trs[i]) / period;
      atrs[i] = rma;
    }
  }
  return atrs;
}

function computeEmaSeries(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

function computeRsiSeries(closes: number[], period = 14): number[] {
  const out = new Array(closes.length).fill(50);
  if (closes.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  let avgG = gain / period;
  let avgL = loss / period;
  out[period] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgG = (avgG * (period - 1) + (d > 0 ? d : 0)) / period;
    avgL = (avgL * (period - 1) + (d < 0 ? -d : 0)) / period;
    out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  return out;
}

function isPivotHigh(candles: Candle[], idx: number, leftRight: number): number | null {
  if (idx < leftRight * 2) return null;
  const center = idx - leftRight;
  const val = candles[center].high;
  for (let i = center - leftRight; i <= idx; i++) {
    if (i !== center && candles[i].high > val) return null;
  }
  return val;
}

function isPivotLow(candles: Candle[], idx: number, leftRight: number): number | null {
  if (idx < leftRight * 2) return null;
  const center = idx - leftRight;
  const val = candles[center].low;
  for (let i = center - leftRight; i <= idx; i++) {
    if (i !== center && candles[i].low < val) return null;
  }
  return val;
}

function getNYHourMinute(unixSec: number): { hour: number; minute: number; dateStr: string } {
  const d = new Date(unixSec * 1000);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));
  const dateStr = `${get('year')}-${get('month')}-${get('day')}`;
  return { hour, minute, dateStr };
}

function inSession(hour: number, minute: number, startH: number, endH: number): boolean {
  const mins = hour * 60 + minute;
  const s = startH * 60;
  const e = endH === 0 ? 24 * 60 : endH * 60;
  return mins >= s && mins < e;
}

export function computeSmcOverlay(
  candles: Candle[],
  timeframe: TimeframeKey,
  settings: SmcSettings,
  externalKeyLevels?: KeyLevelsInput
): SmcOverlayResult {
  const n = candles.length;
  if (n < 30) {
    return {
      boxes: [],
      lines: [],
      labels: [],
      displacementBars: {},
      signals: [],
      latestTrend: 0,
      summary: {
        trendLabel: 'NEUTRAL',
        activeBullOBs: 0,
        activeBearOBs: 0,
        activeFVGs: 0,
        activeBSL: 0,
        activeSSL: 0,
        zonePosition: 'EQUILIBRIUM',
        latestSignal: null,
        liveSetup: {
          bias: 'NEUTRAL',
          action: 'NEUTRAL',
          entry: 0,
          sl: 0,
          tp1: 0,
          tp2: 0,
          confirmationPct: 0,
          winRatePct: 0,
          wins: 0,
          losses: 0,
          qualified75: false,
        },
        keyLevels: externalKeyLevels ?? {},
      },
    };
  }

  const atrs = computeAtrSeries(candles, 14);
  const closes = candles.map((c) => c.close);
  const ema21 = computeEmaSeries(closes, 21);
  const ema50 = computeEmaSeries(closes, 50);
  const rsi14 = computeRsiSeries(closes, 14);

  interface OBState {
    id: string;
    x1: number;
    top: number;
    bot: number;
    dir: 1 | -1;
    state: 0 | 1 | 2;
    kind: 'OB' | 'MB' | 'RB';
    tapped: boolean;
  }

  interface FVGState {
    id: string;
    x1: number;
    top: number;
    bot: number;
    ftop: number;
    fbot: number;
    dir: 1 | -1;
    state: 0 | 1;
  }

  interface LiqState {
    id: string;
    x1: number;
    x2: number;
    price: number;
    isHigh: boolean;
    active: boolean;
    label: string;
    pool?: { x1: number; top: number; bot: number; text: string };
  }

  interface SRState {
    id: string;
    x1: number;
    x2: number;
    price: number;
    isRes: boolean;
    flipped: boolean;
    active: boolean;
  }

  interface SDState {
    id: string;
    x1: number;
    top: number;
    bot: number;
    dir: 1 | -1;
  }

  interface SessState {
    name: string;
    color: string;
    active: boolean;
    hi: number;
    lo: number;
    startIdx: number;
    endIdx: number;
    hiSwept: boolean;
    hiSweptIdx: number;
    loSwept: boolean;
    loSweptIdx: number;
    completedBoxes: Array<{ x1: number; x2: number; top: number; bot: number }>;
    completedLines: Array<{
      x1: number;
      x2: number;
      y: number;
      isHigh: boolean;
      swept: boolean;
    }>;
  }

  const obs: OBState[] = [];
  const rbs: OBState[] = [];
  const fvgs: FVGState[] = [];
  const bsl: LiqState[] = [];
  const ssl: LiqState[] = [];
  const closedLiq: LiqState[] = [];
  const srs: SRState[] = [];
  const closedSR: SRState[] = [];
  const sds: SDState[] = [];

  const structLines: SmcLine[] = [];
  const labels: SmcLabel[] = [];
  const displacementBars: Record<number, 1 | -1> = {};
  const signals: SmcTradeSignal[] = [];

  let lastSH: number | null = null;
  let lastSL: number | null = null;
  let prevSH: number | null = null;
  let prevSL: number | null = null;
  let lastSHi: number | null = null;
  let lastSLi: number | null = null;
  let shBroken = true;
  let slBroken = true;
  let trend: 1 | -1 | 0 = 0;

  let idmActive: { x1: number; x2: number; price: number; dir: 1 | -1; taken: boolean } | null =
    null;

  let inRange = false;
  let rangeBox: { x1: number; x2: number; top: number; bot: number } | null = null;

  const isIntraday = timeframe !== '1d';
  const sessAsia: SessState = {
    name: 'Asia',
    color: C.asia,
    active: false,
    hi: 0,
    lo: 0,
    startIdx: 0,
    endIdx: 0,
    hiSwept: false,
    hiSweptIdx: 0,
    loSwept: false,
    loSweptIdx: 0,
    completedBoxes: [],
    completedLines: [],
  };
  const sessLon: SessState = {
    name: 'London',
    color: C.lon,
    active: false,
    hi: 0,
    lo: 0,
    startIdx: 0,
    endIdx: 0,
    hiSwept: false,
    hiSweptIdx: 0,
    loSwept: false,
    loSweptIdx: 0,
    completedBoxes: [],
    completedLines: [],
  };
  const sessNY: SessState = {
    name: 'New York',
    color: C.ny,
    active: false,
    hi: 0,
    lo: 0,
    startIdx: 0,
    endIdx: 0,
    hiSwept: false,
    hiSweptIdx: 0,
    loSwept: false,
    loSweptIdx: 0,
    completedBoxes: [],
    completedLines: [],
  };

  let uid = 0;
  const nextId = (prefix: string) => `${prefix}_${++uid}`;

  const isDispUpArr: boolean[] = new Array(n).fill(false);
  const isDispDnArr: boolean[] = new Array(n).fill(false);
  let lastSweepIdx = -99;
  let lastSweepDir: 1 | -1 | 0 = 0;
  let lastSignalBar = -99;

  for (let i = 0; i < n; i++) {
    const c = candles[i];
    const atr = Math.max(atrs[i], 0.01);
    const body = Math.abs(c.close - c.open);
    const rng = c.high - c.low;
    const isDispUp =
      c.close > c.open && body >= atr * settings.dispMult && rng > 0 && body / rng >= 0.6;
    const isDispDn =
      c.close < c.open && body >= atr * settings.dispMult && rng > 0 && body / rng >= 0.6;
    isDispUpArr[i] = isDispUp;
    isDispDnArr[i] = isDispDn;
    if (settings.showDisp) {
      if (isDispUp) displacementBars[i] = 1;
      else if (isDispDn) displacementBars[i] = -1;
    }

    const emitSweep = (isHigh: boolean, lvl: number, nm: string) => {
      const rngC = Math.max(c.high - c.low, 0.01);
      const wickC = isHigh
        ? c.high - Math.max(c.open, c.close)
        : Math.min(c.open, c.close) - c.low;
      const pen = isHigh ? c.high - lvl : lvl - c.low;
      const hunt =
        wickC / rngC >= 0.5 &&
        pen >= atr * settings.shPen &&
        (isHigh ? c.close < c.open : c.close > c.open);

      lastSweepIdx = i;
      lastSweepDir = isHigh ? -1 : 1;

      if (hunt && settings.showStopHunt) {
        labels.push({
          id: nextId('hunt'),
          x: i,
          y: isHigh ? c.high : c.low,
          text: `Stop Hunt ${nm}`,
          position: isHigh ? 'above' : 'below',
          color: '#ffffff',
          bgColor: C.hunt,
          kind: 'HUNT',
        });
      } else if (settings.showSweep) {
        labels.push({
          id: nextId('sweep'),
          x: i,
          y: isHigh ? c.high : c.low,
          text: `Sweep ${nm}`,
          position: isHigh ? 'above' : 'below',
          color: '#ffffff',
          bgColor: C.sweep,
          kind: 'SWEEP',
        });
      }
    };

    // 1. Update existing blocks (OB & RB)
    const updateBlocks = (arr: OBState[]) => {
      for (let k = arr.length - 1; k >= 0; k--) {
        const o = arr[k];
        const bullOrig = o.dir === 1;
        const invalid = bullOrig ? c.close < o.bot : c.close > o.top;
        if (o.state === 0) {
          if (invalid) {
            if (o.kind === 'RB' || !settings.showBreaker) {
              arr.splice(k, 1);
            } else {
              o.state = 1;
            }
          } else if (!o.tapped && (bullOrig ? c.low <= o.top : c.high >= o.bot)) {
            o.tapped = true;
          }
        } else if (o.state === 1) {
          const reclaim = bullOrig ? c.close > o.top : c.close < o.bot;
          if (reclaim) {
            if (settings.showReclaimed) {
              o.state = 2;
            } else {
              arr.splice(k, 1);
            }
          }
        } else if (invalid) {
          arr.splice(k, 1);
        }
      }
    };
    updateBlocks(obs);
    updateBlocks(rbs);

    // 2. Update FVGs
    for (let k = fvgs.length - 1; k >= 0; k--) {
      const g = fvgs[k];
      const bull = g.dir === 1;
      if (g.state === 0) {
        const broke = bull ? c.close < g.bot : c.close > g.top;
        if (broke) {
          if (settings.showIFVG) {
            g.state = 1;
            g.top = g.ftop;
            g.bot = g.fbot;
          } else {
            fvgs.splice(k, 1);
          }
        } else {
          if (bull && c.low < g.top) g.top = Math.max(c.low, g.bot);
          if (!bull && c.high > g.bot) g.bot = Math.min(c.high, g.top);
          if (g.top <= g.bot) fvgs.splice(k, 1);
        }
      } else {
        const back = bull ? c.close > g.ftop : c.close < g.fbot;
        if (back) fvgs.splice(k, 1);
      }
    }

    // 3. Update BSL / SSL
    const updateLiq = (arr: LiqState[], isHigh: boolean) => {
      for (let k = arr.length - 1; k >= 0; k--) {
        const l = arr[k];
        const pierced = isHigh ? c.high > l.price : c.low < l.price;
        if (pierced) {
          const closedBack = isHigh ? c.close < l.price : c.close > l.price;
          if (closedBack && (settings.showSweep || settings.showStopHunt)) {
            emitSweep(isHigh, l.price, isHigh ? 'BSL' : 'SSL');
          }
          l.active = false;
          l.x2 = i;
          closedLiq.push(l);
          arr.splice(k, 1);
        }
      }
    };
    updateLiq(bsl, true);
    updateLiq(ssl, false);

    // 4. Update S/R
    for (let k = srs.length - 1; k >= 0; k--) {
      const v = srs[k];
      const broke = v.isRes ? c.close > v.price : c.close < v.price;
      if (broke) {
        if (!v.flipped && settings.showFlip) {
          v.flipped = true;
          v.isRes = !v.isRes;
        } else {
          v.active = false;
          v.x2 = i;
          closedSR.push(v);
          srs.splice(k, 1);
        }
      }
    }

    // 5. Update S/D
    for (let k = sds.length - 1; k >= 0; k--) {
      const z = sds[k];
      const dead = z.dir === 1 ? c.close < z.bot : c.close > z.top;
      if (dead) sds.splice(k, 1);
    }

    // 6. Swings
    const ph = isPivotHigh(candles, i, settings.swingLen);
    const pl = isPivotLow(candles, i, settings.swingLen);
    const pivotIdxH = i - settings.swingLen;
    const pivotIdxL = i - settings.swingLen;

    if (ph !== null) {
      prevSH = lastSH;
      lastSH = ph;
      lastSHi = pivotIdxH;
      shBroken = false;
      if (settings.showSwings) {
        const tag = settings.classify
          ? prevSH === null
            ? 'SH'
            : ph > prevSH
            ? 'HH'
            : 'LH'
          : 'SH';
        labels.push({
          id: nextId('sh'),
          x: pivotIdxH,
          y: ph,
          text: tag,
          position: 'above',
          color: tag === 'HH' ? C.hh : tag === 'LH' ? C.ll : C.eq,
          kind: 'SWING',
        });
      }
      if (settings.showLiq) {
        let merged = false;
        if (settings.showPools) {
          for (const l of bsl) {
            if (!merged && Math.abs(l.price - ph) <= atr * settings.eqTol) {
              merged = true;
              const newP = Math.max(l.price, ph);
              const zHi = newP + atr * 0.03;
              const zLo = Math.min(l.price, ph) - atr * 0.03;
              l.price = newP;
              l.label = 'BSL (EQH)';
              l.pool = {
                x1: l.x1,
                top: l.pool ? Math.max(l.pool.top, zHi) : zHi,
                bot: l.pool ? Math.min(l.pool.bot, zLo) : zLo,
                text: 'EQH Pool',
              };
            }
          }
        }
        if (!merged) {
          bsl.push({
            id: nextId('bsl'),
            x1: pivotIdxH,
            x2: i,
            price: ph,
            isHigh: true,
            active: true,
            label: 'BSL',
          });
          if (bsl.length > settings.liqMax) bsl.shift();
        }
      }
      if (settings.showRB && pivotIdxH >= 0) {
        const pc = candles[pivotIdxH];
        const wick = pc.high - Math.max(pc.open, pc.close);
        const pcRng = pc.high - pc.low;
        if (pcRng > 0 && wick / pcRng >= settings.rbRatio && wick >= atr * 0.3) {
          rbs.push({
            id: nextId('rb'),
            x1: pivotIdxH,
            top: pc.high,
            bot: Math.max(pc.open, pc.close),
            dir: -1,
            state: 0,
            kind: 'RB',
            tapped: false,
          });
          if (rbs.length > settings.maxRB) rbs.shift();
        }
      }
    }

    if (pl !== null) {
      prevSL = lastSL;
      lastSL = pl;
      lastSLi = pivotIdxL;
      slBroken = false;
      if (settings.showSwings) {
        const tag = settings.classify
          ? prevSL === null
            ? 'SL'
            : pl < prevSL
            ? 'LL'
            : 'HL'
          : 'SL';
        labels.push({
          id: nextId('sl'),
          x: pivotIdxL,
          y: pl,
          text: tag,
          position: 'below',
          color: tag === 'HL' ? C.hh : tag === 'LL' ? C.ll : C.eq,
          kind: 'SWING',
        });
      }
      if (settings.showLiq) {
        let merged = false;
        if (settings.showPools) {
          for (const l of ssl) {
            if (!merged && Math.abs(l.price - pl) <= atr * settings.eqTol) {
              merged = true;
              const newP = Math.min(l.price, pl);
              const zHi = Math.max(l.price, pl) + atr * 0.03;
              const zLo = newP - atr * 0.03;
              l.price = newP;
              l.label = 'SSL (EQL)';
              l.pool = {
                x1: l.x1,
                top: l.pool ? Math.max(l.pool.top, zHi) : zHi,
                bot: l.pool ? Math.min(l.pool.bot, zLo) : zLo,
                text: 'EQL Pool',
              };
            }
          }
        }
        if (!merged) {
          ssl.push({
            id: nextId('ssl'),
            x1: pivotIdxL,
            x2: i,
            price: pl,
            isHigh: false,
            active: true,
            label: 'SSL',
          });
          if (ssl.length > settings.liqMax) ssl.shift();
        }
      }
      if (settings.showRB && pivotIdxL >= 0) {
        const pc = candles[pivotIdxL];
        const wick = Math.min(pc.open, pc.close) - pc.low;
        const pcRng = pc.high - pc.low;
        if (pcRng > 0 && wick / pcRng >= settings.rbRatio && wick >= atr * 0.3) {
          rbs.push({
            id: nextId('rb'),
            x1: pivotIdxL,
            top: Math.min(pc.open, pc.close),
            bot: pc.low,
            dir: 1,
            state: 0,
            kind: 'RB',
            tapped: false,
          });
          if (rbs.length > settings.maxRB) rbs.shift();
        }
      }
    }

    // 7. Structure: BOS / CHoCH / MSS + Order Block creation
    const bullBreak = lastSH !== null && lastSHi !== null && !shBroken && c.close > lastSH;
    const bearBreak = lastSL !== null && lastSLi !== null && !slBroken && c.close < lastSL;
    const bullChoch = bullBreak && trend === -1;
    const bearChoch = bearBreak && trend === 1;
    const bullMSS =
      bullChoch &&
      (isDispUpArr[i] || (i >= 1 && isDispUpArr[i - 1]) || (i >= 2 && isDispUpArr[i - 2]));
    const bearMSS =
      bearChoch &&
      (isDispDnArr[i] || (i >= 1 && isDispDnArr[i - 1]) || (i >= 2 && isDispDnArr[i - 2]));

    if (bullBreak && lastSH !== null && lastSHi !== null) {
      if (bullChoch && settings.showCHOCH) {
        structLines.push({
          id: nextId('choch'),
          x1: lastSHi,
          x2: i,
          y: lastSH,
          extendRight: false,
          color: C.choch,
          style: 'dotted',
          width: 1.5,
          label: 'CHoCH',
          labelColor: C.choch,
          kind: 'CHOCH',
        });
      } else if (!bullChoch && settings.showBOS) {
        structLines.push({
          id: nextId('bos'),
          x1: lastSHi,
          x2: i,
          y: lastSH,
          extendRight: false,
          color: C.bos,
          style: 'dashed',
          width: 1.5,
          label: 'BOS',
          labelColor: C.bos,
          kind: 'BOS',
        });
      }
      if (bullMSS && settings.showMSS) {
        labels.push({
          id: nextId('mss'),
          x: i,
          y: c.low,
          text: 'Bullish MSS',
          position: 'below',
          color: '#ffffff',
          bgColor: C.mss,
          kind: 'MSS',
        });
      }
      if (settings.showOB) {
        let offIdx = i;
        let ext = Infinity;
        for (let j = Math.max(0, lastSHi); j <= i; j++) {
          if (candles[j].low < ext) {
            ext = candles[j].low;
            offIdx = j;
          }
        }
        const t = candles[offIdx].high;
        const b = candles[offIdx].low;
        const dup = obs.some(
          (o) => o.dir === 1 && o.state === 0 && t >= o.bot && b <= o.top
        );
        if (!dup) {
          obs.push({
            id: nextId('ob'),
            x1: offIdx,
            top: t,
            bot: b,
            dir: 1,
            state: 0,
            kind: bullChoch && settings.showMit ? 'MB' : 'OB',
            tapped: false,
          });
          if (obs.length > settings.maxOB) obs.shift();
        }
      }
      shBroken = true;
      trend = 1;
    }

    if (bearBreak && lastSL !== null && lastSLi !== null) {
      if (bearChoch && settings.showCHOCH) {
        structLines.push({
          id: nextId('choch'),
          x1: lastSLi,
          x2: i,
          y: lastSL,
          extendRight: false,
          color: C.choch,
          style: 'dotted',
          width: 1.5,
          label: 'CHoCH',
          labelColor: C.choch,
          kind: 'CHOCH',
        });
      } else if (!bearChoch && settings.showBOS) {
        structLines.push({
          id: nextId('bos'),
          x1: lastSLi,
          x2: i,
          y: lastSL,
          extendRight: false,
          color: C.bos,
          style: 'dashed',
          width: 1.5,
          label: 'BOS',
          labelColor: C.bos,
          kind: 'BOS',
        });
      }
      if (bearMSS && settings.showMSS) {
        labels.push({
          id: nextId('mss'),
          x: i,
          y: c.high,
          text: 'Bearish MSS',
          position: 'above',
          color: '#ffffff',
          bgColor: C.mss,
          kind: 'MSS',
        });
      }
      if (settings.showOB) {
        let offIdx = i;
        let ext = -Infinity;
        for (let j = Math.max(0, lastSLi); j <= i; j++) {
          if (candles[j].high > ext) {
            ext = candles[j].high;
            offIdx = j;
          }
        }
        const t = candles[offIdx].high;
        const b = candles[offIdx].low;
        const dup = obs.some(
          (o) => o.dir === -1 && o.state === 0 && t >= o.bot && b <= o.top
        );
        if (!dup) {
          obs.push({
            id: nextId('ob'),
            x1: offIdx,
            top: t,
            bot: b,
            dir: -1,
            state: 0,
            kind: bearChoch && settings.showMit ? 'MB' : 'OB',
            tapped: false,
          });
          if (obs.length > settings.maxOB) obs.shift();
        }
      }
      slBroken = true;
      trend = -1;
    }

    // 8. Inducement (IDM)
    if (settings.showIDM) {
      if (bullBreak || bearBreak) {
        idmActive = null;
      }
      const iph = isPivotHigh(candles, i, settings.idmLen);
      const ipl = isPivotLow(candles, i, settings.idmLen);
      const idmIdx = i - settings.idmLen;
      if (!idmActive) {
        if (trend === 1 && ipl !== null && lastSHi !== null && idmIdx > lastSHi) {
          idmActive = { x1: idmIdx, x2: i, price: ipl, dir: 1, taken: false };
        } else if (trend === -1 && iph !== null && lastSLi !== null && idmIdx > lastSLi) {
          idmActive = { x1: idmIdx, x2: i, price: iph, dir: -1, taken: false };
        }
      } else if (!idmActive.taken) {
        idmActive.x2 = i;
        const taken = idmActive.dir === 1 ? c.low < idmActive.price : c.high > idmActive.price;
        if (taken) {
          idmActive.taken = true;
          labels.push({
            id: nextId('idm'),
            x: idmActive.x1,
            y: idmActive.price,
            text: 'IDM taken',
            position: idmActive.dir === 1 ? 'below' : 'above',
            color: C.idm,
            kind: 'IDM',
          });
          idmActive = null;
        }
      }
    }

    // 9. Fair Value Gaps
    if (settings.showFVG && i >= 2) {
      const c2 = candles[i - 2];
      if (c.low > c2.high && c.low - c2.high >= atr * settings.fvgMinATR) {
        fvgs.push({
          id: nextId('fvg'),
          x1: i - 2,
          top: c.low,
          bot: c2.high,
          ftop: c.low,
          fbot: c2.high,
          dir: 1,
          state: 0,
        });
        if (fvgs.length > settings.fvgMax) fvgs.shift();
      }
      if (c.high < c2.low && c2.low - c.high >= atr * settings.fvgMinATR) {
        fvgs.push({
          id: nextId('fvg'),
          x1: i - 2,
          top: c2.low,
          bot: c.high,
          ftop: c2.low,
          fbot: c.high,
          dir: -1,
          state: 0,
        });
        if (fvgs.length > settings.fvgMax) fvgs.shift();
      }
    }

    // 10. Supply / Demand
    if (settings.showSD && i >= 2) {
      const c1 = candles[i - 1];
      const c2 = candles[i - 2];
      const base1 = Math.abs(c1.close - c1.open) <= atr * 0.6;
      const base2 = Math.abs(c2.close - c2.open) <= atr * 0.6;
      if (base1) {
        const lftSD = base2 ? i - 2 : i - 1;
        const zTop = base2 ? Math.max(c1.high, c2.high) : c1.high;
        const zBot = base2 ? Math.min(c1.low, c2.low) : c1.low;
        if (isDispUp) {
          const dup = sds.some((z) => z.dir === 1 && zTop >= z.bot && zBot <= z.top);
          if (!dup) {
            sds.push({ id: nextId('sd'), x1: lftSD, top: zTop, bot: zBot, dir: 1 });
            if (sds.length > settings.sdMax) sds.shift();
          }
        }
        if (isDispDn) {
          const dup = sds.some((z) => z.dir === -1 && zTop >= z.bot && zBot <= z.top);
          if (!dup) {
            sds.push({ id: nextId('sd'), x1: lftSD, top: zTop, bot: zBot, dir: -1 });
            if (sds.length > settings.sdMax) sds.shift();
          }
        }
      }
    }

    // 11. Support / Resistance
    if (settings.showSR) {
      const srH = isPivotHigh(candles, i, settings.srLen);
      const srL = isPivotLow(candles, i, settings.srLen);
      if (srH !== null) {
        const dup = srs.some((v) => v.isRes && Math.abs(v.price - srH) <= atr * 0.25);
        if (!dup) {
          srs.push({
            id: nextId('sr'),
            x1: i - settings.srLen,
            x2: i,
            price: srH,
            isRes: true,
            flipped: false,
            active: true,
          });
          if (srs.length > settings.srMax) srs.shift();
        }
      }
      if (srL !== null) {
        const dup = srs.some((v) => !v.isRes && Math.abs(v.price - srL) <= atr * 0.25);
        if (!dup) {
          srs.push({
            id: nextId('sr'),
            x1: i - settings.srLen,
            x2: i,
            price: srL,
            isRes: false,
            flipped: false,
            active: true,
          });
          if (srs.length > settings.srMax) srs.shift();
        }
      }
    }

    // 12. Trading Range
    if (settings.showRange && i >= settings.rangeLen) {
      const slice = candles.slice(i - settings.rangeLen + 1, i + 1);
      const hhR = Math.max(...slice.map((s) => s.high));
      const llR = Math.min(...slice.map((s) => s.low));
      if (!inRange && hhR - llR <= atr * settings.rangeATR) {
        inRange = true;
        rangeBox = { x1: i - settings.rangeLen + 1, x2: i, top: hhR, bot: llR };
      } else if (inRange && rangeBox) {
        if (c.close > rangeBox.top || c.close < rangeBox.bot) {
          inRange = false;
        } else {
          rangeBox.x2 = i;
        }
      }
    }

    // 13. Sessions (Asia / London / NY)
    if (isIntraday) {
      const { hour, minute } = getNYHourMinute(c.time);
      const updateSession = (s: SessState, inS: boolean, enabled: boolean) => {
        if (!enabled) return;
        if (inS) {
          if (!s.active) {
            s.active = true;
            s.hi = c.high;
            s.lo = c.low;
            s.startIdx = i;
            s.endIdx = i;
            s.hiSwept = false;
            s.loSwept = false;
          } else {
            s.hi = Math.max(s.hi, c.high);
            s.lo = Math.min(s.lo, c.low);
            s.endIdx = i;
          }
        } else if (s.active) {
          s.active = false;
          s.completedBoxes.push({ x1: s.startIdx, x2: i, top: s.hi, bot: s.lo });
          if (s.completedBoxes.length > 3) s.completedBoxes.shift();
          s.completedLines.push(
            { x1: s.startIdx, x2: n - 1, y: s.hi, isHigh: true, swept: false },
            { x1: s.startIdx, x2: n - 1, y: s.lo, isHigh: false, swept: false }
          );
          if (s.completedLines.length > 4) s.completedLines.splice(0, 2);
        }
        for (const ln of s.completedLines) {
          if (!ln.swept && i > ln.x1) {
            if (ln.isHigh && c.high > ln.y) {
              ln.swept = true;
              ln.x2 = i;
              if (c.close < ln.y && (settings.showSweep || settings.showStopHunt)) {
                emitSweep(true, ln.y, `${s.name} High`);
              }
            } else if (!ln.isHigh && c.low < ln.y) {
              ln.swept = true;
              ln.x2 = i;
              if (c.close > ln.y && (settings.showSweep || settings.showStopHunt)) {
                emitSweep(false, ln.y, `${s.name} Low`);
              }
            }
          }
        }
      };
      updateSession(sessAsia, inSession(hour, minute, 20, 0), settings.showAsia);
      updateSession(sessLon, inSession(hour, minute, 2, 5), settings.showLon);
      updateSession(sessNY, inSession(hour, minute, 8, 11), settings.showNY);
    }

    // 14. Confluence Buy / Sell Signal (from indicator section 9)
    if (settings.showSig && i >= 50 && i - lastSignalBar >= 12) {
      const bias =
        ema21[i] > ema50[i] && c.close > ema21[i] && rsi14[i] > 50
          ? 1
          : ema21[i] < ema50[i] && c.close < ema21[i] && rsi14[i] < 50
          ? -1
          : 0;

      const hitZone = (want: 1 | -1) => {
        const obHit = obs.some((o) => {
          const eff = o.state === 1 ? -o.dir : o.dir;
          return eff === want && c.low <= o.top && c.high >= o.bot;
        });
        const fvgHit = fvgs.some((g) => {
          const eff = g.state === 1 ? -g.dir : g.dir;
          return eff === want && c.low <= g.top && c.high >= g.bot;
        });
        return obHit || fvgHit;
      };

      const eqPrice = lastSH !== null && lastSL !== null ? (lastSH + lastSL) / 2 : c.close;
      const inDiscount = c.close <= eqPrice;
      const inPremium = c.close >= eqPrice;

      const scoreDir = (dir: 1 | -1) => {
        let score = 0;
        const reasons: string[] = [];
        if (trend === dir) {
          score += 25;
          reasons.push('Structure Aligned');
        }
        if (bias === dir) {
          score += 25;
          reasons.push('EMA21/50 + RSI Bias');
        }
        if (hitZone(dir)) {
          score += 25;
          reasons.push('OB / FVG Mitigation');
        }
        if ((dir === 1 && inDiscount) || (dir === -1 && inPremium)) {
          score += 15;
          reasons.push(dir === 1 ? 'Discount Zone' : 'Premium Zone');
        }
        if (lastSweepDir === dir && i - lastSweepIdx <= 6) {
          score += 15;
          reasons.push('Recent Liquidity Sweep');
        }
        if ((dir === 1 && isDispUp) || (dir === -1 && isDispDn)) {
          score += 15;
          reasons.push('Displacement');
        }
        return { score: Math.min(100, score), reasons };
      };

      const bullEval = scoreDir(1);
      const bearEval = scoreDir(-1);

      if (bullEval.score >= settings.minConf && bullEval.score > bearEval.score) {
        const swingLow5 = Math.min(...candles.slice(Math.max(0, i - 5), i + 1).map((x) => x.low));
        const sl = Math.min(swingLow5 - atr * settings.slBuf, c.close - atr * 0.8);
        const risk = Math.max(atr * 0.6, c.close - sl);
        signals.push({
          barIndex: i,
          time: c.time,
          dir: 1,
          entry: Number(c.close.toFixed(2)),
          sl: Number(sl.toFixed(2)),
          tp1: Number((c.close + risk * settings.rr1).toFixed(2)),
          tp2: Number((c.close + risk * settings.rr2).toFixed(2)),
          confidence: bullEval.score,
          reasons: bullEval.reasons,
        });
        lastSignalBar = i;
      } else if (bearEval.score >= settings.minConf && bearEval.score > bullEval.score) {
        const swingHigh5 = Math.max(...candles.slice(Math.max(0, i - 5), i + 1).map((x) => x.high));
        const sl = Math.max(swingHigh5 + atr * settings.slBuf, c.close + atr * 0.8);
        const risk = Math.max(atr * 0.6, sl - c.close);
        signals.push({
          barIndex: i,
          time: c.time,
          dir: -1,
          entry: Number(c.close.toFixed(2)),
          sl: Number(sl.toFixed(2)),
          tp1: Number((c.close - risk * settings.rr1).toFixed(2)),
          tp2: Number((c.close - risk * settings.rr2).toFixed(2)),
          confidence: bearEval.score,
          reasons: bearEval.reasons,
        });
        lastSignalBar = i;
      }
    }
  }

  // ---------- Assemble Renderable Boxes & Lines ----------
  const boxes: SmcBox[] = [];
  const lines: SmcLine[] = [...structLines];

  // Premium / Discount / EQ + OTE
  if (lastSH !== null && lastSL !== null && lastSH > lastSL) {
    const eq = (lastSH + lastSL) / 2;
    const startX = Math.max(0, Math.min(lastSHi ?? 0, lastSLi ?? 0));
    if (settings.showPD) {
      boxes.push({
        id: 'prem_zone',
        x1: startX,
        x2: n - 1,
        top: lastSH,
        bot: eq,
        extendRight: true,
        color: C.prem,
        borderColor: 'transparent',
        text: 'Premium',
        textColor: C.bearOBText,
        textAlign: 'right',
        kind: 'PREM',
      });
      boxes.push({
        id: 'disc_zone',
        x1: startX,
        x2: n - 1,
        top: eq,
        bot: lastSL,
        extendRight: true,
        color: C.disc,
        borderColor: 'transparent',
        text: 'Discount',
        textColor: C.bullOBText,
        textAlign: 'right',
        kind: 'DISC',
      });
      lines.push({
        id: 'eq_line',
        x1: startX,
        x2: n - 1,
        y: eq,
        extendRight: true,
        color: C.eq,
        style: 'dashed',
        width: 1,
        label: 'EQ 50%',
        labelColor: C.eq,
        kind: 'EQ',
      });
    }
    if (settings.showOTE) {
      const span = lastSH - lastSL;
      const topOTE =
        trend === 1 ? lastSH - span * settings.oteLo : lastSL + span * settings.oteHi;
      const botOTE =
        trend === 1 ? lastSH - span * settings.oteHi : lastSL + span * settings.oteLo;
      boxes.push({
        id: 'ote_zone',
        x1: startX,
        x2: n - 1,
        top: Math.max(topOTE, botOTE),
        bot: Math.min(topOTE, botOTE),
        extendRight: true,
        color: C.ote,
        borderColor: C.oteBorder,
        borderStyle: 'dotted',
        text: `OTE (${settings.oteLo}–${settings.oteHi})`,
        textColor: '#facc15',
        textAlign: 'right',
        kind: 'OTE',
      });
    }
  }

  // Trading Range
  if (settings.showRange && rangeBox) {
    boxes.push({
      id: 'trading_range',
      x1: rangeBox.x1,
      x2: rangeBox.x2,
      top: rangeBox.top,
      bot: rangeBox.bot,
      extendRight: false,
      color: C.range,
      borderColor: C.rangeBorder,
      text: 'Trading Range',
      textColor: C.eq,
      textAlign: 'center',
      kind: 'RANGE',
    });
  }

  // Order Blocks + Rejection Blocks
  for (const o of [...obs, ...rbs]) {
    const isBull = o.dir === 1;
    let color = isBull ? C.bullOB : C.bearOB;
    let borderColor = isBull ? C.bullOBBorder : C.bearOBBorder;
    let textColor = isBull ? C.bullOBText : C.bearOBText;
    let labelText = isBull ? 'Bull OB' : 'Bear OB';

    if (o.kind === 'RB') {
      color = C.rb;
      borderColor = C.rbBorder;
      textColor = C.rbText;
      labelText = `${isBull ? 'Bull' : 'Bear'} Rejection Blk`;
    } else if (o.state === 1) {
      const flippedBull = !isBull;
      color = flippedBull ? C.bullOB : C.bearOB;
      borderColor = flippedBull ? C.bullOBBorder : C.bearOBBorder;
      textColor = flippedBull ? C.bullOBText : C.bearOBText;
      labelText = `${flippedBull ? 'Bull' : 'Bear'} Breaker Blk`;
    } else if (o.state === 2) {
      labelText = `Reclaimed ${isBull ? 'Bull' : 'Bear'} OB`;
    } else if (o.kind === 'MB') {
      labelText = `${isBull ? 'Bull' : 'Bear'} Mitigation Blk`;
    }

    if (o.tapped && o.state === 0) {
      color = o.kind === 'RB' ? 'rgba(255,152,0,0.08)' : isBull ? 'rgba(8,153,129,0.08)' : 'rgba(242,54,69,0.08)';
    }

    boxes.push({
      id: o.id,
      x1: o.x1,
      x2: n - 1,
      top: o.top,
      bot: o.bot,
      extendRight: true,
      color,
      borderColor,
      text: labelText,
      textColor,
      textAlign: 'right',
      kind: o.kind === 'RB' ? 'RB' : o.state === 1 ? 'BREAKER' : o.state === 2 ? 'RECLAIMED' : o.kind,
    });
  }

  // Fair Value Gaps & Inverse FVGs
  for (const g of fvgs) {
    const isBull = g.dir === 1;
    const isIFVG = g.state === 1;
    boxes.push({
      id: g.id,
      x1: g.x1,
      x2: n - 1,
      top: g.top,
      bot: g.bot,
      extendRight: true,
      color: isIFVG ? C.ifvg : isBull ? C.fvgBull : C.fvgBear,
      borderColor: isIFVG ? C.ifvgBorder : isBull ? C.fvgBullBorder : C.fvgBearBorder,
      borderStyle: isIFVG ? 'dotted' : 'solid',
      text: isIFVG ? (isBull ? 'Bear IFVG' : 'Bull IFVG') : isBull ? 'Bull FVG' : 'Bear FVG',
      textColor: isIFVG ? C.ifvgText : isBull ? C.fvgBullText : C.fvgBearText,
      textAlign: 'right',
      kind: isIFVG ? 'IFVG' : 'FVG',
    });
  }

  // Supply / Demand
  for (const z of sds) {
    const isBull = z.dir === 1;
    boxes.push({
      id: z.id,
      x1: z.x1,
      x2: n - 1,
      top: z.top,
      bot: z.bot,
      extendRight: true,
      color: isBull ? C.demand : C.supply,
      borderColor: isBull ? C.demandBorder : C.supplyBorder,
      text: isBull ? 'Demand Zone' : 'Supply Zone',
      textColor: isBull ? C.demandText : C.supplyText,
      textAlign: 'right',
      kind: 'SD',
    });
  }

  // BSL / SSL & Liquidity Pools
  for (const l of [...bsl, ...ssl, ...closedLiq.slice(-6)]) {
    if (l.pool) {
      boxes.push({
        id: `${l.id}_pool`,
        x1: l.pool.x1,
        x2: l.active ? n - 1 : l.x2,
        top: l.pool.top,
        bot: l.pool.bot,
        extendRight: l.active,
        color: C.pool,
        borderColor: C.poolBorder,
        text: l.pool.text,
        textColor: C.poolText,
        textAlign: 'right',
        kind: 'POOL',
      });
    }
    lines.push({
      id: l.id,
      x1: l.x1,
      x2: l.active ? n - 1 : l.x2,
      y: l.price,
      extendRight: l.active,
      color: l.isHigh ? C.bsl : C.ssl,
      style: 'dashed',
      width: 1.25,
      label: l.active ? l.label : undefined,
      labelColor: l.isHigh ? C.bsl : C.ssl,
      kind: l.isHigh ? 'BSL' : 'SSL',
    });
  }

  // Support & Resistance
  for (const sr of [...srs, ...closedSR.slice(-4)]) {
    lines.push({
      id: sr.id,
      x1: sr.x1,
      x2: sr.active ? n - 1 : sr.x2,
      y: sr.price,
      extendRight: sr.active,
      color: sr.isRes ? C.res : C.sup,
      style: 'solid',
      width: 1.75,
      label: sr.active
        ? sr.flipped
          ? sr.isRes
            ? 'Resistance (flip)'
            : 'Support (flip)'
          : sr.isRes
          ? 'Resistance'
          : 'Support'
        : undefined,
      labelColor: sr.isRes ? C.res : C.sup,
      kind: 'SR',
    });
  }

  // Inducement line
  if (idmActive) {
    lines.push({
      id: 'idm_active',
      x1: idmActive.x1,
      x2: idmActive.x2,
      y: idmActive.price,
      extendRight: false,
      color: C.idm,
      style: 'dotted',
      width: 1.25,
      label: 'IDM',
      labelColor: C.idm,
      kind: 'IDM',
    });
  }

  // Sessions
  for (const s of [sessAsia, sessLon, sessNY]) {
    if (s.active) {
      boxes.push({
        id: `sess_${s.name}_active`,
        x1: s.startIdx,
        x2: s.endIdx,
        top: s.hi,
        bot: s.lo,
        extendRight: false,
        color: `${s.color}14`,
        borderColor: `${s.color}66`,
        text: s.name,
        textColor: s.color,
        textAlign: 'left',
        kind: 'SESSION',
      });
    }
    s.completedBoxes.forEach((b, idx) => {
      boxes.push({
        id: `sess_${s.name}_b_${idx}`,
        x1: b.x1,
        x2: b.x2,
        top: b.top,
        bot: b.bot,
        extendRight: false,
        color: `${s.color}12`,
        borderColor: `${s.color}55`,
        text: s.name,
        textColor: s.color,
        textAlign: 'left',
        kind: 'SESSION',
      });
    });
    s.completedLines.forEach((ln, idx) => {
      lines.push({
        id: `sess_${s.name}_ln_${idx}`,
        x1: ln.x1,
        x2: ln.swept ? ln.x2 : n - 1,
        y: ln.y,
        extendRight: !ln.swept,
        color: s.color,
        style: 'dashed',
        width: 1,
        label: !ln.swept ? `${s.name} ${ln.isHigh ? 'High' : 'Low'}` : undefined,
        labelColor: s.color,
        kind: 'SESSION',
      });
    });
  }

  // Key Levels (PDH / PDL / PWH / PWL / Daily / Weekly)
  const keyLevels: KeyLevelsInput = externalKeyLevels ?? {};
  const addKeyLevel = (id: string, y: number | undefined, label: string, color: string, dashed = false) => {
    if (y == null || !Number.isFinite(y)) return;
    lines.push({
      id,
      x1: Math.max(0, n - 45),
      x2: n - 1,
      y,
      extendRight: true,
      color,
      style: dashed ? 'dotted' : 'solid',
      width: 1,
      label,
      labelColor: color,
      kind: 'KEYLEVEL',
    });
  };

  if (settings.showPDHL) {
    addKeyLevel('kl_pdh', keyLevels.pdh, 'PDH', C.pd);
    addKeyLevel('kl_pdl', keyLevels.pdl, 'PDL', C.pd);
  }
  if (settings.showPWHL) {
    addKeyLevel('kl_pwh', keyLevels.pwh, 'PWH', '#cbd5e1');
    addKeyLevel('kl_pwl', keyLevels.pwl, 'PWL', '#cbd5e1');
  }
  if (settings.showDWHL) {
    addKeyLevel('kl_dh', keyLevels.dailyHigh, 'Daily High', C.dw, true);
    addKeyLevel('kl_dl', keyLevels.dailyLow, 'Daily Low', C.dw, true);
    addKeyLevel('kl_wh', keyLevels.weeklyHigh, 'Weekly High', C.dw, true);
    addKeyLevel('kl_wl', keyLevels.weeklyLow, 'Weekly Low', C.dw, true);
  }

  // Latest SMC Signal Lines (Entry, SL, TP1, TP2) + Signal Markers
  for (const sig of signals.slice(-3)) {
    labels.push({
      id: `sig_lbl_${sig.barIndex}`,
      x: sig.barIndex,
      y: sig.dir === 1 ? candles[sig.barIndex].low : candles[sig.barIndex].high,
      text: `${sig.dir === 1 ? 'BUY' : 'SELL'} ${sig.confidence}%`,
      position: sig.dir === 1 ? 'below' : 'above',
      color: '#ffffff',
      bgColor: sig.dir === 1 ? '#00c853' : '#ff1744',
      kind: 'SIGNAL',
    });
  }
  const latestSignal = signals.length > 0 ? signals[signals.length - 1] : null;
  if (latestSignal && settings.showSig) {
    const startX = latestSignal.barIndex;
    lines.push(
      {
        id: 'sig_entry',
        x1: startX,
        x2: n - 1,
        y: latestSignal.entry,
        extendRight: true,
        color: '#2196f3',
        style: 'solid',
        width: 1.75,
        label: `Entry ${latestSignal.entry.toFixed(2)}`,
        labelColor: '#2196f3',
        kind: 'TRADE',
      },
      {
        id: 'sig_sl',
        x1: startX,
        x2: n - 1,
        y: latestSignal.sl,
        extendRight: true,
        color: '#ff1744',
        style: 'solid',
        width: 1.75,
        label: `SL ${latestSignal.sl.toFixed(2)}`,
        labelColor: '#ff1744',
        kind: 'TRADE',
      },
      {
        id: 'sig_tp1',
        x1: startX,
        x2: n - 1,
        y: latestSignal.tp1,
        extendRight: true,
        color: '#00c853',
        style: 'solid',
        width: 1.75,
        label: `TP1 ${latestSignal.tp1.toFixed(2)}`,
        labelColor: '#00c853',
        kind: 'TRADE',
      },
      {
        id: 'sig_tp2',
        x1: startX,
        x2: n - 1,
        y: latestSignal.tp2,
        extendRight: true,
        color: '#00c853',
        style: 'dotted',
        width: 1.5,
        label: `TP2 ${latestSignal.tp2.toFixed(2)}`,
        labelColor: '#00c853',
        kind: 'TRADE',
      }
    );
  }

  const lastClose = candles[n - 1].close;
  let zonePosition: 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM' = 'EQUILIBRIUM';
  if (lastSH !== null && lastSL !== null && lastSH > lastSL) {
    const eq = (lastSH + lastSL) / 2;
    if (lastClose > eq + (lastSH - lastSL) * 0.05) zonePosition = 'PREMIUM';
    else if (lastClose < eq - (lastSH - lastSL) * 0.05) zonePosition = 'DISCOUNT';
  }

  // Historical Backtest of SMC Signals (TP1 vs SL)
  let wins = 0;
  let losses = 0;
  for (const sig of signals) {
    let resolved = false;
    for (let j = sig.barIndex + 1; j < n; j++) {
      const bar = candles[j];
      if (sig.dir === 1) {
        if (bar.low <= sig.sl) {
          losses++;
          resolved = true;
          break;
        }
        if (bar.high >= sig.tp1) {
          wins++;
          resolved = true;
          break;
        }
      } else {
        if (bar.high >= sig.sl) {
          losses++;
          resolved = true;
          break;
        }
        if (bar.low <= sig.tp1) {
          wins++;
          resolved = true;
          break;
        }
      }
    }
    if (!resolved) {
      // Latest active trade still open
    }
  }
  const resolvedTotal = wins + losses;
  const winRatePct = resolvedTotal > 0 ? Math.round((wins / resolvedTotal) * 100) : 0;

  // Evaluate current bar live setup for multi-timeframe table
  const lastIdx = n - 1;
  const lastAtr = Math.max(atrs[lastIdx], 0.5);
  const lastBias =
    ema21[lastIdx] > ema50[lastIdx] && lastClose > ema21[lastIdx] && rsi14[lastIdx] > 50
      ? 1
      : ema21[lastIdx] < ema50[lastIdx] && lastClose < ema21[lastIdx] && rsi14[lastIdx] < 50
      ? -1
      : 0;

  const evalDirScore = (dir: 1 | -1) => {
    let score = 0;
    if (trend === dir) score += 25;
    if (lastBias === dir) score += 25;
    const nearZone =
      obs.some((o) => {
        const eff = o.state === 1 ? -o.dir : o.dir;
        return eff === dir && Math.abs(lastClose - (o.top + o.bot) / 2) <= lastAtr * 1.8;
      }) ||
      fvgs.some((g) => {
        const eff = g.state === 1 ? -g.dir : g.dir;
        return eff === dir && Math.abs(lastClose - (g.top + g.bot) / 2) <= lastAtr * 1.8;
      });
    if (nearZone) score += 25;
    if ((dir === 1 && zonePosition === 'DISCOUNT') || (dir === -1 && zonePosition === 'PREMIUM')) {
      score += 15;
    }
    if (lastSweepDir === dir && lastIdx - lastSweepIdx <= 10) score += 15;
    if ((dir === 1 && isDispUpArr[lastIdx]) || (dir === -1 && isDispDnArr[lastIdx])) score += 15;
    return Math.min(100, score);
  };

  const bScore = evalDirScore(1);
  const sScore = evalDirScore(-1);
  const liveDir: 1 | -1 =
    bScore > sScore
      ? 1
      : sScore > bScore
      ? -1
      : trend !== 0
      ? trend
      : lastBias !== 0
      ? (lastBias as 1 | -1)
      : lastClose >= ema21[lastIdx]
      ? 1
      : -1;
  const liveConf = Math.max(bScore, sScore);

  const recent5 = candles.slice(Math.max(0, n - 5));
  const swingLow5 = Math.min(...recent5.map((x) => x.low));
  const swingHigh5 = Math.max(...recent5.map((x) => x.high));

  const liveEntry = Number(lastClose.toFixed(2));
  const liveSl =
    liveDir === 1
      ? Number(Math.min(swingLow5 - lastAtr * settings.slBuf, lastClose - lastAtr * 0.9).toFixed(2))
      : Number(Math.max(swingHigh5 + lastAtr * settings.slBuf, lastClose + lastAtr * 0.9).toFixed(2));
  const riskDist = Math.max(lastAtr * 0.6, Math.abs(liveEntry - liveSl));
  const liveTp1 =
    liveDir === 1
      ? Number((liveEntry + riskDist * settings.rr1).toFixed(2))
      : Number((liveEntry - riskDist * settings.rr1).toFixed(2));
  const liveTp2 =
    liveDir === 1
      ? Number((liveEntry + riskDist * settings.rr2).toFixed(2))
      : Number((liveEntry - riskDist * settings.rr2).toFixed(2));

  const setupBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
    liveDir === 1 ? 'BULLISH' : 'BEARISH';
  const qualified75 =
    liveConf >= 75 && (resolvedTotal === 0 || winRatePct >= 75);

  return {
    boxes,
    lines,
    labels,
    displacementBars,
    signals,
    latestTrend: trend,
    summary: {
      trendLabel: trend === 1 ? 'BULLISH' : trend === -1 ? 'BEARISH' : setupBias,
      activeBullOBs: obs.filter((o) => (o.state === 1 ? -o.dir : o.dir) === 1).length,
      activeBearOBs: obs.filter((o) => (o.state === 1 ? -o.dir : o.dir) === -1).length,
      activeFVGs: fvgs.length,
      activeBSL: bsl.length,
      activeSSL: ssl.length,
      zonePosition,
      latestSignal,
      liveSetup: {
        bias: setupBias,
        action: liveConf >= settings.minConf ? (liveDir === 1 ? 'BUY' : 'SELL') : 'NEUTRAL',
        entry: liveEntry,
        sl: liveSl,
        tp1: liveTp1,
        tp2: liveTp2,
        confirmationPct: liveConf,
        winRatePct,
        wins,
        losses,
        qualified75,
      },
      keyLevels,
    },
  };
}
