import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  AISignalResponse,
  RiskProfile,
  SignalBias,
  TimeframeKey,
  TradingViewFeedSymbol,
} from '../types/market';

export interface UserPreferencesDoc {
  riskProfile: RiskProfile;
  theme: 'dark' | 'light';
  tvSymbol: TradingViewFeedSymbol;
  minConf: number;
  useSearchGrounding: boolean;
}

const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

function sanitizeId(raw: string, fallbackPrefix = 'id'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  return cleaned && VALID_ID_REGEX.test(cleaned) ? cleaned : `${fallbackPrefix}_${Date.now()}`;
}

export async function loadUserPreferences(
  uid: string
): Promise<UserPreferencesDoc | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      riskProfile: data.riskProfile as RiskProfile,
      theme: data.theme as 'dark' | 'light',
      tvSymbol: data.tvSymbol as TradingViewFeedSymbol,
      minConf: Number(data.minConf) || 75,
      useSearchGrounding: Boolean(data.useSearchGrounding),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserPreferences(
  uid: string,
  prefs: UserPreferencesDoc
): Promise<void> {
  const path = `users/${uid}`;
  const docRef = doc(db, 'users', uid);

  const sanitized = {
    riskProfile:
      prefs.riskProfile === 'Conservative' || prefs.riskProfile === 'Aggressive'
        ? prefs.riskProfile
        : 'Balanced',
    theme: prefs.theme === 'light' ? 'light' : 'dark',
    tvSymbol: String(prefs.tvSymbol || 'OANDA:XAUUSD').slice(0, 40),
    minConf: Math.min(100, Math.max(40, Math.round(Number(prefs.minConf) || 75))),
    useSearchGrounding: Boolean(prefs.useSearchGrounding),
  };

  try {
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
      await setDoc(docRef, {
        ownerId: uid,
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        ...sanitized,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserSignals(
  uid: string,
  onSignals: (signals: AISignalResponse[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}/signals`;
  const q = query(
    collection(db, 'users', uid, 'signals'),
    where('ownerId', '==', uid),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AISignalResponse[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.signalId || d.id),
          symbol: String(data.symbol || 'XAUUSD'),
          timeframe: (data.timeframe as TimeframeKey) || '15m',
          riskProfile: (data.riskProfile as RiskProfile) || 'Balanced',
          bias: (data.bias as SignalBias) || 'NEUTRAL',
          confidence: Number(data.confidence) || 50,
          spotPriceAtSignal: Number(data.spotPriceAtSignal) || 0,
          entryPrice: Number(data.entryPrice) || 0,
          entryZoneMin: Number(data.entryZoneMin) || 0,
          entryZoneMax: Number(data.entryZoneMax) || 0,
          stopLoss: Number(data.stopLoss) || 0,
          takeProfit1: Number(data.takeProfit1) || 0,
          takeProfit2: Number(data.takeProfit2) || 0,
          riskRewardRatio: String(data.riskRewardRatio || '1 : 2.0'),
          setupType: String(data.setupType || ''),
          technicalSummary: String(data.technicalSummary || ''),
          macroCatalysts: Array.isArray(data.macroCatalysts)
            ? data.macroCatalysts.map((item) => String(item))
            : [],
          confluenceFactors: [],
          invalidationCondition: String(data.invalidationCondition || ''),
          sources: [],
          generatedAt: String(data.generatedAt || new Date().toISOString()),
          modelUsed: String(data.modelUsed || 'gemini-4-hydrogen'),
        };
      });

      items.sort(
        (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      );
      onSignals(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function saveSignalToFirestore(
  uid: string,
  signal: AISignalResponse
): Promise<void> {
  const signalId = sanitizeId(signal.id, 'sig');
  const path = `users/${uid}/signals/${signalId}`;

  const payload = {
    ownerId: uid,
    signalId,
    symbol: String(signal.symbol || 'XAUUSD').slice(0, 16),
    timeframe: signal.timeframe,
    riskProfile: signal.riskProfile,
    bias: signal.bias,
    confidence: Math.min(100, Math.max(0, Math.round(signal.confidence))),
    spotPriceAtSignal: Math.max(0.01, Number(signal.spotPriceAtSignal) || 1),
    entryPrice: Math.max(0.01, Number(signal.entryPrice) || 1),
    entryZoneMin: Math.max(0.01, Number(signal.entryZoneMin) || 1),
    entryZoneMax: Math.max(0.01, Number(signal.entryZoneMax) || 1),
    stopLoss: Math.max(0.01, Number(signal.stopLoss) || 1),
    takeProfit1: Math.max(0.01, Number(signal.takeProfit1) || 1),
    takeProfit2: Math.max(0.01, Number(signal.takeProfit2) || 1),
    riskRewardRatio: String(signal.riskRewardRatio || '1 : 2.0').slice(0, 24),
    setupType: String(signal.setupType || 'Quantitative Setup').slice(0, 120),
    technicalSummary: String(signal.technicalSummary || '').slice(0, 2000),
    invalidationCondition: String(signal.invalidationCondition || '').slice(0, 500),
    modelUsed: String(signal.modelUsed || 'gemini-4-hydrogen').slice(0, 64),
    generatedAt: String(signal.generatedAt || new Date().toISOString()).slice(0, 40),
    macroCatalysts: (signal.macroCatalysts || [])
      .slice(0, 6)
      .map((c) => String(c).slice(0, 300)),
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', uid, 'signals', signalId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteSignalFromFirestore(
  uid: string,
  signalId: string
): Promise<void> {
  const safeId = sanitizeId(signalId, 'sig');
  const path = `users/${uid}/signals/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'signals', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearUserSignalsInFirestore(
  uid: string,
  signalIds: string[]
): Promise<void> {
  if (signalIds.length === 0) return;
  const path = `users/${uid}/signals`;
  try {
    const batch = writeBatch(db);
    for (const id of signalIds) {
      const safeId = sanitizeId(id, 'sig');
      batch.delete(doc(db, 'users', uid, 'signals', safeId));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
