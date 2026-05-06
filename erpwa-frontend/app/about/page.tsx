"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Users, 
  Target, 
  Zap, 
  ChevronRight,
  Shield
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { Logo } from "@/components/logo";

const ValueCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:bg-white/5 transition-colors"
  >
    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
      <Icon className="w-6 h-6 text-purple-400" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
  </motion.div>
);

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="hover:text-white transition-colors">
    {children}
  </Link>
);

export default function AboutPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-purple-500/30">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-32 h-10" isSidebar={true} forceWhite={true} />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <NavLink href="/#features">Features</NavLink>
            <NavLink href="/#pricing">Pricing</NavLink>
            <NavLink href="/faq">FAQ</NavLink>
            <NavLink href="/about">About</NavLink>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href={user ? "/admin/dashboard" : "/login"}
              className="px-6 py-2.5 rounded-full bg-white text-slate-950 font-bold hover:scale-105 transition-transform text-sm"
            >
              {user ? "Dashboard" : "Get Started"}
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-24">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8"
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Our Story</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight"
          >
            Revolutionizing Business <br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-green-400 to-blue-500">Communication.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            GPSERP was born from a simple observation: modern businesses need more than just a chat app; they need a scalable, intelligent, and unified operating system for customer interaction.
          </motion.p>
        </section>

        {/* Mission & Vision */}
        <section className="container mx-auto px-6 py-24 border-y border-white/5 bg-white/[0.02]">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl font-bold text-white tracking-tight">Accessing the full Meta WhatsApp Business API suite.</h2>
              <p className="text-slate-400 leading-relaxed text-lg">
                We empower enterprises to build meaningful relationships with their customers through the world&apos;s most popular messaging platform. Our goal is to eliminate the friction between businesses and people.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                  <div className="text-4xl font-black text-white mb-1">99.9%</div>
                  <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Uptime SLA</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                  <div className="text-4xl font-black text-white mb-1">24/7</div>
                  <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Expert Support</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-[3rem] bg-linear-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center p-12 overflow-hidden group">
                <Target className="w-48 h-48 text-purple-400/50 group-hover:scale-110 transition-transform duration-700 blur-sm" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <p className="text-white font-black text-3xl italic leading-tight text-center px-12">&quot;Making business as easy as a chat with a friend.&quot;</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Global Presence */}
        <section className="container mx-auto px-6 py-32">
          <div className="max-w-4xl mx-auto text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">Global reach, local expertise.</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Headquartered in Pune, India, GPSERP serves a diverse range of clients across Southeast Asia, the Middle East, and beyond. We combine global technology standards with an intimate understanding of local business cultures.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
             {[
               { label: "Founded", value: "2020" },
               { label: "Active Clients", value: "500+" },
               { label: "Daily Messages", value: "2M+" },
               { label: "Success Rate", value: "99.2%" }
             ].map((stat, i) => (
               <div key={i} className="p-8 rounded-4xl bg-white/3 border border-white/5 text-center group hover:bg-white/5 transition-colors">
                 <div className="text-4xl font-black text-white italic mb-2 group-hover:scale-110 transition-transform">{stat.value}</div>
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</div>
               </div>
             ))}
          </div>
        </section>

        {/* Values */}
        <section className="container mx-auto px-6 py-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-white mb-4">Values that drive us</h2>
            <p className="text-slate-400">The principles that guide every feature we build.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <ValueCard 
              icon={Shield} 
              title="Trust & Security" 
              description="Enterprise-grade encryption and compliance are at the heart of everything we do. Your data security is non-negotiable."
            />
            <ValueCard 
              icon={Zap} 
              title="Radical Innovation" 
              description="We don't just follow industry standards; we set them. From Native Flows to AI-driven workflows, we push the boundaries."
            />
            <ValueCard 
              icon={Users} 
              title="Customer Obsession" 
              description="Our roadmap is built on your feedback. We succeed when your business scales and your customers are satisfied."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="p-12 md:p-24 rounded-[4rem] bg-linear-to-b from-white/[0.03] to-transparent border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight relative z-10">
              Ready to scale your <br /> outreach?
            </h2>
            <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto relative z-10">
              Join thousands of businesses already growing with GPSERP. 
              Get started with our free trial today.
            </p>
            <div className="flex flex-wrap justify-center gap-6 relative z-10">
              <Link 
                href="/login" 
                className="px-10 py-4 rounded-full bg-white text-slate-950 font-bold hover:scale-105 transition-transform"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/contact" 
                className="px-10 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                Talk to Sales <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

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
                <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
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
