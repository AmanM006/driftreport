import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drift Report",
  description: "Find the drift between your codebase routes and Pendo tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const novusKey = process.env.NEXT_PUBLIC_NOVUS_KEY || "";

  return (
    <html lang="en">
      <body className="antialiased font-sans bg-background text-text-primary">
        {novusKey && (
          <Script id="pendo-snippet" strategy="afterInteractive">
            {`
              (function(apiKey){
                (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
                v=['initialize','identify','updateOptions','pageLoad','track'];for(w=0,x=v.length;w<x;++w)(function(m){
                  o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};
                })(v[w]);y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
                z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
                // Initialize Pendo
                pendo.initialize({
                  visitor: {
                    id: 'anonymous_visitor_' + Math.random().toString(36).substring(2, 11)
                  },
                  account: {
                    id: 'drift_report_account'
                  }
                });
              })('${novusKey}');
            `}
          </Script>
        )}
        {children}
      </body>
    </html>
  );
}
