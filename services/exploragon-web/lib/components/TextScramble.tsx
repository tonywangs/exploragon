"use client";

import { useEffect, useRef } from 'react';

interface TextScrambleProps {
  text: string;
  className?: string;
  delay?: number;
}

export function TextScramble({ text, className = '', delay = 0 }: TextScrambleProps) {
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const chars = '!<>-_\\/[]{}—=+*^?#_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let frame = 0;
    let queue: Array<{to: string, start: number, end: number, char?: string}> = [];

    const update = () => {
      let output = '';
      let complete = 0;

      for (let i = 0; i < queue.length; i++) {
        const { to, start, end } = queue[i];
        
        if (frame >= end) {
          complete++;
          output += to;
        } else if (frame >= start) {
          if (!queue[i].char || Math.random() < 0.5) {
            queue[i].char = chars[Math.floor(Math.random() * chars.length)];
          }
          output += `<span class="text-accent-primary">${queue[i].char}</span>`;
        } else {
          output += '';
        }
      }

      element.innerHTML = output;
      
      if (complete === queue.length) {
        return;
      } else {
        requestAnimationFrame(update);
        frame++;
      }
    };

    const startScramble = () => {
      queue = [];
      
      for (let i = 0; i < text.length; i++) {
        const to = text[i];
        const start = Math.floor(i * 2);
        const end = start + 15;
        queue.push({ to, start, end });
      }
      
      frame = 0;
      update();
    };

    const timeoutId = setTimeout(startScramble, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [text, delay]);

  return <span ref={elementRef} className={className}></span>;
}