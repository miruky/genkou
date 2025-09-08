import './style.css';
import { createApp } from './app';
import { createStore, emptyDraft } from './lib/history';

const root = document.getElementById('app');
if (!root) throw new Error('#app が見つかりません');

const store = createStore(localStorage);

// 初回起動は空の縦書き原稿から始める。一度でも保存があればその状態を尊重する
let draft = store.load();
if (draft === null) {
  draft = emptyDraft();
  store.save(draft);
}

createApp({ root, store, initialDraft: draft });
