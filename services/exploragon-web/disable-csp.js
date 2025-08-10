// Quick fix for Google Maps CSP issues
// Add this to your .env.local file: DISABLE_CSP=true

if (process.env.DISABLE_CSP === "true") {
  console.log("🛡️  CSP disabled for development");

  // Override the CSP header
  const originalFetch = global.fetch;
  global.fetch = function (...args) {
    const response = originalFetch.apply(this, args);
    return response.then((res) => {
      if (res.headers) {
        res.headers.delete("content-security-policy");
        res.headers.delete("content-security-policy-report-only");
      }
      return res;
    });
  };
}
