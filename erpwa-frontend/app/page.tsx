"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Workflow,
  Zap,
  ArrowRight,
  Bot,
  Layers,
  CheckCircle2,
  Globe,
  Smartphone,
  ChevronDown,
  Megaphone,
  BarChart3,
  Users,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { BorderBeam } from "@/components/ui/border-beam";
import { TestimonialsSection } from "@/components/testimonials";
import { Marquee } from "@/components/magicui/marquee";
import { Typewriter } from "@/components/magicui/typewriter";
import api from "@/lib/api";
import { FAQSection } from "@/components/faq";
import { HeroVisual } from "@/components/HeroVisual";
import { Logo } from "@/components/logo";

type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  conversationLimit: number;
  galleryLimit: number;
  chatbotLimit: number;
  templateLimit: number;
  formLimit: number;
  teamUsersLimit: number;
};

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    api.get("/subscription/public-plans")
      .then(res => {
        const sorted = res.data.sort((a: Plan, b: Plan) => {
          const order = ["Free", "Basic", "Custom", "Unlimited"];
          const idxA = order.indexOf(a.name);
          const idxB = order.indexOf(b.name);
          return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        });
        setPlans(sorted);
      })
      .catch(err => console.error("Failed to fetch plans", err))
      .finally(() => setPlansLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden selection:bg-purple-500/30 font-sans scroll-smooth">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[128px] opacity-50" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[128px] opacity-50" />
        <GridPattern />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl supports-backdrop-filter:bg-slate-950/40">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="w-32 h-10" isSidebar={true} forceWhite={true} />
            </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#workflows">Workflows</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href="#testimonials">Testimonials</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
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
                    Start free trial <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 px-6 text-center">
        <div className="container mx-auto max-w-6xl z-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse transition-all shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-bold text-slate-300">v1.0 is now live</span>
          </motion.div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 leading-[1.05] px-2">
            <Typewriter
              texts={["Business on", "Connect on", "Manage your", "Work on"]}
              className="inline-block mr-3 sm:mr-4 md:mr-5"
            />
            <br className="hidden md:block" />
            <span className="relative inline-block">
              <span className="absolute -inset-4 bg-linear-to-r from-green-500/30 to-blue-500/30 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative bg-clip-text text-transparent bg-linear-to-r from-green-400 via-blue-400 to-purple-400 animate-gradient-x p-1">
                WhatsApp
              </span>
            </span>{" "}
            like never before.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4 md:px-0">
            Unlock the power of native flows, dual workflow engines, and interactive catalogs. 
            The complete toolkit for modern businesses to scale their messaging.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 px-6 sm:px-0 mb-8">
            <Link href="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto h-14 px-10 rounded-full bg-slate-200 text-slate-950 font-black text-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)] hover:scale-[1.02]">
                Start free trial <Zap className="w-5 h-5 fill-slate-950" />
              </button>
            </Link>
            <button className="w-full sm:w-auto h-14 px-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-lg font-bold transition-all flex items-center justify-center gap-3 cursor-pointer backdrop-blur-sm group">
              Watch Demo
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <span className="ml-1 text-xs text-blue-400">▶</span>
              </div>
            </button>
          </div>


        </div>
      </section>

      {/* Social Proof Marquee */}
      <div className="border-y border-white/5 bg-slate-950/50 backdrop-blur-sm overflow-hidden py-8">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-slate-950 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-slate-950 to-transparent z-10" />
          <LogoMarquee />
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 px-4">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              Native WhatsApp Superpowers
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Don&apos;t just send text. Create interactive experiences. GPSERP gives you access to the full Meta Business API suite.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SpotlightCard
              icon={<Layers className="w-8 h-8 text-green-400" />}
              title="Native Flows"
              description="Build interactive forms, appointment books, and surveys directly inside WhatsApp. No external links needed."
              delay={0}
            />
            <SpotlightCard
              icon={<MessageSquare className="w-8 h-8 text-purple-400" />}
              title="Rich Catalogs"
              description="Send multi-product carousels that let customers browse your inventory without leaving the chat."
              delay={0.1}
            />
            <SpotlightCard
              icon={<Bot className="w-8 h-8 text-cyan-400" />}
              title="AI Chatbots"
              description="Deploy intelligent agents that handle support queries 24/7 with our visual node-based builder."
              delay={0.2}
            />
            <SpotlightCard
              icon={<Users className="w-8 h-8 text-blue-400" />}
              title="Unified Inbox"
              description="Manage conversations from all channels in a single, collaborative team inbox with assignment rules."
              delay={0.3}
            />
            <SpotlightCard
              icon={<CheckCircle2 className="w-8 h-8 text-orange-400" />}
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



      {/* Workflows Section */}
      <section id="workflows" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-slate-950 via-purple-950/20 to-slate-950 pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
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
            </div>

            <div className="relative">
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-slate-900/40 backdrop-blur-2xl shadow-[0_0_50px_-10px_rgba(59,130,246,0.15)] flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="ml-4 h-2 w-32 bg-white/10 rounded-full" />
                </div>

                <div className="flex-1 relative p-8 text-center sm:text-left">
                  <div className="absolute top-[8%] left-[8%] sm:top-12 sm:left-12 p-3 sm:p-4 bg-slate-800 rounded-xl border border-white/10 shadow-lg w-36 sm:w-48 z-10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm">Inbound Message</span>
                    </div>
                    <div className="h-1 sm:h-1.5 w-full bg-white/5 rounded-full" />
                  </div>

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 sm:p-4 bg-slate-800 rounded-xl border border-purple-500/30 shadow-lg w-36 sm:w-48 z-20 shadow-purple-900/20">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm">AI Auto-Reply</span>
                    </div>
                    <div className="h-1 sm:h-1.5 w-2/3 bg-white/5 rounded-full mb-1.5 sm:mb-2" />
                    <div className="h-1 sm:h-1.5 w-1/2 bg-white/5 rounded-full" />
                  </div>

                  <div className="absolute bottom-[8%] right-[8%] sm:bottom-12 sm:right-12 p-3 sm:p-4 bg-slate-800 rounded-xl border border-white/10 shadow-lg w-36 sm:w-48 z-10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Workflow className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm">Update CRM</span>
                    </div>
                    <div className="h-1 sm:h-1.5 w-full bg-white/5 rounded-full" />
                  </div>

                  <svg viewBox="0 0 500 500" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-50">
                    <path d="M 120 100 C 120 250, 250 150, 250 250" stroke="url(#linegrad1)" strokeWidth="3" fill="none" className="animate-dash" />
                    <path d="M 250 250 C 250 350, 380 250, 380 400" stroke="url(#linegrad2)" strokeWidth="3" fill="none" className="animate-dash [animation-delay:0.5s]" />
                    <defs>
                      <linearGradient id="linegrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4ADE80" stopOpacity="0" />
                        <stop offset="50%" stopColor="#4ADE80" />
                        <stop offset="100%" stopColor="#A855F7" />
                      </linearGradient>
                      <linearGradient id="linegrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-20 px-4">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              Simple, transparent pricing.
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Choose the plan that fits your business needs. No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch max-w-md md:max-w-4xl lg:max-w-none mx-auto">
            {plansLoading ? (
              <div className="col-span-full flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : (
              plans.map((plan, i) => (
                <PricingCard
                  key={plan.id}
                  title={plan.name === "Free" ? "Starter" : (plan.name === "Basic" ? "Professional" : "Enterprise")}
                  price={plan.name === "Custom" || plan.name === "Unlimited" ? "Custom" : `₹${plan.price}`}
                  description={
                    plan.name === "Free" ? "Perfect for exploring the platform and testing your flows." :
                    plan.name === "Basic" ? "Perfect for small businesses starting with WhatsApp API." :
                    "Tailored solutions for large-scale operations."
                  }
                  features={plan.name === "Custom" || plan.name === "Unlimited" ? [
                    "Unlimited WhatsApp Numbers",
                    "Dedicated Success Manager",
                    "Custom API Development",
                    "High Volume Throughput",
                    "On-premise Deployment",
                    "SSO & Role-Based Access",
                    "Custom Volume Discounts",
                  ] : (plan.name === "Basic" ? [
                    "3 WhatsApp Numbers",
                    "Visual Flow Builder",
                    "Native Catalog Sync",
                    "Advanced CRM Integration",
                    "Team Inbox (5 Users)",
                    "Unlimited Message Templates",
                  ] : [
                    "1 WhatsApp Number",
                    "Basic shared inbox",
                    "Green Tick Assistance",
                    "Campaign Broadcasts",
                    "Basic Analytics",
                    "1,000 Free Conversations",
                  ])}
                  buttonText={plan.name === "Custom" || plan.name === "Unlimited" ? "Contact Sales" : "Start free trial"}
                  href={plan.name === "Custom" || plan.name === "Unlimited" ? `https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "919119436662"}?text=Hi%2C%20I%27m%20interested%20in%20the%20Custom%20plan%20for%20GPSerp.` : "/register"}
                  isPrimary={plan.name === "Free"}
                  featured={plan.name === "Basic"}
                  isEnterprise={plan.name === "Custom" || plan.name === "Unlimited"}
                  delay={i * 0.1}
                  isExternalLink={plan.name === "Custom" || plan.name === "Unlimited"}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <TestimonialsSection />
      <FAQSection isCompact={true} />

      <footer className="py-20 border-t border-white/5 bg-slate-950 text-sm">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2 text-center md:text-left">
              <div className="mb-6 flex justify-center md:justify-start">
                <Logo className="w-32 h-10" isSidebar={true} forceWhite={true} />
              </div>
              <p className="text-slate-400 max-sm leading-relaxed max-w-sm mx-auto md:mx-0 font-medium">
                The most powerful WhatsApp marketing and automation platform for
                modern businesses. Built for scale, security, and reliability.
              </p>
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-[10px]">Product</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#workflows" className="hover:text-white transition-colors">Workflows</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/api-docs" className="hover:text-white transition-colors">API Docs</Link></li>
              </ul>
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-[10px]">Company</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 font-medium">
            <div>&copy; 2026 GPSERP. All rights reserved.</div>
            <div className="flex gap-8">
              <Link href="/terms-n-condition" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="relative group py-2">
      <span className="relative z-10 group-hover:text-white transition-colors">{children}</span>
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full" />
    </a>
  );
}

function SpotlightCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
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
    <div
      ref={divRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="group relative h-full isolate perspective-1000"
    >
      <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-700" />
      <div className="relative h-full overflow-hidden rounded-3xl bg-slate-900 border border-white/5 p-8 transition-colors duration-500 group-hover:bg-slate-800/80 group-hover:border-purple-500/30 shadow-xl shadow-black/50">
        <div className="absolute inset-0 bg-linear-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <BorderBeam size={250} duration={12} delay={delay * 9} colorFrom="#A855F7" colorTo="#3B82F6" />
        <div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 mix-blend-screen"
          style={{ background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(168,85,247,0.15), transparent 40%)` }}
        />
        <div className="relative flex flex-col h-full z-10 text-center sm:text-left items-center sm:items-start">
          <div className="mb-6 flex items-start justify-between w-full">
            <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-lg transition-all duration-500 overflow-hidden group-hover:scale-110 group-hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)] group-hover:border-purple-500/30 mx-auto sm:mx-0">
              <div className="absolute inset-0 bg-linear-to-tr from-purple-500/20 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className={`relative z-10 transition-colors duration-500 ${isHovered ? "text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" : "text-slate-400"}`}>
                {icon}
              </div>
            </div>
            <div className="hidden sm:flex w-8 h-8 rounded-full border border-white/10 items-center justify-center bg-white/5 opacity-0 -translate-x-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0 group-hover:border-purple-500/30">
              <ArrowRight className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <h3 className="mb-3 text-xl font-bold tracking-tight text-white transition-all duration-500 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-white group-hover:to-purple-200">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-400 transition-colors duration-500 group-hover:text-slate-300">{description}</p>
          <div className="absolute bottom-[-32px] left-[-32px] right-[-32px] h-[2px] bg-linear-to-r from-transparent via-purple-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out opacity-50" />
        </div>
      </div>
    </div>
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
  isPrimary?: boolean;
  delay: number;
  isExternalLink?: boolean;
}

function PricingCard({ title, price, description, features, buttonText, href, featured = false, isEnterprise = false, isExternalLink = false }: PricingCardProps) {
  return (
    <div className={`group relative h-full rounded-3xl p-px ${featured ? "shadow-2xl shadow-blue-900/40 z-10 scale-105" : "shadow-xl shadow-black/50 z-0"}`}>
      <div className={`absolute inset-0 rounded-3xl overflow-hidden pointer-events-none ${featured ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity duration-500"}`}>
        <div className="absolute -inset-full animate-[spin_4s_linear_infinite]" style={{ background: featured ? "conic-gradient(from 0deg, transparent 0 340deg, #A855F7 360deg)" : isEnterprise ? "conic-gradient(from 0deg, transparent 0 340deg, #10B981 360deg)" : "conic-gradient(from 0deg, transparent 0 340deg, #3B82F6 360deg)" }} />
      </div>
      <div className={`absolute inset-0 rounded-3xl transition-opacity duration-300 pointer-events-none ${featured ? "border border-blue-500/30 opacity-0 group-hover:opacity-100" : "border border-white/5 opacity-100 group-hover:opacity-0"}`} />
      <div className={`relative flex flex-col h-full rounded-[23px] p-8 overflow-hidden transition-colors duration-500 ${featured ? "bg-slate-900/90" : "bg-slate-900/80 group-hover:bg-slate-900/90"}`}>
        <div className={`absolute inset-0 bg-linear-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${featured ? "from-purple-500/10 to-transparent" : isEnterprise ? "from-emerald-500/10 to-transparent" : "from-blue-500/10 to-transparent"}`} />
        {featured && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-linear-to-r from-purple-600 to-blue-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/20 z-20 flex items-center gap-1.5 whitespace-nowrap"><Zap className="w-3 h-3 fill-white" />Most Popular</div>}
        <div className="mb-8 relative z-10 mt-4 text-center sm:text-left">
          <h3 className={`text-base font-bold mb-1 transition-colors duration-300 ${featured ? "text-purple-400" : isEnterprise ? "text-emerald-400" : "text-blue-400"}`}>{title}</h3>
          <div className="flex items-baseline justify-center sm:justify-start gap-1">
            <span className="text-5xl font-extrabold text-white tracking-tight">{price}</span>
            {price !== "Custom" && <span className="text-slate-500 font-medium tracking-wide">/mo</span>}
          </div>
          <p className="text-sm text-slate-400 mt-4 h-12 leading-relaxed font-medium">{description}</p>
        </div>
        <div className="flex-1 space-y-4 mb-10 relative z-10 mt-6">
          {features.map((feature: string) => (
            <div key={feature} className="flex items-center gap-3 text-sm text-slate-300 transition-transform duration-300 group-hover:translate-x-1">
              <div className={`p-0.5 rounded-full border transition-colors duration-300 ${featured ? "border-purple-500/50 text-purple-400" : isEnterprise ? "border-emerald-500/50 text-emerald-400" : "border-blue-500/50 text-blue-400"}`}><CheckCircle2 className="w-3.5 h-3.5" /></div>
              <span className="font-medium">{feature}</span>
            </div>
          ))}
        </div>
        {isExternalLink ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="w-full relative z-10 mt-auto"><PricingButton buttonText={buttonText} featured={featured} /></a>
        ) : (
          <Link href={href} className="w-full relative z-10 mt-auto"><PricingButton buttonText={buttonText} featured={featured} /></Link>
        )}
      </div>
    </div>
  );
}

function PricingButton({ buttonText, featured }: { buttonText: string; featured: boolean }) {
  return (
    <button className={`w-full py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer relative overflow-hidden group/btn ${featured ? "bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:scale-[1.02]" : "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20"}`}>
      <span className="relative z-10 flex items-center justify-center gap-2">{buttonText}</span>
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
    </button>
  );
}

function GridPattern() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
  );
}

function LogoMarquee() {
  const logos = ["Acme Corp", "GlobalVentures", "Nebula", "Trio", "FoxRun", "Spherule", "NiteLife"];
  return (
    <div className="relative flex overflow-hidden w-full group py-2">
      <Marquee pauseOnHover className="[--duration:25s] [--gap:3rem] md:[--gap:4rem]">{logos.map((logo, i) => (<span key={i} className="text-xl md:text-2xl font-bold font-serif text-slate-300 opacity-50 whitespace-nowrap transition-opacity duration-300 hover:opacity-100! px-[1rem] md:px-[1.5rem]">{logo}</span>))}</Marquee>
    </div>
  );
}
