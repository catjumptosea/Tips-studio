# Tips Studio 字阶规范

> 基准：主字号 14px，建议行高 20px。所有新页面的字号、行高都应从下面这套字阶中选择，不要随手写新的 font-size / line-height。

## 字阶 Token

Token 已定义在 `src/index.css` 的 `:root` 中：

| Token | 字号 | 行高系数 | 实际行高 | 使用场景 |
| --- | --- | --- | --- | --- |
| `--text-2xs` / `--leading-2xs` | 12px | 1.3333 | 16px | 标签、版本号、眉、辅助说明、小表头 |
| `--text-xs` / `--leading-xs` | 13px | 1.3846 | 18px | 次要描述、列表辅助文字、表单帮助 |
| `--text-sm` / `--leading-sm` | 14px | 1.4286 | 20px | 正文、导航、按钮、输入框、字段标签（默认） |
| `--text-base` / `--leading-base` | 15px | 1.4667 | 22px | 紧凑正文、次级标题（预留给紧凑场景） |
| `--text-md` / `--leading-md` | 16px | 1.5 | 24px | 产品名、区块标题、卡片小标题 |
| `--text-lg` / `--leading-lg` | 18px | 1.4444 | 26px | 内容条目标题、结果面板标题 |
| `--text-xl` / `--leading-xl` | 20px | 1.4 | 28px | 内容页标题、抽屉标题、页面次标题 |
| `--text-2xl` / `--leading-2xl` | 24px | 1.3333 | 32px | 工作台大标题、章节大标题 |
| `--text-3xl` / `--leading-3xl` | 32px | 1.25 | 40px | 空状态大标题、高权重页面 Hero |

## 使用方式

写 CSS 时直接引用变量，字号和行高必须成对使用：

```css
.page-title {
  font-size: var(--text-2xl);
  line-height: var(--leading-2xl);
}
```

```css
.list-description {
  font-size: var(--text-xs);
  line-height: var(--leading-xs);
}
```

## 默认规则

- 默认正文使用 14px / 20px。
- 不要直接写与 token 不一致的 `font-size` / `line-height`。
- 字号和行高都使用 token，禁止出现 `font-size: 1.05rem; line-height: 1.35` 这类“一次性数字”。
- 常规页面标题控制在 20px / 28px 到 24px / 32px；移动端可下调一档，例如 24px -> 20px。
- 除品牌徽标、版本号等特殊场景外，正文不要低于 12px。
- `letter-spacing` 默认为 0，不要为正文引入负字距。

## 推荐层级

1. **页面主标题**：24px / 32px。
2. **区块标题**：18px / 26px 或 20px / 28px。
3. **正文 / 导航 / 字段**：14px / 20px。
4. **辅助信息 / 标签**：12px / 16px 或 13px / 18px。

## 维护规则

- 不要为了某个页面临时新增字号 token。
- 如果确实需要新字阶，先在 `index.css` 增加 token，再在文档中同步这一行。
- 新页面做完后，检查 computed style，确保实际渲染字号/行高不是临时值。
