import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Download, HardDrive, RefreshCw, Trash2, Upload } from 'lucide-react'
import { usePlayer } from '@/store/PlayerContext'
import { PageHeader } from '@/components/PageHeader'
import { Badge, Field, Hairline, Modal, Prose, SectionHeading, Stat, cn } from '@/components/ui'
import { formatDateTime } from '@/lib/labels'
import { weatherLabels } from '@/data'
import type { Weather } from '@/types'

const weatherOptions: Weather[] = ['clear', 'cloudy', 'rain', 'snow', 'blizzard', 'fog']

export default function ArchivePage() {
  const {
    profile,
    exploration,
    questRecords,
    journal,
    collection,
    world,
    exportData,
    importData,
    resetAll,
    setWeather,
    advanceHours,
    updateProfile,
    notify,
    ready,
  } = usePlayer()

  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  const discovered = Object.values(exploration).filter((r) => r.discovered).length
  const ownedItems = Object.values(collection).filter((r) => r.owned).length
  const activeQuests = Object.values(questRecords).filter((r) => r.status === 'active').length

  const onFile = async (file?: File) => {
    if (!file) return
    const text = await file.text()
    const ok = await importData(text)
    if (!ok) notify('导入失败，请确认文件来自本编年史。')
  }

  return (
    <div>
      <PageHeader
        compact
        eyebrow="Archive & Settings"
        title="存档与设置"
        en="Archive"
        sub="所有个人数据都保存在这台设备的浏览器中。导出备份、导入存档，或调整世界时间与天气。"
        crumbs={[{ to: '/', label: '营地' }, { label: '存档与设置' }]}
        meta={
          <>
            <span>IndexedDB · chronicles-of-skyrim</span>
            <span>{ready ? '已就绪' : '读取中…'}</span>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* 数据总览 */}
          <section className="panel p-4">
            <SectionHeading eyebrow="Overview" title="当前存档概览" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="角色" value={profile ? profile.name : '未创建'} hint={profile ? `等级 ${profile.level}` : '前往档案创建'} accent={Boolean(profile)} />
              <Stat label="已探索" value={discovered} hint="处地点" />
              <Stat label="任务进行中" value={activeQuests} hint={`共 ${Object.keys(questRecords).length} 项被触碰`} />
              <Stat label="日记" value={journal.length} hint="篇记录" />
              <Stat label="收藏" value={ownedItems} hint="件已获得" />
              <Stat label="金币" value={profile?.gold ?? 0} hint="Septim" />
              <Stat label="世界时间" value={`第 ${world.day} 日`} hint={`${String(world.hour).padStart(2, '0')}:00`} />
              <Stat label="天气" value={weatherLabels[world.weather]} hint={world.alignment === 'imperial' ? '帝国立场' : world.alignment === 'stormcloak' ? '风暴斗篷立场' : '保持中立'} />
            </div>
            <Hairline />
            <p className="text-[11px] leading-relaxed text-parchment/35">
              保存位置：本机浏览器 IndexedDB（数据库名 <span className="text-gold/60">chronicles-of-skyrim</span>）。
              清除浏览器站点数据会一并清除存档，请定期导出。
            </p>
          </section>

          {/* 导出导入 */}
          <section className="panel p-4">
            <SectionHeading eyebrow="Backup" title="导出与导入" sub="导出的 JSON 包含角色、探索、任务、日记、收藏与世界状态。" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportData} className="btn btn-primary">
                <Download size={13} /> 导出存档（JSON）
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost">
                <Upload size={13} /> 导入存档文件
              </button>
              <button type="button" onClick={() => setPasteOpen(true)} className="btn btn-ghost">
                粘贴 JSON 导入
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
            </div>
            <div className="mt-3 border border-gold/12 bg-coal/25 p-3">
              <p className="text-[11px] leading-relaxed text-parchment/40">
                导入会<span className="text-[#d68b7e]">覆盖</span>当前所有个人记录。建议先导出一份现有存档作为保险。
                角色建档时间：{profile ? formatDateTime(profile.createdAt) : '—'}。
              </p>
            </div>
          </section>

          {/* 世界调节 */}
          <section className="panel p-4">
            <SectionHeading eyebrow="World" title="世界时间与天气" sub="这里的调整会立即影响全站的背景氛围与状态栏。" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="天气">
                <select value={world.weather} onChange={(e) => setWeather(e.target.value as Weather)} className="select">
                  {weatherOptions.map((w) => (
                    <option key={w} value={w}>
                      {weatherLabels[w]}
                    </option>
                  ))}
                </select>
              </Field>
              <div>
                <p className="label">推进时间</p>
                <div className="flex gap-1.5">
                  {[1, 4, 8, 24].map((h) => (
                    <button key={h} type="button" onClick={() => advanceHours(h)} className="btn btn-sm btn-ghost flex-1">
                      +{h} 时
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Hairline />
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <p className="eyebrow mb-1 text-[8px] text-parchment/35">日期</p>
                <p className="text-[12.5px] text-parchment/75">第四纪元 201 年 · 第 {world.day} 日</p>
              </div>
              <div>
                <p className="eyebrow mb-1 text-[8px] text-parchment/35">时刻</p>
                <p className="text-[12.5px] text-parchment/75">{String(world.hour).padStart(2, '0')}:00</p>
              </div>
              <div>
                <p className="eyebrow mb-1 text-[8px] text-parchment/35">立场</p>
                <p className="text-[12.5px] text-parchment/75">
                  {world.alignment === 'imperial' ? '帝国' : world.alignment === 'stormcloak' ? '风暴斗篷' : '中立'}
                </p>
              </div>
            </div>
          </section>

          {/* 角色信息快速修改 */}
          {profile && (
            <section className="panel p-4">
              <SectionHeading eyebrow="Profile" title="角色快捷设置" />
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="姓名">
                  <input value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} className="input" />
                </Field>
                <Field label="等级">
                  <input
                    type="number"
                    value={profile.level}
                    min={1}
                    max={81}
                    onChange={(e) => updateProfile({ level: Math.max(1, Math.min(81, Number(e.target.value))) })}
                    className="input"
                  />
                </Field>
                <Field label="金币">
                  <input
                    type="number"
                    value={profile.gold}
                    min={0}
                    onChange={(e) => updateProfile({ gold: Math.max(0, Number(e.target.value)) })}
                    className="input"
                  />
                </Field>
              </div>
              <Link to="/profile" className="btn btn-sm btn-ghost mt-3">
                打开完整档案
              </Link>
            </section>
          )}

          {/* 危险区 */}
          <section className="panel border-[#7c2f26]/50 p-4">
            <SectionHeading eyebrow="Danger Zone" title="清除数据" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] leading-relaxed text-parchment/50">
                  清除角色、探索记录、任务进度、日记与收藏。此操作不可撤销。
                </p>
              </div>
              <button type="button" onClick={() => setConfirmReset(true)} className="btn btn-ghost shrink-0 text-[#d68b7e]">
                <Trash2 size={13} /> 清除全部数据
              </button>
            </div>
          </section>
        </div>

        {/* 侧栏 */}
        <aside className="space-y-4">
          <div className="panel p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] tracking-[0.14em] text-gold-soft/80">
              <HardDrive size={12} /> 存储说明
            </p>
            <Prose className="text-[11.5px]">
              <p>
                本站不设服务器，不收集任何账号信息。你的角色、日记与探索进度只存在于当前浏览器。
              </p>
              <p>换设备或清理浏览器缓存时，请先导出 JSON，再在新设备导入。</p>
            </Prose>
            <Hairline />
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="muted">无需登录</Badge>
              <Badge tone="muted">本地优先</Badge>
              <Badge tone="moss">离线可用</Badge>
            </div>
          </div>

          <div className="panel p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] tracking-[0.14em] text-gold-soft/80">
              <RefreshCw size={12} /> 数据完整性
            </p>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-parchment/40">
              <li>· 所有实体均有唯一 ID，并通过 regionId / locationId / characterId 等字段关联。</li>
              <li>· 页面在渲染前会过滤失效引用，个别数据缺口不会导致白屏。</li>
              <li>· 标注「待补充」的内容为尚未收录的官方资料，未作虚构填充。</li>
              <li>· 标注「模拟」「自定义」的内容由玩家或推演生成。</li>
            </ul>
          </div>

          <div className={cn('panel p-4', !profile && 'opacity-80')}>
            <p className="eyebrow mb-2 text-[8px] text-parchment/35">下一步</p>
            <div className="flex flex-col gap-1.5">
              <Link to="/world" className="btn btn-sm btn-ghost">
                继续探索
              </Link>
              <Link to="/journal" className="btn btn-sm btn-ghost">
                写一篇日记
              </Link>
              <Link to="/collections" className="btn btn-sm btn-ghost">
                查看收藏
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* 重置确认 */}
      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="确认清除全部数据？"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmReset(false)} className="btn btn-sm btn-ghost">
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                void resetAll()
                setConfirmReset(false)
              }}
              className="btn btn-sm btn-primary"
            >
              确认清除
            </button>
          </div>
        }
      >
        <div className="flex gap-2 border border-[#7c2f26]/40 bg-[#7c2f26]/10 p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#d68b7e]" />
          <p className="text-[12px] leading-relaxed text-parchment/60">
            这会永久删除角色档案、探索记录、任务进度、全部日记与收藏。没有服务器备份，无法恢复。
            如果还想保留，请先点击「导出存档」。
          </p>
        </div>
      </Modal>

      {/* 粘贴导入 */}
      <Modal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        title="粘贴 JSON 导入"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPasteOpen(false)} className="btn btn-sm btn-ghost">
              取消
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await importData(pasteText)
                if (ok) setPasteOpen(false)
              }}
              className="btn btn-sm btn-primary"
            >
              导入
            </button>
          </div>
        }
      >
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={10}
          placeholder='{"app":"chronicles-of-skyrim", ...}'
          className="textarea font-mono text-[11px]"
        />
      </Modal>
    </div>
  )
}
