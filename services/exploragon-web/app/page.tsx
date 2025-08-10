"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setMounted(true);
    
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        timeZoneName: 'short' 
      };
      setCurrentTime(now.toLocaleDateString('en-US', options).toLowerCase().replace(/,/g, ''));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-terminal-primary">
      {/* Matrix background */}
      <div className="matrix-bg"></div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6 min-h-screen flex flex-col">
        {/* Header */}
        <div className="mb-12 animate-fadeInUp text-center">
          <div className="flex justify-end mb-4">
            <div className="text-xs text-terminal-secondary font-mono">{currentTime}</div>
          </div>
          
          <div className="mb-6">
            <img 
              src="/exploragon-title.png" 
              alt="Exploragon" 
              className="mx-auto max-w-full h-auto w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl"
            />
          </div>
          
          <div className="text-terminal-secondary text-sm space-y-1">
            <div>v1.0.0-alpha • San Francisco, CA • <span className="status-online">ONLINE</span></div>
          </div>
        </div>

        {/* Game Description */}
        <div className="mb-12 animate-fadeInUp text-center" style={{animationDelay: '0.2s'}}>
          <div className="text-terminal-secondary text-lg mb-6">
            A location-based exploration game for San Francisco
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="text-accent-primary text-lg font-semibold">Explore</div>
              <div className="text-terminal-secondary text-sm">Discover hexagon-based zones across the city</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-accent-primary text-lg font-semibold">Complete</div>
              <div className="text-terminal-secondary text-sm">Take photos and videos to complete challenges</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-accent-primary text-lg font-semibold">Compete</div>
              <div className="text-terminal-secondary text-sm">Climb the leaderboard and earn points</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8 animate-fadeInUp text-center" style={{animationDelay: '0.6s'}}>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Link
              href="/user"
              className="terminal-button-primary flex-1 text-center"
            >
              ► START GAME
            </Link>
            
            <Link
              href="/admin"
              className="terminal-button flex-1 text-center"
            >
              ◉ LEADERBOARD
            </Link>
          </div>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
              <span className="text-terminal-secondary">GPS </span>
              <span className="status-online">ONLINE</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-accent-secondary rounded-full animate-pulse"></div>
              <span className="text-terminal-secondary">AI </span>
              <span className="status-online">READY</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
              <span className="text-terminal-secondary">NET </span>
              <span className="status-online">CONNECTED</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto text-center text-xs text-terminal-secondary animate-fadeInUp" style={{animationDelay: '0.8s'}}>
          <div className="space-y-1">
            <div>Exploragon v1.0.0-alpha • San Francisco</div>
            <div>© 2024 • <span className="text-accent-primary cursor">Ready to explore?</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
