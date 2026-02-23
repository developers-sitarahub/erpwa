"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  MessageSquare,
  Workflow,
  Zap,
  ArrowRight,
  Bot,
  Layers,
  CheckCircle2,
  Globe,
  Lock,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { Logo } from "@/components/logo";
import { BorderBeam } from "@/components/ui/border-beam";
import { TestimonialsSection } from "@/components/testimonials";
import { Marquee } from "@/components/magicui/marquee";
import { Typewriter } from "@/components/magicui/typewriter";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.05]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 50]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden selection:bg-purple-500/30 font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[128px] opacity-50" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[128px] opacity-50" />
        <GridPattern />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl supports-backdrop-filter:bg-slate-950/40">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="force-dark w-40 h-12">
              <Logo isSidebar={true} />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#workflows">Workflows</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href="#testimonials">Testimonials</NavLink>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-10 w-28 bg-white/5 animate-pulse rounded-full" />
            ) : user ? (
              <Link
                href={
                  user.role === "vendor_owner" || user.role === "vendor_admin"
                    ? "/admin/dashboard"
                    : "/dashboard"
                }
              >
                <button className="group px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium flex items-center gap-2 cursor-pointer backdrop-blur-sm">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            ) : (
              <Link href="/register">
                <button className="relative px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-slate-100 text-slate-950 hover:bg-white transition-all text-xs sm:text-sm font-bold shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.5)] cursor-pointer overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-2">
                    Start free trial
                  </span>
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="container mx-auto max-w-5xl text-center z-10 relative"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-slate-300">
                v1.0 is now live
              </span>
              {/* <span className="w-px h-4 bg-white/10 mx-1" /> */}
              {/* <span className="text-sm font-medium text-purple-300 flex items-center gap-1">
                See what&apos;s new <ArrowRight className="w-3 h-3" />
              </span> */}
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1] px-2"
          >
            <Typewriter
              texts={["Connect on", "Business on", "Work on", "Manage your"]}
              className="mr-3 sm:mr-4 md:mr-5"
            />
            <br className="hidden md:block" />
            <span className="relative inline-block">
              <span className="absolute -inset-2 bg-linear-to-r from-green-500/20 to-blue-500/20 blur-2xl rounded-full" />
              <span className="relative bg-clip-text text-transparent bg-linear-to-r from-green-400 via-blue-400 to-purple-400 animate-gradient-x">
                WhatsApp
              </span>
            </span>{" "}
            like never before.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl text-slate-400 mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4 md:px-0"
          >
            Unlock the power of native flows, dual workflow engines, and
            interactive catalogs. The complete toolkit for modern businesses to
            scale their messaging.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 px-6 sm:px-0"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto h-14 px-8 rounded-full bg-white text-slate-950 font-bold text-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                Get Started <Zap className="w-5 h-5 fill-slate-950" />
              </button>
            </Link>
            <button className="w-full sm:w-auto h-14 px-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-lg font-bold transition-all flex items-center justify-center gap-3 cursor-pointer backdrop-blur-sm group">
              Watch Demo
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <span className="ml-0.5 text-xs">▶</span>
              </div>
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof Marquee */}
      <div className="border-y border-white/5 bg-slate-950/50 backdrop-blur-sm overflow-hidden">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-slate-950 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-slate-950 to-transparent z-10" />

          <LogoMarquee />
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Native WhatsApp Superpowers
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Don&apos;t just send text. Create interactive experiences. GPSERP
              gives you access to the full Meta Business API suite.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SpotlightCard
              icon={<Layers className="w-8 h-8 text-blue-400" />}
              title="Native Flows"
              description="Build interactive forms, appointment books, and surveys directly inside WhatsApp. No external links needed."
              delay={0}
            />
            <SpotlightCard
              icon={<MessageSquare className="w-8 h-8 text-green-400" />}
              title="Rich Catalogs"
              description="Send multi-product carousels that let customers browse your inventory without leaving the chat."
              delay={0.1}
            />
            <SpotlightCard
              icon={<Bot className="w-8 h-8 text-purple-400" />}
              title="AI Chatbots"
              description="Deploy intelligent agents that handle support queries 24/7 with our visual node-based builder."
              delay={0.2}
            />
            <SpotlightCard
              icon={<Globe className="w-8 h-8 text-cyan-400" />}
              title="Unified Inbox"
              description="Manage conversations from all channels in a single, collaborative team inbox with assignment rules."
              delay={0.3}
            />
            <SpotlightCard
              icon={<Lock className="w-8 h-8 text-orange-400" />}
              title="Enterprise Security"
              description="Role-based access control, audit logs, and data encryption to keep your customer data safe."
              delay={0.4}
            />
            <SpotlightCard
              icon={<Smartphone className="w-8 h-8 text-pink-400" />}
              title="Mobile First"
              description="Manage your business on the go with our fully responsive mobile dashboard and apps."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Dual Workflows Section */}
      <section id="workflows" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-slate-950 via-purple-950/20 to-slate-950 pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-block p-2 rounded-xl bg-purple-500/10 mb-6">
                <Workflow className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight">
                Two Engines, <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-blue-400">
                  Infinite Possibilities.
                </span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                Most platforms lock you into a single way of doing things. We
                separated the logic to give you ultimate control.
              </p>

              <div className="space-y-8">
                <div className="flex gap-5 group">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all shadow-lg">
                    <Workflow className="text-blue-400 w-7 h-7 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2 text-white group-hover:text-blue-300 transition-colors">
                      CRM Workflows
                    </h3>
                    <p className="text-slate-400 leading-relaxed select-text">
                      Automate lead assignments, tag updates, and internal
                      notifications based on triggers like &quot;New
                      Message&quot; or &quot;Status Changed&quot;.
                    </p>
                  </div>
                </div>

                <div className="flex gap-5 group">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-all shadow-lg">
                    <Bot className="text-purple-400 w-7 h-7 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2 text-white group-hover:text-purple-300 transition-colors">
                      Conversational Flows
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                      Visual drag-and-drop builder for customer-facing chat
                      interactions. Build menus, quizzes, and support routing
                      logic.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              {/* Premium Glass Card for Workflow Visual */}
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-slate-900/40 backdrop-blur-2xl shadow-[0_0_50px_-10px_rgba(168,85,247,0.15)] flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="ml-4 h-2 w-32 bg-white/10 rounded-full" />
                </div>

                <div className="flex-1 relative p-8">
                  {/* Mock Nodes */}
                  <div className="absolute top-[8%] left-[8%] sm:top-12 sm:left-12 p-3 sm:p-4 bg-slate-800 rounded-xl border border-white/10 shadow-lg w-36 sm:w-48 z-10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm">
                        Inbound Message
                      </span>
                    </div>
                    <div className="h-1 sm:h-1.5 w-full bg-white/5 rounded-full" />
                  </div>

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 sm:p-4 bg-slate-800 rounded-xl border border-purple-500/30 shadow-lg w-36 sm:w-48 z-20 shadow-purple-900/20">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm">
                        AI Auto-Reply
                      </span>
                    </div>
                    <div className="h-1 sm:h-1.5 w-2/3 bg-white/5 rounded-full mb-1.5 sm:mb-2" />
                    <div className="h-1 sm:h-1.5 w-1/2 bg-white/5 rounded-full" />
                  </div>

                  <div className="absolute bottom-[8%] right-[8%] sm:bottom-12 sm:right-12 p-3 sm:p-4 bg-slate-800 rounded-xl border border-white/10 shadow-lg w-36 sm:w-48 z-10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Workflow className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm">
                        Update CRM
                      </span>
                    </div>
                    <div className="h-1 sm:h-1.5 w-full bg-white/5 rounded-full" />
                  </div>

                  {/* Connecting Spline Lines */}
                  <svg
                    viewBox="0 0 500 500"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-50"
                  >
                    <path
                      d="M 120 100 C 120 250, 250 150, 250 250"
                      stroke="url(#linegrad1)"
                      strokeWidth="3"
                      fill="none"
                      className="animate-dash"
                    />
                    <path
                      d="M 250 250 C 250 350, 380 250, 380 400"
                      stroke="url(#linegrad2)"
                      strokeWidth="3"
                      fill="none"
                      className="animate-dash [animation-delay:0.5s]"
                    />
                    <defs>
                      <linearGradient
                        id="linegrad1"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#4ADE80" stopOpacity="0" />
                        <stop offset="50%" stopColor="#4ADE80" />
                        <stop offset="100%" stopColor="#A855F7" />
                      </linearGradient>
                      <linearGradient
                        id="linegrad2"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop
                          offset="100%"
                          stopColor="#3B82F6"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 relative overflow-hidden">
        {/* Background blobs for pricing */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Simple, transparent pricing.
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Choose the plan that fits your business needs. No hidden fees.
              Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start max-w-md md:max-w-4xl lg:max-w-none mx-auto">
            <PricingCard
              title="Starter"
              price="$29"
              description="Perfect for small businesses starting with WhatsApp API."
              features={[
                "1 WhatsApp API Number",
                "Green Tick Assistance",
                "Basic Unified Inbox",
                "Campaign Broadcasts",
                "Meta Chat Fees Billed Separately",
              ]}
              buttonText="Start free trial"
              href="/register?plan=starter"
              delay={0}
            />

            <PricingCard
              title="Professional"
              price="$79"
              description="For growing businesses needing automation and flows."
              features={[
                "Up to 3 WhatsApp Numbers",
                "Drag & Drop Flow Builder",
                "CRM Integrations",
                "Interactive Catalogs",
                "Unlimited Team Members",
                "Advanced Analytics",
                "Meta Chat Fees Billed Separately",
              ]}
              buttonText="Start Free Trial"
              href="/register?plan=pro"
              featured={true}
              delay={0.1}
            />

            <PricingCard
              title="Enterprise"
              price="Custom"
              description="Tailored solutions for large-scale operations."
              features={[
                "Unlimited WhatsApp Numbers",
                "Dedicated Success Manager",
                "Custom API Development",
                "High Volume Throughput",
                "On-premise Deployment",
                "SSO & Role-Based Access",
                "Custom Volume Discounts",
              ]}
              buttonText="Contact Sales"
              href="mailto:sales@gpserp.com"
              isEnterprise={true}
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 bg-slate-950 text-sm">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-6">
                <div className="force-dark w-32 h-10">
                  <Logo isSidebar={true} />
                </div>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed">
                The most powerful WhatsApp marketing and automation platform for
                modern businesses. Built for scale, security, and reliability.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Product</h4>
              <ul className="space-y-4 text-slate-400">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#workflows"
                    className="hover:text-white transition-colors"
                  >
                    Workflows
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API Docs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Company</h4>
              <ul className="space-y-4 text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500">
            <div>&copy; 2026 GPSERP. All rights reserved.</div>
            <div className="flex gap-8">
              <Link
                href="/privacy-policy"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-n-condition"
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Components ---

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="relative group py-2">
      <span className="relative z-10 group-hover:text-white transition-colors">
        {children}
      </span>
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full" />
    </a>
  );
}

function SpotlightCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={divRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="group relative h-full isolate"
    >
      {/* Outer Glow on Hover */}
      <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-700" />

      {/* Card Body */}
      <div className="relative h-full overflow-hidden rounded-3xl bg-slate-900 border border-white/5 p-8 transition-colors duration-500 group-hover:bg-slate-800/80 group-hover:border-purple-500/30 shadow-xl shadow-black/50">
        {/* Soft Inner Gradient behind the content */}
        <div className="absolute inset-0 bg-linear-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <BorderBeam
          size={250}
          duration={12}
          delay={delay * 9}
          colorFrom="#A855F7"
          colorTo="#3B82F6"
        />

        {/* Dynamic Spotlight Effect following the mouse */}
        <div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 mix-blend-screen"
          style={{
            background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(168,85,247,0.15), transparent 40%)`,
          }}
        />

        <div className="relative flex flex-col h-full z-10">
          {/* Header Row: Icon + Arrow */}
          <div className="mb-6 flex items-start justify-between">
            {/* Animated Icon Container */}
            <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-lg transition-all duration-500 overflow-hidden group-hover:scale-110 group-hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)] group-hover:border-purple-500/30">
              {/* Spinning gradient behind the icon */}
              <div className="absolute inset-0 bg-linear-to-tr from-purple-500/20 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div
                className={`relative z-10 transition-colors duration-500 ${isHovered ? "text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" : "text-slate-400"}`}
              >
                {icon}
              </div>
            </div>

            {/* Hover Indicator Arrow */}
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 opacity-0 -translate-x-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0 group-hover:border-purple-500/30">
              <ArrowRight className="w-4 h-4 text-purple-400" />
            </div>
          </div>

          <h3 className="mb-3 text-xl font-bold tracking-tight text-white transition-all duration-500 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-white group-hover:to-purple-200">
            {title}
          </h3>

          <p className="text-sm leading-relaxed text-slate-400 transition-colors duration-500 group-hover:text-slate-300">
            {description}
          </p>

          {/* Animated decorative bottom line */}
          <div className="absolute bottom-[-32px] left-[-32px] right-[-32px] h-[2px] bg-linear-to-r from-transparent via-purple-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out opacity-50" />
        </div>
      </div>
    </motion.div>
  );
}

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  href: string;
  featured?: boolean;
  isEnterprise?: boolean;
  delay: number;
}

function PricingCard({
  title,
  price,
  description,
  features,
  buttonText,
  href,
  featured = false,
  isEnterprise = false,
  delay,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={`group relative h-full rounded-3xl p-px ${
        featured
          ? "shadow-2xl shadow-purple-900/40 z-10 scale-105"
          : "shadow-xl shadow-black/50 z-0"
      }`}
    >
      {/* Animated Flowing Gradient Border (Using standard Tailwind animations) */}
      <div
        className={`absolute inset-0 rounded-3xl overflow-hidden pointer-events-none ${
          featured
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        }`}
      >
        <div
          className="absolute -inset-full animate-[spin_4s_linear_infinite]"
          style={{
            background: featured
              ? "conic-gradient(from 0deg, transparent 0 340deg, #A855F7 360deg)"
              : isEnterprise
                ? "conic-gradient(from 0deg, transparent 0 340deg, #10B981 360deg)"
                : "conic-gradient(from 0deg, transparent 0 340deg, #3B82F6 360deg)",
          }}
        />
      </div>

      {/* Static Border Fallback / Base border */}
      <div
        className={`absolute inset-0 rounded-3xl transition-opacity duration-300 pointer-events-none ${
          featured
            ? "border border-purple-500/30 opacity-0 group-hover:opacity-100"
            : "border border-white/5 opacity-100 group-hover:opacity-0"
        }`}
      />

      {/* Card Content Container */}
      <div
        className={`relative flex flex-col h-full rounded-[23px] p-8 overflow-hidden transition-colors duration-500 ${
          featured
            ? "bg-slate-900/90"
            : "bg-slate-900/80 group-hover:bg-slate-900/90"
        }`}
      >
        {/* Soft Inner Glow */}
        <div
          className={`absolute inset-0 bg-linear-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
            featured
              ? "from-purple-500/10 to-transparent"
              : isEnterprise
                ? "from-emerald-500/10 to-transparent"
                : "from-blue-500/5 to-transparent"
          }`}
        />

        {featured && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-linear-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-b-xl text-xs font-bold uppercase tracking-wide shadow-lg border-x border-b border-purple-400/30">
            Most Popular
          </div>
        )}

        <div className="mb-8 relative z-10 mt-2">
          <h3
            className={`text-lg font-bold mb-2 transition-colors duration-300 ${
              featured
                ? "text-purple-300"
                : isEnterprise
                  ? "text-slate-300 group-hover:text-emerald-400"
                  : "text-slate-300 group-hover:text-blue-300"
            }`}
          >
            {title}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-extrabold text-white tracking-tight">
              {price}
            </span>
            {price !== "Custom" && (
              <span className="text-slate-500 font-medium tracking-wide">
                /mo
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-4 h-10 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        <div className="flex-1 space-y-5 mb-8 relative z-10 mt-4">
          {features.map((feature: string) => (
            <div
              key={feature}
              className="flex items-start gap-3 text-sm text-slate-300 transition-transform duration-300 group-hover:translate-x-1"
            >
              <CheckCircle2
                className={`w-5 h-5 shrink-0 transition-colors duration-300 ${
                  featured
                    ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                    : isEnterprise
                      ? "text-emerald-500/70 group-hover:text-emerald-400"
                      : "text-blue-500/70 group-hover:text-blue-400"
                }`}
              />
              <span className="leading-tight">{feature}</span>
            </div>
          ))}
        </div>

        <Link href={href} className="w-full relative z-10 mt-auto">
          <button
            className={`w-full py-4 rounded-xl font-bold transition-all cursor-pointer relative overflow-hidden group/btn ${
              featured
                ? "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]"
                : isEnterprise
                  ? "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-emerald-500/50"
                  : "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-blue-500/50"
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {buttonText}
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover/btn:opacity-100 group-hover/btn:translate-x-0" />
            </span>
            {/* Button Shine Effect */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

function GridPattern() {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    />
  );
}

function LogoMarquee() {
  const logos = [
    "Acme Corp",
    "GlobalVentures",
    "Nebula",
    "Trio",
    "FoxRun",
    "Spherule",
    "NiteLife",
  ];

  return (
    <div className="relative flex overflow-hidden w-full group py-2">
      <Marquee
        pauseOnHover
        className="[--duration:25s] [--gap:3rem] md:[--gap:4rem]"
      >
        {logos.map((logo, i) => (
          <span
            key={i}
            className="text-xl md:text-2xl font-bold font-serif text-slate-300 whitespace-nowrap opacity-50 transition-opacity duration-300 group-hover:opacity-80 px-[1rem] md:px-[1.5rem]"
          >
            {logo}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
