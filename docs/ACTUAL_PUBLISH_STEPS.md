# Meta App 实际发布步骤（根据真实界面）

根据你的截图，这是 Instagram API 的权限和功能配置页面。

---

## 📋 当前页面说明

你看到的是 **"Permissions and features"** 页面，显示了可以添加到你的 Use Case 的各种权限。

### 页面上的权限列表

| 权限 | 说明 | 是否需要 |
|------|------|----------|
| Business Asset User Profile Access | 读取商业资产用户信息 | ❌ 不需要 |
| Human Agent | 真人客服标记功能 | ❌ 不需要 |
| Instagram Public Content Access | 访问公开内容 | ❌ 不需要 |
| ads_management | 广告管理 | ❌ 不需要 |
| ads_read | 读取广告数据 | ❌ 不需要 |
| business_management | 商业账号管理 | ✅ **已测试通过** |

---

## ✅ 你实际需要的权限（已经在测试中通过）

根据之前的测试结果，你需要的权限是：

### Instagram 相关
- `instagram_basic` ✅ 已通过
- `instagram_business_basic` ✅ 已通过
- `instagram_manage_messages` ⚠️ 需要审核
- `instagram_business_manage_messages` ⚠️ 需要审核
- `instagram_manage_comments` ✅ 已通过

### Facebook Pages 相关
- `pages_messaging` ⚠️ 需要审核
- `pages_read_engagement` ✅ 已通过
- `pages_show_list` ✅ 已通过
- `pages_manage_metadata` ✅ 已通过

### 通用
- `public_profile` ✅ 已通过
- `business_management` ✅ 已通过

---

## 🎯 实际操作步骤

### 步骤 1: 检查当前 Use Case 的权限

在当前页面（Instagram API > Permissions and features）：

1. **不需要点击任何 "Add" 按钮**
2. 你需要的权限应该已经自动包含在 Use Case 中
3. 页面上显示的这些额外功能（Human Agent, ads_management 等）都是可选的

### 步骤 2: 返回到 Publish 页面

1. 点击左侧菜单的 **"Publish"** 或顶部的 **"Publish"** 标签
2. 回到你之前截图的页面（显示三个 Use Cases）

### 步骤 3: 检查每个 Use Case 的状态

#### A. Manage messaging & content on Instagram

点击右侧箭头 `>` 进入，检查：
- ✅ 是否显示 "Testing in progress" 或 "Ready to submit"
- ✅ 是否有红色警告或错误提示
- ✅ 权限列表是否完整

**如果显示 "Testing in progress"**：
- 这是正常的，说明你已经运行了测试脚本
- API 调用已经被记录
- 可以继续下一步

**如果要求填写信息**：
- App 说明
- 使用场景
- 屏幕录制

#### B. Engage with customers on Messenger from Meta

同样点击右侧箭头检查状态。

#### C. Connect with customers through WhatsApp

**建议操作**：
1. 点击右侧箭头进入
2. 找到 **"Remove use case"** 或 **"Delete"** 按钮
3. 删除这个 Use Case（因为你的项目不使用 WhatsApp）

---

## 📝 如果需要填写 Use Case 信息

### Instagram Use Case 信息模板

**1. What will your app do with this data?**
```
Our app provides AI-powered automated customer service for Instagram 
business accounts. We use the Instagram Messaging API to:

1. Receive customer direct messages via webhook
2. Automatically generate and send AI responses based on business rules
3. Reply to comments on Instagram posts
4. Send private messages to commenters
5. Allow business owners to monitor conversations and take over manually

我们的应用为 Instagram 商业账号提供 AI 驱动的自动化客服。
我们使用 Instagram Messaging API 来：
1. 通过 webhook 接收客户私讯
2. 根据商家规则自动生成并发送 AI 回覆
3. 回覆 Instagram 贴文留言
4. 向留言者发送私讯
5. 允许商家监控对话并手动接管
```

**2. How do people use your app?**
```
Step-by-step user flow:

1. Business owner visits our platform and creates an account
2. Clicks "Connect Instagram Business Account"
3. Completes Meta OAuth authorization flow
4. Grants required permissions (instagram_manage_messages, instagram_manage_comments)
5. Configures AI response rules in our dashboard:
   - Sets business information (hours, products, FAQs)
   - Defines AI tone and personality
   - Sets escalation rules for human takeover
6. When customers send Instagram DMs or comments:
   - Our system receives webhook notification
   - AI analyzes the message and generates appropriate response
   - Response is sent via Instagram API
7. Business owner can:
   - View all conversations in real-time
   - Take over any conversation manually
   - Review AI response quality
   - Adjust rules based on feedback

用户使用流程：
1. 商家访问我们的平台并创建账号
2. 点击"连接 Instagram 商业账号"
3. 完成 Meta OAuth 授权流程
4. 授予所需权限
5. 在仪表板中配置 AI 回覆规则
6. 当客户发送 Instagram 私讯或留言时，系统自动回覆
7. 商家可以查看对话、手动接管、审查质量
```

**3. Screencast (屏幕录制)**

录制 1-2 分钟视频展示：
- 登录应用
- 连接 Instagram
- 配置 AI 规则
- 展示自动回覆功能
- 展示对话管理界面

---

## 🎬 屏幕录制快速指南

### 使用 Loom（最简单）

1. 访问 https://www.loom.com/
2. 注册免费账号
3. 点击 "Start Recording"
4. 选择 "Screen + Camera" 或 "Screen Only"
5. 录制你的应用演示
6. 完成后，复制分享链接
7. 粘贴到 Meta App Review 的 Screencast 字段

### 录制内容清单

✅ **必须展示的内容**：
- [ ] 用户登录你的应用
- [ ] 点击"连接 Instagram"按钮
- [ ] Meta OAuth 授权页面（显示权限请求）
- [ ] 授权成功后的界面
- [ ] 配置 AI 规则的界面
- [ ] 接收到消息后的自动回覆（可以用测试数据）
- [ ] 对话历史界面

❌ **不要展示的内容**：
- 真实客户的个人信息
- API Keys 或 Access Tokens
- 数据库密码
- 其他敏感信息

---

## 🚀 提交审核

完成所有配置后：

1. 返回 **Publish** 页面
2. 确认所有 Use Cases 状态为 "Ready to submit"
3. 点击页面底部的 **"Publish"** 按钮
4. 确认提交

---

## ⏰ 审核时间

- **通常**: 1-5 个工作日
- **可能更快**: 如果材料完整清晰
- **可能更慢**: 如果需要补充材料

---

## 📧 审核结果

你会收到邮件通知：

### ✅ 审核通过
- 应用可以正式使用
- 所有权限生效
- 可以开始接入真实用户

### ❌ 审核拒绝
- 邮件会说明拒绝原因
- 修改后可以重新提交
- 常见原因：
  - 屏幕录制不清楚
  - 说明不够详细
  - 缺少必要功能展示

### ⏸️ 需要更多信息
- Meta 会要求补充材料
- 按要求补充后重新提交

---

## 💡 关键提示

1. **不要添加不需要的权限** - 只添加你实际使用的
2. **屏幕录制很重要** - 这是审核人员了解你应用的主要方式
3. **说明要清楚** - 解释为什么需要每个权限
4. **测试数据可以** - 不需要真实客户数据
5. **WhatsApp 可以删除** - 如果不使用就删掉

---

## 🆘 遇到问题？

如果在配置过程中遇到问题：
1. 截图给我看
2. 告诉我具体在哪一步
3. 我会帮你解决