'use client'

import Link from 'next/link'
import { Printer, Trash2, Heart, ArrowRight, Plus, FolderPlus, X, Check, MoreVertical } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useFavorites } from '@/components/favorites/FavoritesProvider'
import { getMaterialById } from '@/lib/data'
import type { Material } from '@/lib/types'

export interface FavoriteItem {
  material: Material
  groupName: string | null
}

interface Props {
  initialItems: FavoriteItem[]
  limit: number
}

const UNGROUPED = '__ungrouped__'

export function FavoritesView({ initialItems, limit }: Props) {
  const { entries, isAnonymous, move, bulkDelete } = useFavorites()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [moveMenuOpen, setMoveMenuOpen] = useState(false)

  // 認証済み: initialItems（サーバーレンダ）を entries で更新
  // 匿名: localStorage の entries から getMaterialById でクライアント側ルックアップ
  const liveItems: FavoriteItem[] = useMemo(() => {
    const initialMap = new Map(initialItems.map(it => [it.material.id, it]))
    const items: FavoriteItem[] = []
    for (const entry of entries.values()) {
      const seed = initialMap.get(entry.materialId)
      if (seed) {
        items.push({ material: seed.material, groupName: entry.groupName ?? seed.groupName })
      } else {
        const m = getMaterialById(entry.materialId)
        if (m) items.push({ material: m, groupName: entry.groupName })
      }
    }
    return items
  }, [initialItems, entries])

  // Group items by groupName (null → ungrouped)
  const groups = useMemo(() => {
    const map = new Map<string, FavoriteItem[]>()
    for (const it of liveItems) {
      const key = it.groupName || UNGROUPED
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    }
    return map
  }, [liveItems])

  // Existing group names (excluding ungrouped)
  const existingGroupNames = useMemo(() => {
    return Array.from(groups.keys()).filter(k => k !== UNGROUPED).sort()
  }, [groups])

  const count = liveItems.length

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleGroup(items: FavoriteItem[]) {
    const ids = items.map(it => it.material.id)
    const allSelected = ids.every(id => selected.has(id))
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) {
        for (const id of ids) next.delete(id)
      } else {
        for (const id of ids) next.add(id)
      }
      return next
    })
  }

  function clearSelection() { setSelected(new Set()) }

  async function handlePrintSelected() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    window.open(`/favorites/print?ids=${ids.join(',')}`, '_blank')
  }

  async function handlePrintAll() {
    const ids = liveItems.map(it => it.material.id)
    if (ids.length === 0) return
    window.open(`/favorites/print?ids=${ids.join(',')}`, '_blank')
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (!confirm(`${ids.length} 件をお気に入りから削除しますか？`)) return
    await bulkDelete(ids)
    clearSelection()
  }

  async function handleMove(groupName: string | null) {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    await move(ids, groupName)
    setMoveMenuOpen(false)
    clearSelection()
  }

  async function handleCreateGroupAndMove() {
    const name = newGroupName.trim()
    if (!name) return
    const ids = Array.from(selected)
    if (ids.length === 0) {
      // Just create the empty group placeholder via moving nothing — no-op.
      setNewGroupName('')
      setNewGroupOpen(false)
      return
    }
    await move(ids, name)
    setNewGroupName('')
    setNewGroupOpen(false)
    clearSelection()
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-border flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-rounded font-bold text-[12px] text-primary mb-1 tracking-[0.1em] flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 fill-primary" />
            お気に入り
          </div>
          <h1 className="font-rounded text-[26px] sm:text-[32px] font-black">お気に入りのぬりえ</h1>
          <p className="text-[13px] text-muted-foreground mt-2">
            <strong className="text-foreground">{count}</strong> / {limit} 件
          </p>
          {isAnonymous && count > 0 && (
            <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
              <Link href="/login?callbackUrl=/favorites" className="text-primary underline">ログイン</Link>すると別端末でも同じお気に入りを使えます。
            </p>
          )}
        </div>
        {count > 0 && (
          <button
            onClick={handlePrintAll}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-[13px] font-rounded font-black hover:opacity-90 transition-colors shadow-md"
          >
            <Printer className="w-4 h-4" />
            まとめて印刷（{count}枚）
          </button>
        )}
      </div>

      {/* Empty state */}
      {count === 0 ? (
        <div className="bg-white border border-border rounded-lg p-10 text-center">
          <div className="text-5xl mb-4">💝</div>
          <h2 className="font-rounded text-[18px] font-black mb-2">まだお気に入りがありません</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
            気に入った教材のハートをタップすると、ここに集まります。<br />
            まとめて印刷もできます。
          </p>
          <Link
            href="/materials"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full text-[13px] font-rounded font-black hover:opacity-90 transition-colors"
          >
            ぬりえを探す<ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Selection toolbar — floats when something is selected */}
          {selected.size > 0 && (
            <div className="sticky top-32 z-30 mb-5">
              <div className="bg-foreground text-white rounded-full pl-5 pr-2 py-2 shadow-xl flex items-center gap-3 flex-wrap">
                <span className="text-[13px] font-rounded font-black">
                  {selected.size}件 選択中
                </span>
                <span className="w-px h-4 bg-white/30" />
                <button
                  onClick={handlePrintSelected}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-white/10 text-[12px]"
                >
                  <Printer className="w-3.5 h-3.5" />印刷
                </button>
                <div className="relative">
                  <button
                    onClick={() => setMoveMenuOpen(v => !v)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-white/10 text-[12px]"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />グループへ移動
                  </button>
                  {moveMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 bg-white text-foreground rounded-lg shadow-2xl border border-border min-w-[200px] py-1.5 z-40">
                      <button
                        onClick={() => handleMove(null)}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-muted flex items-center gap-2"
                      >
                        <span className="w-1 h-4 bg-muted-foreground/30 rounded" />未分類に戻す
                      </button>
                      {existingGroupNames.length > 0 && (
                        <>
                          <div className="border-t border-border my-1" />
                          {existingGroupNames.map(name => (
                            <button
                              key={name}
                              onClick={() => handleMove(name)}
                              className="w-full text-left px-4 py-2 text-[13px] hover:bg-muted flex items-center gap-2"
                            >
                              <span className="w-1 h-4 bg-primary rounded" />{name}
                            </button>
                          ))}
                        </>
                      )}
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={() => { setNewGroupOpen(true); setMoveMenuOpen(false) }}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-muted flex items-center gap-2 text-primary font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />新しいグループを作る
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-red-500/30 text-[12px] text-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />削除
                </button>
                <button
                  onClick={clearSelection}
                  aria-label="選択を解除"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 ml-auto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* New group inline input (modal-style) */}
          {newGroupOpen && (
            <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setNewGroupOpen(false)}>
              <div className="bg-white rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-rounded font-black text-[16px] mb-3">新しいグループを作る</h3>
                <input
                  autoFocus
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateGroupAndMove() }}
                  placeholder="例: 雨の日用、お試し、誕生日会"
                  maxLength={40}
                  className="w-full border-2 border-foreground rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-primary"
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setNewGroupName(''); setNewGroupOpen(false) }}
                    className="flex-1 bg-muted text-foreground py-2.5 rounded-lg text-[13px] font-medium"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleCreateGroupAndMove}
                    disabled={!newGroupName.trim() || selected.size === 0}
                    className="flex-1 bg-primary text-white py-2.5 rounded-lg text-[13px] font-rounded font-black disabled:opacity-40"
                  >
                    作成して移動（{selected.size}件）
                  </button>
                </div>
                {selected.size === 0 && (
                  <p className="text-[11px] text-muted-foreground mt-2 text-center">
                    ※ 先に移動したい教材を選択してから新しいグループを作成してください
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick "new group" hint when nothing selected */}
          {selected.size === 0 && existingGroupNames.length === 0 && (
            <p className="text-[12px] text-muted-foreground mb-3">
              💡 教材を選択すると、グループ分けや一括操作ができます。
            </p>
          )}

          {/* Groups — ungrouped first, then sorted */}
          {[UNGROUPED, ...existingGroupNames].map(key => {
            const items = groups.get(key)
            if (!items || items.length === 0) return null
            const isUngrouped = key === UNGROUPED
            const groupLabel = isUngrouped ? '未分類' : key
            const ids = items.map(it => it.material.id)
            const allSelected = ids.every(id => selected.has(id))
            const someSelected = ids.some(id => selected.has(id))
            return (
              <section key={key} className="mb-8">
                <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = !allSelected && someSelected }}
                      onChange={() => toggleGroup(items)}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                  </label>
                  <h2 className="font-rounded font-black text-[16px] flex items-center gap-2">
                    {!isUngrouped && <span className="text-primary">📁</span>}
                    {groupLabel}
                    <span className="text-[12px] text-muted-foreground font-medium">{items.length}</span>
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {items.map(it => (
                    <FavoriteCard
                      key={it.material.id}
                      material={it.material}
                      selected={selected.has(it.material.id)}
                      onToggleSelect={() => toggleOne(it.material.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          {count >= limit && (
            <div className="bg-[#FFF3E0]/60 border border-primary/30 rounded-lg p-5 text-center">
              <div className="text-3xl mb-2">🎈</div>
              <p className="font-rounded font-black text-[15px] mb-1">保存上限（{limit}件）に達しました</p>
              <p className="text-[12px] text-muted-foreground">
                整理してから新しい教材を追加してください。
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Inline card with checkbox + thumbnail + meta
// ──────────────────────────────────────────────
function FavoriteCard({
  material,
  selected,
  onToggleSelect,
}: {
  material: Material
  selected: boolean
  onToggleSelect: () => void
}) {
  const ageLabel = material.ageMin === material.ageMax ? `${material.ageMin}歳` : `${material.ageMin}〜${material.ageMax}歳`
  return (
    <div className={`relative bg-white border-2 rounded-lg overflow-hidden transition-all ${selected ? 'border-primary shadow-md' : 'border-border'}`}>
      <Link href={`/materials/${material.id}`} className="block">
        <div className="aspect-[1.414/1] bg-background flex items-center justify-center overflow-hidden">
          {material.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={material.imageUrl} alt={material.title} className="w-full h-full object-contain p-2" />
          )}
        </div>
        <div className="p-3">
          <h3 className="font-rounded font-black text-[13px] line-clamp-1 mb-1">{material.title}</h3>
          {material.description && (
            <p className="text-[11px] text-primary/85 line-clamp-1 mb-1.5">{material.description}</p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{ageLabel}</span>
            <span>·</span>
            <span>{material.duration}分</span>
          </div>
        </div>
      </Link>
      {/* Checkbox overlay */}
      <button
        onClick={onToggleSelect}
        aria-label={selected ? '選択を解除' : '選択'}
        className={`absolute top-2 left-2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
          selected ? 'bg-primary border-primary text-white' : 'bg-white/95 border-border text-transparent hover:border-primary'
        }`}
      >
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
      </button>
    </div>
  )
}
