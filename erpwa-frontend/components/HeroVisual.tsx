"use client";

import React from "react";
import { MessageSquare, Zap } from "lucide-react";

export function HeroVisual() {
  return (
    <div className="relative w-full max-w-4xl mx-auto h-[450px] md:h-[600px] mt-8 px-4">
      {/* Central Glass Phone Frame */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[260px] md:max-w-[300px] aspect-[9/18.5] rounded-[3rem] border border-white/15 bg-slate-900/60 backdrop-blur-3xl shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)] overflow-hidden z-20"
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-950 rounded-b-2xl z-30 shadow-inner" />
        
        {/* Chat UI Mockup */}
        <div className="flex flex-col h-full pt-12 pb-6 px-4">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <MessageSquare className="w-5 h-5 text-green-400" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
            </div>
            <div>
              <div className="font-bold text-[13px] text-white tracking-tight">Support Agent</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Now</div>
            </div>
          </div>

          <div className="space-y-4 overflow-hidden flex-1">
            <div className="bg-white/10 rounded-2xl rounded-tl-none p-3 text-[11px] text-slate-200 ml-1 shadow-sm max-w-[85%]">
              How can we help your business thrive today?
            </div>
            
            <div className="bg-blue-600/30 border border-blue-500/30 rounded-2xl rounded-tr-none p-3 text-[11px] text-blue-50 text-right ml-auto mr-1 shadow-sm max-w-[85%]">
              I need to automate my WhatsApp sales! 🚀
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] text-slate-300 shadow-xl">
              <div className="font-bold text-white mb-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                Quick Actions
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-blue-400 font-bold text-center text-[10px] uppercase tracking-widest">
                  View Catalog
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-white font-bold text-center text-[10px] uppercase tracking-widest">
                   Order Tracking
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 flex gap-2">
            <div className="flex-1 h-10 bg-white/5 rounded-full border border-white/5 px-4 flex items-center text-[11px] text-slate-500 font-medium">
              Start typing...
            </div>
            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] z-0" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] z-0" />
    </div>
  );
}
