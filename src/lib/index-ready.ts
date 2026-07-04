/**
 * index 解禁済み素材 ID（リンク層の crawl 判定専用・単一の真実源）。
 *
 * このファイルは scripts/apply_index_ready.py が data.ts の indexReady と同時に生成する。
 * 手で編集せず、scripts/index_ready_content.json を更新して再生成すること。
 * data.ts の indexReady と本 Set の一致は scripts/audit_index_pages.py が検証する。
 *
 * なぜ data.ts と別モジュールなのか: data.ts は数MBの巨大配列で、MaterialCard 等の
 * クライアント境界に import すると配列ごとクライアントバンドルに載ってしまう。
 * リンク層が必要とするのは ID の Set だけなので、ここに切り出している。
 */
export const INDEX_READY_IDS: ReadonlySet<string> = new Set<string>([
  'bear-simple-1',
  'cat-simple',
  'dog-simple',
  'rabbit-simple-1',
  'elephant-simple-1',
  'lion-simple-1',
  'panda-simple-1',
  'tyrannosaurus-simple-1',
  'tyrannosaurus-easy-1',
  'spinosaurus-simple-1',
  'velociraptor-simple-1',
  'allosaurus-simple-1',
  'car-simple-1',
  'car-easy-1',
  'train-simple-1',
  'bus-simple-1',
  'shinkansen-simple-1',
  'hinamatsuri-simple-1',
  'hanami-simple-1',
  'excursion-simple-1',
  'enrollment-simple-1',
  'apple-simple-1',
  'strawberry-simple-1',
  'banana-simple-1',
  'carrot-simple-1',
  'onion-simple-1',
  'cake-simple-1',
  'donut-simple-1',
  'rainbow-simple-1',
  'sun-simple-1',
  'police-car-easy-1',
  'shinkansen-normal-1',
  'himawari-shin-rich-1',
  'oni-simple-1',
  'shark-normal-1',
  'childrensday-easy-1'
])

export function isIndexReadyId(id: string): boolean {
  return INDEX_READY_IDS.has(id)
}

/**
 * 素材ページへの内部リンク用 rel。
 * index 解禁済み = follow（crawl 許可）、それ以外 = nofollow（巡回を最小化）。
 * 非 indexReady ページを完全に孤立させはせず、リンク自体は残して文脈だけ保つ。
 */
export function relForMaterialLink(id: string): 'nofollow' | undefined {
  return INDEX_READY_IDS.has(id) ? undefined : 'nofollow'
}
