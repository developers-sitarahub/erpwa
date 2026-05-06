"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  MessageSquare, 
  MapPin, 
  Send,
  CheckCircle2,
  Phone,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { Logo } from "@/components/logo";

const ContactInfo = ({ icon: Icon, title, detail, subdetail }: { icon: React.ElementType, title: string, detail: string, subdetail?: string }) => (
  <div className="flex gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
      <Icon className="w-6 h-6 text-blue-400" />
    </div>
    <div>
      <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
      <p className="text-slate-300 font-medium mb-1">{detail}</p>
      {subdetail && <p className="text-slate-500 text-sm font-medium">{subdetail}</p>}
    </div>
  </div>
);

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="hover:text-white transition-colors">
    {children}
  </Link>
);

export default function ContactPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (resp.ok) {
        setIsSent(true);
      } else {
        const errData = await resp.json();
        alert(errData.message || "Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Decorative background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
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
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              
              {/* Left Column: Content */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-12"
              >
                <div>
                  <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
                    Let&apos;s scale <br />
                    <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-emerald-400">together.</span>
                  </h1>
                  <p className="text-slate-400 text-lg leading-relaxed max-w-lg">
                    Have questions about the Business API or need a custom solution? 
                    Our experts are here to help you automate and grow.
                  </p>
                </div>

                <div className="grid gap-6">
                  <ContactInfo 
                    icon={Mail} 
                    title="Email Support" 
                    detail="sales@gpserp.com" 
                    subdetail="Response within 24 hours"
                  />
                  <a 
                    href="https://wa.me/919119436662"
                    target="_blank"
                    className="group"
                  >
                    <ContactInfo 
                      icon={Phone} 
                      title="WhatsApp & Phone" 
                      detail="+91 91194 36662" 
                      subdetail="Chat or Call: Mon-Fri, 9am - 6pm IST"
                    />
                  </a>
                  
                  {/* WhatsApp Specific CTA */}
                  <a 
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "919119436662"}?text=Hi%2C%20I%20have%20some%20questions%20about%20GPSERP.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-8 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group shadow-[0_20px_50px_rgba(16,185,129,0.1)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.2)]"
                  >
                    <div className="flex gap-6 items-center">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-8 h-8 text-white fill-white" />
                      </div>
                      <div>
                        <h3 className="text-emerald-400 font-black text-xl">Direct WhatsApp Chat</h3>
                        <p className="text-emerald-500/80 font-bold uppercase tracking-widest text-[10px]">Instant Business Support</p>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-emerald-500 group-hover:translate-x-2 transition-transform" />
                  </a>
                </div>
              </motion.div>

              {/* Right Column: Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <div className="absolute -inset-1 bg-linear-to-r from-blue-500 to-purple-500 rounded-[2.5rem] blur opacity-20" />
                <div className="relative bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12">
                  <AnimatePresence mode="wait">
                    {!isSent ? (
                      <motion.form
                        key="contact-form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                      >
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1 uppercase tracking-wider">Full Name</label>
                            <input 
                              required
                              name="name"
                              type="text" 
                              placeholder="John Smith" 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1 uppercase tracking-wider">Work Email</label>
                            <input 
                              required
                              name="email"
                              type="email" 
                              placeholder="john@company.com" 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600 transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-300 ml-1 uppercase tracking-wider">Subject</label>
                          <select 
                            name="subject"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                          >
                            <option className="bg-slate-900">General Inquiry</option>
                            <option className="bg-slate-900">Enterprise Pricing</option>
                            <option className="bg-slate-900">Technical Support</option>
                            <option className="bg-slate-900">Partnership</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-300 ml-1 uppercase tracking-wider">Message</label>
                          <textarea 
                            required
                            name="message"
                            rows={4}
                            placeholder="Tell us about your business goals..." 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600 transition-all resize-none"
                          />
                        </div>

                        <button 
                          disabled={isSubmitting}
                          type="submit"
                          className="w-full py-5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black text-lg transition-all shadow-[0_8px_30px_rgb(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                        >
                          {isSubmitting ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              Send Message
                              <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                          )}
                        </button>
                        
                        <p className="text-center text-slate-500 text-xs font-medium uppercase tracking-widest">
                          Secure message transmission enabled
                        </p>
                      </motion.form>
                    ) : (
                      <motion.div
                        key="success-message"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-20 flex flex-col items-center"
                      >
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4 italic">Message Sent!</h2>
                        <p className="text-slate-400 mb-8 max-w-xs">
                          Thanks for reaching out! Our team will get back to you within 24 hours. 
                          For faster response, chat with us directly.
                        </p>
                        
                        <div className="flex flex-col gap-4 w-full max-w-xs">
                          <a 
                            href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "919119436662"}?text=Hi%2C%20I%20just%20sent%20a%20contact%20form%20on%20your%20website.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                          >
                            <MessageSquare className="w-5 h-5 fill-white" />
                            Chat on WhatsApp
                          </a>
                          
                          <button 
                            onClick={() => setIsSent(false)}
                            className="text-slate-500 font-bold hover:text-white transition-colors text-sm"
                          >
                            Send another message
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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
