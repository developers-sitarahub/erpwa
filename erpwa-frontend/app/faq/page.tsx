"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { FAQSection } from "@/components/faq";
import { Logo } from "@/components/logo";

export default function FAQPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden selection:bg-purple-500/30 font-sans scroll-smooth">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-200 h-200 bg-purple-600/10 rounded-full blur-[128px] opacity-50" />
        <div className="absolute bottom-[-20%] right-[-10%] w-200 h-200 bg-blue-600/10 rounded-full blur-[128px] opacity-50" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl supports-backdrop-filter:bg-slate-950/40">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-32 h-10" isSidebar={true} forceWhite={true} />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/#workflows" className="hover:text-white transition-colors">Workflows</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/#testimonials" className="hover:text-white transition-colors">Testimonials</Link>
            <Link href="/faq" className="text-white">FAQ</Link>
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
                <button className="group px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium flex items-center gap-2 cursor-pointer backdrop-blur-sm shadow-lg">
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
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-32">
        <FAQSection />
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
