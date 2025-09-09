// 画面の描画。本文の入力はその場で字数表示だけを差し替え、
// スナップショットの操作や縦横の切り替えのときだけ全体を描き直す。
// こうすることで、入力中にキャレットや変換が途切れない。

import { countText, manuscriptPages } from './lib/count';
import {
  diffStats,
  MAX_SNAPSHOTS,
  newSnapshotId,
  type Draft,
  type DraftStore,
} from './lib/history';
import { modeLabel, type ThemeMode, ThemeController } from './lib/theme';
import { icons } from './icons';

const THEME_ICONS: Record<ThemeMode, string> = {
  auto: icons.themeAuto,
  light: icons.themeLight,
  dark: icons.themeDark,
};

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function esc(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

function formatDateTime(epoch: number): string {
  const d = new Date(epoch);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export interface AppDeps {
  root: HTMLElement;
  store: DraftStore;
  initialDraft: Draft;
}

export function createApp({ root, store, initialDraft }: AppDeps): void {
  const draft = initialDraft;
  const theme = new ThemeController();
  /** 復元の二度押し確認の対象スナップショットid */
  let confirmingRestore: string | null = null;
  let confirmTimer: ReturnType<typeof setTimeout> | null = null;

  function save(): void {
    store.save(draft);
  }

  function countsHtml(): string {
    const c = countText(draft.text);
    const sheets = manuscriptPages(draft.text);
    return `
      <span class="count"><strong>${c.chars}</strong>字</span>
      <span class="count">空白込み <strong>${c.charsWithSpaces}</strong>字</span>
      <span class="count"><strong>${c.lines}</strong>行</span>
      <span class="count">20×20原稿用紙 <strong>${sheets}</strong>枚</span>
      <span class="count">400字換算 <strong>${c.pages400}</strong>枚</span>`;
  }

  function snapshotList(): string {
    if (draft.snapshots.length === 0) {
      return '<p class="hint">節目はまだありません。書き換える前に「節目を残す」を押すと、あとで読み比べたり戻したりできます。</p>';
    }
    const items = [...draft.snapshots]
      .sort((a, b) => b.savedAt - a.savedAt)
      .map((snap) => {
        const c = countText(snap.text);
        const diff = diffStats(snap.text, draft.text);
        const confirming = confirmingRestore === snap.id;
        return `
          <li class="snapshot" style="--i:0">
            <div class="snapshot-head">
              <strong>${esc(snap.label) || '(無題の節目)'}</strong>
              <span class="snapshot-meta">${formatDateTime(snap.savedAt)}・${c.chars}字</span>
            </div>
            <p class="snapshot-diff">いまの本文との差: <span class="added">+${diff.added}字</span> / <span class="removed">-${diff.removed}字</span></p>
            <div class="snapshot-actions">
              <button type="button" class="button small ${confirming ? 'confirming' : ''}" data-restore="${snap.id}">
                ${icons.restore}<span>${confirming ? 'もう一度押すと置き換え' : 'この節目に戻す'}</span></button>
              <button type="button" class="icon-button" data-del="${snap.id}"
                aria-label="${esc(snap.label) || '無題の節目'}を削除">${icons.trash}</button>
            </div>
          </li>`;
      })
      .join('');
    return `<ul class="snapshots">${items}</ul>`;
  }

  function bindEvents(): void {
    const editor = root.querySelector<HTMLTextAreaElement>('#editor');
    const counts = root.querySelector<HTMLElement>('#counts');
    editor?.addEventListener('input', () => {
      draft.text = editor.value;
      save();
      if (counts) counts.innerHTML = countsHtml();
    });

    root.querySelector('#toggle-direction')?.addEventListener('click', () => {
      draft.vertical = !draft.vertical;
      save();
      render();
    });

    const themeBtn = root.querySelector<HTMLButtonElement>('#theme-toggle');
    themeBtn?.addEventListener('click', () => {
      const mode = theme.cycle();
      themeBtn.innerHTML = THEME_ICONS[mode];
      themeBtn.setAttribute('aria-label', `配色テーマ: ${modeLabel(mode)}(クリックで切り替え)`);
    });

    root.querySelector<HTMLFormElement>('#snapshot-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = root.querySelector<HTMLInputElement>('#snapshot-label');
      draft.snapshots.push({
        id: newSnapshotId(),
        savedAt: Date.now(),
        label: (input?.value ?? '').trim(),
        text: draft.text,
      });
      // 上限を超えたら古いものから捨てる
      draft.snapshots.sort((a, b) => a.savedAt - b.savedAt);
      while (draft.snapshots.length > MAX_SNAPSHOTS) draft.snapshots.shift();
      save();
      render();
    });

    for (const el of root.querySelectorAll<HTMLElement>('[data-restore]')) {
      el.addEventListener('click', () => {
        const id = el.dataset.restore ?? '';
        const snap = draft.snapshots.find((s) => s.id === id);
        if (!snap) return;
        if (confirmingRestore !== id) {
          confirmingRestore = id;
          if (confirmTimer) clearTimeout(confirmTimer);
          confirmTimer = setTimeout(() => {
            confirmingRestore = null;
            render();
          }, 4000);
          render();
          return;
        }
        confirmingRestore = null;
        if (confirmTimer) clearTimeout(confirmTimer);
        // 戻す前のいまの本文を自動で節目に残し、書きかけを失わないようにする
        if (draft.text !== snap.text && draft.text.trim() !== '') {
          draft.snapshots.push({
            id: newSnapshotId(),
            savedAt: Date.now(),
            label: '戻す前の本文',
            text: draft.text,
          });
        }
        draft.text = snap.text;
        save();
        render();
      });
    }

    for (const el of root.querySelectorAll<HTMLElement>('[data-del]')) {
      el.addEventListener('click', () => {
        const id = el.dataset.del ?? '';
        const at = draft.snapshots.findIndex((s) => s.id === id);
        if (at === -1) return;
        draft.snapshots.splice(at, 1);
        save();
        render();
      });
    }

    root.querySelector('#download')?.addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob([draft.text], { type: 'text/plain' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'genkou.txt';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function render(): void {
    root.innerHTML = `
      <header class="site-header">
        <div class="site-header-inner">
          <span class="brand">${icons.logo}<span class="brand-text"><span class="brand-kicker">原稿用紙</span><span class="brand-name">genkou</span></span></span>
          <div class="header-right">
            <div id="counts" class="counts">${countsHtml()}</div>
            <button type="button" class="icon-button" id="theme-toggle"
              aria-label="配色テーマ: ${modeLabel(theme.mode)}(クリックで切り替え)">${THEME_ICONS[theme.mode]}</button>
          </div>
        </div>
      </header>
      <main class="site-main">
        <div class="toolbar">
          <button type="button" class="button" id="toggle-direction">
            ${icons.rotate}<span>${draft.vertical ? '横書きにする' : '縦書きにする'}</span></button>
          <button type="button" class="button" id="download">${icons.download}<span>テキストを保存</span></button>
          <form class="snapshot-form" id="snapshot-form">
            <input id="snapshot-label" placeholder="覚え書き(例: 初稿)" aria-label="節目の覚え書き" />
            <button type="submit" class="button primary">${icons.save}<span>節目を残す</span></button>
          </form>
        </div>
        <div class="paper ${draft.vertical ? 'vertical' : 'horizontal'}">
          <textarea id="editor" spellcheck="false" aria-label="本文"
            placeholder="ここに本文を書く">${esc(draft.text)}</textarea>
        </div>
        <section class="panel">
          <div class="panel-head">
            <span class="panel-kicker">Revisions</span>
            <h2>推敲の節目</h2>
          </div>
          ${snapshotList()}
        </section>
      </main>
      <footer class="site-footer">
        <p>genkou — 原稿用紙エディタ。本文と節目はこの端末のブラウザにだけ保存されます。</p>
      </footer>`;
    bindEvents();
  }

  render();
}
