/**
 * 子の年齢ラベルを表示用に正規化する。プライバシー保護のため精度を粗くする。
 *
 * 入力例: "2歳10ヶ月" / "2y10m" / "5歳" / "編集部試し塗り" / "2歳半"
 *
 * 出力ルール:
 *  - "○歳○ヶ月" / "○y○m" → 月齢を半年単位で丸めて「○歳」「○歳半」に
 *  - 「半」「すぎ」「ごろ」が既に入っていればそのまま
 *  - 数値で年齢が取れない自由テキスト（編集部試し塗り等）はそのまま返す
 */
export function normalizeChildAge(raw: string): string {
  if (!raw) return ''
  const s = raw.trim()

  // 例: "2歳10ヶ月" / "2歳10か月" / "2歳10カ月"
  const jpMatch = s.match(/^(\d+)\s*歳\s*(\d+)\s*[ヶか月カ]+月?$/)
  if (jpMatch) {
    const y = Number(jpMatch[1])
    const m = Number(jpMatch[2])
    return formatHalfYear(y, m)
  }

  // 例: "2y10m" / "2Y10M"
  const enMatch = s.match(/^(\d+)\s*[yY]\s*(\d+)\s*[mM]$/)
  if (enMatch) {
    const y = Number(enMatch[1])
    const m = Number(enMatch[2])
    return formatHalfYear(y, m)
  }

  // 数値のみ: "2" → "2歳"
  if (/^\d+$/.test(s)) return `${s}歳`

  // それ以外（"5歳", "編集部試し塗り" など）はそのまま
  return s
}

function formatHalfYear(years: number, months: number): string {
  // 0-3ヶ月 → "○歳", 4-8ヶ月 → "○歳半", 9-11ヶ月 → "○歳すぎ"
  if (months < 4) return `${years}歳`
  if (months < 9) return `${years}歳半`
  return `${years}歳すぎ`
}
