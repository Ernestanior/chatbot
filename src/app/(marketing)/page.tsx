"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoChat } from "@/components/demo-chat";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🤖</div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ChatBotAI
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm hover:text-blue-600 transition-colors">功能特色</a>
            <a href="#demo" className="text-sm hover:text-blue-600 transition-colors">互动演示</a>
            <a href="#pricing" className="text-sm hover:text-blue-600 transition-colors">价格方案</a>
            <Link href="/privacy" className="text-sm hover:text-blue-600 transition-colors">隐私政策</Link>
            <Link href="/terms" className="text-sm hover:text-blue-600 transition-colors">服务条款</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">登录</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                免费开始
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          ✨ AI 驱动的智能客服
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          让 AI 为你的品牌
          <br />
          24/7 自动回复客户
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          连接 Facebook 和 Instagram，用 AI 笔记本训练专属客服，
          自动回复客户消息，提升响应速度，节省人力成本
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8">
              立即开始 →
            </Button>
          </Link>
          <a href="#demo">
            <Button size="lg" variant="outline" className="text-lg px-8">
              查看演示
            </Button>
          </a>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
          <div>
            <div className="text-4xl font-bold text-blue-600">24/7</div>
            <div className="text-sm text-muted-foreground mt-1">全天候服务</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-600">&lt;2s</div>
            <div className="text-sm text-muted-foreground mt-1">平均响应时间</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-pink-600">90%+</div>
            <div className="text-sm text-muted-foreground mt-1">问题解决率</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">强大的功能特色</h2>
          <p className="text-muted-foreground text-lg">一站式 AI 客服解决方案</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow border-2">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI 笔记本</h3>
            <p className="text-muted-foreground">
              用简单的文字描述你的品牌、产品和常见问题，AI 自动学习并生成专业回复
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold mb-2">多平台连接</h3>
            <p className="text-muted-foreground">
              一键连接 Facebook Page 和 Instagram 商业账号，统一管理所有客户对话
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">实时自动回复</h3>
            <p className="text-muted-foreground">
              客户发送消息后 2 秒内自动回复，提升客户满意度和转化率
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">智能触发规则</h3>
            <p className="text-muted-foreground">
              设置关键词和 hashtag 触发器，自动发送私信或回复评论
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">数据洞察</h3>
            <p className="text-muted-foreground">
              追踪对话数据、客户满意度和 AI 表现，持续优化服务质量
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold mb-2">人工接管</h3>
            <p className="text-muted-foreground">
              遇到复杂问题时，一键切换到人工客服，确保客户体验
            </p>
          </Card>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">🎮 互动演示</h2>
          <p className="text-muted-foreground text-lg">亲自体验 AI 客服的智能对话能力</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <DemoChat />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">简单透明的价格</h2>
          <p className="text-muted-foreground text-lg">选择适合你的方案</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-bold mb-2">免费版</h3>
            <div className="text-4xl font-bold mb-4">$0<span className="text-lg text-muted-foreground">/月</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">1 个品牌</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">100 条消息/月</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">基础 AI 笔记本</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">✗</span>
                <span className="text-sm text-muted-foreground">多平台连接</span>
              </li>
            </ul>
            <Link href="/login">
              <Button variant="outline" className="w-full">开始使用</Button>
            </Link>
          </Card>

          <Card className="p-6 border-2 border-blue-600 hover:shadow-xl transition-shadow relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">推荐</Badge>
            <h3 className="text-2xl font-bold mb-2">专业版</h3>
            <div className="text-4xl font-bold mb-4">$29<span className="text-lg text-muted-foreground">/月</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">3 个品牌</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">5,000 条消息/月</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">完整 AI 笔记本</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">多平台连接</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">数据分析</span>
              </li>
            </ul>
            <Link href="/login">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">立即订阅</Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-bold mb-2">企业版</h3>
            <div className="text-4xl font-bold mb-4">$99<span className="text-lg text-muted-foreground">/月</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">无限品牌</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">无限消息</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">所有功能</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">优先支持</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">定制开发</span>
              </li>
            </ul>
            <Link href="/login">
              <Button variant="outline" className="w-full">联系我们</Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <h2 className="text-4xl font-bold mb-4">准备好开始了吗？</h2>
          <p className="text-xl mb-8 opacity-90">
            立即注册，免费试用 14 天，无需信用卡
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              免费开始 →
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-2xl">🤖</div>
                <span className="text-xl font-bold">ChatBotAI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI 驱动的智能客服平台，让每个品牌都能拥有 24/7 自动化客服
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">产品</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">功能特色</a></li>
                <li><a href="#pricing" className="hover:text-foreground">价格方案</a></li>
                <li><a href="#demo" className="hover:text-foreground">互动演示</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">公司</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">隐私政策</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">服务条款</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">联系我们</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@chatbotai.com</li>
                <li>+886 2 1234 5678</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2026 ChatBotAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}