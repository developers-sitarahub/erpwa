"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ChevronDown, 
  HelpCircle, 
  Zap, 
  CreditCard, 
  MessageSquare,
  ArrowRight
} from "lucide-react";

const faqData = [
  {
    category: "General Questions",
    icon: <HelpCircle className="w-5 h-5 text-blue-400" />,
    items: [
      {
        question: "What is GPSERP?",
        answer: "GPSERP is an enterprise-grade WhatsApp Business API platform designed to help businesses scale their messaging. Unlike standard WhatsApp Business, GPSERP provides advanced tools like native flows, AI chatbots, and a unified team inbox.",
      },
      {
        question: "How do I get started with GPSERP?",
        answer: "You can start by registering on our platform. The onboarding process involves a simple two-step registration: Identity Verification: Provide your name, email, and mobile number. Business Configuration: Connect your WhatsApp Business account and set up your business profile.",
      },
      {
        question: "Do I need a WhatsApp Business API account?",
        answer: "Yes, GPSERP works exclusively with the official Meta WhatsApp Business API. If you don't have one, our platform will guide you through the connection process.",
      },
      {
        question: "Who can benefit from using GPSERP?",
        answer: "Businesses of all sizes, including small enterprises, e-commerce stores, service providers, and large sales organizations.",
      },
    ],
  },
  {
    category: "Features and Functionalities",
    icon: <Zap className="w-5 h-5 text-green-400" />,
    items: [
      {
        question: "What are WhatsApp Message Templates?",
        answer: "Templates are pre-approved message formats required by Meta for initiating conversations with customers. GPSERP supports: Standard Templates (Text-based messages), Media Templates (Messages with images, videos, or documents), and Carousel Templates (Multi-product cards for browsing).",
      },
      {
        question: "Can I send Bulk Broadcast Campaigns?",
        answer: "Absolutely. You can run campaigns using pre-approved templates or images to reach your entire lead database while maintaining compliance with Meta's policies.",
      },
      {
        question: "Can I add my team members to GPSERP?",
        answer: "Yes, you can add team members to manage different aspects of customer interactions, ensuring efficient and collaborative support.",
      },
      {
        question: "How can I import my existing leads?",
        answer: "GPSERP supports bulk importing leads via Excel (.xlsx) and CSV files. Our system automatically parses the data and lets you categorize leads into custom groups.",
      },
      {
        question: "Can I assign leads to specific sales persons?",
        answer: "Yes. You can manually assign leads or use our Workflow engine to automatically distribute incoming leads to your team based on predefined rules.",
      },
      {
        question: "How does the AI Chatbot builder work?",
        answer: "We provide a visual, node-based 'Conversational Flow' builder. You can drag and drop nodes to create automated responses, support routing, and interactive menus without writing any code.",
      },
      {
        question: "What are 'Native Flows'?",
        answer: "Native Flows allow you to build interactive forms, appointment booking systems, and surveys that run directly inside WhatsApp. Customers don't have to click external links to provide information.",
      },
      {
        question: "What is the 24-hour messaging window?",
        answer: "When a customer sends a message to your business, a 24-hour conversation window opens where you can send free-form messages. After the window closes, businesses must use approved message templates to re-initiate conversations.",
      },
    ],
  },
  {
    category: "Pricing and Support",
    icon: <CreditCard className="w-5 h-5 text-purple-400" />,
    items: [
      {
        question: "What are the pricing plans for GPSERP?",
        answer: "We offer three main tiers: Free (Perfect for exploring the platform features), Basic (₹1,999/mo: Designed for growing businesses with higher limits on conversations and chatbots), and Enterprise (Custom: Tailored for large-scale operations requiring unlimited numbers and dedicated support).",
      },
      {
        question: "Is there a free trial available for GPSERP?",
        answer: "Yes, GPSERP offers a 7 Day free trial for users to explore its features before committing to a paid plan.",
      },
      {
        question: "How do I pay for my subscription?",
        answer: "We use Razorpay for secure payments. You can pay via UPI, Credit/Debit cards, or Net banking. Your plan will be automatically activated immediately after a successful payment.",
      },
    ],
  },
];

export function FAQSection({ isCompact = false }: { isCompact?: boolean }) {
  const [openIndex, setOpenIndex] = useState<string | null>("General Questions-0");

  const toggleFAQ = (category: string, index: number) => {
    const id = `${category}-${index}`;
    setOpenIndex(openIndex === id ? null : id);
  };

  const displayData = isCompact 
    ? faqData.filter(cat => cat.category === "General Questions")
    : faqData;

  return (
    <section id="faq" className={`${isCompact ? "py-16" : "pt-8 pb-24"} px-6 relative overflow-hidden scroll-mt-32`}>
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4"
          >
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Common Questions</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-linear-to-b from-white to-white/60"
          >
            {isCompact ? "Common Questions" : "GPSERP FAQ"}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            {isCompact 
              ? "Find answers to the most frequently asked questions about GPSERP."
              : "Welcome to the official FAQ for GPSERP, the most powerful WhatsApp marketing and automation platform for modern businesses."}
          </motion.p>
        </div>

        <div className="space-y-12">
          {displayData.map((category, catIdx) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIdx * 0.1 }}
              className="space-y-4"
            >
              {!isCompact && (
                <div className="flex items-center gap-3 pb-2 border-b border-white/5 mb-6">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white">{category.category}</h3>
                </div>
              )}

              <div className="grid gap-4">
                {category.items.map((item, itemIdx) => {
                  const id = `${category.category}-${itemIdx}`;
                  const isOpen = openIndex === id;

                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: itemIdx * 0.05, duration: 0.4 }}
                      className={`group rounded-2xl border transition-all duration-300 ${
                        isOpen 
                          ? "bg-white/5 border-purple-500/30 shadow-[0_0_20px_-5px_rgba(168,85,247,0.1)]" 
                          : "bg-slate-900/50 border-white/5 hover:border-white/20"
                      }`}
                    >
                      <button
                        onClick={() => toggleFAQ(category.category, itemIdx)}
                        className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                      >
                        <span className={`font-semibold transition-colors duration-300 ${
                          isOpen ? "text-white" : "text-slate-300 group-hover:text-white"
                        }`}>
                          {item.question}
                        </span>
                        <div className={`p-1 rounded-full transition-all duration-300 ${
                          isOpen ? "bg-purple-500/20 text-purple-400 rotate-180" : "bg-white/5 text-slate-500 rotate-0"
                        }`}>
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                              {item.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {isCompact && (
          <div className="mt-12 text-center">
            <Link 
              href="/faq" 
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all group"
            >
              View All FAQs
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-8 rounded-3xl bg-linear-to-r from-purple-500/10 via-blue-500/10 to-transparent border border-white/10 text-center"
        >
          <HelpCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-slate-400 mb-6">Can&apos;t find the answer you&apos;re looking for? Please chat with our friendly team.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "919119436662"}?text=Hi%2C%20I%20have%20some%20questions%20about%20GPSERP.`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-full bg-emerald-500 text-white font-bold hover:bg-emerald-400 hover:scale-105 transition-all flex items-center gap-2 shadow-[0_4px_14px_0_rgba(16,185,129,0.39)]"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              Chat on WhatsApp
            </a>
            <button className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors">
              Email Support
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
