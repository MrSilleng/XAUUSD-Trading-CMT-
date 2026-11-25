import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { AISignalResponse, Candle, TimeframeKey } from '../types/market';
import type { SmcOverlayResult, SmcSettings } from '../lib/smcEngine';

interface SmcChartCanvasProps {
  candles: Candle[];
  timeframe: TimeframeKey;
  theme: 'dark' | 'light';
  smc: SmcOverlayResult;
  settings: SmcSettings;
  onSettingsChange: (next: SmcSettings) => void;
  activeAiSignal: AISignalResponse | null;
}

export function SmcChartCanvas({
  candles,
  timeframe,
  theme,
  smc,
  settings,
  onSettingsChange,
  activeAiSignal,
}: SmcChartCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [size, setSize] = useState({ width: 920, height: 540 });
  const [visibleCount, setVisibleCount] = useState<number>(95);
  const [rightOffset, setRightOffset] = useState<number>(10); // empty bars on right for labels
  const [panEndIdx, setPanEndIdx] = useState<number | null>(null); // null = pinned to live bar
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showAiOverlay, setShowAiOverlay] = useState<boolean>(true);

  const dragRef = useRef<{ active: boolean; startX: number; startEndIdx: number }>({
    active: false,
    startX: 0,
    startEndIdx: candles.length - 1,
  });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(320, Math.floor(entry.contentRect.width));
        const h = Math.max(420, Math.floor(entry.contentRect.height));
        setSize({ width: w, height: h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const effectiveEndIdx =
    panEndIdx === null ? candles.length - 1 : Math.min(candles.length - 1, Math.max(15, panEndIdx));
  const startIdx = Math.max(0, effectiveEndIdx - visibleCount + 1);

  const hoveredBarIdx = useMemo(() => {
    if (!hoverPos || candles.length === 0) return null;
    const padLeft = 12;
    const padRight = 104;
    const plotW = Math.max(100, size.width - padLeft - padRight);
    const totalSlots = visibleCount + rightOffset;
    const stepX = plotW / totalSlots;
    const rel = Math.floor((hoverPos.x - padLeft) / stepX);
    const idx = startIdx + rel;
    if (idx < 0 || idx >= candles.length) return null;
    return idx;
  }, [hoverPos, candles.length, size.width, visibleCount, rightOffset, startIdx]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isDark = theme === 'dark';
    const bg = isDark ? '#0E131D' : '#F8FAFC';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.10)' : 'rgba(15, 23, 42, 0.08)';
    const axisText = isDark ? '#94A3B8' : '#475569';
    const axisBg = isDark ? '#111827' : '#FFFFFF';
    const borderLine = isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.15)';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size.width, size.height);

    if (candles.length === 0) {
      ctx.fillStyle = axisText;
      ctx.font = '13px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading XAUUSD candles...', size.width / 2, size.height / 2);
      return;
    }

    const padLeft = 12;
    const padRight = 104;
    const padTop = 20;
    const padBottom = 28;
    const plotW = Math.max(100, size.width - padLeft - padRight);
    const plotH = Math.max(100, size.height - padTop - padBottom);

    const totalSlots = visibleCount + rightOffset;
    const stepX = plotW / totalSlots;
    const bodyW = Math.max(2, Math.min(11, stepX * 0.64));

    const visibleCandles = candles.slice(startIdx, effectiveEndIdx + 1);
    let minPrice = Math.min(...visibleCandles.map((c) => c.low));
    let maxPrice = Math.max(...visibleCandles.map((c) => c.high));

    // Include key trade levels in scale if close to visible range
    const rawSpan = Math.max(0.5, maxPrice - minPrice);
    if (showAiOverlay && activeAiSignal) {
      const candidates = [
        activeAiSignal.entryPrice,
        activeAiSignal.stopLoss,
        activeAiSignal.takeProfit1,
      ];
      for (const p of candidates) {
        if (Math.abs(p - maxPrice) < rawSpan * 1.4 && Math.abs(p - minPrice) < rawSpan * 1.4) {
          minPrice = Math.min(minPrice, p);
          maxPrice = Math.max(maxPrice, p);
        }
      }
    }
    if (smc.summary.latestSignal && settings.showSig) {
      const s = smc.summary.latestSignal;
      for (const p of [s.entry, s.sl, s.tp1]) {
        if (Math.abs(p - maxPrice) < rawSpan * 1.4 && Math.abs(p - minPrice) < rawSpan * 1.4) {
          minPrice = Math.min(minPrice, p);
          maxPrice = Math.max(maxPrice, p);
        }
      }
    }

    const span = Math.max(1, maxPrice - minPrice);
    minPrice -= span * 0.08;
    maxPrice += span * 0.08;
    const priceSpan = maxPrice - minPrice;

    const xFor = (barIdx: number) => padLeft + (barIdx - startIdx) * stepX + stepX / 2;
    const yFor = (price: number) => padTop + ((maxPrice - price) / priceSpan) * plotH;
    const priceForY = (y: number) => maxPrice - ((y - padTop) / plotH) * priceSpan;
    const plotRightX = padLeft + plotW;

    // 1. Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const priceSteps = 6;
    for (let i = 1; i < priceSteps; i++) {
      const p = minPrice + (priceSpan * i) / priceSteps;
      const y = Math.round(yFor(p)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(plotRightX, y);
      ctx.stroke();
    }

    // Clip to chart plot area
    ctx.save();
    ctx.beginPath();
    ctx.rect(padLeft, padTop, plotW, plotH);
    ctx.clip();

    // 2. Draw SMC Boxes (Background zones first: PREM/DISC/RANGE/SESSION/OTE, then OB/FVG/SD/POOL)
    const bgOrder = new Set(['PREM', 'DISC', 'RANGE', 'SESSION', 'OTE']);
    const sortedBoxes = [
      ...smc.boxes.filter((b) => bgOrder.has(b.kind)),
      ...smc.boxes.filter((b) => !bgOrder.has(b.kind)),
    ];

    for (const bx of sortedBoxes) {
      const bxEndIdx = bx.extendRight ? effectiveEndIdx + rightOffset - 1 : bx.x2;
      if (bxEndIdx < startIdx || bx.x1 > effectiveEndIdx + rightOffset) continue;

      const x1 = Math.max(padLeft, xFor(bx.x1) - stepX / 2);
      const x2 = Math.min(plotRightX - 4, xFor(bxEndIdx) + stepX / 2);
      const w = x2 - x1;
      if (w <= 1) continue;

      const yTop = yFor(bx.top);
      const yBot = yFor(bx.bot);
      const h = Math.max(2, yBot - yTop);

      ctx.fillStyle = bx.color;
      ctx.fillRect(x1, yTop, w, h);

      if (bx.borderColor !== 'transparent') {
        ctx.save();
        ctx.strokeStyle = bx.borderColor;
        ctx.lineWidth = 1;
        if (bx.borderStyle === 'dotted') ctx.setLineDash([2, 3]);
        else if (bx.borderStyle === 'dashed') ctx.setLineDash([5, 4]);
        ctx.strokeRect(x1 + 0.5, yTop + 0.5, w - 1, h - 1);
        ctx.restore();
      }

      if (bx.text && w > 38 && h >= 11) {
        ctx.fillStyle = bx.textColor ?? axisText;
        ctx.font = '600 10px "DM Sans", sans-serif';
        ctx.textBaseline = 'middle';
        const ty = yTop + h / 2;
        if (bx.textAlign === 'left') {
          ctx.textAlign = 'left';
          ctx.fillText(bx.text, x1 + 5, Math.min(yBot - 6, yTop + 8));
        } else if (bx.textAlign === 'center') {
          ctx.textAlign = 'center';
          ctx.fillText(bx.text, x1 + w / 2, yTop + 9);
        } else {
          ctx.textAlign = 'right';
          ctx.fillText(bx.text, x2 - 5, ty);
        }
      }
    }

    // 3. Draw SMC Lines (BOS, CHoCH, BSL, SSL, S/R, IDM, EQ, Sessions, Key Levels, Trade)
    for (const ln of smc.lines) {
      const endBar = ln.extendRight ? effectiveEndIdx + rightOffset - 1 : ln.x2;
      if (endBar < startIdx || ln.x1 > effectiveEndIdx + rightOffset) continue;
      const y = yFor(ln.y);
      if (y < padTop - 20 || y > padTop + plotH + 20) continue;

      const x1 = Math.max(padLeft, xFor(ln.x1));
      const x2 = Math.min(plotRightX - 4, xFor(endBar));
      if (x2 <= x1) continue;

      ctx.save();
      ctx.strokeStyle = ln.color;
      ctx.lineWidth = ln.width;
      if (ln.style === 'dashed') ctx.setLineDash([5, 4]);
      else if (ln.style === 'dotted') ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, Math.round(y) + 0.5);
      ctx.lineTo(x2, Math.round(y) + 0.5);
      ctx.stroke();
      ctx.restore();

      if (ln.label) {
        ctx.fillStyle = ln.labelColor ?? ln.color;
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textBaseline = 'bottom';
        if (ln.kind === 'BOS' || ln.kind === 'CHOCH') {
          ctx.textAlign = 'center';
          ctx.fillText(ln.label, (x1 + x2) / 2, y - 3);
        } else {
          ctx.textAlign = 'right';
          ctx.fillText(ln.label, x2 - 4, y - 2);
        }
      }
    }

    // 4. Optional Gemini AI Signal Overlay Lines (when active)
    if (showAiOverlay && activeAiSignal) {
      const aiLines = [
        { label: `AI TP2 ${activeAiSignal.takeProfit2.toFixed(2)}`, y: activeAiSignal.takeProfit2, color: '#10b981', dash: [3, 3] },
        { label: `AI TP1 ${activeAiSignal.takeProfit1.toFixed(2)}`, y: activeAiSignal.takeProfit1, color: '#10b981', dash: [6, 3] },
        { label: `AI ENTRY ${activeAiSignal.entryPrice.toFixed(2)}`, y: activeAiSignal.entryPrice, color: '#f59e0b', dash: [6, 3] },
        { label: `AI SL ${activeAiSignal.stopLoss.toFixed(2)}`, y: activeAiSignal.stopLoss, color: '#ef4444', dash: [6, 3] },
      ];
      for (const al of aiLines) {
        const y = yFor(al.y);
        if (y < padTop || y > padTop + plotH) continue;
        ctx.save();
        ctx.strokeStyle = al.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash(al.dash);
        ctx.beginPath();
        ctx.moveTo(padLeft, Math.round(y) + 0.5);
        ctx.lineTo(plotRightX, Math.round(y) + 0.5);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = al.color;
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(al.label, padLeft + 6, y - 2);
      }
    }

    // 5. Candlesticks + Displacement highlights
    for (let i = startIdx; i <= effectiveEndIdx; i++) {
      const c = candles[i];
      const cx = xFor(i);
      const isBull = c.close >= c.open;
      const disp = smc.displacementBars[i];

      let color = isBull ? '#16a34a' : '#dc2626';
      if (disp === 1) color = '#00e676';
      else if (disp === -1) color = '#ff1744';

      const yH = yFor(c.high);
      const yL = yFor(c.low);
      const yO = yFor(c.open);
      const yC = yFor(c.close);

      ctx.strokeStyle = color;
      ctx.lineWidth = disp ? 1.5 : 1.1;
      ctx.beginPath();
      ctx.moveTo(Math.round(cx) + 0.5, yH);
      ctx.lineTo(Math.round(cx) + 0.5, yL);
      ctx.stroke();

      const top = Math.min(yO, yC);
      const h = Math.max(1.5, Math.abs(yO - yC));
      ctx.fillStyle = color;
      ctx.fillRect(cx - bodyW / 2, top, bodyW, h);
    }

    // 6. Labels (HH/HL/LH/LL, MSS, Sweep, Stop Hunt, IDM, BUY/SELL Signal)
    for (const lb of smc.labels) {
      if (lb.x < startIdx - 1 || lb.x > effectiveEndIdx + 1) continue;
      const cx = xFor(lb.x);
      const cy = yFor(lb.y);
      if (cy < padTop - 15 || cy > padTop + plotH + 15) continue;

      ctx.font = lb.kind === 'SIGNAL' ? '700 11px "DM Sans", sans-serif' : '600 10px "DM Sans", sans-serif';
      const tw = ctx.measureText(lb.text).width;
      const offsetY = lb.position === 'above' ? -12 : 12;
      const drawY = cy + offsetY;

      if (lb.bgColor) {
        const pw = tw + 10;
        const ph = 18;
        ctx.fillStyle = lb.bgColor;
        ctx.beginPath();
        ctx.roundRect(cx - pw / 2, drawY - ph / 2, pw, ph, 4);
        ctx.fill();
        ctx.fillStyle = lb.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lb.text, cx, drawY);
      } else {
        ctx.fillStyle = lb.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lb.text, cx, drawY);
      }
    }

    // 7. Crosshair inside plot
    if (hoverPos && hoverPos.x >= padLeft && hoverPos.x <= plotRightX && hoverPos.y >= padTop && hoverPos.y <= padTop + plotH) {
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(226, 232, 240, 0.35)' : 'rgba(15, 23, 42, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hoverPos.x, padTop);
      ctx.lineTo(hoverPos.x, padTop + plotH);
      ctx.moveTo(padLeft, hoverPos.y);
      ctx.lineTo(plotRightX, hoverPos.y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // end plot clip

    // 8. Right Price Axis
    ctx.fillStyle = axisBg;
    ctx.fillRect(plotRightX, 0, padRight, size.height);
    ctx.strokeStyle = borderLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotRightX + 0.5, 0);
    ctx.lineTo(plotRightX + 0.5, size.height - padBottom);
    ctx.stroke();

    ctx.fillStyle = axisText;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 1; i < priceSteps; i++) {
      const p = minPrice + (priceSpan * i) / priceSteps;
      ctx.fillText(p.toFixed(2), plotRightX + 8, yFor(p));
    }

    // Live Price Tag on Y-Axis
    const lastPrice = candles[candles.length - 1].close;
    const lastY = Math.min(padTop + plotH - 10, Math.max(padTop + 10, yFor(lastPrice)));
    const lastBull = candles[candles.length - 1].close >= candles[candles.length - 1].open;
    ctx.fillStyle = lastBull ? '#16a34a' : '#dc2626';
    ctx.fillRect(plotRightX + 2, lastY - 10, padRight - 6, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText(lastPrice.toFixed(2), plotRightX + 8, lastY);

    // Crosshair Y Price Pill
    if (hoverPos && hoverPos.y >= padTop && hoverPos.y <= padTop + plotH) {
      const hp = priceForY(hoverPos.y);
      ctx.fillStyle = isDark ? '#334155' : '#1e293b';
      ctx.fillRect(plotRightX + 2, hoverPos.y - 10, padRight - 6, 20);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(hp.toFixed(2), plotRightX + 8, hoverPos.y);
    }

    // 9. Bottom Time Axis
    ctx.fillStyle = axisBg;
    ctx.fillRect(0, size.height - padBottom, size.width, padBottom);
    ctx.strokeStyle = borderLine;
    ctx.beginPath();
    ctx.moveTo(0, size.height - padBottom + 0.5);
    ctx.lineTo(size.width, size.height - padBottom + 0.5);
    ctx.stroke();

    ctx.fillStyle = axisText;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const stepBars = Math.max(6, Math.floor(visibleCount / 7));
    for (let i = startIdx; i <= effectiveEndIdx; i += stepBars) {
      const d = new Date(candles[i].time * 1000);
      const label =
        timeframe === '1d'
          ? d.toISOString().slice(5, 10)
          : `${d.toISOString().slice(5, 10)} ${d.toISOString().slice(11, 16)}`;
      ctx.fillText(label, xFor(i), size.height - padBottom / 2);
    }
  }, [
    candles,
    size,
    theme,
    smc,
    startIdx,
    effectiveEndIdx,
    visibleCount,
    rightOffset,
    hoverPos,
    timeframe,
    showAiOverlay,
    activeAiSignal,
    settings.showSig,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 10 : -10;
    setVisibleCount((prev) => Math.min(Math.max(25, candles.length), Math.max(28, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startEndIdx: effectiveEndIdx,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.startX;
      const plotW = Math.max(100, size.width - 116);
      const barsPerPx = (visibleCount + rightOffset) / plotW;
      const shiftBars = Math.round(dx * barsPerPx);
      const nextEnd = dragRef.current.startEndIdx - shiftBars;
      if (nextEnd >= candles.length - 1) {
        setPanEndIdx(null);
      } else {
        setPanEndIdx(Math.max(20, nextEnd));
      }
    }
  };

  const stopDrag = () => {
    dragRef.current.active = false;
  };

  const resetView = () => {
    setVisibleCount(95);
    setRightOffset(10);
    setPanEndIdx(null);
  };

  const inspectedCandle =
    hoveredBarIdx !== null ? candles[hoveredBarIdx] : candles[candles.length - 1];

  return (
    <div className="flex flex-col h-full">
      {/* Top Indicator Status & Layer Toggle Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            SMC / ICT Toolkit
          </span>
          {inspectedCandle && (
            <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
              O {inspectedCandle.open.toFixed(2)} · H {inspectedCandle.high.toFixed(2)} · L{' '}
              {inspectedCandle.low.toFixed(2)} · C {inspectedCandle.close.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeAiSignal && (
            <button
              type="button"
              onClick={() => setShowAiOverlay((v) => !v)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                showAiOverlay
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              {showAiOverlay ? 'Hide AI Lines' : 'Show AI Lines'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowControls((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              showControls
                ? 'border-amber-500 bg-amber-600 text-white'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" aria-hidden="true" />
            Indicator Layers
          </button>
          <button
            type="button"
            onClick={resetView}
            aria-label="Reset chart zoom and pan"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      {/* Collapsible Indicator Layer Controls (mirrors Pine Script groups 1–9) */}
      {showControls && (
        <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-[11px]">
          {[
            { key: 'showBOS' as const, label: 'BOS / CHoCH', toggle: () => onSettingsChange({ ...settings, showBOS: !settings.showBOS, showCHOCH: !settings.showBOS }) },
            { key: 'showSwings' as const, label: 'HH / HL / LH / LL', toggle: () => onSettingsChange({ ...settings, showSwings: !settings.showSwings }) },
            { key: 'showOB' as const, label: 'Order & Breaker Blks', toggle: () => onSettingsChange({ ...settings, showOB: !settings.showOB, showRB: !settings.showOB }) },
            { key: 'showFVG' as const, label: 'FVG / IFVG', toggle: () => onSettingsChange({ ...settings, showFVG: !settings.showFVG, showIFVG: !settings.showFVG }) },
            { key: 'showLiq' as const, label: 'BSL / SSL & Pools', toggle: () => onSettingsChange({ ...settings, showLiq: !settings.showLiq, showPools: !settings.showLiq }) },
            { key: 'showSweep' as const, label: 'Sweeps & Stop Hunts', toggle: () => onSettingsChange({ ...settings, showSweep: !settings.showSweep, showStopHunt: !settings.showSweep }) },
            { key: 'showSD' as const, label: 'Supply / Demand', toggle: () => onSettingsChange({ ...settings, showSD: !settings.showSD }) },
            { key: 'showSR' as const, label: 'Support / Resistance', toggle: () => onSettingsChange({ ...settings, showSR: !settings.showSR }) },
            { key: 'showPD' as const, label: 'Premium / Discount', toggle: () => onSettingsChange({ ...settings, showPD: !settings.showPD }) },
            { key: 'showOTE' as const, label: 'OTE (0.62–0.79)', toggle: () => onSettingsChange({ ...settings, showOTE: !settings.showOTE }) },
            { key: 'showAsia' as const, label: 'Sessions (Asia/LDN/NY)', toggle: () => { const v = !settings.showAsia; onSettingsChange({ ...settings, showAsia: v, showLon: v, showNY: v }); } },
            { key: 'showPDHL' as const, label: 'PDH / PDL / PWH / PWL', toggle: () => { const v = !settings.showPDHL; onSettingsChange({ ...settings, showPDHL: v, showPWHL: v, showDWHL: v }); } },
          ].map((item) => {
            const active = Boolean(settings[item.key]);
            return (
              <label key={item.key} className="inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={item.toggle}
                  className="w-3.5 h-3.5 rounded accent-amber-600"
                />
                <span className="truncate">{item.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* Interactive Canvas */}
      <div ref={wrapperRef} className="relative flex-1 min-h-[440px]">
        <canvas
          ref={canvasRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={() => {
            stopDrag();
            setHoverPos(null);
          }}
          onDoubleClick={resetView}
          className="w-full h-full block cursor-crosshair"
        />
      </div>
    </div>
  );
}
