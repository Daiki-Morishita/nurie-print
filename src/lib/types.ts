/**
 * 素材の階層構造（共通言語） — docs/terms.md が正式定義
 *
 * Category（カテゴリ）
 *   └─ Theme（テーマ）       … 大ジャンル（動物・のりもの 等）
 *        └─ Item（アイテム） … 個別題材（くま・ブランコ 等）
 *             └─ Variant（バリアント）… 同アイテムの別場面構成（-1/-2/-3）
 *                  └─ Unit（ユニット）… 難易度（simple/easy/normal/rich）
 *
 * 素材ID形式: {item}-{unit}-{variant}  例: swing-simple-1 / swing-simple-2
 */

export type AgeGroup = 2 | 3 | 4 | 5 | 6

export type Difficulty = 1 | 2 | 3 | 4

export type Duration = 5 | 10 | 15 | 20 | 30

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export type Category =
  | 'coloring'        // ぬりえ（こども向け）
  | 'adult-coloring'  // 大人ぬりえ
  | 'hiragana'        // ひらがな
  | 'numbers'         // 数字
  | 'drawing'         // 運筆
  | 'maze'            // 迷路
  | 'dotconnect'      // 点つなぎ
  | 'craft'           // 工作
  | 'scissors'        // ハサミ練習

export type Theme =
  // ── こども向けテーマ ──
  | 'animals'       // 動物
  | 'dinosaurs'     // 恐竜
  | 'vehicles'      // のりもの
  | 'trains'        // 電車
  | 'food'          // 食べ物
  | 'fruits'        // くだもの
  | 'vegetables'    // やさい
  | 'sea'           // 海の生き物
  | 'insects'       // 虫
  | 'flowers'          // 花
  | 'characters'       // キャラクター風
  | 'park'             // 公園・遊具
  | 'sports'           // スポーツ
  | 'seasonal-events'  // 季節の行事
  | 'spring'           // 春
  | 'summer'           // 夏
  | 'autumn'           // 秋
  | 'winter'           // 冬
  | 'gotochi'          // ご当地ぬりえ（47都道府県）
  // ── おとな向けテーマ ──
  | 'mandala'           // 曼荼羅
  | 'botanical'         // 植物画
  | 'landscape'         // 風景
  | 'pattern'           // 幾何模様
  | 'animals-detail'    // 動物（細密）
  | 'flowers-detail'    // 花（細密）
  | 'cityscape'         // 街並み
  | 'railway'           // 鉄道・風景
  | 'architecture'      // 世界の建築
  | 'seasonal-adult'    // 季節の行事（大人版）
  | 'masterpiece'       // 有名絵画（PD）

export type Audience = 'kids' | 'adult'

export const AUDIENCE_LABELS: Record<Audience, string> = {
  kids: 'こども向け',
  adult: 'おとな向け',
}

/** どのテーマが大人向けか */
export const ADULT_THEMES: Theme[] = [
  'mandala',
  'botanical',
  'landscape',
  'pattern',
  'animals-detail',
  'flowers-detail',
  'cityscape',
  'railway',
  'architecture',
  'seasonal-adult',
  'masterpiece',
]

export const CATEGORY_LABELS: Record<Category, string> = {
  coloring: 'ぬりえ',
  'adult-coloring': '大人ぬりえ',
  hiragana: 'ひらがな',
  numbers: '数字・数え方',
  drawing: '運筆',
  maze: '迷路',
  dotconnect: '点つなぎ',
  craft: '工作',
  scissors: 'ハサミ練習',
}

// ========== Item / Unit ==========

/**
 * Item（アイテム）: テーマ内の具体的な対象。
 * 素材IDの第1セグメント。例: bear, cat, train, bus
 * 固定リストではなく string — 新テーマ追加のたびに自由に増やせる。
 */
export type Item = string

/**
 * Unit（ユニット）: アイテムの難易度バリアント。
 * 素材IDの第2セグメント。4段階固定。
 *
 * simple … キャラ1体・背景なし（2〜3歳）
 * easy   … キャラ1体＋関連要素1つ（3歳）
 * normal … キャラ1体＋関連要素2〜3（3〜4歳）
 * rich   … 複数キャラ＋背景（4〜6歳）
 */
export type Unit = 'simple' | 'easy' | 'normal' | 'rich'

export const UNIT_LABELS: Record<Unit, string> = {
  simple: 'シンプル',
  easy:   'かんたん',
  normal: 'ふつう',
  rich:   'にぎやか',
}

export const UNIT_AGE: Record<Unit, { min: AgeGroup; max: AgeGroup }> = {
  simple: { min: 2, max: 3 },
  easy:   { min: 3, max: 4 },
  normal: { min: 3, max: 5 },
  rich:   { min: 4, max: 6 },
}

export const THEME_LABELS: Record<Theme, string> = {
  animals: '動物',
  dinosaurs: '恐竜',
  vehicles: 'のりもの',
  trains: '電車',
  food: '食べ物',
  fruits: 'くだもの',
  vegetables: 'やさい',
  sea: '海の生き物',
  insects: '虫',
  flowers: '花',
  characters: 'キャラクター風',
  park: '公園・遊具',
  sports: 'スポーツ',
  'seasonal-events': '季節の行事',
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
  gotochi: 'ご当地',
  mandala: '曼荼羅',
  botanical: '植物画',
  landscape: '風景',
  pattern: '幾何模様',
  'animals-detail': '動物（細密）',
  'flowers-detail': '花（細密）',
  cityscape: '街並み',
  railway: '鉄道・風景',
  architecture: '世界の建築',
  'seasonal-adult': '季節の行事（大人）',
  masterpiece: '有名絵画',
}

export const SEASON_LABELS: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
}

export const EVENT_LABELS: Record<string, string> = {
  // 春
  hinamatsuri:   'ひな祭り',
  enrollment:    '入園・進級式',
  childrensday:  'こどもの日',
  mothersday:    '母の日',
  excursion:     '遠足',
  // 夏
  fathersday:    '父の日',
  tanabata:      '七夕',
  pool:          'プール',
  summerfestival: '夏祭り',
  // 秋
  tsukimi:       'お月見',
  sports:        '運動会',
  imohori:       'いもほり',
  halloween:     'ハロウィン',
  shichigosan:   '七五三',
  // 冬
  christmas:     'クリスマス',
  mochitsuki:    'もちつき',
  newyear:       'お正月',
  setsubun:      '節分',
  // 通年
  graduation:    '卒園式',
  birthday:      '誕生日',
}

// ========== イラスト素材管理 ==========

/**
 * イラストの管理ステータス
 *
 * placeholder    : SVGの線画のみ（AIイラスト未設定）
 * pending_review : AIイラストを配置済み・レビュー待ち
 * approved       : レビュー済み・本番使用OK
 * needs_revision : 要修正（差し替え待ち）
 */
export type ImageStatus = 'placeholder' | 'pending_review' | 'approved' | 'needs_revision'

export const IMAGE_STATUS_LABELS: Record<ImageStatus, string> = {
  placeholder:    'SVGのみ',
  pending_review: 'レビュー待ち',
  approved:       '承認済み',
  needs_revision: '要修正',
}

export const IMAGE_STATUS_COLOR: Record<ImageStatus, string> = {
  placeholder:    'bg-gray-100 text-gray-600',
  pending_review: 'bg-yellow-100 text-yellow-700',
  approved:       'bg-green-100 text-green-700',
  needs_revision: 'bg-red-100 text-red-700',
}

// ========== 教材 ==========

export type Material = {
  id: string
  title: string
  description: string
  /** ターゲット層 — 省略時は kids（後方互換） */
  audience?: Audience
  ageMin: AgeGroup
  ageMax: AgeGroup
  difficulty: Difficulty
  duration: Duration
  category: Category
  theme?: Theme
  tags: string[]
  season?: Season
  event?: string
  tools: string[]
  activityIdeas: string[]
  /** SVG塗り絵ファイルのパス（常に存在する） */
  imageUrl: string
  /** 印刷用SVGのパス */
  pdfUrl: string
  createdAt: string
  popular: boolean
  downloadCount?: number

  // ── イラスト素材管理フィールド ──────────────────────────
  /** AIイラスト画像のパス（例: /materials/cat-simple-illust.jpg） */
  illustUrl?: string
  /** イラストのバージョン番号（差し替えのたびに +1） */
  illustVersion?: number
  /** 管理ステータス */
  imageStatus?: ImageStatus
  /** レビューメモ（修正指示や承認コメントなど） */
  illustNotes?: string
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'かんたん',
  2: 'やさしい',
  3: 'ふつう',
  4: 'わくわく',
}

/** 年齢下限（年齢範囲の上限は表示しない） */
export const DIFFICULTY_AGE: Record<Difficulty, string> = {
  1: '2歳〜',
  2: '3歳〜',
  3: '4歳〜',
  4: '5歳〜',
}
