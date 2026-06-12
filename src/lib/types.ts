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
  | 'densha'        // でんしゃ（旧キー / 在来線）
  | 'shinkansen'    // 新幹線
  | 'fairytale'     // 昔話・童話
  | 'food'          // 食べ物
  | 'fruits'        // くだもの
  | 'vegetables'    // やさい
  | 'sweets'        // おかし・スイーツ
  | 'sea'           // 海の生き物
  | 'insects'       // 虫
  | 'flowers'          // 花
  | 'characters'       // キャラクター風
  | 'park'             // 公園・遊具
  | 'sports'           // スポーツ
  | 'yokai'            // 妖怪
  | 'seasonal-events'  // 季節の行事
  | 'spring'           // 春
  | 'summer'           // 夏
  | 'autumn'           // 秋
  | 'winter'           // 冬
  | 'gotochi'          // ご当地ぬりえ（47都道府県）
  | 'nature'           // しぜん（虹・空・雲など）
  | 'seikatsu'         // せいかつ（家庭・生活）
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
  densha: 'でんしゃ',
  shinkansen: '新幹線',
  fairytale: '昔話・童話',
  food: '食べ物',
  fruits: 'くだもの',
  vegetables: 'やさい',
  sweets: 'おかし',
  sea: '海の生き物',
  insects: '虫',
  flowers: '花',
  characters: 'キャラクター風',
  park: '公園・遊具',
  sports: 'スポーツ',
  yokai: '妖怪',
  'seasonal-events': '季節',
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
  gotochi: 'ご当地',
  nature: 'しぜん',
  seikatsu: 'せいかつ',
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
export type ImageStatus = 'placeholder' | 'pending_review' | 'approved' | 'needs_revision' | 'duplicate' | 'broken'

export const IMAGE_STATUS_LABELS: Record<ImageStatus, string> = {
  placeholder:    'SVGのみ',
  pending_review: 'レビュー待ち',
  approved:       '承認済み',
  needs_revision: '要修正',
  duplicate:      '重複（非表示）',
  broken:         '画像なし',
}

export const IMAGE_STATUS_COLOR: Record<ImageStatus, string> = {
  placeholder:    'bg-gray-100 text-gray-600',
  pending_review: 'bg-yellow-100 text-yellow-700',
  approved:       'bg-green-100 text-green-700',
  needs_revision: 'bg-red-100 text-red-700',
  duplicate:      'bg-orange-100 text-orange-700',
  broken:         'bg-red-200 text-red-900',
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

  /** Featured 素材: noindex 戦略の whitelist。true の素材だけインデックス対象、sitemapにも掲載 */
  featured?: boolean
  /**
   * index 解禁フラグ。featured(=量産テンプレ whitelist)とは別物。
   * 人手で画像固有テキストに固有化し、再申請の品質基準(P4監査)を満たした素材だけ true。
   * この true の素材だけが index 対象・sitemap 掲載・crawlable 内部リンクの対象。
   */
  indexReady?: boolean
  /** Featured 素材専用の独自解説文（200字以上推奨）。素材ページに表示 */
  seoDescription?: string

  /** 素材ページ「この教材について」セクション内の個別解説（AI生成で別途投入する想定） */
  about?: MaterialAbout
}

/**
 * 素材ごとに個別の解説要素を持つための構造。値が無いブロックは UI で非表示。
 *
 * indexReady ページは「リード(seoDescription)／この絵の特徴／色のアイデア／塗り方・印刷の実用情報」
 * の4ブロック構成で固有化する。テーマ共通定数(themeStrength 等)は indexReady ページでは描画しない。
 * 各フィールドには「その絵を実際に見ないと書けない具体描写」を最低1つ含めること。
 */
export type MaterialAbout = {
  /** 「この絵の特徴」絵柄を踏まえた個別解説（画像固有の事実を含む） */
  featureDescription?: string
  /** 「色のアイデア」具体的な色名と部位（画像の部位に紐づける） */
  colorIdeas?: string
  /** 「塗り方ワンポイント」実用Tips（線の太さ・余白など画像固有の観察を含む） */
  coloringTips?: string
  /** 「年齢別のねらい」この難易度・構図でどんな力が育つか（画像構成に紐づく固有説明） */
  ageAim?: string
  /** 「印刷・おうちでの楽しみ方」推奨用紙・うす色なぞり・余白と対象年齢・印刷後の遊び方（画像で代替できない独自価値） */
  printTips?: string
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
