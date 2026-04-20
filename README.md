# CFTeleTrans (CTT) - Telegram消息转发分组对话机器人（基于Cloudflare）

这是一个基于Cloudflare Workers实现的Telegram消息转发分组对话机器人，代号 **CFTeleTrans (CTT)**，专注于将用户消息安全、高效地转发到后台群组，同时充分利用Cloudflare的免费额度（榨干CF大善人！）。该机器人支持用户验证、消息转发、频率限制、管理员管理等功能，适用于客服、社区管理等场景。

## 最近更新

### 2026.04.20

- 修复子话题中管理员命令识别问题，`/admin` 与 `/admin@机器人用户名` 均可正常呼出管理员面板，不会再被误转发给网友。
- 修复验证码消息重复删除导致的异常，验证失败、验证码过期后的旧按钮消息会更稳定地清理。
- 修复管理员面板重复呼出时旧面板不消失的问题，同一子话题中只保留最新一条管理员面板。
- 补充管理员面板作用范围说明：拉黑、解除拉黑、删除用户针对当前子话题绑定用户；验证码开关、用户 Raw 开关、黑名单查询为全局功能。

### 2025.05.17

- 优化，添加检测更新功能。
## 项目截图

以下是 CFTeleTrans 项目的截图： 

![CFTeleTrans 截图](https://awtc.pp.ua/ctt.png)

## 特点与亮点

1. **充分利用Cloudflare免费额度（榨干CF大善人！）**  
   - **CFTeleTrans (CTT)** 完全基于Cloudflare Workers部署，利用其免费额度（每天10万次请求，50次/分钟）实现高性能、低成本的机器人运行。
   - **使用Cloudflare D1存储用户状态和数据，免费额度（每天10万次读/写）足以支持中小规模用户群。**
   - 避免用别人的，受他人控制，（避免了突然植入广告，触不及防）该项目完全开源自己所有，可以自由修改代码的机器人
   - 零成本运行，适合个人开发者或小型团队，真正做到“榨干CF大善人”的免费资源！

2. **分组对话消息管理**  
   - 用户消息自动转发到后台群组的子论坛，别人私聊你机器人就如同添加了你好友，。
   - 群聊可多个号回复用户（只需将你的号拉进群并设置管理）
   - 置顶消息显示用户信息（昵称、用户名、UserID、发起时间）及通知内容
   - 每个用户独立一个分组，随时随地想聊就聊！
   - 可通过后台群组直接回复用户消息，消息会转发到用户私聊。
  
3. **高效的用户验证机制**  
    - 支持按钮式验证码验证（简单数学题），防止机器人刷消息。
    - 验证通过状态默认保留24小时，验证码题目默认5分钟有效，用户验证通过后无需重复验证，除非触发频率限制。
    - 删除聊天记录后重新开始，验证码会自动触发，确保用户体验流畅。
    - 验证失败、验证码过期后会自动刷新新的验证按钮，并尽量清理旧验证消息，减少消息堆积。

4. **消息频率限制（防刷保护）**  
   - 默认每分钟40条消息上限（可通过环境变量调整），超过限制的用户需重新验证。
   - 有效防止恶意刷消息，保护后台群组和cf免费额度。

5. **管理员面板功能**  
    - 支持在用户对应子话题中通过`/admin`或`/admin@机器人用户名`呼出管理员面板。
    - 同一子话题内重复呼出管理员面板时，旧面板会自动清理，只保留最新的一条。
    - 支持拉黑当前用户、解除拉黑、删除当前用户、查询黑名单、全局开关验证码、全局开关用户 Raw 等多种功能。
    - 支持管理员在子话题中使用`/reset_user <chat_id>`重置指定用户状态。

6. **轻量级部署**  
   - 单文件部署（仅需一个`_worker.js`），代码简洁，易于维护。
   - 支持Cloudflare Workers和Cloudflare Pages部署，部署过程简单。

## 部署教程

### 准备工作
1. **创建Telegram Bot**：
   - 在Telegram中找到`@BotFather`，发送`/newbot`创建新机器人。
   - 按照提示设置机器人名称和用户名，获取Bot Token（例如`123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`）。
   - 发送`/setinline`切换内联模式。
![CFTeleTrans 截图](picture/0903f76329b80fc231893abde40b9ab8.png)

2. **创建后台群组**：
   - 创建一个Telegram群组（按需设置是否公开），
   - 群组的“话题功能”打开。
   - 添加机器人为管理员，建议权限全给（消息管理，话题管理）
   - 获取群组的Chat ID（例如`-100123456789`），可以通过`@getidsbot`获取（拉它进群）。

3. **创建D1 SQL数据库**：
   - 登录[Cloudflare仪表板](https://dash.cloudflare.com/)。
   - 导航到 **存储和数据库 > D1 SQL数据库**，输入一个名称（例如`cfteletrans-db`），点击 **创建**。

### 方案一：直接复制粘贴`_worker.js`

适合首次部署、想尽快跑起来的用户。整个项目只需要一个`_worker.js`文件即可运行。

#### 步骤 1：创建Worker项目
1. 登录[Cloudflare仪表板](https://dash.cloudflare.com/)。
2. 导航到 **Workers和Pages > Workers和Pages**，点击 **创建**。
3. 点击 **Hello world**，输入一个名称（例如`cfteletrans`），再点击 **部署**

#### 步骤 2：配置环境变量
1. 在创建的Workers项目 **设置 > 变量和机密** 中，添加以下变量：
- `BOT_TOKEN_ENV`：您的Telegram Bot Token（例如`123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`）。
- `GROUP_ID_ENV`：后台群组的Chat ID（例如`-100123456789`）。
- `MAX_MESSAGES_PER_MINUTE_ENV`：消息频率限制（例如`40`）。

#### 步骤 3：绑定D1 SQL数据库
1. 在创建的Workers项目 **设置 > 绑定** 中，绑定数据库：
- 添加-选择D1数据库
- 变量名称 `D1`
- D1 数据库 选择刚建的数据库（例如`cfteletrans-db`），

#### 步骤 4：替换代码并部署
1. 点击 **编辑代码**。
2. 把原来的示例代码全部替换成仓库中的`_worker.js`内容。
3. 点击 **部署**。
4. 首次运行时，程序会自动创建或修复所需数据表，无需手动执行建表SQL。

#### 步骤 5：测试
1. 在Telegram中找到您的机器人，发送`/start`。
2. 确认收到“你好，欢迎使用私聊机器人！”并触发验证码。
3. 完成验证，确认收到验证成功提示，并可继续发送消息。
4. 发送消息，确认消息转发到后台群组的子论坛。
5. 在对应子话题中发送`/admin`，确认可以正常呼出管理员面板。

### 方案二：连接GitHub自动部署

适合后续会持续更新代码、希望每次提交后自动部署的用户。当前仓库已针对 Git 自动构建做了整理，根目录不再依赖部署无关的原生模块。

#### 步骤 1：准备仓库

- 先 fork 本项目，或将本项目同步到您自己的 GitHub 仓库。
- 确认仓库根目录中包含`_worker.js`、`package.json`和`README.md`。

#### 步骤 2：创建或打开Worker项目

1. 登录[Cloudflare仪表板](https://dash.cloudflare.com/)。
2. 导航到 **Workers和Pages > Workers和Pages**。
3. 创建一个新的 Worker 项目，或打开已有的 Worker 项目。
4. 在项目中找到 **构建** 或 **连接 Git 存储库**，将该 Worker 与 GitHub 仓库连接。

#### 步骤 3：配置Git自动部署

如果您看到的是 Cloudflare 的 **Worker Git 自动构建** 页面，建议按以下方式填写：

- `构建命令`：留空
- `部署命令`：`npx wrangler deploy --keep-vars`
- `非生产分支部署命令`：`npx wrangler versions upload --keep-vars`
- `路径`：`/`

说明：

- 仓库已提供`wrangler.toml`，其中已包含`main`、`compatibility_date`与`keep_vars`等基础配置。
- `keep_vars = true`用于保留已在 Cloudflare Worker 控制台中配置的运行时变量，避免后续自动部署时覆盖普通变量。
- `wrangler.toml`当前为精简配置，只负责 Worker 入口、兼容日期和变量保留策略，不在仓库中写入每个部署者自己的私有配置。

#### 步骤 4：配置运行时变量和绑定

连接 GitHub 只负责自动拉取并发布代码，运行时仍需要在 Worker 项目中手动配置：

- **设置 > 变量和机密**
  - `BOT_TOKEN_ENV`：建议添加为机密（Secret）
  - `GROUP_ID_ENV`
  - `MAX_MESSAGES_PER_MINUTE_ENV`
- **设置 > 绑定**
  - D1 数据库绑定名必须为`D1`
- 当前仓库不会在`wrangler.toml`中写死`BOT_TOKEN_ENV`、`GROUP_ID_ENV`、`MAX_MESSAGES_PER_MINUTE_ENV`和 D1 绑定信息，避免公开仓库泄露每个部署者自己的配置。

#### 步骤 5：触发部署并测试

1. 保存 Git 构建配置。
2. 推送一次代码到生产分支（例如`main`），或在 Cloudflare 控制台中重试构建。
3. 部署完成后，按“方案一”中的测试步骤验证机器人是否正常工作。

### 补充说明

- 当前 README 主要整理两种最直接的部署方式：**复制粘贴`_worker.js`** 与 **连接 GitHub 自动部署**。
- 项目也可以运行在 Cloudflare Pages Advanced Mode，但如果您只是部署本项目本身，优先推荐以上两种方案，流程更直观、问题也更少。
- 生成 README 中 Star 图所需的依赖已单独移到`scripts`目录，不会再影响线上部署。
- 如果您需要手动生成 README 中的 Star 图，请在`scripts`目录单独安装依赖后执行：

```bash
npm --prefix scripts install
npm run generate-star-chart
```


## 需要在 Cloudflare 绑定的变量表

以下是项目中需要在 Cloudflare 环境中绑定的变量及其说明：

| **变量名**                  | **类型**   | **描述**                                                                 | **默认值/示例**            |
|-----------------------------|------------|--------------------------------------------------------------------------|----------------------------|
| `BOT_TOKEN_ENV`            | 机密（Secret） | Telegram Bot 的 Token，用于与 Telegram API 通信。                        | `your-telegram-bot-token`  |
| `GROUP_ID_ENV`             | 环境变量   | Telegram 群组的 ID，用于消息转发和客服回复。                             | `-123456789`               |
| `MAX_MESSAGES_PER_MINUTE_ENV` | 环境变量 | 每分钟允许的最大消息数，用于限制用户发送频率。                           | `40`                       |
| `D1`                       | D1 绑定    | Cloudflare D1 数据库绑定，用于存储用户状态、消息频率、群组映射及管理员面板状态。 | `cfteletrans-db`           |

## 管理员面板说明

- 管理员面板必须在“用户对应的子话题”中呼出，机器人会根据当前子话题反查绑定的私聊用户。
- 呼出命令支持`/admin`和`/admin@机器人用户名`两种形式。
- `拉黑用户`、`解除拉黑`、`删除用户`：仅作用于当前子话题绑定的那位用户。
- `查询黑名单`：查询当前所有被拉黑的用户，属于全局操作。
- `开启/关闭验证码`：全局开关，影响所有用户的新验证流程。
- `开启/关闭用户 Raw`：全局开关，影响所有用户端欢迎内容中的 Raw 链接。
- `/reset_user <chat_id>`：管理员命令，用于重置指定用户的状态、消息记录和话题映射。


## 灵感来源
本项目的灵感来源于 Telegram-interactive-bot(部署在服务器)

- [Telegram-interactive-bot](https://github.com/MiHaKun/Telegram-interactive-bot)

## 参考文献

在开发过程中，以下资源提供了宝贵的参考和指导：

- [NodeSeek 帖子](https://www.nodeseek.com/post-237769-1)

## 致谢
- 特别感谢 [VTEXS](https://vtexs.com/) 赞助本项目，感谢 [VTEXS](https://vtexs.com/)为开源社区提供算力支持！
- [![Powered by DartNode](https://dartnode.com/branding/DN-Open-Source-sm.png)](https://dartnode.com "Powered by DartNode - Free VPS for Open Source")
- 特别感谢 [xAI](https://x.ai/) 提供的支持和灵感，帮助我完成了本项目的开发和优化！
- 特别感谢 [cloud flare](https://www.cloudflare.com/) 大善人！
- 再次感谢所有测试者、贡献者和社区支持！

## 贡献

欢迎提交 Issue 或 Pull Request！如果您有任何改进建议或新功能需求，请随时联系我。

![Star 增长趋势](https://raw.githubusercontent.com/iawooo/StarCharts/refs/heads/main/images/ctt_star_chart.png)

## 许可证

本项目采用 MIT 许可证，详情请见 [LICENSE](LICENSE) 文件。

## 声明

- **尊重原创，转载须知**  
  如需转载，请务必注明出处，感谢支持！严禁将本项目用于任何违法犯罪行为。  
- **二次修改与发布**  
  欢迎基于本项目进行二次开发，但请在发布时注明原始出处，共同维护开源社区的良好氛围。
