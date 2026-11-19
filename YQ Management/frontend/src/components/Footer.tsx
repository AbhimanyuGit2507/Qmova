import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          <div className="col-span-2">
            <div className="mb-6">
              <Logo width={150} height={24} href="/" forceTheme="dark" />
            </div>
            <p className="text-sm text-zinc-400 mb-4 max-w-xs leading-relaxed">
              Modern, affordable queue management and virtual waiting rooms. Launch in 3 minutes with zero hardware required.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-zinc-400 border border-white/10">
              ⏱️ 3-Min Setup • ⚡ Zero Hardware
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="flex flex-col gap-3 text-sm text-zinc-400">
              <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/book-demo" className="hover:text-white transition-colors">Book a Demo</Link></li>
              <li><Link href="/register" className="hover:text-sky-400 transition-colors">Free 14-Day Trial</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Solutions</h3>
            <ul className="flex flex-col gap-3 text-sm text-zinc-400">
              <li><Link href="/for/clinics" className="hover:text-white transition-colors">Clinics & Health</Link></li>
              <li><Link href="/for/salons" className="hover:text-white transition-colors">Salons & Barbers</Link></li>
              <li><Link href="/for/banks" className="hover:text-white transition-colors">Banks & Branches</Link></li>
              <li><Link href="/for/repair-shops" className="hover:text-white transition-colors">Auto & Repair</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="flex flex-col gap-3 text-sm text-zinc-400">
              <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
              <li><Link href="/status" className="hover:text-white transition-colors">System Status</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Legal & Trust</h3>
            <ul className="flex flex-col gap-3 text-sm text-zinc-400">
              <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} Qmova Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Link
              href="/status"
              className="inline-flex items-center gap-2 hover:text-white transition-colors group cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:ring-4 group-hover:ring-emerald-500/20 transition-all"></span>
              All systems operational
            </Link>
            <span className="font-mono text-xs">v2.4.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
