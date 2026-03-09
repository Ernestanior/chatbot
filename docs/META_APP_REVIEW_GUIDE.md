# Meta App Review 指南

本文档帮助你通过 Meta App Review，成功发布 SocialAI 应用。

## 📋 你的项目实际需要的权限

根据代码分析，SocialAI MVP 只需要以下功能：
- Instagram 私讯收发
- Facebook Messenger 收发
- 留言回覆
- 留言触发私讯 (Private Reply)

### ✅ 必须的权限清单

| 权限 | 用途 | 对应代码 |
|------|------|----------|
| `instagram_manage_messages` | 收发 Instagram 私讯 | `sendIGMessage()` |
| `instagram_business_manage_messages` | 商业账号私讯 API | `sendIGMessage()` |
| `instagram_manage_comments` | 回覆 Instagram 留言 | `replyToComment()` |
| `instagram_basic` | 获取 IG 账号基本信息 | OAuth 流程 |
| `instagram_business_basic` | 商业账号信息 | OAuth 流程 |
| `pages_messaging` | 收发 Facebook Messenger | `sendFBMessage()` |
| `pages_read_engagement` | 读取粉丝专页互动 | Webhook 接收 |
| `pages_show_list` | 列出用户管理的粉专 | OAuth 授权流程 |
| `pages_manage_metadata` | 管理 Webhook 订阅 | Webhook 设置 |
| `public_profile` | 基本用户信息 | 必要基础权限 |
| `business_management` | 商业账号管理 | 获取商业账号列表 |

### ❌ 可以移除的权限/产品

| 权限/产品 | 移除原因 |
|-----------|----------|
| `instagram_content_publish` | MVP 不发布贴文，只回覆讯息 |
| **WhatsApp Business** 整个产品 | 项目不使用 WhatsApp |
| `whatsapp_business_messaging` | 不需要 |
| `whatsapp_business_management` | 不需要 |

---

## 🗑️ 如何移除不需要的权限和产品

### 步骤 1: 移除 WhatsApp Business 产品

1. 登入 [Meta for Developers](https://developers.facebook.com/)
2. 选择你的 App
3. 左侧菜单找到 **Products** (产品)
4. 找到 "Connect with customers through WhatsApp"
5. 点击右边的 **⚙️ 设置** 或 **删除** 按钮
6. 确认移除

> **注意**: 移除产品会同时移除相关的所有权限请求

### 步骤 2: 移除 instagram_content_publish

1. 在 App Dashboard 中
2. 进入 **App Review** > **Permissions and Features**
3. 找到 `instagram_content_publish`
4. 点击 **Remove** 或取消勾选
5. 保存更改

### 步骤 3: 确认只保留必要权限

在 App Review 页面，确保只勾选了以下权限：

**Instagram 相关:**
- ✅ instagram_basic
- ✅ instagram_business_basic  
- ✅ instagram_manage_messages
- ✅ instagram_business_manage_messages
- ✅ instagram_manage_comments

**Facebook Pages 相关:**
- ✅ pages_messaging
- ✅ pages_read_engagement
- ✅ pages_show_list
- ✅ pages_manage_metadata

**通用:**
- ✅ public_profile
- ✅ business_management

---

## 🧪 完成 API 测试调用

Meta 要求每个权限都有实际的 API 调用记录。运行测试脚本：

### 准备工作

1. 获取 Access Token:
   - 在 App Dashboard > Tools > Graph API Explorer
   - 选择你的 App
   - 勾选需要的权限
   - 点击 "Generate Access Token"

2. 获取 Page ID 和 IG User ID:
   ```
   # 获取 Page ID
   GET /me/accounts?fields=id,name,instagram_business_account
   
   # instagram_business_account.id 就是你的 IG User ID
   ```

### 运行测试脚本

```bash
cd socialai

# 设置环境变量
export META_ACCESS_TOKEN="你的access_token"
export META_PAGE_ID="你的page_id"
export META_IG_USER_ID="你的ig_user_id"

# 运行测试
npx ts-node scripts/test-meta-permissions.ts
```

### 脚本会测试的端点

| 权限 | 测试端点 |
|------|----------|
| public_profile | `GET /me` |
| instagram_business_basic | `GET /{ig-user-id}?fields=id,username,followers_count` |
| business_management | `GET /me/businesses` |
| pages_show_list | `GET /me/accounts` |
| pages_read_engagement | `GET /{page-id}?fields=fan_count` |
| instagram_manage_messages | `GET /{ig-user-id}/conversations` |
| pages_messaging | `GET /{page-id}/conversations` |
| instagram_manage_comments | `GET /{media-id}/comments` |

---

## 📝 填写 App Review 申请

### 每个权限需要提供的内容

1. **使用说明** (How will you use this permission?)
   
   范例 - instagram_manage_messages:
   ```
   Our app is an AI-powered customer service platform. We use this 
   permission to:
   1. Receive incoming Instagram DMs from customers via webhook
   2. Send automated AI-generated replies to customer inquiries
   3. Allow human agents to take over conversations when needed
   
   Users authorize their Instagram Business Account through our OAuth 
   flow, and we only respond to messages within the 24-hour messaging 
   window as per Meta's policies.
   ```

2. **步骤说明** (Step-by-step instructions)
   ```
   1. User logs into our platform at https://your-domain.com
   2. User clicks "Connect Instagram" button
   3. User completes Meta OAuth flow and grants permissions
   4. Our system receives webhooks for new Instagram DMs
   5. AI automatically generates and sends appropriate responses
   6. User can view all conversations in our dashboard
   ```

3. **屏幕录制** (Screencast)
   - 录制 1-2 分钟视频展示功能
   - 展示用户如何授权
   - 展示消息如何被接收和回覆

---

## ⚠️ 常见审核失败原因

1. **没有实际 API 调用** - 运行测试脚本解决
2. **缺少隐私政策** - 确保网站有 Privacy Policy 页面
3. **缺少数据删除说明** - 说明用户如何删除数据
4. **权限申请过多** - 只申请实际使用的权限
5. **说明不清楚** - 提供详细的使用场景和步骤

---

## 🔗 有用链接

- [Meta App Review 文档](https://developers.facebook.com/docs/app-review)
- [Instagram Graph API 权限](https://developers.facebook.com/docs/instagram-api/overview#permissions)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Webhook 设置指南](https://developers.facebook.com/docs/messenger-platform/webhooks)