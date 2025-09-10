import { describe, expect, it } from 'vitest';
import { countText, manuscriptPages } from './count';

describe('countText', () => {
  it('空白と改行を除いて数える', () => {
    const c = countText('吾輩は 猫である。\n名前は　まだ無い。');
    expect(c.chars).toBe(16);
    expect(c.charsWithSpaces).toBe(18);
    expect(c.lines).toBe(2);
  });

  it('空の原稿は0', () => {
    expect(countText('')).toEqual({
      chars: 0,
      charsWithSpaces: 0,
      lines: 0,
      sentences: 0,
      pages400: 0,
      readingMinutes: 0,
    });
  });

  it('終止記号で文を数え、連続記号は1つに畳む', () => {
    expect(countText('行った。帰った。').sentences).toBe(2);
    expect(countText('本当に?!').sentences).toBe(1);
    expect(countText('まだ記号がない').sentences).toBe(1);
    expect(countText('一文目。二文目').sentences).toBe(2);
  });

  it('読了時間は毎分500字で切り上げる', () => {
    expect(countText('あ'.repeat(500)).readingMinutes).toBe(1);
    expect(countText('あ'.repeat(501)).readingMinutes).toBe(2);
    expect(countText('あ').readingMinutes).toBe(1);
  });

  it('句読点・記号も1字として数える', () => {
    expect(countText('「お?」と言った。').chars).toBe(9);
  });

  it('サロゲートペアを1字として数える', () => {
    expect(countText('𠮷野家').chars).toBe(3);
  });

  it('400字詰めの換算枚数を切り上げる', () => {
    expect(countText('あ'.repeat(400)).pages400).toBe(1);
    expect(countText('あ'.repeat(401)).pages400).toBe(2);
  });
});

describe('manuscriptPages', () => {
  it('改行ごとに行を改め、20行で1枚とする', () => {
    expect(manuscriptPages('')).toBe(0);
    expect(manuscriptPages('あ')).toBe(1);
    // 21字の行は2行に折り返す
    expect(manuscriptPages('あ'.repeat(21))).toBe(1);
    // 1行20マス×20行=400字を1字超えると、行が21行になり2枚目へ
    const onePage = ('あ'.repeat(20) + '\n').repeat(19) + 'あ'.repeat(20);
    expect(manuscriptPages(onePage)).toBe(1);
    expect(manuscriptPages(onePage + '\nあ')).toBe(2);
  });

  it('空行も1行として数える', () => {
    const text = 'あ\n\nい';
    expect(manuscriptPages(text, 20, 3)).toBe(1);
    expect(manuscriptPages('あ\n\n\nい', 20, 3)).toBe(2);
  });
});
