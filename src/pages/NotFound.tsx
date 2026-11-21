import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { coreNav } from '@/components/Layout'
import { Eyebrow } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <Compass size={34} className="mb-5 text-gold/35" />
      <Eyebrow className="mb-2">Lost in the Wilds</Eyebrow>
      <h1 className="title-xl text-[26px] text-parchment sm:text-[32px]">你走进了没有记载的地方</h1>
      <p className="mt-3 max-w-md text-[12.5px] leading-relaxed text-parchment/45">
        这张地图的边缘没有绘出这条路。也许它通向某处尚未被记录的遗迹，也许只是一片风雪。
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/" className="btn btn-primary">
          回到营地
        </Link>
        <Link to="/world" className="btn btn-ghost">
          打开地图
        </Link>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-1.5">
        {coreNav.map((n) => (
          <Link key={n.to} to={n.to} className="border border-parchment/12 px-2.5 py-1 text-[11px] text-parchment/50 hover:border-gold/40 hover:text-gold-soft">
            {n.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
