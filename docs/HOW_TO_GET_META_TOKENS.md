# 如何获取 Meta API 测试所需的 Token 和 ID

运行 [`test-meta-permissions.ts`](../scripts/test-meta-permissions.ts) 脚本需要三个参数，本文档详细说明如何获取。

---

## 1️⃣ 获取 META_ACCESS_TOKEN (访问令牌)

### 方法 A: 使用 Graph API Explorer (推荐用于测试)

1. **打开 Graph API Explorer**
   - 访问: https://developers.facebook.com/tools/explorer/

2. **选择你的应用**
   - 在页面右上角 "Meta App" 下拉菜单中
   - 选择你的 App (例如: "SocialAI")

3. **选择权限**
   - 点击 "Permissions" 标签
   - 勾选以下权限：
     ```
     ✅ instagram_basic
     ✅ instagram_manage_messages
     ✅ instagram_manage_comments
     ✅ pages_messaging
     ✅ pages_read_engagement
     ✅ pages_show_list
     ✅ pages_manage_metadata
     ✅ business_management
     ✅ public_profile
     ```

4. **生成 Access Token**
   - 点击 "Generate Access Token" 按钮
   - 在弹出窗口中授权你的 Facebook 账号
   - 选择要授权的 Page (粉丝专页)
   - 复制生成的 Access Token

5. **验证 Token**
   - 在 Graph API Explorer 中输入: `me?fields=id,name`
   - 点击 "Submit"
   - 如果返回你的用户信息，说明 Token 有效

> ⚠️ **注意**: Graph API Explorer 生成的 Token 是短期 Token (1-2小时有效)，仅用于测试。生产环境需要使用长期 Token。

### 方法 B: 从你的应用数据库获取 (生产环境)

如果你已经通过 OAuth 授权了用户，可以从数据库中获取：

```sql
-- 从 PlatformAccount 表获取已加密的 token
SELECT accessToken FROM PlatformAccount 
WHERE platform = 'FACEBOOK' OR platform = 'INSTAGRAM'
LIMIT 1;
```

然后使用你的解密函数解密：
```typescript
import { decrypt } from '@/lib/encryption';
const token = decrypt(encryptedToken);
```

---

## 2️⃣ 获取 META_PAGE_ID (Facebook 粉丝专页 ID)

### 方法 A: 使用 Graph API Explorer

1. 在 Graph API Explorer 中输入:
   ```
   me/accounts?fields=id,name,instagram_business_account
   ```

2. 点击 "Submit"

3. 返回结果示例:
   ```json
   {
     "data": [
       {
         "id": "123456789012345",  // ← 这就是 PAGE_ID
         "name": "你的粉丝专页名称",
         "instagram_business_account": {
           "id": "987654321098765"  // ← 这就是 IG_USER_ID (见下方)
         }
       }
     ]
   }
   ```

4. 复制 `id` 字段的值作为 `META_PAGE_ID`

### 方法 B: 从 Facebook 页面 URL 获取

1. 访问你的 Facebook 粉丝专页
2. 查看 URL，格式通常是:
   - `https://www.facebook.com/YourPageName`
   - 或 `https://www.facebook.com/profile.php?id=123456789012345`

3. 如果是第一种格式，需要转换:
   - 在 Graph API Explorer 输入: `YourPageName?fields=id`
   - 返回的 `id` 就是 PAGE_ID

### 方法 C: 从数据库获取

```sql
SELECT platformUserId FROM PlatformAccount 
WHERE platform = 'FACEBOOK' 
LIMIT 1;
```

---

## 3️⃣ 获取 META_IG_USER_ID (Instagram 商业账号 ID)

### 方法 A: 从 Page 信息中获取 (最简单)

使用上面获取 PAGE_ID 时的同一个 API 调用:
```
me/accounts?fields=id,name,instagram_business_account
```

返回结果中的 `instagram_business_account.id` 就是 `META_IG_USER_ID`

### 方法 B: 直接查询 Page 的 Instagram 账号

1. 在 Graph API Explorer 中输入:
   ```
   {PAGE_ID}?fields=instagram_business_account
   ```
   (将 `{PAGE_ID}` 替换为你的 Page ID)

2. 返回结果:
   ```json
   {
     "instagram_business_account": {
       "id": "987654321098765"  // ← 这就是 IG_USER_ID
     }
   }
   ```

### 方法 C: 从数据库获取

```sql
SELECT platformUserId FROM PlatformAccount 
WHERE platform = 'INSTAGRAM' 
LIMIT 1;
```

---

## 📝 完整示例流程

### 步骤 1: 获取所有信息

在 Graph API Explorer 中执行:
```
me/accounts?fields=id,name,access_token,instagram_business_account{id,username}
```

返回示例:
```json
{
  "data": [
    {
      "id": "123456789012345",           // ← PAGE_ID
      "name": "我的品牌粉专",
      "access_token": "EAABwz...",       // ← ACCESS_TOKEN (Page Token)
      "instagram_business_account": {
        "id": "987654321098765",         // ← IG_USER_ID
        "username": "mybrand"
      }
    }
  ]
}
```

### 步骤 2: 设置环境变量

```bash
# Windows (CMD)
set META_ACCESS_TOKEN=EAABwz...
set META_PAGE_ID=123456789012345
set META_IG_USER_ID=987654321098765

# Windows (PowerShell)
$env:META_ACCESS_TOKEN="EAABwz..."
$env:META_PAGE_ID="123456789012345"
$env:META_IG_USER_ID="987654321098765"

# macOS/Linux
export META_ACCESS_TOKEN="EAABwz..."
export META_PAGE_ID="123456789012345"
export META_IG_USER_ID="987654321098765"
```

### 步骤 3: 运行测试脚本

```bash
cd socialai
npx ts-node scripts/test-meta-permissions.ts
```

---

## ⚠️ 常见问题

### Q1: 我的 Page 没有 instagram_business_account 字段

**原因**: 你的 Facebook Page 还没有连接 Instagram 商业账号

**解决方法**:
1. 确保你有一个 Instagram 商业账号 (不是个人账号)
2. 在 Facebook Page 设置中连接 Instagram 账号
3. 路径: Facebook Page > 设置 > Instagram > 连接账号

### Q2: Access Token 显示权限不足

**原因**: Token 没有包含所需的权限

**解决方法**:
1. 在 Graph API Explorer 中重新生成 Token
2. 确保勾选了所有需要的权限 (见上方列表)
3. 重新授权

### Q3: Token 过期了怎么办？

**短期 Token (测试用)**:
- Graph API Explorer 生成的 Token 1-2 小时后过期
- 重新生成即可

**长期 Token (生产环境)**:
- 使用 OAuth 流程获取的 Token 可以续期
- 参考: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived

### Q4: 找不到 Instagram Business Account ID

**检查清单**:
1. ✅ Instagram 账号已转换为商业账号
2. ✅ Instagram 商业账号已连接到 Facebook Page
3. ✅ 你是该 Page 的管理员
4. ✅ Access Token 包含 `instagram_basic` 权限

---

## 🔗 相关链接

- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Access Token 调试工具](https://developers.facebook.com/tools/debug/accesstoken/)
- [Instagram Graph API 文档](https://developers.facebook.com/docs/instagram-api)
- [Pages API 文档](https://developers.facebook.com/docs/pages)