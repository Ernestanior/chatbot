# 如何发布 Meta App - 完整指南

根据你的截图，你需要完成三个 Use Cases 的配置才能发布应用。

---

## 📋 发布前检查清单

### ✅ 已完成
- Privacy Policy URL (隐私政策链接)

### ⚠️ 需要完成的 Use Cases

1. **Manage messaging & content on Instagram** (管理 Instagram 消息和内容)
2. **Engage with customers on Messenger from Meta** (通过 Messenger 与客户互动)
3. **Connect with customers through WhatsApp** (通过 WhatsApp 与客户联系)

---

## 🎯 推荐方案：移除 WhatsApp Use Case

**你的项目不使用 WhatsApp**，建议移除这个 Use Case：

### 如何移除 WhatsApp Use Case

1. 在 Publish 页面，点击 **"Connect with customers through WhatsApp"** 右侧的箭头 `>`
2. 进入详情页后，找到 **"Remove use case"** 或 **"Delete"** 按钮
3. 确认移除

如果找不到移除按钮：
- 左侧菜单点击 **"Use cases"**
- 找到 WhatsApp 相关的 Use Case
- 点击右上角的 **"..."** 菜单
- 选择 **"Remove"** 或 **"Delete"**

---

## 📝 完成 Instagram Use Case

点击 **"Manage messaging & content on Instagram"** 进入配置页面。

### 需要提供的信息

#### 1. App 用途说明 (App Purpose)
```
Our app is an AI-powered customer service automation platform. We help 
businesses automatically respond to Instagram direct messages and comments 
using AI, while allowing human agents to take over when needed.

我们的应用是一个 AI 驱动的客服自动化平台。我们帮助企业使用 AI 自动
回覆 Instagram 私讯和留言，同时允许真人客服在需要时接管对话。
```

#### 2. 详细功能说明 (Detailed Description)
```
Key features:
1. Receive Instagram DMs via webhook
2. Automatically generate and send AI responses based on business rules
3. Reply to Instagram comments
4. Send private messages to commenters
5. Allow human agents to monitor and take over conversations
6. Store conversation history for quality improvement

主要功能：
1. 通过 webhook 接收 Instagram 私讯
2. 根据商家规则自动生成并发送 AI 回覆
3. 回覆 Instagram 留言
4. 向留言者发送私讯
5. 允许真人客服监控并接管对话
6. 存储对话历史以改进质量
```

#### 3. 使用步骤 (Step-by-step Instructions)
```
1. Business owner logs into our platform at https://your-domain.com
2. Clicks "Connect Instagram" button
3. Completes Meta OAuth authorization flow
4. Grants permissions: instagram_manage_messages, instagram_manage_comments
5. Configures AI response rules in our dashboard
6. When customers send DMs or comments, our system:
   - Receives webhook notification
   - Generates appropriate AI response
   - Sends reply via Instagram API
7. Business owner can view all conversations and take over manually

1. 商家登录我们的平台 https://your-domain.com
2. 点击"连接 Instagram"按钮
3. 完成 Meta OAuth 授权流程
4. 授予权限：instagram_manage_messages, instagram_manage_comments
5. 在我们的仪表板中配置 AI 回覆规则
6. 当客户发送私讯或留言时，我们的系统：
   - 接收 webhook 通知
   - 生成适当的 AI 回覆
   - 通过 Instagram API 发送回覆
7. 商家可以查看所有对话并手动接管
```

#### 4. 屏幕录制 (Screencast)

**需要录制 1-2 分钟视频展示**：

录制内容：
1. 登录你的应用
2. 点击"连接 Instagram"
3. 完成 OAuth 授权（展示权限请求页面）
4. 展示配置 AI 规则的界面
5. 展示接收到 Instagram 消息后的自动回覆
6. 展示对话历史界面

**录制工具推荐**：
- Windows: Xbox Game Bar (Win + G)
- Mac: QuickTime Player
- 在线工具: Loom (https://www.loom.com/)

**录制要求**：
- 时长: 1-2 分钟
- 格式: MP4, MOV, 或 AVI
- 大小: 不超过 100MB
- 分辨率: 至少 720p

---

## 📝 完成 Messenger Use Case

点击 **"Engage with customers on Messenger from Meta"** 进入配置页面。

### 需要提供的信息

#### 1. App 用途说明
```
Our app provides AI-powered automated customer service for Facebook 
Messenger. Businesses can automatically respond to customer messages 
using AI while maintaining human oversight.

我们的应用为 Facebook Messenger 提供 AI 驱动的自动化客服。
企业可以使用 AI 自动回覆客户消息，同时保持人工监督。
```

#### 2. 详细功能说明
```
Key features:
1. Receive Facebook Messenger messages via webhook
2. Automatically generate and send AI responses
3. Allow human agents to take over conversations
4. Store conversation history
5. Provide analytics on response quality

主要功能：
1. 通过 webhook 接收 Facebook Messenger 消息
2. 自动生成并发送 AI 回覆
3. 允许真人客服接管对话
4. 存储对话历史
5. 提供回覆质量分析
```

#### 3. 使用步骤
```
1. Business owner logs into our platform
2. Clicks "Connect Facebook Page" button
3. Completes Meta OAuth authorization
4. Grants permissions: pages_messaging, pages_read_engagement
5. Configures AI response rules
6. When customers send messages:
   - System receives webhook
   - Generates AI response
   - Sends reply via Messenger API
7. Business owner monitors conversations in dashboard

1. 商家登录我们的平台
2. 点击"连接 Facebook 粉专"按钮
3. 完成 Meta OAuth 授权
4. 授予权限：pages_messaging, pages_read_engagement
5. 配置 AI 回覆规则
6. 当客户发送消息时：
   - 系统接收 webhook
   - 生成 AI 回覆
   - 通过 Messenger API 发送回覆
7. 商家在仪表板中监控对话
```

#### 4. 屏幕录制

录制与 Instagram 类似的流程，但展示 Facebook Messenger 的功能。

---

## 🎬 如何录制屏幕视频

### 方案 A: 使用 Loom (推荐)

1. 访问 https://www.loom.com/
2. 注册免费账号
3. 安装浏览器扩展或桌面应用
4. 点击录制按钮
5. 选择录制屏幕
6. 完成录制后，复制分享链接
7. 在 Meta App Review 中粘贴链接

### 方案 B: 使用本地工具

**Windows:**
```
1. 按 Win + G 打开 Xbox Game Bar
2. 点击录制按钮
3. 完成后，视频保存在 C:\Users\你的用户名\Videos\Captures
4. 上传到 YouTube (Unlisted) 或 Google Drive
5. 在 Meta App Review 中粘贴链接
```

**Mac:**
```
1. 打开 QuickTime Player
2. 文件 > 新建屏幕录制
3. 点击录制按钮
4. 完成后保存视频
5. 上传到 YouTube (Unlisted) 或 Google Drive
6. 在 Meta App Review 中粘贴链接
```

---

## ⚠️ 重要提示

### 关于测试数据

在录制视频时：
- ✅ 可以使用测试账号
- ✅ 可以使用模拟数据
- ✅ 展示开发环境
- ❌ 不要展示真实客户数据
- ❌ 不要展示敏感信息（API keys, tokens）

### 关于权限说明

在填写说明时：
- ✅ 清楚说明为什么需要这个权限
- ✅ 说明如何使用这个权限
- ✅ 说明用户如何受益
- ❌ 不要请求不需要的权限
- ❌ 不要含糊其辞

---

## 📊 提交后的流程

1. **提交审核** - 点击 "Publish" 按钮
2. **等待审核** - 通常 1-5 个工作日
3. **可能的结果**:
   - ✅ **批准** - 应用可以正式使用
   - ❌ **拒绝** - 会收到拒绝原因，修改后重新提交
   - ⏸️ **需要更多信息** - 补充材料后重新提交

---

## 🔗 相关资源

- [Meta App Review 文档](https://developers.facebook.com/docs/app-review)
- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Messenger Platform](https://developers.facebook.com/docs/messenger-platform)
- [屏幕录制工具 Loom](https://www.loom.com/)

---

## 💡 快速总结

**你需要做的事情**：

1. ✅ **移除 WhatsApp Use Case** (你不需要它)
2. 📝 **填写 Instagram Use Case 的说明** (复制上面的文案)
3. 📝 **填写 Messenger Use Case 的说明** (复制上面的文案)
4. 🎬 **录制 2 个屏幕视频** (每个 1-2 分钟)
5. 🚀 **点击 Publish 提交审核**

完成这些后，等待 Meta 审核即可！