"use client"

import { BentoGrid, BentoCard } from "@/components/ui/bento-grid"
import RetroGrid from "@/components/ui/retro-grid"
import BlurFade from "@/components/ui/blur-fade"
import { RainbowButton } from "@/components/ui/rainbow-button"
import Link from 'next/link'
import { 
  RocketIcon, 
  CalendarIcon, 
  ChatBubbleIcon, 
  GearIcon,
  ClockIcon,
  BellIcon,
  CheckboxIcon,
  PersonIcon,
  BarChartIcon
} from "@radix-ui/react-icons"

export default function BentoPage() {
  const cards = [
    {
      name: "日程管理",
      Icon: CalendarIcon,
      description: "智能管理您的日常事项，包含截止时间提醒、优先级排序、分类管理等功能。支持日/周/月视图切换，帮您高效规划时间。",
      className: "md:col-span-2",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 opacity-80" />
      ),
      href: "/",
      cta: "管理日程",
      features: ["智能提醒", "多视图切换", "优先级排序"]
    },
    {
      name: "AI助理对话",
      Icon: ChatBubbleIcon,
      description: "智能AI助手随时为您服务，可以帮您分析日程、提供建议、回答问题，支持自然语言交互。",
      className: "md:col-span-1",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-100 opacity-80" />
      ),
      href: "/assistant",
      cta: "开始对话",
      features: ["智能对话", "日程分析", "建议优化"]
    },
    {
      name: "时间统计",
      Icon: ClockIcon,
      description: "详细统计您的时间使用情况，生成可视化报表，帮您发现时间管理的优化空间。",
      className: "md:col-span-1",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-amber-100 opacity-80" />
      ),
      href: "/statistics",
      cta: "查看统计",
      features: ["时间追踪", "数据分析", "效率报告"]
    },
    {
      name: "任务追踪",
      Icon: CheckboxIcon,
      description: "可视化展示任务完成进度，支持任务分解、进度更新、协作共享等功能。",
      className: "md:col-span-1",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-red-100 opacity-80" />
      ),
      href: "/tasks",
      cta: "追踪任务",
      features: ["进度管理", "任务分解", "协作共享"]
    },
    {
      name: "数据分析",
      Icon: BarChartIcon,
      description: "深入分析您的工作效率和时间分配，生成个性化的改进建议和优化方案。",
      className: "md:col-span-1",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 opacity-80" />
      ),
      href: "/analytics",
      cta: "查看分析",
      features: ["效率分析", "趋势报告", "优化建议"]
    },
    {
      name: "提醒设置",
      Icon: BellIcon,
      description: "自定义提醒方式，支持多种提醒类型和时间设置，确保重要事项不会遗漏。",
      className: "md:col-span-1",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-cyan-100 opacity-80" />
      ),
      href: "/notifications",
      cta: "设置提醒",
      features: ["自定义提醒", "多渠道通知", "智能提醒"]
    },
    {
      name: "个人设置",
      Icon: PersonIcon,
      description: "个性化您的使用体验，包括界面主题、语言偏好、通知设置等，打造专属的效率工具。",
      className: "md:col-span-2",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-fuchsia-100 opacity-80" />
      ),
      href: "/settings",
      cta: "前往设置",
      features: ["个性化定制", "主题切换", "偏好设置"]
    }
  ]

  const renderCardContent = (card: typeof cards[0]) => {
    return (
      <>
        <span className="block mb-2">{card.description}</span>
        <div className="flex flex-wrap gap-2">
          {card.features.map((feature, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10"
            >
              {feature}
            </span>
          ))}
        </div>
      </>
    )
  }

  return (
    <div className="relative min-h-screen">
      <RetroGrid className="fixed inset-0" />

      <div className="relative p-8">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <RainbowButton>
              返回主页
            </RainbowButton>
          </Link>
          <h1 className="text-2xl font-bold">功能导航</h1>
          <div className="w-[100px]" />
        </div>

        {/* Bento Grid */}
        <BlurFade>
          <BentoGrid className="max-w-7xl mx-auto">
            {cards.map((card) => (
              <BentoCard 
                key={card.name} 
                {...card}
                description={renderCardContent(card)}
              />
            ))}
          </BentoGrid>
        </BlurFade>
      </div>
    </div>
  )
} 