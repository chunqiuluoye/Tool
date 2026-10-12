# Debug session: Tool blank page

Status: [OPEN]

## Symptoms
打开 F:\\yu\\github\\Tool 后网页显示空白。

## Hypotheses
1. 使用 file:// 直接打开 index.html，导致 ES module 加载失败。
2. public 目录中的脚本或资源不完整。
3. Node 服务未启动或端口异常。
4. 浏览器缓存或运行时脚本错误导致页面空白。

## Evidence
待收集。
