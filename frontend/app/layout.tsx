import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { NavbarWrapper } from "./NavbarWrapper";

export const metadata: Metadata = {
  title: "SecurePoll - Cyber Voting System",
  description: "Next-gen encrypted voting powered by FHEVM",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="min-h-screen relative overflow-hidden">
          {/* Cyber Grid Background */}
          <div className="fixed inset-0 -z-10 cyber-grid opacity-30"></div>
          
          {/* Animated Lines */}
          <div className="fixed inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent opacity-20 animate-pulse"></div>
            <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-magenta-500 to-transparent opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute left-0 top-1/3 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>

          <main className="container mx-auto px-6 py-8">
            <Providers>
              <NavbarWrapper>{children}</NavbarWrapper>
            </Providers>
          </main>

          {/* Footer */}
          <footer className="mt-20 border-t border-cyan-500/20 bg-slate-900/80 backdrop-blur-md">
            <div className="container mx-auto px-6 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-400 font-mono">
                  <span className="text-cyan-400 font-bold">&gt;_</span> SecurePoll v2.0 | FHEVM-POWERED
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-mono">
                  <span className="text-magenta-400">■</span>
                  <span>ENCRYPTED</span>
                  <span className="text-cyan-400">■</span>
                  <span>SECURE</span>
                  <span className="text-purple-400">■</span>
                  <span>ANONYMOUS</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
