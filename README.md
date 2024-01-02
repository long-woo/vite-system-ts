# vite-system-ts

Vite System HRM 插件，适用于 Single-SPA 架构。

## 使用

1.安装

```sh
pnpm add @loongwoo/vite-plugin-system-ts
```

2.修改 `vite.config.mts` 文件，添加如下代码：

```ts
// ...
# 导入插件
import systemTS from '@loongwoo/vite-plugin-system-ts';

# 添加插件
export default defineConfig({
    // 其他配置
    // ...
    plugins: [
        // 其他插件
        // ...
        systemTS()
    ]
})
```

3.在基座应用（root-config）的 `index.html`，添加引用：

```html
<script src="https://unpkg.com/@rollup/browser@4.9.0/dist/rollup.browser.js"></script>
<script src="/vite-system-ts.js"></script>
```
