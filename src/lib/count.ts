// 字数の数え方。原稿の慣習に合わせ、空白と改行は数えず、
// 句読点や記号は1字として数える。

export interface CharCount {
  /** 空白・改行を除いた字数 */
  chars: number;
  /** 改行を除いたすべての文字(空白込み) */
  charsWithSpaces: number;
  /** 改行で区切った行数(空行も数える) */
  lines: number;
  /** 400字詰め原稿用紙の換算枚数(切り上げ) */
  pages400: number;
}

/** サロゲートペアを1字として数える */
function countGraphemes(text: string): number {
  return [...text].length;
}

export function countText(text: string): CharCount {
  const noNewline = text.replace(/\r?\n/g, '');
  // \s は全角スペース(U+3000)も含む
  const noSpaces = noNewline.replace(/\s/g, '');
  const chars = countGraphemes(noSpaces);
  return {
    chars,
    charsWithSpaces: countGraphemes(noNewline),
    lines: text === '' ? 0 : text.split(/\r?\n/).length,
    pages400: Math.ceil(chars / 400),
  };
}

/**
 * 原稿用紙のマス目に置いたときの枚数。1行=20マスで改行のたびに行を改め、
 * 1枚=20行として数える。空の原稿は0枚。
 */
export function manuscriptPages(text: string, cols = 20, rows = 20): number {
  if (text === '') return 0;
  const lines = text.split(/\r?\n/);
  let usedRows = 0;
  for (const line of lines) {
    usedRows += Math.max(1, Math.ceil(countGraphemes(line) / cols));
  }
  return Math.ceil(usedRows / rows);
}
