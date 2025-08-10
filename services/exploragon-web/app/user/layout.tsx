import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Exploragon - Player View",
  description: "Explore San Francisco and discover new locations",
};

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Preconnect to Google Maps domains for better performance */}
      <Script
        id="google-maps-preconnect"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const link1 = document.createElement('link');
              link1.rel = 'preconnect';
              link1.href = 'https://maps.googleapis.com';
              document.head.appendChild(link1);
              
              const link2 = document.createElement('link');
              link2.rel = 'preconnect';
              link2.href = 'https://maps.gstatic.com';
              link2.crossOrigin = 'anonymous';
              document.head.appendChild(link2);
            })();
          `,
        }}
      />
      {children}
    </>
  );
}
