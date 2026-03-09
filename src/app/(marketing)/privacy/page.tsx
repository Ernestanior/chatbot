import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">🤖</div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ChatBotAI
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">← 返回首页</Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">隐私政策</h1>
        <p className="text-muted-foreground mb-8">最后更新：2026年3月9日</p>

        <Card className="p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. 简介</h2>
            <p className="text-muted-foreground leading-relaxed">
              ChatBotAI（"我们"、"我们的"）重视您的隐私。本隐私政策说明了我们如何收集、使用、披露和保护您在使用我们的服务时提供的信息。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. 我们收集的信息</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p><strong>2.1 账户信息</strong></p>
              <p>当您注册 ChatBotAI 账户时，我们会收集您的电子邮件地址、姓名和密码。</p>
              
              <p><strong>2.2 平台连接信息</strong></p>
              <p>当您连接 Facebook 或 Instagram 账号时，我们会收集必要的访问令牌和权限，以便为您提供服务。</p>
              
              <p><strong>2.3 对话数据</strong></p>
              <p>我们会存储您的客户对话记录，以便提供 AI 自动回复服务和数据分析功能。</p>
              
              <p><strong>2.4 使用数据</strong></p>
              <p>我们会收集您如何使用我们服务的信息，包括访问时间、功能使用情况等。</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. 信息使用方式</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>我们使用收集的信息用于：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>提供和维护我们的服务</li>
                <li>改进和优化用户体验</li>
                <li>训练和改进 AI 模型</li>
                <li>发送服务相关通知</li>
                <li>检测和防止欺诈行为</li>
                <li>遵守法律义务</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. 信息共享</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们不会出售您的个人信息。我们仅在以下情况下共享您的信息：
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground mt-2">
              <li>经您明确同意</li>
              <li>与服务提供商（如云服务提供商）共享，以提供服务</li>
              <li>遵守法律要求或响应法律程序</li>
              <li>保护我们的权利、财产或安全</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. 数据安全</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们采用行业标准的安全措施来保护您的数据，包括加密存储、访问控制和定期安全审计。但请注意，没有任何互联网传输或电子存储方法是 100% 安全的。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. 数据保留</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们会在提供服务所需的期间内保留您的信息。当您删除账户时，我们会在 30 天内删除您的个人数据，除非法律要求我们保留。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. 您的权利</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              根据适用的数据保护法律，您有权：
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
              <li>访问您的个人数据</li>
              <li>更正不准确的数据</li>
              <li>删除您的数据</li>
              <li>限制或反对数据处理</li>
              <li>数据可携带性</li>
              <li>撤回同意</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Cookie 和追踪技术</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们使用 Cookie 和类似技术来改善用户体验、分析使用情况和提供个性化内容。您可以通过浏览器设置管理 Cookie 偏好。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. 第三方服务</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们的服务集成了第三方平台（如 Facebook、Instagram）。这些平台有自己的隐私政策，我们建议您查阅它们的政策。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. 儿童隐私</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们的服务不面向 13 岁以下的儿童。我们不会故意收集儿童的个人信息。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. 政策更新</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们可能会不时更新本隐私政策。重大变更时，我们会通过电子邮件或服务内通知告知您。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. 联系我们</h2>
            <p className="text-muted-foreground leading-relaxed">
              如果您对本隐私政策有任何疑问或顾虑，请通过以下方式联系我们：
            </p>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p>电子邮件：privacy@chatbotai.com</p>
              <p>地址：台北市信义区信义路五段7号</p>
            </div>
          </section>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}