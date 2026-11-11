import Footer from "../../components/Footer";
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext';
import { Logo } from '../../components/Logo';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, Building2, Store, Users2, ShieldCheck, ArrowRight } from 'lucide-react';
import { GetServerSideProps } from 'next';

interface Plan {
  id: string;
  name: string;
  type?: string;
  description: string;
  price: number;
  annualPrice: number;
  currency: string;
  interval?: string;
  features?: Record<string, boolean>;
  limits?: {
    maxServices?: number;
    maxLocations?: number;
    maxStaff?: number;
    maxTokens?: number;
    dailyTicketCap?: number;
    maxJourneyStages?: number | null;
  };
}

interface PricingProps {
  plans: Plan[];
}

export default function PricingPage({ plans }: PricingProps) {
  const { user } = useAuth();
  const [isYearly, setIsYearly] = React.useState(false);

  // Filter out trial plan so the 4 commercial tiers appear in the 4-column grid
  const paidPlans = (plans || []).filter(
    (p) => p.price > 0 && !p.name.toLowerCase().includes('trial') && p.type !== 'TRIAL'
  );

  const displayPlans = paidPlans.length >= 4 ? paidPlans : [
    {
      id: 'basic-plan',
      name: 'Basic (Small Business)',
      type: 'BASIC',
      description: 'Solo barbers, single-doctor clinics, small takeaways (Under 100 tickets/day).',
      price: 69900,
      annualPrice: 699000,
      currency: 'ZAR',
      limits: { maxLocations: 1, maxServices: 3, maxStaff: 3, dailyTicketCap: 1000, maxJourneyStages: 3 },
      features: { walkInQr: true, onlinePortal: true, checkout: true, tvDisplay: true, emailTracking: true, poweredByBadge: true, customBranding: false }
    },
    {
      id: 'growth-plan',
      name: 'Growth (Busy Venue)',
      type: 'GROWTH',
      description: 'High-throughput QSRs, large multi-doctor clinics, auto centers (100–500 tickets/day).',
      price: 139900,
      annualPrice: 1399000,
      currency: 'ZAR',
      limits: { maxLocations: 1, maxServices: 15, maxStaff: 10, dailyTicketCap: 2500, maxJourneyStages: null },
      features: { walkInQr: true, onlinePortal: true, checkout: true, tvDisplay: true, emailTracking: true, textToSpeech: true, whatsappChatbot: true, whatsappChat: true, reviewAuditing: true, customBranding: true }
    },
    {
      id: 'plus-plan',
      name: 'Plus (Multi-Branch)',
      type: 'PLUS',
      description: 'Regional chains, franchise groups with 2-3 outlets, medical groups.',
      price: 249900,
      annualPrice: 2499000,
      currency: 'ZAR',
      limits: { maxLocations: 3, maxServices: 30, maxStaff: 25, dailyTicketCap: 10000, maxJourneyStages: null },
      features: { walkInQr: true, onlinePortal: true, checkout: true, tvDisplay: true, emailTracking: true, textToSpeech: true, whatsappChatbot: true, whatsappChat: true, reviewAuditing: true, crossBranchAnalytics: true, whiteLabeling: true, crmWebhooks: true, customBranding: true }
    },
    {
      id: 'enterprise-plan',
      name: 'Enterprise (Network)',
      type: 'ENTERPRISE',
      description: 'Hospital networks, government centers, national franchises.',
      price: 499900,
      annualPrice: 4999000,
      currency: 'ZAR',
      limits: { maxLocations: 10, maxServices: 100, maxStaff: 9999, dailyTicketCap: 100000, maxJourneyStages: null },
      features: { walkInQr: true, onlinePortal: true, checkout: true, tvDisplay: true, emailTracking: true, textToSpeech: true, whatsappChatbot: true, whatsappChat: true, reviewAuditing: true, crossBranchAnalytics: true, whiteLabeling: true, crmWebhooks: true, apiAccess: true, customDomain: true, multiZoneVoice: true, prioritySla: true, customBranding: true }
    }
  ];
  
  return (
    <div className="dark bg-[#09090b] min-h-screen font-body-md text-white antialiased overflow-x-hidden selection:bg-sky-500/30">
      <Head>
        <title>Qmova | Pricing & Plans</title>
        <meta name="description" content="Transparent pricing for smart queue management. 14-day free trial on all plans." />
        <style dangerouslySetInnerHTML={{__html: `body { background-color: #09090b !important; }`}} />
      </Head>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-ui h-header-h flex items-center justify-between px-gutter border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="flex items-center gap-2">
          <Logo width={140} height={22} href="/" forceTheme="dark" />
        </div>
        <div className="hidden md:flex gap-8 font-body-sm text-zinc-400 font-medium tracking-wide">
          <Link className="hover:text-white transition-colors" href="/features">Features</Link>
          <Link className="hover:text-white transition-colors" href="/pricing">Pricing</Link>
          <Link className="hover:text-white transition-colors" href="/about">About Us</Link>
        </div>
        <div className="hidden md:flex gap-4 items-center">
          {user ? (
            <Link href="/dashboard" className="bg-white text-black font-body-sm font-semibold px-5 py-2.5 rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-zinc-400 font-body-sm font-semibold hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="bg-white text-black font-body-sm font-semibold px-5 py-2.5 rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-12 px-gutter overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-sky-500/10 blur-[120px] rounded-full z-0 pointer-events-none mix-blend-screen" />
        
        <div className="max-w-4xl mx-auto text-center z-10 space-y-5 flex flex-col items-center relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5" /> 14-Day Free Trial Included
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-headline-lg font-extrabold tracking-tight text-white drop-shadow-2xl"
          >
            Predictable Plans for Modern Venues
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-body-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed text-base sm:text-lg"
          >
            Choose the right capacity for your venue. Start with a 14-day free trial on Growth features. No credit card required.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-2 mt-4 bg-[#0f1219] p-1.5 rounded-full border border-white/10"
          >
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${!isYearly ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-zinc-400 hover:text-white'}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isYearly ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-zinc-400 hover:text-white'}`}
            >
              Annual Billing
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isYearly ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                Save 17%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* 14-Day Free Trial Highlight Banner */}
      <section className="px-gutter pb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-7xl mx-auto bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-purple-950/40 border border-sky-500/30 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl shadow-xl shadow-sky-950/20"
        >
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> 14-Day Free Trial
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Try Growth (Busy Venue) Features Free For 14 Days
            </h3>
            <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">
              Experience AI TV voice announcements, WhatsApp chatbots, live chat workspace, and custom branding with 1 location and a hard cap of <strong>50 tickets per day</strong> (700 total for the 14-day trial). Zero risk, no credit card required.
            </p>
          </div>
          <Link
            href="/register"
            className="shrink-0 bg-white hover:bg-zinc-200 text-black font-semibold px-6 py-3 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 text-sm flex items-center gap-2"
          >
            Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-32 px-gutter relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayPlans.map((plan, index) => {
            const isPopular = plan.name.toLowerCase().includes('growth');
            const isEnterprise = plan.name.toLowerCase().includes('enterprise');
            const isBasic = plan.name.toLowerCase().includes('basic');
            const isPlus = plan.name.toLowerCase().includes('plus');
            const currencySymbol = 'R';

            // Prices stored in cents: e.g. 69900 -> R699, 139900 -> R1,399, etc.
            const rawMonthly = plan.price || 0;
            const monthlyAmount = rawMonthly >= 1000 ? Math.round(rawMonthly / 100) : Math.round(rawMonthly);
            const rawAnnual = plan.annualPrice || 0;
            const annualAmount = rawAnnual >= 1000 ? Math.round(rawAnnual / 100) : Math.round(rawAnnual);

            // Annual monthly rate without decimals
            const annualMonthlyRate = annualAmount > 0 ? Math.round(annualAmount / 12) : 0;
            const currentPrice = `${currencySymbol}${(isYearly && annualMonthlyRate > 0 ? annualMonthlyRate : monthlyAmount).toLocaleString()}`;

            const savingsPercent = monthlyAmount > 0 && annualAmount > 0
              ? Math.max(0, Math.round(((monthlyAmount * 12 - annualAmount) / (monthlyAmount * 12)) * 100))
              : 0;

            const limits = plan.limits || {};
            const dailyCap = limits.dailyTicketCap || limits.maxTokens || 1000;

            return (
              <motion.div 
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                className={`bg-[#0f1219] border ${
                  isPopular 
                    ? 'border-sky-500 shadow-2xl shadow-sky-900/30 md:-translate-y-3' 
                    : isEnterprise
                      ? 'border-purple-500/40 hover:border-purple-500/60'
                      : 'border-white/10 hover:border-white/20'
                } rounded-3xl p-7 flex flex-col h-full relative transition-all`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sky-500 text-white px-3.5 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase shadow-lg shadow-sky-500/30">
                    Most Popular
                  </div>
                )}
                {isEnterprise && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-3.5 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase shadow-lg shadow-purple-600/30">
                    Enterprise Fleet
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-xs text-zinc-400 min-h-[36px] leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6 relative">
                  {isYearly && savingsPercent > 0 && (
                    <div className="absolute -top-5 right-0 bg-emerald-500/20 text-emerald-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {savingsPercent}% OFF
                    </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {currentPrice}
                    </span>
                    <span className="text-zinc-500 text-xs font-semibold">/mo</span>
                  </div>
                  {isYearly && annualAmount > 0 && (
                    <div className="text-xs text-zinc-400 mt-1">
                      Billed {currencySymbol}{annualAmount.toLocaleString()} yearly
                    </div>
                  )}
                </div>

                <Link 
                  href="/register" 
                  className={`w-full block py-3 px-4 rounded-xl text-center text-sm font-semibold transition-all mb-6 ${
                    isPopular 
                      ? 'bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-lg shadow-sky-500/25' 
                      : isEnterprise
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Start 14-Day Free Trial
                </Link>

                <div className="flex-1 flex flex-col justify-between space-y-6">
                  {/* Structural Allowances */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-3">
                      Structural Allowances:
                    </p>
                    <ul className="space-y-2.5 text-xs text-zinc-300">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                        <span><strong>{limits.maxLocations} Location{limits.maxLocations === 1 ? '' : 's'}</strong></span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>Up to <strong>{limits.maxServices} Services</strong></span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>{limits.maxStaff && limits.maxStaff >= 9999 ? 'Unlimited' : `Up to ${limits.maxStaff}`} <strong>Staff Desks</strong></span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>
                          {limits.maxJourneyStages ? (
                            <>Max <strong>{limits.maxJourneyStages} Journey Stages</strong> (excl. start & end)</>
                          ) : (
                            <><strong>Unlimited Journey Stages</strong></>
                          )}
                        </span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>{dailyCap.toLocaleString()} Tickets/Day Cap</strong></span>
                      </li>
                    </ul>
                  </div>

                  {/* Feature Payload */}
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                      Feature Payload:
                    </p>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      {isBasic && (
                        <>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>Walk-in QR & Online Portal</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>Stripe & Paystack Checkout</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>Visual TV Queue Display</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>Email & Portal Tracking</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                            <span className="text-zinc-400">"Powered by Qmova" Badge</span>
                          </li>
                        </>
                      )}

                      {isGrowth && (
                        <>
                          <li className="flex items-start gap-2 text-sky-300 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>Includes All Basic Features</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>AI TV Voice Announcements</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>AI WhatsApp Chatbot</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>Live Chat Workspace</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>Custom Branding (No Badge)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>Review Auditing</span>
                          </li>
                        </>
                      )}

                      {isPlus && (
                        <>
                          <li className="flex items-start gap-2 text-sky-300 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>Includes All Growth Features</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>Cross-Branch Analytics</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>Full White-Labeling</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>Webhooks for CRM Integration</span>
                          </li>
                        </>
                      )}

                      {isEnterprise && (
                        <>
                          <li className="flex items-start gap-2 text-purple-300 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <span>Includes All Plus Features</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <span>Full REST API Access</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <span>Custom Domain Hosting</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <span>Multi-Zone AI Voice Routing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <span>Priority SLA Support</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FAQs */}
      <section className="py-24 px-gutter border-t border-white/5 relative">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { 
                q: 'How does the 14-day free trial work?', 
                a: 'Every new account starts on a full 14-day trial that mirrors the Growth (Busy Venue) plan. It gives you 1 Location, full access to AI voice announcements and WhatsApp features, and a hard cap of 50 tickets per day (700 total for the trial) with no credit card required.' 
              },
              { 
                q: 'Can I change my plan later?', 
                a: 'Yes, you can upgrade or downgrade your plan at any time in your dashboard billing settings. Changes take effect immediately with automated prorated billing.' 
              },
              { 
                q: 'Are there any setup fees?', 
                a: 'No setup fees whatsoever. You only pay the flat rate for the plan you choose.' 
              },
              { 
                q: 'Do you offer annual discounts?', 
                a: 'Yes! Choosing annual billing saves you 17% across all plans.' 
              },
              { 
                q: 'What happens if I reach my daily ticket limit?', 
                a: 'You will receive immediate dashboard notifications as you approach your daily limit. If you consistently handle higher volume, upgrading takes just one click.' 
              }
            ].map((faq, i) => (
              <div key={i} className="bg-[#0f1219] border border-white/5 rounded-2xl p-6">
                <h4 className="text-base font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  let plans: Plan[] = [];
  
  try {
    const res = await fetch(`${baseUrl}/public/plans`);
    if (res.ok) {
      plans = await res.json();
      plans.sort((a, b) => a.price - b.price);
    }
  } catch (error) {
    console.error('Failed to fetch public plans:', error);
  }

  // Fallback plans if backend fails
  if (plans.length === 0) {
    plans = [
      {
        id: '1',
        name: 'Basic (Small Business)',
        type: 'BASIC',
        description: 'Solo barbers, single-doctor clinics, small takeaways (Under 100 tickets/day).',
        price: 69900,
        annualPrice: 699000,
        currency: 'ZAR',
        limits: { maxLocations: 1, maxServices: 3, maxStaff: 3, dailyTicketCap: 1000, maxJourneyStages: 3 },
        features: { walkInQr: true, onlinePortal: true, checkout: true, tvDisplay: true, emailTracking: true, poweredByBadge: true, customBranding: false }
      },
      {
        id: '2',
        name: 'Growth (Busy Venue)',
        type: 'GROWTH',
        description: 'High-throughput QSRs, large multi-doctor clinics, auto centers (100–500 tickets/day).',
        price: 139900,
        annualPrice: 1399000,
        currency: 'ZAR',
        limits: { maxLocations: 1, maxServices: 15, maxStaff: 10, dailyTicketCap: 2500, maxJourneyStages: null },
        features: { walkInQr: true, onlinePortal: true, checkout: true, tvDisplay: true, emailTracking: true, textToSpeech: true, whatsappChatbot: true, whatsappChat: true, reviewAuditing: true, customBranding: true }
      },
      {
        id: '3',
        name: 'Plus (Multi-Branch)',
        type: 'PLUS',
        description: 'Regional chains, franchise groups with 2-3 outlets, medical groups.',
        price: 249900,
        annualPrice: 2499000,
        currency: 'ZAR',
        limits: { maxLocations: 3, maxServices: 30, maxStaff: 25, dailyTicketCap: 10000, maxJourneyStages: null },
        features: { walkInQr: true, onlinePortal: true, checkout: true, tvDisplay: true, emailTracking: true, textToSpeech: true, whatsappChatbot: true, whatsappChat: true, reviewAuditing: true, crossBranchAnalytics: true, whiteLabeling: true, crmWebhooks: true, customBranding: true }
      },
      {
        id: '4',
        name: 'Enterprise (Network)',
        type: 'ENTERPRISE',
        description: 'Hospital networks, government centers, national franchises.',
        price: 499900,
        annualPrice: 4999000,
        currency: 'ZAR',
        limits: { maxLocations: 10, maxServices: 100, maxStaff: 9999, dailyTicketCap: 100000, maxJourneyStages: null },
        features: { walkInQr: true, onlinePortal: true, checkout: true, tvDisplay: true, emailTracking: true, textToSpeech: true, whatsappChatbot: true, whatsappChat: true, reviewAuditing: true, crossBranchAnalytics: true, whiteLabeling: true, crmWebhooks: true, apiAccess: true, customDomain: true, multiZoneVoice: true, prioritySla: true, customBranding: true }
      }
    ];
  }

  return {
    props: {
      plans,
    },
  };
};
