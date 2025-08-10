"use client";

import { useEffect, useRef } from 'react';

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const cols = Math.floor(width / 20);
    const ypos = Array(cols).fill(0);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    function matrix() {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = '#0a0a0a11';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#64ffda';
      ctx.font = '15pt JetBrains Mono, monospace';

      ypos.forEach((y, ind) => {
        const text = String.fromCharCode(Math.random() * 128);
        const x = ind * 20;
        ctx.fillText(text, x, y);
        
        if (y > 100 + Math.random() * 10000) {
          ypos[ind] = 0;
        } else {
          ypos[ind] = y + 20;
        }
      });
    }

    const interval = setInterval(matrix, 50);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      className="matrix-bg"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        opacity: 0.05,
        pointerEvents: 'none'
      }}
    />
  );
}