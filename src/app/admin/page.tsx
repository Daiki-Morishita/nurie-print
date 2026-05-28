/**
 * /admin — イラスト素材管理ページ
 *
 * ⚠️ 本番環境では Basic Auth や環境変数チェックで保護すること
 *    例: ADMIN_SECRET を URL パラメータ or middleware で確認
 */
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { materials } from '@/lib/data'
import type { ImageStatus } from '@/lib/types'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { AdminMaterialsTable } from '@/components/admin/AdminMaterialsTable'
import { SearchRequestsTable } from '@/components/admin/SearchRequestsTable'
import { prisma } from '@/lib/db'
import { loadOverrides, invalidateOverridesCache } from '@/lib/data-overrides'
import { isAdminSession } from '@/lib/admin-auth'

export const metadata = {
  title: '素材管理 | ぬりえプリント Admin',
  robots: { index: false, follow: false },  // 検索エンジンから除外
}

export default async function AdminPage() {
  // 認証ガード: ADMIN_EMAILS allowlist のメンバーのみ閲覧可能
  if (!await isAdminSession()) {
    redirect('/login?callbackUrl=/admin')
  }

  // DB override を即時取り込むため、毎回キャッシュをリセット
  invalidateOverridesCache()
  const overrides = await loadOverrides()

  // 静的 imageStatus に override をマージしたリストを作る
  const effective = materials.map(m => {
    const o = overrides.get(m.id)
    return o?.imageStatus
      ? { ...m, imageStatus: o.imageStatus as ImageStatus, ...(o.illustNotes !== null ? { illustNotes: o.illustNotes } : {}) }
      : (o?.illustNotes !== undefined && o?.illustNotes !== null ? { ...m, illustNotes: o.illustNotes } : m)
  })

  function countByStatus(status: ImageStatus | 'placeholder') {
    return effective.filter(m => (m.imageStatus ?? 'placeholder') === status).length
  }

  const searchRequests = await prisma.searchRequest.findMany({
    orderBy: { count: 'desc' },
  })
  const contactMessages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  const stats = {
    total: effective.length,
    placeholder: countByStatus('placeholder'),
    pending: countByStatus('pending_review'),
    approved: countByStatus('approved'),
    needs_revision: countByStatus('needs_revision'),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">🖼️ イラスト素材管理</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              AIイラストの配置・レビュー・差し替えを管理します
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin/posts" className="text-xs font-bold text-primary border border-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors">
              📝 今日のいちまい 管理
            </a>
            <div className="text-xs text-gray-400 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
              ⚠️ 管理者専用ページ
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* 統計サマリー */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <StatCard label="教材総数" value={stats.total} color="bg-blue-50 text-blue-700 border-blue-200" />
          <StatCard label="SVGのみ" value={stats.placeholder} color="bg-gray-50 text-gray-600 border-gray-200" />
          <StatCard label="レビュー待ち" value={stats.pending} color="bg-yellow-50 text-yellow-700 border-yellow-200" />
          <StatCard label="承認済み" value={stats.approved} color="bg-green-50 text-green-700 border-green-200" />
          <StatCard label="要修正" value={stats.needs_revision} color="bg-red-50 text-red-700 border-red-200" />
        </div>

        {/* ── 画像アップロード & AI 解析 ── */}
        <div className="mb-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <h2 className="font-semibold text-sm text-gray-900">新しいイラストを追加</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                画像をアップロードすると Claude Vision が自動でメタデータを提案します
              </p>
            </div>
          </div>
          <div className="p-5">
            <ImageUploader />
          </div>
        </div>

        {/* 命名規則リファレンス */}
        <details className="mb-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <summary className="px-5 py-3.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-2">
            📋 ファイル命名規則・差し替え手順
          </summary>
          <div className="px-5 py-4 border-t border-gray-100 text-sm text-gray-700 space-y-3">
            <div>
              <p className="font-semibold text-gray-900 mb-1">ファイルパス規則</p>
              <code className="block bg-gray-50 rounded p-3 text-xs leading-relaxed font-mono text-gray-800">
                {`public/materials/\n`}
                {`  {id}.svg              # 印刷用SVG線画（常に必須）\n`}
                {`  {id}-illust.jpg       # AIイラスト（1280×960px推奨）\n`}
                {`  {id}-illust-v2.jpg    # リビジョン（旧版を残す場合）\n`}
                {`  {id}-thumb.jpg        # サムネイル（400×300px）`}
              </code>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">差し替え手順</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600">
                <li><code className="bg-gray-100 px-1 rounded">public/materials/{'{id}'}-illust.jpg</code> を上書き保存</li>
                <li><code className="bg-gray-100 px-1 rounded">src/lib/data.ts</code> の該当エントリの <code className="bg-gray-100 px-1 rounded">imageStatus</code> を <code className="bg-gray-100 px-1 rounded">&apos;pending_review&apos;</code> に変更</li>
                <li><code className="bg-gray-100 px-1 rounded">illustVersion</code> を +1、<code className="bg-gray-100 px-1 rounded">illustNotes</code> に変更理由を記載</li>
                <li>このページで確認 → <code className="bg-gray-100 px-1 rounded">approved</code> に変更してコミット</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">AI生成プロンプトのベース</p>
              <code className="block bg-gray-50 rounded p-3 text-xs font-mono text-gray-800 leading-relaxed">
                {`フラットイラスト、明るいパステル調、白背景\n`}
                {`日本の保育園・幼稚園向けWebサイト用サムネイル\n`}
                {`1280×960px、子ども向けで親しみやすいタッチ\n`}
                {`テーマ: {title}`}
              </code>
            </div>
          </div>
        </details>

        {/* 教材一覧テーブル */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-900">教材一覧（{effective.length}件）</h2>
            <p className="text-xs text-gray-400">ヘッダーをクリックでソート / data.ts を編集してステータスを更新</p>
          </div>
          <AdminMaterialsTable materials={effective} />
        </div>

        {/* 検索リクエスト */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <div>
                <h2 className="font-semibold text-sm text-gray-900">未ヒット検索ワード（生成テーマ候補）</h2>
                <p className="text-xs text-gray-500 mt-0.5">素材が見つからなかった検索ワード。回数が多いほど優先テーマ候補</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">{searchRequests.length}件</span>
          </div>
          <SearchRequestsTable requests={searchRequests} />
        </div>

        {/* お問い合わせメッセージ */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">✉️</span>
              <div>
                <h2 className="font-semibold text-sm text-gray-900">お問い合わせ（直近50件）</h2>
                <p className="text-xs text-gray-500 mt-0.5">未確認: {contactMessages.filter(m => m.status === 'new').length} 件</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">{contactMessages.length}件</span>
          </div>
          {contactMessages.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-gray-400">お問い合わせはまだありません</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {contactMessages.map(m => (
                <details key={m.id} className="group">
                  <summary className="px-5 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 list-none">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        m.status === 'new' ? 'bg-orange-100 text-orange-700' :
                        m.status === 'replied' ? 'bg-green-100 text-green-700' :
                        m.status === 'spam' ? 'bg-gray-100 text-gray-500' :
                        'bg-blue-100 text-blue-700'
                      }`}>{m.status.toUpperCase()}</span>
                      <span className="shrink-0 text-[11px] text-gray-500 font-mono">{m.category}</span>
                      <span className="truncate text-[13px] font-medium text-gray-900">
                        {m.subject || m.body.slice(0, 60) + (m.body.length > 60 ? '…' : '')}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {new Date(m.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </summary>
                  <div className="px-5 py-4 bg-gray-50 text-[13px] space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-500">From:</span> {m.name || '(名前なし)'} &lt;{m.email}&gt;</div>
                      <div><span className="text-gray-500">IP:</span> {m.ip || '-'}</div>
                    </div>
                    <div className="whitespace-pre-wrap bg-white border border-gray-200 rounded p-3 leading-relaxed">
                      {m.body}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>

        {/* フッターガイド */}
        <p className="mt-6 text-xs text-center text-gray-400">
          ステータスの変更は <code className="bg-gray-100 px-1 rounded">src/lib/data.ts</code> を直接編集してください。将来的にAPIエンドポイントで更新可能にする予定です。
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 font-medium opacity-80">{label}</p>
    </div>
  )
}
