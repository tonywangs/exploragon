import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.ngrok-free.app'],
  async headers() {
    // Skip CSP in development
    if (process.env.NODE_ENV === 'development' || process.env.DISABLE_CSP === 'true') {
      return [];
    }
    
    return [
      {
        // Apply CSP to all routes except API
        source: '/((?!api).*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: data:",
              "style-src 'self' 'unsafe-inline' https: http:",
              "font-src 'self' https: http: data:",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https: http: ws: wss:",
              "frame-src 'self' https: http:",
              "worker-src 'self' blob: data:",
              "child-src 'self' blob: data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig;
