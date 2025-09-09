// UIで使う線画アイコン。24pxグリッド・stroke=currentColorで統一し、
// 隣に必ずテキストラベルを置く前提ですべて装飾(aria-hidden)とする。

const svg = (body: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const icons = {
  logo: svg(
    '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/>' +
      '<path d="M9.2 3.5v17"/><path d="M14.8 3.5v17"/>' +
      '<path d="M17.5 7.5h2M17.5 12h2M17.5 16.5h2" stroke-width="1.4"/>',
  ),
  save: svg(
    '<path d="M5 3.5h11l3.5 3.5v12a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z"/>' +
      '<path d="M8 3.5V8h7V3.5"/><rect x="8" y="13" width="8" height="7.5"/>',
  ),
  restore: svg(
    '<path d="M4 12a8 8 0 1 1 2.3 5.7"/><path d="M4 13v-4h4"/><path d="M12 8v4.5l3 2"/>',
  ),
  trash: svg(
    '<path d="M4 7h16"/>' +
      '<path d="M9.5 7V5A1.5 1.5 0 0 1 11 3.5h2A1.5 1.5 0 0 1 14.5 5v2"/>' +
      '<path d="m6.5 7 .7 11.2a2 2 0 0 0 2 1.8h5.6a2 2 0 0 0 2-1.8L17.5 7"/>' +
      '<path d="M10 11v5.5"/><path d="M14 11v5.5"/>',
  ),
  download: svg('<path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>'),
  rotate: svg(
    '<path d="M3.5 5.5h10a3 3 0 0 1 3 3v10"/>' +
      '<path d="m13 16.5 3.5 3.5 3.5-3.5"/>' +
      '<path d="m7 9 -3.5-3.5L7 2"/>',
  ),
  themeAuto: svg(
    '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
  ),
  themeLight: svg(
    '<circle cx="12" cy="12" r="4"/>' +
      '<path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19"/>',
  ),
  themeDark: svg('<path d="M20.5 14.6A8 8 0 0 1 9.4 3.5 7 7 0 1 0 20.5 14.6z"/>'),
  focus: svg(
    '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  ),
} as const;
