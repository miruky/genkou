import { describe, expect, it } from 'vitest';
import {
  createStore,
  deserializeDraft,
  diffStats,
  emptyDraft,
  serializeDraft,
  type Draft,
} from './history';

describe('diffStats', () => {
  it('末尾への加筆は追加だけになる', () => {
    expect(diffStats('春は', '春はあけぼの')).toEqual({ added: 4, removed: 0 });
  });

  it('途中の書き換えは追加と削除の両方になる', () => {
    expect(diffStats('夏は夜である', '夏は朝である')).toEqual({ added: 1, removed: 1 });
  });

  it('削除だけの推敲', () => {
    expect(diffStats('とてもとても良い', '良い')).toEqual({ added: 0, removed: 6 });
  });

  it('同じ本文は差分なし', () => {
    expect(diffStats('同じ', '同じ')).toEqual({ added: 0, removed: 0 });
  });

  it('共通の結び(稿)を除いた残りを書き換え量とみなす', () => {
    expect(diffStats('旧稿', '新しい原稿')).toEqual({ added: 4, removed: 1 });
  });
});

describe('deserializeDraft', () => {
  it('serializeDraftと往復できる', () => {
    const draft: Draft = {
      text: '本文',
      vertical: true,
      snapshots: [{ id: 'n-1', savedAt: 1700000000000, label: '初稿', text: '本' }],
    };
    expect(deserializeDraft(serializeDraft(draft))).toEqual(draft);
  });

  it('壊れたJSON・形の崩れたものはnull', () => {
    expect(deserializeDraft('{')).toBeNull();
    expect(deserializeDraft('[]')).toBeNull();
    expect(deserializeDraft('{"text":1,"vertical":true}')).toBeNull();
  });

  it('形の崩れたスナップショットだけを読み飛ばす', () => {
    const json = JSON.stringify({
      text: '',
      vertical: false,
      snapshots: [{ id: 'n-1', savedAt: 1, label: '', text: '' }, { id: 'n-2' }],
    });
    expect(deserializeDraft(json)?.snapshots).toHaveLength(1);
  });
});

describe('createStore', () => {
  it('保存して読み戻せる', () => {
    const map = new Map<string, string>();
    const store = createStore({
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => void map.set(k, v),
    });
    expect(store.load()).toBeNull();
    const draft = { ...emptyDraft(), text: '草稿' };
    store.save(draft);
    expect(store.load()).toEqual(draft);
  });
});
