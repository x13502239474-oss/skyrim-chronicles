# CHRONICLES OF SKYRIM · 天际编年史

一个以《The Elder Scrolls V: Skyrim》为世界观的**个人互动 RPG 探索平台**。

你不是在阅读天际省的故事，而是在天际省留下自己的故事。

---

## 在线地址

- **已部署站点**：https://skyrim-chronicles.app.workbuddy.host/?sharecode=2YQ7RSKBQW
- **源码仓库**：https://github.com/x13502239474-oss/skyrim-chronicles

仓库已配置 GitHub Actions 工作流（`.github/workflows/deploy.yml`）。若需启用 GitHub Pages：
在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**，之后每次
推送到 `main` 都会自动部署到 `https://x13502239474-oss.github.io/skyrim-chronicles/`。
（新仓库的 Pages 站点 GitHub 仅允许网页端首次启用，API 无法代劳。）

## 本地运行

```bash
# 1. 安装依赖（Node 20.19+ / 22.12+）
npm install

# 2. 开发模式（默认 http://localhost:5173）
npm run dev

# 3. 生产构建与本地预览
npm run build
npm run preview

# 4. 代码检查
npm run lint
```

技术栈：React 19 · TypeScript 7 · Vite 8 · Tailwind CSS v4（`@theme` 令牌 + `@layer components`）·
Framer Motion · React Router 7 · Dexie 4（IndexedDB）· Lucide Icons。

---

## 目录结构

```
src/
├── main.tsx                # 入口：Router + PlayerProvider
├── App.tsx                 # 路由表
├── index.css               # 设计系统（色彩/字体/纹理/按钮/表单/动画）
├── types.ts                # 全部实体与玩家数据类型
├── db.ts                   # Dexie 数据库、导入/导出 bundle
├── store/
│   └── PlayerContext.tsx   # 全局状态：角色、探索、任务、日记、收藏、世界态
├── data/                   # 结构化世界数据库（唯一 ID 交叉引用）
│   ├── regions.ts          # 九大领地 + 索瑟姆、地图多边形与场景调色板
│   ├── cities.ts           # 10 座城市
│   ├── locations-*.ts      # 256 处地点（城内 / 野外）
│   ├── characters-*.ts     # 259 位人物
│   ├── factions.ts         # 17 个势力
│   ├── quests.ts           # 105 项任务（11 类，含分支）
│   ├── events.ts           # 世界事件时间线、月份与天气
│   ├── items.ts            # 54 件收藏品（9 类）
│   ├── relationships.ts    # 70 条人物关系
│   ├── events.ts           # 世界事件、月份、天气
│   ├── races.ts            # 10 个种族、18 项技能、10 个龙吼
│   └── index.ts            # 聚合索引与安全查询函数
├── components/             # 通用组件（导航、卡片、地图、肖像、弹层…）
└── pages/                  # 13 个页面
```

## 页面结构

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 营地（首页） | 主视觉、个人状态、九大领地、世界事件、快捷入口 |
| `/world` | 天际省地图 | SVG 幻想地图：拖动/缩放/捏合、筛选、探索状态、详情面板 |
| `/travel` | 旅行与路线 | 选目的地、规划途经地标、估算耗时、推进世界时间、生成旅途日记 |
| `/holds` | 领地一览 | 九大领地 + 索瑟姆、一览表、城市列表 |
| `/region/:id` | 领地详情 | 地理、历史、城市、地点、人物、势力、任务、探索进度 |
| `/city/:id` | 城市资料 | 历史、地理、政治、统治者、城内地点、商人、居民、任务、传闻 |
| `/location/:id` | 地点详情 | 地点志、敌人、掉落、人物、任务、收藏品、探索笔记 |
| `/profile` | 冒险者档案 | 六步角色创建；档案页管理属性/技能/装备/龙吼/称号 |
| `/quests` | 任务与冒险 | 11 类筛选、状态、步骤勾选、分支抉择、自定义冒险 |
| `/characters` | 人物与关系 | 15 类分类、关系网络图、预设对话 |
| `/factions` | 势力与政治 | 势力档案 + 内战推演（官方立场与推演结果分列） |
| `/collections` | 收藏与发现 | 9 类图鉴、获得/收藏状态、完成度、自定义条目 |
| `/journal` | 世界日记 | 羊皮纸 CRUD、插图、关联人物/任务、草稿生成、Markdown 导出 |
| `/archive` | 存档与设置 | 数据总览、JSON 导出/导入、世界时间与天气、清除数据 |

## 数据结构

全部实体拥有唯一 `id`，通过外键关联，页面只读取索引，不重复硬编码：

```
Hold ──┬─ capitalId ──▶ City
       ├─ characterIds ──▶ Character ──┬─ factionIds ──▶ Faction
       ├─ factionIds ──▶ Faction       ├─ regionId ──▶ Hold
       ├─ questIds ──▶ Quest           └─ locationId ──▶ WorldLocation
       └─ locationIds ──▶ WorldLocation ── questIds ──▶ Quest
Character ──(Relationship{from,to,kind,label})── Character
```

玩家数据（`src/types.ts` → `src/db.ts` → Dexie）：

| 表 | 类型 | 内容 |
| --- | --- | --- |
| `profile` | `PlayerProfile` | 姓名/种族/出身/职业/背景/等级/属性/技能/装备/龙吼/称号/位置 |
| `exploration` | `ExplorationRecord` | `discovered` / `favorited` / `visitedAt` / `note` |
| `quests` | `QuestRecord` | `status` / `stepIndex` / `choices` / `note` / `custom` |
| `journal` | `JournalEntry` | 标题/正文/世界日期/地点/人物/任务/标签/图片 |
| `collection` | `CollectionRecord` | `owned` / `favorite` / `note` / `custom` |
| `world` | `WorldState` | 日/时/天气/立场/各领地归属/事件日志 |

数据库名 `chronicles-of-skyrim`。所有写入经 300–400ms 防抖后落盘；`archive` 页可整体导出为
`ExportBundle` JSON（`app: 'chronicles-of-skyrim'`, `version: 1`）并原样导入。

旅行系统复用现有状态 API：出发地取自角色当前位置，按地图坐标估算途经地标与耗时，抵达后推进
世界时间、更新位置、标记沿途发现、写入事件日志，并可选生成可编辑的旅途日记草稿。
构建采用 rolldown 分包（react / motion / icons / db 独立 chunk），`base: './'` 兼容任意静态托管路径。

## 内容标注约定

- 原版任务、地点、人物、物品：取自游戏设定，界面不额外标注「官方」以外的判断。
- 「模拟」「推演」「自定义」标签用于区分：内战推演结果、玩家自建任务/收藏、程序化生成内容。
- 尚未收录的细节统一写作「待补充」，不以虚构内容冒充官方设定。

---

世界观与角色版权归 Bethesda Softworks 所有；本项目为爱好者向二创作品，不用于商业用途。
