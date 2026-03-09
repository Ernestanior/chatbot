import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold mb-4">服务条款</h1>
        <p className="text-muted-foreground mb-8">最后更新：2026年3月9日</p>

        <Card className="p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. 接受条款</h2>
            <p className="text-muted-foreground leading-relaxed">
              欢迎使用 ChatBotAI！通过访问或使用我们的服务，您同意受本服务条款的约束。如果您不同意这些条款，请不要使用我们的服务。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. 服务描述</h2>
            <p className="text-muted-foreground leading-relaxed">
              ChatBotAI 是一个 AI 驱动的智能客服平台，帮助企业自动化社交媒体客户服务。我们提供：
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground mt-2">
              <li>AI 笔记本功能，用于训练定制化客服机器人</li>
              <li>Facebook 和 Instagram 平台集成</li>
              <li>自动消息回复和对话管理</li>
              <li>数据分析和洞察工具</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. 账户注册</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p><strong>3.1 资格要求</strong></p>
              <p>您必须年满 18 岁才能使用我们的服务。通过注册，您声明并保证您符合此要求。</p>
              
              <p><strong>3.2 账户安全</strong></p>
              <p>您负责维护账户的机密性和安全性。您同意对您账户下发生的所有活动负责。</p>
              
              <p><strong>3.3 准确信息</strong></p>
              <p>您同意提供准确、完整和最新的注册信息，并及时更新这些信息。</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. 使用许可和限制</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p><strong>4.1 许可授予</strong></p>
              <p>我们授予您有限的、非独占的、不可转让的许可，以访问和使用我们的服务。</p>
              
              <p><strong>4.2 使用限制</strong></p>
              <p>您同意不会：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>违反任何适用的法律或法规</li>
                <li>侵犯他人的知识产权</li>
                <li>发送垃圾邮件或恶意内容</li>
                <li>尝试未经授权访问我们的系统</li>
                <li>干扰或破坏服务的正常运行</li>
                <li>使用自动化工具抓取或复制内容</li>
                <li>转售或再分发我们的服务</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. 第三方平台集成</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们的服务集成了 Facebook 和 Instagram 等第三方平台。您的使用还受这些平台的服务条款约束。我们不对第三方平台的任何变更、中断或终止负责。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. 付费服务</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p><strong>6.1 订阅费用</strong></p>
              <p>某些功能需要付费订阅。费用将在订阅页面明确显示。</p>
              
              <p><strong>6.2 计费周期</strong></p>
              <p>订阅按月或年计费。除非您取消，订阅将自动续订。</p>
              
              <p><strong>6.3 退款政策</strong></p>
              <p>我们提供 14 天免费试用期。试用期后，除非法律要求，否则费用不予退还。</p>
              
              <p><strong>6.4 价格变更</strong></p>
              <p>我们保留随时更改价格的权利，但会提前 30 天通知现有订阅用户。</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. 知识产权</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p><strong>7.1 我们的权利</strong></p>
              <p>ChatBotAI 及其所有内容、功能和特性均为我们的专有财产，受知识产权法保护。</p>
              
              <p><strong>7.2 您的内容</strong></p>
              <p>您保留对上传到我们服务的内容的所有权。通过上传内容，您授予我们使用该内容提供服务的许可。</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. 数据和隐私</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们按照我们的<Link href="/privacy" className="text-blue-600 hover:underline">隐私政策</Link>收集和使用您的数据。使用我们的服务即表示您同意该政策。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. 免责声明</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们的服务按"现状"和"可用"基础提供，不提供任何明示或暗示的保证。我们不保证服务将不间断、安全或无错误。AI 生成的回复可能不总是准确或适当，您应该监控和审查 AI 的输出。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. 责任限制</h2>
            <p className="text-muted-foreground leading-relaxed">
              在法律允许的最大范围内，ChatBotAI 及其关联方不对任何间接、偶然、特殊、后果性或惩罚性损害负责，包括但不限于利润损失、数据丢失或业务中断。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. 赔偿</h2>
            <p className="text-muted-foreground leading-relaxed">
              您同意赔偿并使 ChatBotAI 及其关联方免受因您违反本条款或使用服务而产生的任何索赔、损害、损失、责任和费用的损害。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. 终止</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p><strong>12.1 您的终止权</strong></p>
              <p>您可以随时通过删除账户来终止使用我们的服务。</p>
              
              <p><strong>12.2 我们的终止权</strong></p>
              <p>如果您违反本条款，我们保留暂停或终止您的账户的权利，恕不另行通知。</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. 争议解决</h2>
            <p className="text-muted-foreground leading-relaxed">
              本条款受台湾法律管辖。任何争议应首先通过友好协商解决。如果协商失败，争议应提交台北地方法院管辖。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">14. 条款变更</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们可能会不时更新这些条款。重大变更时，我们会通过电子邮件或服务内通知告知您。继续使用服务即表示您接受修订后的条款。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">15. 完整协议</h2>
            <p className="text-muted-foreground leading-relaxed">
              本条款构成您与 ChatBotAI 之间关于使用服务的完整协议，取代所有先前的协议和理解。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">16. 联系我们</h2>
            <p className="text-muted-foreground leading-relaxed">
              如果您对本服务条款有任何疑问，请联系我们：
            </p>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p>电子邮件：legal@chatbotai.com</p>
              <p>地址：台北市信义区信义路五段7号</p>
              <p>电话：+886 2 1234 5678</p>
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