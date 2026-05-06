"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Code2, 
  ArrowRight,
  Copy,
  Lock,
  Globe
} from "lucide-react";

import { Logo } from "@/components/logo";

const EndpointCard = ({ method, path, description }: { method: string, path: string, description: string }) => (
  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors group">
    <div className="flex items-center gap-3 mb-4">
      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
        method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : 
        method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
      }`}>
        {method}
      </span>
      <code className="text-white font-mono text-sm">{path}</code>
    </div>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);

const CodeSnippet = ({ code, language }: { code: string, language: string }) => (
  <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-3xl">
    <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{language}</span>
      <button className="text-slate-500 hover:text-white transition-colors">
        <Copy className="w-4 h-4" />
      </button>
    </div>
    <div className="p-6 font-mono text-sm overflow-x-auto whitespace-pre">
      <code className="text-blue-300">{code}</code>
    </div>
  </div>
);

export default function APIDocsPage() {
  const exampleCode = `curl -X POST https://api.gpserp.com/v1/messages \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "919876543210",
    "type": "template",
    "template": {
      "name": "welcome_message",
      "language": "en"
    }
  }'`;

  return (
    <div className="min-h-screen bg-[#020617] font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-32 h-10" isSidebar={true} forceWhite={true} />
            <span className="text-xl font-bold bg-white/10 px-3 py-1 rounded-lg text-blue-400">Docs</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link href="/faq" className="hover:text-white transition-colors">Support</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Sales</Link>
          </div>
          <Link href="/login" className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors text-sm shadow-[0_4px_20px_rgba(37,99,235,0.3)]">
            Get API Key
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-40 pb-24 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-16">
          
          {/* Left: Sidebar Navigation */}
          <aside className="hidden lg:block lg:col-span-3 space-y-10 sticky top-40 h-fit">
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-6">Getting Started</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li><a href="#auth" className="hover:text-blue-400 transition-colors">Authentication</a></li>
                <li><a href="#messaging" className="hover:text-blue-400 transition-colors">Messaging</a></li>
                <li><a href="#webhooks" className="hover:text-blue-400 transition-colors">Webhooks</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-6">Messaging API</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li><a href="#messaging" className="hover:text-blue-400 transition-colors">Send Template</a></li>
                <li><a href="#messaging" className="hover:text-blue-400 transition-colors">Send Media</a></li>
                <li><a href="#sdks" className="hover:text-blue-400 transition-colors">Official SDKs</a></li>
              </ul>
            </div>
          </aside>

          {/* Center: Documentation Content */}
          <div className="lg:col-span-9 space-y-32">
            
            <section id="auth">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 font-mono text-[10px] text-blue-400 uppercase tracking-widest">
                  v1.2 API Reference
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">Enterprise Messaging API</h1>
                <p className="text-slate-400 text-lg leading-relaxed max-w-3xl">
                  Our REST API allows you to programmatically manage your WhatsApp communications, build 
                  deep integrations with your CRM, and automate complex messaging workflows with ease.
                </p>
                
                <div className="pt-12">
                   <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                     <Lock className="w-6 h-6 text-blue-500" /> Authentication
                   </h2>
                   <p className="text-slate-400 mb-8 max-w-2xl text-lg">
                     All API requests must include an Authorization header with a Bearer token. 
                     You can generate and revoke API keys from your dashboard settings.
                   </p>
                   <CodeSnippet language="bash" code={exampleCode} />
                </div>
              </motion.div>
            </section>

            <section id="messaging" className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-white tracking-tight">Messaging</h2>
                <p className="text-slate-400 text-lg">Send various types of messages to your customers using these core endpoints.</p>
              </div>

              <div className="space-y-20">
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-white">1. Send Template Message</h3>
                  <p className="text-slate-400">Template messages are used for outbound notifications. They must be pre-approved by Meta.</p>
                  <div className="grid md:grid-cols-2 gap-8 items-start">
                    <EndpointCard 
                      method="POST" 
                      path="/v1/messages/template" 
                      description="Broadcast an approved template with dynamic variables and buttons."
                    />
                    <div className="p-6 rounded-2xl bg-white/2 border border-white/5 space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">Required Parameters</h4>
                      <ul className="space-y-2 text-sm text-slate-400">
                        <li><code className="text-blue-400">to</code>: Recipient phone number with country code.</li>
                        <li><code className="text-blue-400">templateName</code>: The unique name of your approved template.</li>
                        <li><code className="text-blue-400">language</code>: Template language code (e.g., &quot;en&quot;).</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-white">2. Send Media Message</h3>
                  <p className="text-slate-400">Send images, videos, documents, or audio files to any active conversation session.</p>
                  <EndpointCard 
                    method="POST" 
                    path="/v1/messages/media" 
                    description="Upload media directly or provide a public URL to send rich content."
                  />
                </div>
              </div>
            </section>

            <section id="webhooks" className="space-y-12">
              <div className="p-12 rounded-[3.5rem] bg-indigo-600/5 border border-indigo-500/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 space-y-8">
                  <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                    <Globe className="w-8 h-8 text-indigo-400" /> Webhooks
                  </h2>
                  <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
                    Configure your endpoint to receive real-time notifications for incoming messages, 
                    message status updates (sent, delivered, read), and customer-driven events from WhatsApp Flows.
                  </p>
                  <div className="bg-black/40 rounded-3xl p-8 border border-white/5 font-mono text-xs text-indigo-300">
                    <div className="flex items-center gap-2 mb-4 opacity-50">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" /> Incoming Payload Example
                    </div>
                    {`{
  "event": "message.received",
  "from": "919876543210",
  "name": "John Doe",
  "type": "text",
  "text": "How can I help you today?"
}`}
                  </div>
                </div>
              </div>
            </section>

            <section id="errors" className="space-y-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                Error Handling
              </h2>
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/2">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-300 uppercase tracking-widest text-[10px]">Code</th>
                      <th className="px-6 py-4 font-bold text-slate-300 uppercase tracking-widest text-[10px]">Description</th>
                      <th className="px-6 py-4 font-bold text-slate-300 uppercase tracking-widest text-[10px]">Solution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="px-6 py-4 font-mono text-blue-400">401</td>
                      <td className="px-6 py-4 text-slate-300 font-medium">Unauthorized</td>
                      <td className="px-6 py-4 text-slate-500">Check your API token in headers.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-mono text-blue-400">429</td>
                      <td className="px-6 py-4 text-slate-300 font-medium">Too Many Requests</td>
                      <td className="px-6 py-4 text-slate-500">Slow down requests temporarily.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-mono text-blue-400">400</td>
                      <td className="px-6 py-4 text-slate-300 font-medium">Bad Request</td>
                      <td className="px-6 py-4 text-slate-500">Check your JSON payload structure.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="sdks" className="p-12 rounded-4xl bg-linear-to-br from-blue-600/10 to-transparent border border-white/10">
               <div className="flex flex-col md:flex-row items-center gap-12">
                 <div className="w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_20px_40px_rgba(37,99,235,0.4)]">
                   <Code2 className="w-12 h-12 text-white" />
                 </div>
                 <div className="text-center md:text-left space-y-6">
                   <h3 className="text-3xl font-black text-white">Official SDKs Coming Soon</h3>
                   <p className="text-slate-400 text-lg leading-relaxed">
                     Our developer team is building official libraries for Node.js, Python, and PHP to make integration even faster. 
                     Join our developer community to stay updated!
                   </p>
                   <Link href="/contact" className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black hover:bg-blue-500 hover:text-white transition-all">
                     Request Early Access <ArrowRight className="w-5 h-5" />
                   </Link>
                 </div>
               </div>
            </section>

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
