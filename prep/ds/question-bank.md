# 题库（Question Bank）

> 网页指挥台（练习页）读本文件。
> **格式契约**（解析器依赖，勿破坏）：`## 类别` → `### [id] 题目一行` → 题干补充（可选多行）→ 单独一行 `**要点**` → 要点内容（到下一题为止）。
> 自评记录自动落 [practice-log.md](practice-log.md)；要加题/换方向 → 站点「📨 派活」或对 Claude 直说。
> 下面是一套通用 DS 题（SQL/Python · 统计实验 · 产品 sense · 行为面），可直接练；想换成更贴你目标公司的题 → 对 Claude 说，或走站点「📨 派活」。

## SQL

> sql-07 起为 **LeetCode 经典 + 业务壳**，每题在「要点」给**完整可对照 query**（先自己写、再对解）；底层技巧可跨公司复用，业务壳偏广告 / marketplace。

### [sql-01] events(user_id, event_date, event_type)：求 D1/D7 留存曲线
**要点**
```sql
WITH first_day AS (
  SELECT user_id, MIN(event_date) AS d0 FROM events GROUP BY user_id
)
SELECT f.d0,
       COUNT(DISTINCT f.user_id) AS cohort,
       COUNT(DISTINCT CASE WHEN e.event_date = f.d0 + INTERVAL '1 day' THEN e.user_id END)::numeric
         / COUNT(DISTINCT f.user_id) AS d1_retention,
       COUNT(DISTINCT CASE WHEN e.event_date = f.d0 + INTERVAL '7 day' THEN e.user_id END)::numeric
         / COUNT(DISTINCT f.user_id) AS d7_retention
FROM first_day f
LEFT JOIN events e ON e.user_id = f.user_id
GROUP BY f.d0 ORDER BY f.d0;
```
- 模式：首访 cohort（`MIN(event_date)` per user）→ self-join/EXISTS 看 D+1、D+7 是否活跃 → 除以 cohort 规模。
- 口述时先讲思路再写；注意去重（DISTINCT user）、留存定义（当天 vs 窗口内）。
- 参考：[warmup-problems](sql-python/warmup-problems.md)

### [sql-02] 每个 category 收入 top 3 产品 + 占类目收入百分比
**要点**
```sql
WITH agg AS (
  SELECT category, product, SUM(revenue) AS rev FROM sales GROUP BY category, product
), ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY category ORDER BY rev DESC) AS rn,
         rev / SUM(rev) OVER (PARTITION BY category) AS pct_of_cat   -- 占比窗口在过滤 top3 前算
  FROM agg
)
SELECT category, product, rev, pct_of_cat
FROM ranked WHERE rn <= 3 ORDER BY category, rev DESC;
```
- `SUM(revenue) GROUP BY category, product` → `ROW_NUMBER() OVER (PARTITION BY category ORDER BY rev DESC)` ≤3 + `rev / SUM(rev) OVER (PARTITION BY category)`。
- 细节：tie 处理（RANK vs ROW_NUMBER 说一句）、percent 在过滤 top3 前算。

### [sql-03] 连续登录 ≥3 天的用户（gaps-and-islands）
**要点**
```sql
WITH d AS (SELECT DISTINCT user_id, event_date FROM events),
g AS (
  SELECT user_id, event_date,
         event_date - CAST(ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY event_date) AS int) AS grp
  FROM d
)
SELECT DISTINCT user_id
FROM (SELECT user_id, grp FROM g GROUP BY user_id, grp HAVING COUNT(*) >= 3) s;
```
- 经典：`event_date - ROW_NUMBER() OVER (PARTITION BY user ORDER BY event_date)` 同组常数 → GROUP BY 组长度 ≥3。
- 先 DISTINCT user+date；讲清为什么差值在连续段内不变。

### [sql-04] 漏斗 view→add_to_cart→purchase 各步转化，按渠道拆
**要点**
```sql
WITH u AS (   -- 用户级打 flag（是否到过各步）
  SELECT user_id, channel,
         MAX(CASE WHEN event_type='view'        THEN 1 ELSE 0 END) AS viewed,
         MAX(CASE WHEN event_type='add_to_cart' THEN 1 ELSE 0 END) AS carted,
         MAX(CASE WHEN event_type='purchase'    THEN 1 ELSE 0 END) AS bought
  FROM events GROUP BY user_id, channel
)
SELECT channel,
       SUM(viewed) AS views,
       SUM(carted)::numeric / NULLIF(SUM(viewed),0) AS view_to_cart,
       SUM(bought)::numeric / NULLIF(SUM(carted),0) AS cart_to_buy
FROM u GROUP BY channel;
```
- 用户级打 flag（MAX(CASE WHEN…)）→ 按渠道聚合 `SUM(purchase)/SUM(add_to_cart)` 等。
- 提一句口径：时间窗约束（view 后 7 天内购买）、严格顺序漏斗 vs 宽松口径。

### [sql-05] Python：DataFrame 算各组 CUPED 校正后均值
**要点**
```python
import pandas as pd
def cuped_means(df, y='y', x_pre='x_pre', group='variant'):
    theta = df[[y, x_pre]].cov().iloc[0, 1] / df[x_pre].var()   # cov(Y,Xpre)/var(Xpre)
    df = df.assign(y_cuped=df[y] - theta * (df[x_pre] - df[x_pre].mean()))
    return df.groupby(group)['y_cuped'].mean()                  # 各实验组校正后均值
```
- `theta = cov(Y, X_pre) / var(X_pre)`；`Y_cuped = Y − theta·(X_pre − mean(X_pre))`；再 groupby 实验组均值。
- 讲原理一句话：用前期协变量解释掉一部分方差，无偏且方差更小。

### [sql-06] 配送 marketplace SQL：orders(order_id, consumer_id, merchant_id, courier_id, created_at, delivered_at, gov, is_subscriber)
① 各 merchant 月 GOV + 环比%；② 订阅会员 vs 非订阅的 30 天复购率；③ 各 region 配送时长 p90
**要点**
```sql
-- ① 各 merchant 月 GOV + 环比%
WITH m AS (
  SELECT merchant_id, DATE_TRUNC('month', created_at) AS mon, SUM(gov) AS gov
  FROM orders GROUP BY merchant_id, DATE_TRUNC('month', created_at)
)
SELECT merchant_id, mon, gov,
       (gov - LAG(gov) OVER (PARTITION BY merchant_id ORDER BY mon))
         / NULLIF(LAG(gov) OVER (PARTITION BY merchant_id ORDER BY mon), 0) AS mom_pct
FROM m;

-- ② 订阅会员 vs 非订阅 30 天复购率（分子分母分开 distinct）
WITH nxt AS (
  SELECT consumer_id, is_subscriber, created_at,
         LEAD(created_at) OVER (PARTITION BY consumer_id ORDER BY created_at) AS next_at
  FROM orders
)
SELECT is_subscriber,
       COUNT(DISTINCT CASE WHEN next_at <= created_at + INTERVAL '30 day' THEN consumer_id END)::numeric
         / COUNT(DISTINCT consumer_id) AS repurchase_30d
FROM nxt GROUP BY is_subscriber;

-- ③ 各 region 配送时长 p90
SELECT c.region,
       PERCENTILE_CONT(0.9) WITHIN GROUP (
         ORDER BY EXTRACT(EPOCH FROM (o.delivered_at - o.created_at))/60) AS p90_minutes
FROM orders o JOIN couriers c ON c.courier_id = o.courier_id
WHERE o.delivered_at IS NOT NULL
GROUP BY c.region;
```
- **① 月 GOV 环比**：`DATE_TRUNC('month', created_at)` 分组 `SUM(gov)`；环比 `LAG(SUM(gov)) OVER (PARTITION BY merchant_id ORDER BY month)`，`(cur−prev)/prev`。
- **② 复购率**：标每单"30 天内是否有下一单"（`LEAD(created_at) OVER (PARTITION BY consumer_id ORDER BY created_at)` 比 `created_at + 30d`）；按 `is_subscriber` 分组 = 复购用户数 / 用户数（**分子分母分开 `COUNT(DISTINCT)` 再除**，别行级平均）。
- **③ p90 配送时长**：`PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY delivered_at − created_at)`，按 region（join courier→region 维表）。
- **坑**：维表 join **fan-out**（一单别翻倍）；`delivered_at` 为 NULL（未送达）要排除；除零（merchant 首月无 prev）；时区。
- 答题：先问 schema/粒度/去重键 → 写骨架再填 → 主动报边界 → 自查 fan-out & 分母。

### [sql-07] [LeetCode 176/177] 第 N 高薪资（second / Nth highest，无则返回 NULL）
> 共享技巧：**DENSE_RANK 去重排名** + 「无则 NULL」。schema：`employee(id, salary)`
**要点**
```sql
-- 第二高（无则 NULL）：找比"最大值"小的最大值
SELECT MAX(salary) AS second_highest
FROM employee
WHERE salary < (SELECT MAX(salary) FROM employee);

-- 通用第 N 高（N=2 即第二高）
WITH ranked AS (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rk
  FROM employee
)
SELECT MAX(salary) AS nth_highest   -- 外层 MAX 把"无此名次"安全折成 NULL
FROM ranked
WHERE rk = 2;
```
- 关键：外层 `MAX()` —— 当不存在第 N 高（如只有 1 个不同值），`WHERE rk=2` 无行，`MAX(...)` 返回 NULL，正好满足题目"无则 NULL"（直接 SELECT 会返回空集而非 NULL 行）。

**深挖追问**
- *"为什么用 DENSE_RANK 不用 ROW_NUMBER / RANK？"* → 要"第二个**不同**薪资"：ROW_NUMBER 给并列编不同号会误判；RANK 并列后跳号（1,1,3）会漏名次；DENSE_RANK 正确。
- *"并列拿第二高的人都要列吗？"* → 若输出是"人"而非"值"，则 `WHERE rk=2` 取全部行、不再 MAX。先问输出口径。
- *(staff)* "第 N / top-per-group"是窗口母题，能即兴改 per-department（加 `PARTITION BY dept`）。

### [sql-08] [LeetCode 180] 连续出现 ≥3 次的数字
> 共享技巧：**LAG 比较相邻行**。schema：`logs(id 自增, num)`
**要点**
```sql
WITH t AS (
  SELECT num,
         LAG(num,1) OVER (ORDER BY id) AS p1,
         LAG(num,2) OVER (ORDER BY id) AS p2
  FROM logs
)
SELECT DISTINCT num AS consecutive_num
FROM t
WHERE num = p1 AND num = p2;   -- 当前 = 前1 = 前2 → 连续3次
```
- 思路：按 id 排序取前 1、前 2 行的值，三者相等即连续 3 次出现；`DISTINCT` 去重多段。

**深挖追问**
- *"连续 ≥K 次怎么推广？"* → LAG 1..K-1 全相等；或 gaps-and-islands（`id - ROW_NUMBER() OVER(PARTITION BY num ORDER BY id)` 同组常数 → 组内 `COUNT≥K`）。
- *"id 有空洞影响吗？"* → LAG 按行序、不依赖 id 连续；gaps-islands 版才依赖。先确认 id 语义。
- *(staff)* 套到"连续 N 期告警/未达标"监控，K 可配置。

### [sql-09] [LeetCode 197] 气温比"前一天"高的日期
> 共享技巧：**按真实日期对齐**（坑：不能用 id-1 / 无条件 LAG）。schema：`weather(id, recordDate, temperature)`
**要点**
```sql
-- 自连接版：按 recordDate-1 天对齐
SELECT w.id
FROM weather w
JOIN weather y ON y.recordDate = w.recordDate - INTERVAL '1 day'
WHERE w.temperature > y.temperature;

-- LAG 版：必须校验"上一行确实是昨天"
WITH t AS (
  SELECT id, temperature,
         LAG(temperature) OVER (ORDER BY recordDate) AS prev_t,
         LAG(recordDate)  OVER (ORDER BY recordDate) AS prev_d
  FROM weather
)
SELECT id FROM t
WHERE temperature > prev_t AND recordDate = prev_d + INTERVAL '1 day';
```
- 坑：日期可能缺天，"前一天"要按 `recordDate - 1 day`，**不是** `id-1` 也不是无条件 LAG（LAG 取的是上一**行**而非上一**日**）。

**深挖追问**
- *"日期有缺口时 LAG 会取错前一天吗？"* → 会 → 必须加 `recordDate = prev_d + 1` 校验。经典坑。
- *"MySQL 怎么写？"* → `DATEDIFF(w.recordDate, y.recordDate)=1` 或 `DATE_SUB(w.recordDate, INTERVAL 1 DAY)`。
- *(staff)* 同模式 = "环比上一期"，注意期粒度 + 缺口补齐。

### [sql-10] [LeetCode 183] 从不下单的客户（anti-join 反连接）
> 共享技巧：**反连接** 三写法 + NOT IN 的 NULL 陷阱。schema：`customers(id, name)`、`orders(id, customerId)`
**要点**
```sql
-- 推荐 NOT EXISTS（NULL 安全、可走半连接优化）
SELECT c.name AS customers
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customerId = c.id);

-- 等价 LEFT JOIN 反连接
SELECT c.name AS customers
FROM customers c
LEFT JOIN orders o ON o.customerId = c.id
WHERE o.id IS NULL;
```
- 坑：`NOT IN (SELECT customerId FROM orders)` 在子查询含 NULL 时**整体返回空**（NULL 比较）——别用，除非先过滤 NULL。

**深挖追问**
- *"NOT IN / NOT EXISTS / LEFT-JOIN-NULL 三者差别？"* → NOT EXISTS 最稳（半连接、NULL 安全）；NOT IN 有 NULL 陷阱；LEFT-JOIN-NULL 等价但大表可能物化更多行。
- *"要'下单 < K 次'而非'从不'？"* → LEFT JOIN + `GROUP BY HAVING COUNT(o.id) < K`。
- *(staff)* 反连接 = "流失/未激活"分群母题，接到 reactivation 实验。

### [sql-11] [LeetCode 182/196] 重复邮箱（查 + 删除只留最小 id）
> 共享技巧：**GROUP BY HAVING 找重复** + 自连接删除。schema：`person(id, email)`
**要点**
```sql
-- 查重复
SELECT email FROM person GROUP BY email HAVING COUNT(*) > 1;

-- 删除重复、每个 email 只留最小 id
DELETE p FROM person p
JOIN person q ON p.email = q.email AND p.id > q.id;        -- MySQL
-- 标准 SQL：DELETE FROM person WHERE id NOT IN (SELECT MIN(id) FROM person GROUP BY email);
```
- 思路：存在更小 id 的同邮箱行就删 p（`p.id > q.id`），等价"只留最小 id"。

**深挖追问**
- *"标准 SQL 不支持 DELETE...JOIN 怎么办？"* → `WHERE id NOT IN (SELECT MIN(id) ... GROUP BY email)`（某些引擎对"删除同表子查询"要再包一层 `SELECT * FROM (...) x`）。
- *"重复判定的业务键？"* → email 要不要先 `LOWER(TRIM())` 归一；落库前 dedupe 比事后删更稳。
- *(staff)* 数据质量门：先定唯一键 + 约束，避免反复清洗。

### [sql-12] [LeetCode 181] 工资高于其经理的员工（自连接）
> schema：`employee(id, name, salary, managerId)`
**要点**
```sql
SELECT e.name AS employee
FROM employee e
JOIN employee m ON e.managerId = m.id
WHERE e.salary > m.salary;
```
- 思路：同表自连接，把员工与其经理拼到一行再比薪资。

**深挖追问**
- *"managerId 为 NULL（CEO）会怎样？"* → INNER JOIN 自动排除；要列出无经理者需另行处理。
- *"要比'经理的经理'多级？"* → 递归 CTE（`WITH RECURSIVE`）向上爬层级。
- *(staff)* 层级数据坑：环引用、深度不定 → 递归 + 深度上限保护。

### [sql-13] [行转列 pivot] 各产品按月销量透视成「产品 × 月份」宽表
> 共享技巧：**条件聚合做 pivot**（`SUM(CASE WHEN…)`）。schema：`sales(product, sale_date, qty)`
**要点**
```sql
SELECT product,
       SUM(CASE WHEN EXTRACT(MONTH FROM sale_date)=1 THEN qty ELSE 0 END) AS jan,
       SUM(CASE WHEN EXTRACT(MONTH FROM sale_date)=2 THEN qty ELSE 0 END) AS feb,
       SUM(CASE WHEN EXTRACT(MONTH FROM sale_date)=3 THEN qty ELSE 0 END) AS mar
FROM sales
WHERE sale_date >= DATE '2024-01-01' AND sale_date < DATE '2024-04-01'
GROUP BY product;
```
- 思路：每个目标列 = 一个 `SUM(CASE WHEN 列条件 THEN 值)`；行（product）GROUP BY，列（月份）用 CASE 摊开。

**深挖追问**
- *"列是动态的（月份不固定）怎么办？"* → 纯 SQL 无法动态列 → 引擎 `PIVOT` 语法 / 动态拼 SQL / 在 pandas·BI 层 pivot。
- *"反向列转行（unpivot）？"* → `UNION ALL` 各列，或 `UNPIVOT` / `CROSS JOIN LATERAL (VALUES …)`。
- *(staff)* 报表别在 SQL 写死过多列；SQL 出长表、pandas/BI 做宽表更灵活。

### [sql-14] [窗口帧] 每用户按时间的累计消费 + 7 行滚动均值
> 共享技巧：**window frame**（累计 vs 滚动的边界写法）。schema：`txn(user_id, ts, amount)`
**要点**
```sql
SELECT user_id, ts, amount,
       SUM(amount) OVER (PARTITION BY user_id ORDER BY ts
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_spend,
       AVG(amount) OVER (PARTITION BY user_id ORDER BY ts
                         ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)        AS roll7_avg
FROM txn;
```
- 累计 = `UNBOUNDED PRECEDING → CURRENT ROW`；近 7 行滚动 = `6 PRECEDING → CURRENT ROW`；`PARTITION BY user_id` 保证每用户重置。

**深挖追问**
- *"ROWS vs RANGE？"* → ROWS 按物理行数；RANGE 按 ORDER BY 值范围（同值并列一起纳入）。真·滚动 7 **天**（有缺口）要 `RANGE BETWEEN INTERVAL '6 days' PRECEDING`，否则"7 行"≠"7 天"。
- *"要排除当前行（只看过去）？"* → 帧改 `… AND 1 PRECEDING`。
- *(staff)* 这是留存/LTV 累计 + 异常检测（滚动均值±kσ）的底座。

### [sql-15] [LeetCode 569 风格] 各部门工资中位数
> 共享技巧：**无内建中位数时用双向 ROW_NUMBER 夹中**。schema：`employee(id, dept, salary)`
**要点**
```sql
-- 引擎支持时最简：
SELECT dept, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary
FROM employee GROUP BY dept;

-- 通用（无 PERCENTILE）：升降序名次夹出中间 1~2 行求平均
WITH r AS (
  SELECT dept, salary,
         ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary)      AS rn_asc,
         ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn_desc
  FROM employee
)
SELECT dept, AVG(salary) AS median_salary
FROM r
WHERE rn_asc IN (rn_desc, rn_desc - 1, rn_desc + 1)   -- 奇数取中1行、偶数取中2行
GROUP BY dept;
```
- 思路：升序/降序名次"夹"出中位位置——`|rn_asc - rn_desc| ≤ 1` 的行即中间 1（奇）或 2（偶）个，平均即中位数。

**深挖追问**
- *"为什么 `rn_asc IN (rn_desc, rn_desc±1)` 能同时处理奇偶？"* → 奇数中位行 rn_asc=rn_desc；偶数两中间行差 1 → 取平均。
- *"重复薪资影响吗？"* → ROW_NUMBER 强制唯一名次仍正确夹中；PERCENTILE_CONT 会插值，二者口径略不同先说明。
- *(staff)* 大表中位数贵 → 近似分位（t-digest）/预聚合；报指标多用 p50/p90（抗偏态）而非均值。

### [sql-16] [LeetCode 601] 体育馆连续 ≥3 天人数 ≥100（hard）
> 共享技巧：**gaps-and-islands 变体**——先按阈值过滤，再 `id - ROW_NUMBER` 分组、组长 ≥3。schema：`stadium(id, visit_date, people)`
**要点**
```sql
WITH ok AS (                       -- 先留人数 >=100 的日子
  SELECT id, visit_date, people FROM stadium WHERE people >= 100
),
grp AS (                           -- 连续 id 的差值在同段里恒定
  SELECT *, id - ROW_NUMBER() OVER (ORDER BY id) AS g FROM ok
)
SELECT id, visit_date, people
FROM grp
WHERE g IN (SELECT g FROM grp GROUP BY g HAVING COUNT(*) >= 3)
ORDER BY visit_date;
```
- 思路：过滤达标行后，连续 id 段里 `id - row_number` 恒定 → 作分组键；组内行数 ≥3 即"连续 ≥3 天"。

**深挖追问**
- *"过滤后还能用 id 连续判断的前提？"* → 这里"连续"按 id（题设 id 随日递增）；若按真实日历连续，要用 `visit_date - (row_number 天)` 做岛。先确认"连续"是 id 还是日历日。
- *"≥K 天通用？"* → `HAVING COUNT(*) >= K`。
- *(staff)* 是 sql-03 连续登录的"带阈值过滤"升级版；脏数据（重复日期）先规整再做岛。

### [sql-17] [LeetCode 262] Trips 取消率（指定日期、排除被封禁用户）
> 共享技巧：**条件聚合算比率** + 多次 join 过滤角色/状态。schema：`trips(id, client_id, driver_id, status, request_date)`、`users(users_id, banned, role)`
**要点**
```sql
SELECT t.request_date,
       ROUND(
         SUM(CASE WHEN t.status LIKE 'cancelled%' THEN 1 ELSE 0 END)::numeric
         / COUNT(*), 2) AS cancellation_rate
FROM trips t
JOIN users c ON c.users_id = t.client_id AND c.banned = 'No'
JOIN users d ON d.users_id = t.driver_id AND d.banned = 'No'
WHERE t.request_date BETWEEN DATE '2013-10-01' AND DATE '2013-10-03'
GROUP BY t.request_date;
```
- 思路：join 两次 users 把"双方都未封禁"过滤掉；取消率 = 取消单 / 总单（条件 SUM / COUNT），按天 GROUP BY。两种取消都算 → `LIKE 'cancelled%'`。

**深挖追问**
- *"为什么 join 两次 users？"* → client 和 driver 各要校验 banned，一次只能验一方。
- *"比率为什么先转 numeric/float？"* → 整数除法截断成 0；显式转浮点再 ROUND。
- *(staff)* 取消率是 marketplace 健康核心；要分用户侧/供给侧归因 + 控制混杂（地区/时段）再比，别看总体率下结论。

### [sql-18] [ads/feed 业务] DAU / WAU / MAU 粘性（滚动窗口去重活跃）
> 共享技巧：**滚动窗口内 DISTINCT 计数**（多数引擎不支持 distinct 窗口 → 相关子查询）。schema：`activity(user_id, activity_date)`
**要点**
```sql
WITH d AS (SELECT DISTINCT user_id, activity_date FROM activity)
SELECT a.activity_date,
       COUNT(DISTINCT a.user_id) AS dau,
       (SELECT COUNT(DISTINCT b.user_id) FROM d b
        WHERE b.activity_date BETWEEN a.activity_date - INTERVAL '6 days'  AND a.activity_date) AS wau,
       (SELECT COUNT(DISTINCT b.user_id) FROM d b
        WHERE b.activity_date BETWEEN a.activity_date - INTERVAL '27 days' AND a.activity_date) AS mau
FROM d a
GROUP BY a.activity_date
ORDER BY a.activity_date;
-- 粘性 stickiness = DAU / MAU
```
- 坑：WAU/MAU 是"窗口内**去重**活跃用户"而非"7×DAU"；普通 `COUNT(DISTINCT) OVER` 多数引擎不支持 → 用相关子查询按日期范围数 distinct。

**深挖追问**
- *"几亿行这样跑爆怎么办？"* → 预聚合到 user-day，再用 HLL 近似 distinct（`APPROX_COUNT_DISTINCT`）或增量维护窗口。
- *"WAU 要自然周还是滚动 7 天？"* → 口径不同（calendar vs rolling）；监控多用 rolling，先和业务确认。
- *(staff)* feed/ads engagement 北极星底座；进一步拆 new/retained/resurrected DAU（见 sql-19）讲增长。

### [sql-19] [增长会计] 月活的 新增 / 流失 / 留存（MoM new vs churned vs retained）
> 共享技巧：**跨期集合差**（相邻月自连接 + NULL 判方向）。schema：`monthly_active(user_id, month)`（已去重到 user-月）
**要点**
```sql
WITH cur AS (SELECT user_id, month FROM monthly_active)
-- retained（连续两月）/ new_or_resurrected（本月有、上月无）
SELECT c.month,
       CASE WHEN p.user_id IS NULL THEN 'new_or_resurrected' ELSE 'retained' END AS state,
       COUNT(*) AS users
FROM cur c
LEFT JOIN cur p
  ON p.user_id = c.user_id AND p.month = c.month - INTERVAL '1 month'
GROUP BY c.month, state;

-- churned（上月有、本月无）= 反方向 LEFT JOIN
SELECT p.month + INTERVAL '1 month' AS churn_month, COUNT(*) AS churned
FROM cur p
LEFT JOIN cur c ON c.user_id = p.user_id AND c.month = p.month + INTERVAL '1 month'
WHERE c.user_id IS NULL
GROUP BY p.month;
```
- 思路：本月∩上月 = retained；本月−上月 = new/resurrected；上月−本月 = churned。用相邻月自连接 + `IS NULL` 判方向。

**深挖追问**
- *"new 和 resurrected 怎么分？"* → resurrected = 本月有、上月无但**更早曾活跃** → 再 join 历史首活月，区分史上首次（new）vs 回流。
- *"为什么不用 LAG？"* → 活跃是"集合存在性"不是每行一值；自连接相邻月更直接（LAG 适合连续时间序列指标）。
- *(staff)* new/churned/resurrected/retained 分解 = 增长会计核心，把"MAU 涨了"拆成可行动的驱动。

### [sql-20] [ads measurement 业务] campaign 的 CTR / ROAS / 当日花费占比 / 排名
> 共享技巧：**比率必须分子分母分开 SUM 再除（防 Simpson）** + 窗口套聚合。schema：`ad_perf(campaign_id, day, impressions, clicks, spend, revenue)`
**要点**
```sql
SELECT
  campaign_id, day,
  SUM(clicks)::numeric  / NULLIF(SUM(impressions),0)          AS ctr,
  SUM(revenue)::numeric / NULLIF(SUM(spend),0)                AS roas,
  SUM(spend) / SUM(SUM(spend)) OVER (PARTITION BY day)        AS spend_share_of_day,
  RANK() OVER (PARTITION BY day ORDER BY SUM(spend) DESC)     AS spend_rank_in_day
FROM ad_perf
GROUP BY campaign_id, day;
```
- 关键：CTR/ROAS 是比率 → **先各自 SUM 再相除**（绝不行级算比率再平均 → Simpson）；`NULLIF(…,0)` 防除零；`SUM(SUM(spend)) OVER(PARTITION BY day)` = 聚合后再开窗（GROUP BY 后合法），算当日总花费做分母。

**深挖追问**
- *"为什么不能 `AVG(行级 CTR)`？"* → 各行曝光不同，等权平均被小曝光行带偏（Simpson）→ 必须曝光加权 `SUM(clicks)/SUM(impr)`。
- *"ROAS 绝对值能说明 campaign 增量价值吗？"* → 不能，含自然转化被归因到广告 → 要 incrementality / geo holdout 才是因果 ROAS（measurement 场景核心）。
- *"`SUM(SUM())` 窗口套聚合为什么合法？"* → GROUP BY 后每组一行，外层窗口在这些聚合行上再算；很多人不知能这么写。
- *(staff)* 把它讲成"日常监控 campaign 健康 + 抓异常花费"，并主动提因果口径 = 和因果/measurement 面试官同频。

## Python（LeetCode 算法 + pandas）

> 为 DS coding / 算法轮 + 通用准备：每题给**完整可对照代码 + 复杂度**。先自己写、再对解。前 9 题 = LeetCode 高频算法模板（哈希/双指针/滑窗/DP/栈/二分/堆/区间）；py-10~12 = pandas + DS 模拟（更贴日常）。

### [py-01] [LeetCode 1] Two Sum：数组里找两数之和 = target，返回下标
> 共享技巧：**哈希表换空间省时间**，O(n)。
**要点**
```python
def two_sum(nums, target):
    seen = {}                          # value -> index
    for i, x in enumerate(nums):
        if target - x in seen:         # 边走边查"还差的补数"
            return [seen[target - x], i]
        seen[x] = i
    return []
```
- O(n) 时间 / O(n) 空间，胜过暴力两重循环 O(n²)。

**深挖追问**
- *"有重复值 / 要返回所有组合？"* → 哈希存 `value → [indices]`；要去重组合则排序 + 两指针。
- *"数组已排序？"* → 改两指针 O(1) 空间（左右夹逼）。
- *(staff)* 讲清时间/空间权衡，能口述哈希查均摊 O(1)。

### [py-02] [LeetCode 242/49] 有效字母异位词 & 异位词分组
> 共享技巧：**Counter / 排序当 key**。
**要点**
```python
from collections import Counter, defaultdict

def is_anagram(s, t):
    return Counter(s) == Counter(t)            # O(n)

def group_anagrams(words):
    groups = defaultdict(list)
    for w in words:
        key = tuple(sorted(w))                 # 或用 26 长度的字符计数元组
        groups[key].append(w)
    return list(groups.values())
```
- 异位词 ⇔ 字符多重集相同 → Counter 比较；分组用"排序后的串"或"字符计数"当 dict key。

**深挖追问**
- *"sorted key O(k log k) vs 计数 key O(k)？"* → 大量长词用 26 维计数元组当 key 更快。
- *"大小写 / Unicode / 空格怎么规整？"* → 先 `casefold()` + 去空白再比。
- *(staff)* defaultdict/Counter 是数据清洗高频工具，能讲 hash key 设计。

### [py-03] [LeetCode 3] 无重复字符的最长子串
> 共享技巧：**可变滑动窗口 + 哈希记录最近位置**。
**要点**
```python
def length_of_longest_substring(s):
    last = {}              # char -> 最近出现下标
    start = 0              # 当前窗口左端
    best = 0
    for i, c in enumerate(s):
        if c in last and last[c] >= start:
            start = last[c] + 1        # 重复且仍在窗口内 → 左端跳到其下一位
        last[c] = i
        best = max(best, i - start + 1)
    return best
```
- 右指针扩窗、遇窗口内重复就收缩左端；O(n)。

**深挖追问**
- *"为什么判 `last[c] >= start`？"* → 只有重复字符**仍在当前窗口内**才需收缩，否则是窗口外的旧记录。
- *"最多含 K 个不同字符 / 要返回子串本身？"* → 窗口内维护 Counter，超 K 收缩；记录 start/end 切片返回。
- *(staff)* 可变窗口模板可迁移到"最长满足条件子数组"一类。

### [py-04] [LeetCode 53] 最大子数组和（Kadane）
> 共享技巧：**一维 DP/贪心**：要么接上前缀、要么从我重开。
**要点**
```python
def max_subarray(nums):
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)     # 接上前面 or 从 x 重新开始
        best = max(best, cur)
    return best
```
- `cur` = 以当前元素结尾的最大和；负前缀就丢弃重开。O(n) 时间 / O(1) 空间。

**深挖追问**
- *"要返回子数组起止下标？"* → 在 `cur=x`（重开）时记 start，更新 best 时记 end。
- *"全是负数？"* → 初始化 `best=cur=nums[0]`（**别**初始化为 0）才能返回最大单元素。
- *"最大乘积子数组怎么变？"* → 同时维护当前 min（负负得正）。
- *(staff)* 能口述"贪心=DP"（最优子结构）。

### [py-05] [LeetCode 56] 合并区间
> 共享技巧：**排序后线性扫描合并重叠**——与 SQL sessionization 同源。
**要点**
```python
def merge(intervals):
    intervals.sort(key=lambda x: x[0])       # 按起点排序
    out = []
    for s, e in intervals:
        if out and s <= out[-1][1]:          # 与上一区间重叠
            out[-1][1] = max(out[-1][1], e)  # 合并，终点取较大
        else:
            out.append([s, e])
    return out
```
- O(n log n)（排序主导）。

**深挖追问**
- *"端点相接（s == prev_e）算重叠吗？"* → 业务定义；相接合并用 `≤`，严格重叠用 `<`。先确认。
- *"和会话切分什么关系？"* → 同构：把用户活动区间合并成 session（对应 sql-03 / py-11）。
- *(staff)* 区间问题先排序是通法；联系"合并重叠时段防重复计时"。

### [py-06] [LeetCode 347] 前 K 个高频元素
> 共享技巧：**Counter + 堆**（或桶排序 O(n)）。
**要点**
```python
from collections import Counter
import heapq

def top_k_frequent(nums, k):
    cnt = Counter(nums)
    return [x for x, _ in heapq.nlargest(k, cnt.items(), key=lambda kv: kv[1])]
    # O(n log k)；要 O(n) 用桶排序：按频次放进 len(nums)+1 个桶，从高频桶往回取
```

**深挖追问**
- *"k 接近 n 时堆还划算吗？"* → 不一定；桶排序 O(n) 更稳（频次范围有限）。
- *"频次并列怎么 tie-break？"* → 自定义 key（再按值），先问想要的顺序。
- *(staff)* top-k 是推荐/热榜高频；流式场景用 count-min sketch + 堆近似。

### [py-07] [LeetCode 704/278] 二分查找 & 第一个错误版本
> 共享技巧：**二分边界**——闭区间精确查找 vs 边界二分。
**要点**
```python
def binary_search(nums, target):           # 找具体值：闭区间 lo<=hi
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2           # 防溢出取中
        if nums[mid] == target: return mid
        elif nums[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1

def first_bad_version(n, is_bad):          # 找"第一个 True"：边界二分 lo<hi
    lo, hi = 1, n
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if is_bad(mid): hi = mid           # mid 可能是答案 → 收右界但保留 mid
        else: lo = mid + 1
    return lo
```

**深挖追问**
- *"`lo<=hi` 和 `lo<hi` 何时用哪个？"* → 找具体值用前者；找边界/插入位用后者，关键在 hi 是否可能是答案。
- *"`(lo+hi)//2` 有何坑？"* → 大数溢出（别的语言）；写 `lo+(hi-lo)//2` 更稳。
- *(staff)* 二分能套"找满足阈值的最小参数"（最小样本量、容量规划）。

### [py-08] [LeetCode 70] 爬楼梯 / 斐波那契（DP 入门 + 空间优化）
**要点**
```python
def climb_stairs(n):
    a, b = 1, 1               # f(0)=1, f(1)=1
    for _ in range(n):
        a, b = b, a + b       # 滚动，只存最近两项
    return a                  # f(n)
```
- `f(n)=f(n-1)+f(n-2)`；两个变量滚动把 O(n) 空间降到 O(1)。

**深挖追问**
- *"和斐波那契一样吗？"* → 同一递推，区别只在初值。
- *"每次可走 1/2/3 步？"* → 三项滚动 `f(n)=f(n-1)+f(n-2)+f(n-3)`。
- *(staff)* 讲清 DP 三要素（状态/转移/初值）+ 何时能空间优化（只依赖最近常数项）。

### [py-09] [LeetCode 20] 有效的括号（栈）
**要点**
```python
def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for c in s:
        if c in pairs:                                  # 右括号
            if not stack or stack.pop() != pairs[c]:
                return False
        else:                                           # 左括号入栈
            stack.append(c)
    return not stack                                    # 栈空才完全匹配
```
- O(n)。

**深挖追问**
- *"右括号时栈空为什么 False？"* → 没有可匹配的左括号（如 `")("`）。
- *"含其它字符 / 求最长有效括号？"* → 跳过非括号；最长有效是 DP/栈进阶。
- *(staff)* 栈是嵌套结构解析通法（联系 SQL/JSON 解析）。

### [py-10] [pandas] 两表聚合算指标：各 campaign 的 ROAS + 当日花费占比 + 排名
> 共享技巧：**groupby agg + transform 占比 + rank**；与 sql-20 同题不同工具。
**要点**
```python
import pandas as pd
# perf: campaign_id, day, impressions, clicks, spend, revenue
g = (perf.groupby(['day', 'campaign_id'], as_index=False)
          .agg(spend=('spend','sum'), revenue=('revenue','sum'),
               clicks=('clicks','sum'), impr=('impressions','sum')))
g['ctr']  = g['clicks']  / g['impr'].replace(0, pd.NA)     # 比率分子分母分开 sum 再除
g['roas'] = g['revenue'] / g['spend'].replace(0, pd.NA)
g['spend_share'] = g['spend'] / g.groupby('day')['spend'].transform('sum')  # 组内总和广播回行级
g['spend_rank']  = g.groupby('day')['spend'].rank(ascending=False, method='min')
```

**深挖追问**
- *"为什么用 `transform('sum')` 而不是 agg 再 merge？"* → transform 保持原行数、自动对齐回去，省一次 merge；agg 会塌缩成每组一行。
- *"除零 / 缺失怎么处理？"* → `.replace(0, NA)` 或 `np.where`，别让 inf 污染下游。
- *(staff)* 讲 pandas vs SQL 取舍：探索/可视化用 pandas，生产管线落 SQL/仓库。

### [py-11] [pandas] 每用户首单 cohort 的 D1 留存 + 7 日滚动均值
> 共享技巧：**`transform('min')` 定 cohort + nunique 去重 + rolling**；sql-01 留存的 pandas 版。
**要点**
```python
import pandas as pd
# events: user_id, date(datetime)
ev = events.sort_values(['user_id', 'date'])
ev['d0'] = ev.groupby('user_id')['date'].transform('min')       # 每用户首活日 = cohort
ev['offset'] = (ev['date'] - ev['d0']).dt.days
cohort_size = ev.groupby('d0')['user_id'].nunique()
d1_users    = ev[ev['offset'] == 1].groupby('d0')['user_id'].nunique()
retention_d1 = (d1_users / cohort_size).fillna(0)

daily = events.groupby('date').size().rename('cnt').to_frame()  # 时间序列滚动
daily['roll7'] = daily['cnt'].rolling(7, min_periods=1).mean()
```

**深挖追问**
- *"rolling 按'行'还是按'天'？有缺失日期怎么办？"* → `rolling(7)` 是 7 行；真 7 天先 `reindex`/`asfreq('D')` 补齐日期，或用 `rolling('7D', on='date')`。
- *"cohort 留存为什么用 `nunique` 不是 `count`？"* → 同用户一天可能多行，留存看"是否有该用户"必须去重。
- *(staff)* 能讲 cohort 三角矩阵（`pivot_table(index=d0, columns=offset)`）。

### [py-12] [DS coding] 加权随机抽样 + bootstrap 置信区间（numpy）
> 共享技巧：DS 岗常考"用代码实现统计"——抽样、模拟、CI。
**要点**
```python
import numpy as np

def weighted_sample(items, weights, k, rng=np.random.default_rng(0)):
    p = np.asarray(weights, float); p /= p.sum()         # 归一化权重
    return rng.choice(items, size=k, replace=False, p=p)

def bootstrap_mean_ci(data, n_boot=10000, alpha=0.05, rng=np.random.default_rng(0)):
    data = np.asarray(data, float)
    # 有放回重采样 n_boot 次、每次算均值
    means = rng.choice(data, size=(n_boot, len(data)), replace=True).mean(axis=1)
    lo, hi = np.percentile(means, [100*alpha/2, 100*(1-alpha/2)])
    return data.mean(), (lo, hi)
```

**深挖追问**
- *"bootstrap CI vs t 检验 CI 何时用？"* → 分布偏态/统计量复杂（中位数、比率、AUC）用 bootstrap；近正态均值用解析 t-CI 更快。
- *"无放回加权抽样 k 很大时慢？"* → reservoir / Gumbel-top-k trick；先问数据规模。
- *(staff)* 接到实验：bootstrap 比率指标 CI、cluster bootstrap 处理用户内相关——贴近实验/measurement 场景。

### [py-13] [LeetCode 200] 岛屿数量（grid DFS/BFS 连通分量）
**要点**
```python
def num_islands(grid):
    if not grid: return 0
    R, C = len(grid), len(grid[0])
    def sink(r, c):
        if 0 <= r < R and 0 <= c < C and grid[r][c] == '1':
            grid[r][c] = '0'                       # 标记已访问（淹掉）
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                sink(r+dr, c+dc)
    count = 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == '1':
                count += 1; sink(r, c)             # 每个新陆地块 = 一个岛
    return count
```
- 遍历网格，遇未访问陆地就 +1 并 DFS 淹掉整块（连通分量计数）。O(R·C)。

**深挖追问**
- *"大网格递归栈溢出？"* → 改迭代 BFS（队列）或显式栈。
- *"不能改输入 grid？"* → 用 visited 集合替代原地标记。
- *"求最大岛面积 / 周长？"* → DFS 返回计数；周长在水边/边界 +1。
- *(staff)* 连通分量是图/聚类基础（联系用户-设备图连通、社区发现）。

### [py-14] [LeetCode 102] 二叉树层序遍历（BFS）
**要点**
```python
from collections import deque
def level_order(root):
    if not root: return []
    out, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):           # 锁定本层大小，逐层出队
            node = q.popleft()
            level.append(node.val)
            if node.left:  q.append(node.left)
            if node.right: q.append(node.right)
        out.append(level)
    return out
```
- 队列 BFS，每轮固定 `len(q)` 出完一整层。O(n)。

**深挖追问**
- *"为什么先存 `len(q)`？"* → 锁定当前层节点数，避免把下一层混进来。
- *"DFS 能层序吗？"* → 能，带 depth 参数往对应层 append。
- *"zigzag / 右视图？"* → 偶数层 reverse；右视图取每层最后一个。
- *(staff)* BFS 模板可迁移到无权图最短路、层级展开。

### [py-15] [LeetCode 72] 编辑距离（2D DP）
**要点**
```python
def edit_distance(a, b):
    m, n = len(a), len(b)
    dp = [[0]*(n+1) for _ in range(m+1)]
    for i in range(m+1): dp[i][0] = i        # 删 i 个
    for j in range(n+1): dp[0][j] = j        # 插 j 个
    for i in range(1, m+1):
        for j in range(1, n+1):
            if a[i-1] == b[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j],     # 删
                                   dp[i][j-1],     # 插
                                   dp[i-1][j-1])   # 替
    return dp[m][n]
```
- `dp[i][j]` = a 前 i 与 b 前 j 的最小编辑距离。O(mn) 时间/空间（可滚动到 O(n)）。

**深挖追问**
- *"三个转移对应什么操作？"* → 删 a[i] / 插 b[j] / 替换；相等则继承对角。
- *"空间优化？"* → 只依赖上一行 → 滚动两行 O(n)。
- *"要还原编辑路径？"* → 回溯 dp 表记录每步选择。
- *(staff)* 2D DP 母题（联系 LCS、序列比对、模糊去重）。

### [py-16] [LeetCode 322] 零钱兑换（完全背包 DP）
**要点**
```python
def coin_change(coins, amount):
    INF = amount + 1
    dp = [0] + [INF]*amount              # dp[x] = 凑 x 的最少硬币数
    for x in range(1, amount+1):
        for c in coins:
            if c <= x:
                dp[x] = min(dp[x], dp[x-c] + 1)
    return dp[amount] if dp[amount] != INF else -1
```
- `dp[x]` = 凑出金额 x 的最少硬币数，硬币可重复（完全背包）。O(amount·#coins)。

**深挖追问**
- *"求'组合数'而非'最少个数'两层顺序？"* → 组合数要外层 coins、内层金额（避免重复计组合）；最少个数两序皆可。
- *"凑不出返回？"* → INF 哨兵判 -1。
- *"硬币有限（01 背包）？"* → 金额维度逆序遍历防重复取。
- *(staff)* 背包 DP 母题（联系预算分配、resource packing）。

### [py-17] [pandas] 时间序列对齐：merge_asof 最近匹配 + 重采样 + 滚动相关
> 共享技巧：**merge_asof**（按时间最近 join、不等值）+ `resample` + `rolling.corr`。
**要点**
```python
import pandas as pd
# 把曝光事件 join 到"之前最近一次"出价快照（不等值时间 join）
imp = imp.sort_values('ts'); bid = bid.sort_values('ts')
joined = pd.merge_asof(imp, bid, on='ts', by='campaign_id', direction='backward')

# 按天重采样 + 7 日滚动两序列相关（spend vs conversions）
daily = (df.set_index('ts').groupby('campaign_id')
           .resample('D')[['spend','conversions']].sum().reset_index())
daily['roll_corr'] = (daily.groupby('campaign_id')
    .apply(lambda g: g['spend'].rolling(7).corr(g['conversions']))
    .reset_index(level=0, drop=True))
```
- `merge_asof` = 按排序时间的"最近匹配"join（日志对齐快照利器）；`resample('D')` 规整日频；`rolling.corr` 看滚动相关。

**深挖追问**
- *"merge_asof 的 direction / tolerance？"* → backward/forward/nearest + `tolerance=pd.Timedelta('1h')` 限制最大匹配间隔。
- *"为什么不用普通 merge？"* → 时间戳几乎不精确相等；asof 取"之前最近一条"。
- *"resample 有空洞？"* → 缺失日补 0 / ffill，按指标语义选。
- *(staff)* 日志-快照对齐 + 滚动统计是归因/异常检测常见前处理。

## 统计与实验

### [se-01] 设计 A/B 测"结账按钮从蓝改绿是否提升转化"——样本量、时长、指标、坑全讲
**要点**
- **澄清**：转化定义？基线 p？预期效应（MDE）？流量多大？
- **样本量**：16 法则 `n/组 ≈ 16·p(1−p)/Δ²`（α=.05 双侧、power 80%）。现场代数：p=10%、MDE=1pp → 每组 ~1.44 万。
- **时长**：≥1–2 个完整业务周期（周内效应）；不提前偷看（peeking）。
- **指标**：主=结账转化率；护栏=收入/单、退款、页面报错、延迟；诊断=点击率分步漏斗。
- **坑**：SRM 检查、novelty effect、多设备同用户、分流单位=用户而非 session。
- 参考：[功效·方差](stats-experimentation/cheatsheet-power-variance.md) · [A/B 坑](stats-experimentation/cheatsheet-abtest-pitfalls.md)

### [se-02] 实验只有 +0.3% lift、p=0.04，要不要 ship？
**要点**
- 显著 ≠ 重要：先问 **0.3% 值多少钱**（×受众×年化）vs 实现/维护成本。
- 检查：power 是否够（效应小→可能就是真小）；CI 宽度；护栏有没有掉；分段有没有反向（Simpson）。
- 长期：novelty/primacy？可做 holdback 验证持续性。
- 决策框架收尾：value > cost 且护栏干净 → ship；否则迭代或放弃。"带着预估金额去和 PM 对齐"——回到业务。

### [se-03] 要测一个有网络效应的功能（如群聊邀请），普通 A/B 为什么偏？怎么设计？
**要点**
- **SUTVA 破坏**：treatment 用户影响 control 用户（邀请跨组）→ 效应被稀释/污染，常**低估**。
- 设计：**cluster randomization**（按社交圈/地理分桶）、**switchback**（时间片轮换，适合 marketplace）、graph cluster、或 ego-cluster。
- trade-off：cluster 减少有效样本量（ICC↑ → 方差↑）→ 需要更大规模或更长时间。
- 参考：[因果 cheatsheet](stats-experimentation/cheatsheet-causal-inference.md)

### [se-04] 没法随机化（如定价），怎么估因果效应？PSM/DiD/RDD 怎么选？
**要点**
- **DiD**：有干预前后 + 可比对照组（平行趋势假设，要画 pre-trend 验证）。
- **PSM**：观测混杂可建模（unconfoundedness），按倾向分匹配；坑=未观测混杂、common support。
- **RDD**：有清晰阈值规则（如满 $35 免运费）→ 阈值附近局部随机；坑=只识别局部效应、操纵阈值。
- 选择逻辑一句话：有时间维度对照→DiD；有阈值→RDD；都没有但混杂可观测→PSM/加权。各配 1 个工作实例。

### [se-05] "Can bootstrap reduce variance?" + ratio 指标怎么算方差
**要点**
- **不能**。bootstrap 是**估计**统计量抽样分布/方差的工具，不改变估计量本身的方差。能"降方差"的是 CUPED、分层、回归调整等。
- ratio 指标（如人均收入，分流单位=用户但指标=session 级）：用 **delta method** 近似方差，或对用户级聚合后再算；直接按 session 算会**低估方差**（相关性）。
- 加分：主动讲 CUPED——用实验前协变量回归调整，方差降 ~30–50%，等价于更小样本量。

### [se-06] 实验跑到一半看着显著了，能停吗？（peeking）
**要点**
- 不能按固定样本量检验反复看——**第一类错误膨胀**（看 5 次 α≈14%）。
- 正确做法：① 预定样本量跑满；② 要提前停 → **sequential testing**（O'Brien-Fleming、mSPRT、always-valid p）；③ 平台层面给 always-valid CI。
- 顺带讲 SRM：每次看数据先查分流比例 χ²，SRM 说明分流坏了，结果全不可信。

### [se-07] PSM、DiD、mixed model 各 2 分钟口述（怎么用 + 适用 + 陷阱）
练熟到能在白板边画边讲。
**要点**
- 每个按四段式：**场景 → 假设 → 步骤 → 陷阱**。
- PSM：估倾向分→匹配/加权→平衡性检查（SMD<0.1）→敏感性分析。陷阱：未观测混杂。
- DiD：平行趋势图→双重差分回归（含个体/时间 FE）→event study 验证。陷阱：treatment 时点异质、spillover。
- mixed model：重复测量/分组数据，fixed effect=感兴趣的均值效应，random effect=组间异质（如用户/市场随机截距）。何时用：纵向数据、cluster 内相关。
- 参考：[因果 cheatsheet](stats-experimentation/cheatsheet-causal-inference.md) 二节

### [se-08] 什么时候不该做实验？不可行时的替代方案
**要点**
- 不该/不能：伦理或品牌风险（涨价、宕机）、网络效应全局功能、样本太少/效应太慢（年留存）、不可逆动作。
- 替代梯队：准实验（DiD/RDD/合成控制）→ 观测因果（PSM/IV）→ holdout 市场（geo test/MMM 校准）→ 前后对比+时序模型（最弱，讲明置信度低）。
- 举一个你熟悉领域的例子（如广告增量测量里 holdout/geo 实验与 MMM 互相校准）。

### [se-09] Attribution 和 incrementality 有什么区别？为什么 last-click 会高估广告？
**要点**
- **attribution = 给已发生的转化分信用**（last/first/linear/data-driven Shapley/Markov）——全是**相关性分配**，不回答「这笔转化本来会不会发生」。
- **incrementality = 因果增量** = treated 转化率 − holdout 转化率；只有它告诉你哪些转化是广告**真正带来的**。
- last-click 高估机制：广告**专挑本来就最可能转化的人**投（selection bias）→ 把「本来就会买」的人算成广告功劳。
- 钩子句：*"Attribution measures correlation, incrementality measures causation."* 真理 = holdout / PSA / ghost ads。
- 参考：[因果速学 Part 3](stats-experimentation/study-causal-from-experiments.md)

### [se-10] 没法跑 holdout 时怎么测广告增量？MMM 什么时候可信？
**要点**
- 梯队：**geo / matched-market 实验**（按城市随机，cluster randomization）→ 观测因果（PSM/IPW on exposure，讲 unconfoundedness 风险）→ **MMM** → 最后 pre/post+时序（最弱）。每层报假设+不确定性。
- **MMM**：top-down 回归 `sales ~ Σ channel spend`，含 **adstock**（滞后衰减）+ **saturation**（边际递减）。优点=隐私友好/全渠道/做预算分配；缺点=**相关性非因果**（共线性、季节混杂、低频数据）。
- 现代做法：**用实验/geo-test 校准 MMM 先验**（如 Robyn、Meridian 等开源框架）→ 二者互补不替代。
- 诚实口径：以 experiment-based incrementality 为主；MMM 理解其结构与局限，不单独信未校准的 MMM。
- 参考：[因果速学 Part 3.3](stats-experimentation/study-causal-from-experiments.md)

## 产品 Sense

### [ps-01] 为一个短视频信息流产品定义成功指标
**要点**
- 套路：**澄清范围 → 业务目标 → 北极星+驱动+护栏 → 取舍**（[范答](product-sense/practice-define-metrics.md)）。
- 北极星：**满意观看时长/用户**（裸 watch time 会被刷——看完率/long-click/survey 加权）。
- 驱动：DAU、人均 session、完成率、推荐 CTR（配点击后满意）、D7/D30 留存、**创作者侧供给**（多边飞轮）。
- 护栏：举报/踩、regretted watch、对长视频/Feed 的 cannibalization、延迟。
- 取舍：短期时长 vs 长期留存；别忘了说"会被操纵的指标不配当北极星"。

### [ps-02] 某外卖配送平台某城市的配送时长变长了，怎么诊断？
**要点**
- 先**澄清+量化**：多长？多久了？突变还是渐变？（突变→找 event；渐变→找 mix shift）
- **拆解漏斗**：下单→商家接单→出餐→骑手接单→取餐→送达，定位哪段变长。
- **供需**：骑手在线时长/订单比（供给不足最常见）、天气/大促/新区扩张。
- **mix shift**：订单构成变化（远距离/大单/新商家占比）——总量恶化可能每段都没变（Simpson）。
- 收尾给行动：短期调度/定价杠杆，长期供给运营；附监控指标。
- 参考：[ratio 诊断 7 步](product-sense/diagnose-ratio-metric.md) · [marketplace 指标](product-sense/cheatsheet-marketplace-metrics.md)

### [ps-03] 某 ratio 指标掉了 5%，结构化排查
**要点**
- 7 步框架：**①澄清定义/幅度/时点 → ②数据质量（logging/管道先排除）→ ③分子还是分母动了 → ④内部 mix shift（Simpson）→ ⑤分段定位（平台/地区/新老用户/渠道）→ ⑥外部事件（发版/节假日/竞品/政策）→ ⑦量化归因+建议**。
- 关键 move：分母涨也会让 ratio 掉（新用户涌入稀释）——**先问分子分母**，面试官就在等这个。
- 参考：[diagnose-ratio-metric](product-sense/diagnose-ratio-metric.md)（含 3 题范答）

### [ps-04] 该不该给一个网约车平台上线"拼车/合乘"功能？用数据论证
**要点**
- 框架：**目标（谁的价值）→ 机会规模 → 实验设计 → 指标体系 → 取舍建议**。
- 三边影响：乘客（便宜 vs 时长↑）、司机（单价↓ vs 利用率↑）、平台（单均毛利 vs 总单量、供给效率）。
- 实验：**switchback/城市级**（拼车改变 marketplace 动态，用户级 A/B 会偏）。
- 指标：完成单量、每司机小时收入、乘客等待/绕路时长、留存；护栏=取消率、评分。
- 取舍收尾：低密度城市可能负向——分城市推。

### [ps-05] 怎么衡量"推送通知"的价值且不惹恼用户？
**要点**
- **增量**：holdout 不发组（长期 holdout 测累计效应），别用打开率自嗨——打开≠增量活跃。
- 价值=带来的**增量 DAU/转化**；成本=**关推送率、卸载率、通知疲劳**（护栏）。
- 频控实验找边际拐点：第 N 条通知的边际增量 vs 边际退订。
- 加分：通知是"借未来的留存"——看 30/60 天 LTV 级影响而不是当日 CTR。

### [ps-06] 为一个新 AI 功能（AI 客服/AI 摘要）定义成功与风险指标
**要点**
- 成功：**任务完成率/解决率**（非用量虚荣指标）、采纳率、edit distance/接受率（生成质量行为代理）、节省时长、CSAT。
- 质量评估：**LLM-as-judge + 人工抽检**双轨、golden set 回归；线上 A/B 看业务终点指标。
- 风险/护栏：幻觉率/事实错误投诉、升级人工率、延迟与成本（$/会话）、安全违规。
- 若有相关经验：用一句话举例你怎么定 acceptance / 质量指标（很加分）。

### [ps-07] 两边 marketplace（外卖 / 短租 / 网约车这类）的指标体系怎么搭？
**要点**
- 三层：**需求侧**（MAU、转化、频次、留存）/ **供给侧**（活跃供给、利用率、供给留存）/ **撮合健康**（匹配率、等待时长、fill rate、流动性）。
- 北极星=完成交易量（可持续口径，剔补贴）；**约束=供需平衡**——单侧优化必反噬。
- 经典问法变体：补贴该给哪边？→ 看哪侧是瓶颈（constrained side）+ 弹性。
- 参考：[marketplace cheatsheet](product-sense/cheatsheet-marketplace-metrics.md)

### [ps-08] 外卖平台上线会员订阅（月费，免配送费/折扣类），怎么衡量它表现好不好？
> 三边 marketplace 样板题。三方 = 消费者 / 商家 / 配送方（骑手）。
**要点**
- **先澄清**：目标 = retention？GOV？margin？看绝对值还是**增量**？哪个用户群？时间窗？
- **北极星**：订阅用户的**增量 GOV / 增量订单**（非绝对值——警惕选择偏差："本来就高频的人才会订"）。
- **支撑**：渗透率、续订/churn、订阅 vs 非订阅下单频次（**holdout / 倾向得分匹配去选择偏差**）、AOV、单位经济（补贴 vs 增量利润）。
- **三方护栏**：消费者体验 / 商家单量履约 / 配送方供给与 ETA——别一方受益、另两方受损。
- **测因果**：订阅 **holdout / geo(switchback) 实验**；看 **novelty** 是否长期衰减；查 **cannibalization**（给本就会下单的人发福利）。
- **建议 + tradeoff**：定价/权益调整 → 说清业务影响 + 网络效应/利润权衡。
- 框架：澄清 → 结构(三方+飞轮+单位经济) → 指标(北极星+护栏) → ≥2 假设 → 数据 → 实验/因果 → 建议+影响+tradeoff（全程 think out loud、像对话）。

## 行为面

### [bh-01] Tell me about yourself（TMAY，60–90 秒）
**要点**
- 三段式（在 [behavioral](behavioral/README.md) 里定稿）：现职定位（角色 + 方向，一句话）→ 2 个代表成就（量级脱敏口径）→ 为什么找下一站（成长/方向叙事）→ 为什么这家。
- 自查：≤90 秒、无内部代号、和简历数字一致。

### [bh-02] 一次用数据改变了 PM/领导的决定
**要点**
- 选一个"数据推翻直觉"的 STAR；结构：决策背景→你的分析（方法一句话）→ 关键证据 → 对方被什么说服 → 结果量化。
- 考点是 **influence**：突出"怎么讲给非技术人听"与 stakeholder 推进，不是炫技术。

### [bh-03] 一次失败/判断错了，怎么补救、学到什么
**要点**
- 选一个真失败 + 真教训，别"我太追求完美"那种假失败。
- 结构：错在哪（自己的判断，不甩锅）→ 发现信号 → 止损动作 → 制度化改进（之后怎么防）。

### [bh-04] 跨职能冲突 / 和 eng/PM 意见不合
**要点**
- 要点：先讲**对方立场的合理性** → 用数据/标准把分歧客观化 → 找共同目标收敛 → 关系结果（之后合作更顺）。
- 忌：说成"我对他错我赢了"。

### [bh-05] 模糊问题、没人给方向时你怎么做
**要点**
- 对标高级别（Staff/IC6）期望：**自己定义问题**——先收敛目标（和利益方对齐"成功长什么样"）→ 拆解可验证假设 → 快速 MVP 分析定方向 → 滚动汇报。
- 配实例：从 0 建标准/平台类项目最贴。

### [bh-06] 为什么离开现公司 / 为什么我们公司
**要点**
- 正向叙事：想把核心强项（某方法/某领域深度）带到新业务场景 + 该公司具体吸引点（产品/数据文化/岗位方向，**做功课点名**）。
- 不说：签证/身份等私人因素、政治、对现/前公司的负面评价。每家公司提前备一句定制版（[company-specific-prep](company-specific-prep.md)）。
