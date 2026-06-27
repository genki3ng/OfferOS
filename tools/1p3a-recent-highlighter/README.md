# 1p3a 最新帖高亮（Chrome / Edge 扩展）

在 [1point3acres](https://www.1point3acres.com/) 论坛**版块列表页**，按帖子的
**发帖时间**或**最后回复时间**高亮最近的帖子，方便快速找到新内容（求职/面经/offer 版尤其有用）。

- 🟢 **强高亮**：age ≤ `recentDays`（默认 3 天）—— 淡绿背景 + 绿色左边条 + 标题加粗
- 🟡 **弱高亮**：age ≤ `weekDays`（默认 7 天）—— 淡黄背景 + 黄色左边条
- 每行标题旁可显示 `N天前` 徽章
- 可选：把不命中的帖子**变灰**，让新帖更跳

全部阈值/开关在扩展弹窗里调，**改动即时生效**（当前列表页自动重扫）。

> **v0.5**：点"下一页/页码"（论坛 AJAX 换列表、不刷新页面）也会自动重扫高亮（MutationObserver 监听列表替换）。

## 安装（加载未打包扩展）

1. Chrome / Edge 打开 `chrome://extensions`（Edge 为 `edge://extensions`）。
2. 右上角打开 **开发者模式 / Developer mode**。
3. 点 **加载已解压的扩展程序 / Load unpacked**，选中本文件夹
   （`tools/1p3a-recent-highlighter/`）。
4. 打开任意版块列表页，比如：
   - `https://www.1point3acres.com/bbs/forum-99-1.html`
   - `https://www.1point3acres.com/bbs/forum.php?mod=forumdisplay&fid=28&...`
5. 点工具栏里的扩展图标调阈值。

> 没放自定义图标，工具栏会显示默认拼图图标，不影响功能。

## 工作原理

- 只在版块列表页（`forum-*.html` 或 `mod=forumdisplay`）运行，不动帖子详情页。
- 论坛用 Discuz!，列表每行是 `tbody[id^="normalthread_"]`；时间在 `td.by` 里。
  - **发帖时间** = 第一个 `td.by`；**最后回复** = 第二个 `td.by`。
  - 优先读元素的 `title`（绝对时间），否则解析文本（支持 `2024-6-17`、
    `6-1 12:00`、`X分钟/小时/天/周/月前`、`昨天`、`前天`、`刚刚`）。
- 时间解析与高亮逻辑全在 `content.js`，样式在 `styles.css`。

## 如果某天不高亮了（论坛改版）

多半是 Discuz 主题换了 DOM。改 `content.js` 里这两处即可：

- `getThreadRows()`：行的选择器（`tbody[id^="normalthread_"]`）。
- `pickByCell()` / `dateFromByCell()`：时间单元格（`td.by` 与其中的 `em` / `[title]`）。

> 选择器是按 1point3acres 当前的 Discuz 模板写的、带了多重兜底；若论坛改版导致失效，
> 按上面两处对照页面真实 DOM 调一下就行。

## ② 收集到 GitHub（v0.2 新增）

把面经 / LinkedIn JD / 签证信息等**正文或截图**一键存到 GitHub 仓库的 `inbox/`，
供 Claude 下次对话直接读取、打标签、总结（给链接它跑不出内容，但**文件能读**）。

> **v0.6.2（2026-06-27）**：修**SPA 详情页（如 `/interview/thread/N`）截图重名报错**——这类界面点列表切帖时 `document.title` **不更新**（停在上一帖），导致每次截图 slug 全相同、同分钟两次抓取撞名报 422。两处修复：① 文件名带上 URL 里的**帖子 ID**（不同帖一定不撞）；② 抓取时优先从内容区取**当前帖标题**而非 stale 的 `document.title`。⚠️ 装了旧版的话，改完要去 `chrome://extensions` **重新加载扩展**才生效。
>
> **v0.6.1（2026-06-11）**：修 `GitHub 422 "sha wasn't supplied"`——提交前先查文件 sha，已存在则带 sha 走"更新"（不再 422）；文件名时间戳加到**秒**，避免同分钟两次抓取撞名互相覆盖。
>
> **v0.6（2026-06-10）**：① **抓正文改存 Markdown**——保留文章里的**超链接**、标题、列表、表格（此前是纯文本，链接全丢）；普通页面优先抓 `<article>/<main>` 正文区，1p3a 帖子页仍抓 `td.t_f`。② **整页截图支持"内部滚动容器"页面**（如 1p3a 的 `/interview/guides/` 报告页——窗口不滚、容器滚，旧版只能截首屏）：自动探测最大可滚容器、滚它拼接，页头只画一次。

收集方式（v0.6）：

- **⚡ 正文+整页 一键收集**：一个按钮同时抓正文 + 截整页并保存（最省事）。
  **v0.5 起在后台运行**——点完即可关弹窗/继续干别的；结果看扩展图标角标。
  唯一要求：**滚动截图那几秒别切走标签页**（切走会安全中断报 `!`，不会截错页面，重截即可）。
  ⚠️ v0.4 及之前它跑在弹窗里，弹窗一关（点页面任意处）就**静默中断、没存也没提示**——已修复。
- **📥 打开 inbox**：弹窗顶部直达 GitHub inbox 文件夹的链接（按 owner/repo/branch/path 配置生成），随手核对捕获入库没有。
- **⌨️ 快捷键 `Alt+Shift+S`**：不开弹窗，直接整页截图+正文存到 inbox（默认按"面经"；
  改键见 `chrome://extensions/shortcuts`）。
- **🖱️ 右键收集**：选中文字 → 右键"收集选中文字 → jobhunt inbox" → 选类型，直接存。
- **抓取正文/选中**：在 1point3acres 帖子页自动抓正文（`td.t_f`），或抓选中文字（填进文本框）。
- **粘贴**：往文本框粘文字；粘图片则作为截图一起存。
- **截整页 / 仅可见区**：手动截图后点"保存上面内容"。（这组手动操作仍在弹窗里跑，**保持弹窗开着**直到显示 ✓。）

**图标角标语义**：`…` 进行中 → `✓` 已保存 / `!` 失败（常见原因：截图中切走了标签页、token 失效、网络）。
每次保存在 `inbox/` 生成 `YYYY-MM-DD_HHMMSS_{type}_{slug}.md`（`slug` = 帖子标题 + 帖子 ID，带来源/时间/类型 frontmatter），有图再附 `.png` 并在 md 里引用。

> 文件结构：`gh.js` = 弹窗与后台共享的 GitHub 提交逻辑；`background.js` = 右键菜单 + 快捷键；
> `popup.js` = 弹窗 UI 与整页截图。

### 一次性配置 GitHub token

1. GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → Generate。
2. **Repository access**：只选你自己 fork 的这个仓库（`<your-username>/<your-repo>`）。
3. **Permissions → Repository permissions → Contents: Read and write**（其它不给）。
4. 生成后复制 token，填进扩展弹窗"GitHub 连接设置"里的 `token`，点"保存设置"→"测试连接"。
   - token 只存在本机浏览器（`chrome.storage.local`），**不会写进仓库**。
   - owner/repo/branch/path 填 `<your-username> / <your-repo> / main / inbox`，按需改。

> 注意：捕获默认写到 **`main`** 分支。要让 Claude 自动处理 inbox，需把本扩展配套的
> `inbox/` 约定与 CLAUDE.md 改动合并进 `main`。

## 路线图

- [x] 整页截图对 sticky/吸顶导航去重（v0.3：首屏保留、之后隐藏 fixed/sticky 元素再拼接）。
- ~~列表页数据导出 CSV/JSON~~（2026-06-03 用户判断暂无用，搁置）。
