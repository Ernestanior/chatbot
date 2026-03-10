"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoChat } from "@/components/demo-chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LandingPage() {
  const t = useTranslations('marketing');
  const tCommon = useTranslations('common');
  const [activeFeature, setActiveFeature] = useState(0);
  const [stats, setStats] = useState({ messages: 0, satisfaction: 0, time: 0 });

  // Animated stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        messages: Math.min(prev.messages + 127, 50000),
        satisfaction: Math.min(prev.satisfaction + 2, 95),
        time: Math.min(prev.time + 0.1, 1.8)
      }));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: "AI 笔记本",
      icon: "📝",
      description: "用自然语言描述你的品牌和产品，AI 自动学习并生成专业回复",
      demo: "只需输入：'我们是一家台湾手摇饮品牌，主打珍珠奶茶...'，AI 就能理解并自动回复客户关于产品、价格、营业时间等问题。"
    },
    {
      title: "多平台整合",
      icon: "🔗",
      description: "一键连接 Facebook Page 和 Instagram，统一管理所有对话",
      demo: "支持 Facebook Messenger、Instagram Direct、评论回复。所有平台的消息集中在一个界面，再也不用切换多个 App。"
    },
    {
      title: "智能触发规则",
      icon: "⚡",
      description: "设置关键词和 hashtag，自动发送私信或回复评论",
      demo: "例如：当用户在贴文评论 '#想要' 时，自动发送私信提供购买链接。或者当用户提到 '价格' 时，自动回复价目表。"
    },
    {
      title: "数据分析",
      icon: "📊",
      description: "实时追踪对话数据、客户满意度和 AI 表现",
      demo: "查看每日对话量、AI 处理率、平均响应时间、客户满意度评分等关键指标，持续优化服务质量。"
    }
  ];

  const testimonials = [
    {
      name: "小样奶茶店",
      role: "创始人",
      content: "使用 ChatBotAI 后，我们的客服效率提升了 300%，客户满意度也从 75% 提升到 92%。现在即使深夜也能即时回复客户！",
      avatar: "🧋"
    },
    {
      name: "美妆工作室",
      role: "营运经理",
      content: "以前每天要花 3-4 小时回复 Instagram 私信，现在 AI 帮我处理了 80% 的常见问题，我可以专注在真正需要人工处理的复杂咨询。",
      avatar: "💄"
    },
    {
      name: "服饰品牌",
      role: "电商负责人",
      content: "最喜欢的功能是自动触发规则！现在客户在贴文留言 '#想要'，系统就自动发送购买链接，转化率提升了 45%。",
      avatar: "👗"
    }
  ];

  const faqs = [
    {
      q: "AI 会不会回答错误或不专业？",
      a: "ChatBotAI 基于您提供的品牌信息和知识库进行回复，确保答案准确且符合品牌调性。您可以随时在 AI 笔记本中调整内容，AI 会立即学习更新。遇到复杂问题时，系统会自动转接人工客服。"
    },
    {
      q: "需要多久才能设置完成？",
      a: "只需 10-15 分钟！连接 Facebook/Instagram 账号后，用自然语言描述您的品牌，AI 会自动生成初始知识库。您可以立即开始使用，之后再慢慢优化内容。"
    },
    {
      q: "支持哪些语言？",
      a: "目前支持繁体中文、简体中文、英文。AI 能自动识别客户使用的语言并用相同语言回复。"
    },
    {
      q: "如果 AI 无法回答怎么办？",
      a: "系统会自动识别复杂问题并标记为需要人工处理。您可以在讯息中心看到这些对话，并手动回复。AI 会从您的回复中学习，下次遇到类似问题就能自动处理。"
    },
    {
      q: "价格方案可以随时更改吗？",
      a: "可以！您可以随时升级或降级方案。升级立即生效，降级则在下个计费周期生效。我们提供 14 天免费试用，无需信用卡。"
    }
  ];

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

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
            <a href="#how-it-works" className="text-sm hover:text-blue-600 transition-colors">使用流程</a>
            <a href="#testimonials" className="text-sm hover:text-blue-600 transition-colors">客户评价</a>
            <a href="#faq" className="text-sm hover:text-blue-600 transition-colors">常见问题</a>
            <a href="#pricing" className="text-sm hover:text-blue-600 transition-colors">价格方案</a>
            <Link href="/privacy" className="text-sm hover:text-blue-600 transition-colors">隐私政策</Link>
            <Link href="/terms" className="text-sm hover:text-blue-600 transition-colors">服务条款</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost" size="sm">{tCommon('login')}</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                {t('getStarted')}
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
        <div className="flex items-center justify-center gap-4 mb-12">
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
        
        {/* Animated Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div>
            <div className="text-4xl font-bold text-blue-600">{Math.floor(stats.messages).toLocaleString()}+</div>
            <div className="text-sm text-muted-foreground mt-1">每月处理消息</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-600">{stats.satisfaction.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground mt-1">客户满意度</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-pink-600">{stats.time.toFixed(1)}s</div>
            <div className="text-sm text-muted-foreground mt-1">平均响应时间</div>
          </div>
        </div>
      </section>

      {/* Interactive Features */}
      <section id="features" className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">强大的功能特色</h2>
          <p className="text-muted-foreground text-lg">点击了解每个功能的详细说明</p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className={`p-6 cursor-pointer transition-all ${
                  activeFeature === idx
                    ? "border-2 border-blue-600 shadow-lg scale-105"
                    : "hover:shadow-md"
                }`}
                onClick={() => setActiveFeature(idx)}
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
          
          <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{features[activeFeature].icon}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3">{features[activeFeature].title}</h3>
                <p className="text-lg leading-relaxed">{features[activeFeature].demo}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">三步开始使用</h2>
          <p className="text-muted-foreground text-lg">简单快速，10 分钟完成设置</p>
        </div>
        
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          <Card className="p-6 text-center relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div className="text-5xl mb-4 mt-2">🔗</div>
            <h3 className="font-bold mb-2">连接平台</h3>
            <p className="text-sm text-muted-foreground">
              一键连接 Facebook Page 和 Instagram 商业账号，授权后即可开始
            </p>
          </Card>
          
          <Card className="p-6 text-center relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div className="text-5xl mb-4 mt-2">📝</div>
            <h3 className="font-bold mb-2">训练 AI</h3>
            <p className="text-sm text-muted-foreground">
              用自然语言描述品牌、产品和常见问题，AI 自动学习生成知识库
            </p>
          </Card>
          
          <Card className="p-6 text-center relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div className="text-5xl mb-4 mt-2">🚀</div>
            <h3 className="font-bold mb-2">开始使用</h3>
            <p className="text-sm text-muted-foreground">
              启用 AI 自动回复，客户消息将在 2 秒内获得专业回复
            </p>
          </Card>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">🎮 互动演示</h2>
          <p className="text-muted-foreground text-lg">亲自体验 AI 客服的智能对话能力</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <DemoChat />
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">客户怎么说</h2>
          <p className="text-muted-foreground text-lg">来自真实用户的评价</p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-6xl opacity-10">"</div>
            <div className="flex items-start gap-4">
              <div className="text-5xl">{testimonials[currentTestimonial].avatar}</div>
              <div className="flex-1">
                <p className="text-lg mb-4 leading-relaxed">{testimonials[currentTestimonial].content}</p>
                <div>
                  <div className="font-semibold">{testimonials[currentTestimonial].name}</div>
                  <div className="text-sm text-muted-foreground">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentTestimonial ? "bg-blue-600 w-8" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">常见问题</h2>
          <p className="text-muted-foreground text-lg">点击查看详细解答</p>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <Card
              key={idx}
              className="overflow-hidden cursor-pointer transition-all hover:shadow-md"
              onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{faq.q}</h3>
                  <span className="text-2xl transition-transform" style={{
                    transform: expandedFaq === idx ? "rotate(180deg)" : "rotate(0deg)"
                  }}>
                    ▼
                  </span>
                </div>
                {expandedFaq === idx && (
                  <p className="mt-4 text-muted-foreground leading-relaxed">{faq.a}</p>
                )}
              </div>
            </Card>
          ))}
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