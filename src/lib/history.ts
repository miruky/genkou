// 推敲履歴。書き手が節目で残すスナップショットと、現在の本文との差分量。

export interface Snapshot {
  id: string;
  /** 保存した時刻(エポックミリ秒) */
  savedAt: number;
  /** 書き手が付ける覚え書き(「初稿」「結末を書き換え」) */
  label: string;
  text: string;
}

export interface Draft {
  text: string;
  /** 縦書きで表示するか */
  vertical: boolean;
  snapshots: Snapshot[];
}

export const MAX_SNAPSHOTS = 50;

export function newSnapshotId(): string {
  return `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyDraft(): Draft {
  return { text: '', vertical: true, snapshots: [] };
}

/**
 * 2つの本文の差分量。共通の前置きと結びを取り除いた残りを
 * 「書き換えた量」とみなす素朴な見積もりで、移動や入れ替えは区別しない。
 */
export function diffStats(before: string, after: string): { added: number; removed: number } {
  const a = [...before];
  const b = [...after];
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < a.length - prefix &&
    suffix < b.length - prefix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  return { removed: a.length - prefix - suffix, added: b.length - prefix - suffix };
}

function isSnapshot(value: unknown): value is Snapshot {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.savedAt === 'number' &&
    Number.isFinite(s.savedAt) &&
    typeof s.label === 'string' &&
    typeof s.text === 'string'
  );
}

/** JSON文字列から復元する。全体の形が崩れていればnull */
export function deserializeDraft(json: string): Draft | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const d = parsed as Record<string, unknown>;
  if (typeof d.text !== 'string' || typeof d.vertical !== 'boolean') return null;
  const snapshots = Array.isArray(d.snapshots) ? d.snapshots.filter(isSnapshot) : [];
  return { text: d.text, vertical: d.vertical, snapshots };
}

export function serializeDraft(draft: Draft): string {
  return JSON.stringify(draft);
}

export interface DraftStore {
  load(): Draft | null;
  save(draft: Draft): void;
}

const STORAGE_KEY = 'genkou.draft.v1';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createStore(storage: StorageLike): DraftStore {
  return {
    load() {
      const raw = storage.getItem(STORAGE_KEY);
      return raw === null ? null : deserializeDraft(raw);
    },
    save(draft) {
      storage.setItem(STORAGE_KEY, serializeDraft(draft));
    },
  };
}
