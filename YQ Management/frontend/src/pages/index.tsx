import Footer from "../components/Footer";
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

import SEO from '../components/SEO';
import { useAuth } from '../components/AuthContext';
import { Logo } from '../components/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  CalendarDays, 
  Ticket, 
  MonitorSmartphone, 
  ArrowRight, 
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  DollarSign,
  Smartphone,
  Building2,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Scissors,
  Landmark,
  Wrench
} from 'lucide-react';

const homeFaqs = [
  {
    question: "How fast can I set up QMova for my business?",
    answer: "You can be live in under 3 minutes. QMova requires zero IT setup, zero code, and zero hardware installations. Simply sign up, add your service queues, print or display your unique QR code, and start accepting walk-ins and scheduled appointments immediately from any web browser or phone."
  },
  {
    question: "Do I need to buy expensive kiosks, pagers, or specialized tablets?",
    answer: "No. QMova is 100% cloud-based and hardware-agnostic. Customers check in using their own smartphones by scanning a QR code or messaging your WhatsApp bot. Your receptionists and staff manage queues from existing laptops, tablets, or iPads, and you can turn any standard smart TV into a real-time lobby waiting display with a single browser link."
  },
  {
    question: "How does QMova cost up to 80% less than legacy queue systems?",
    answer: "Legacy queue systems like Qmatic, Qminder, or Waitwhile charge thousands of dollars for proprietary touchscreen kiosks, thermal ticket printers, and high monthly hardware leasing fees. QMova runs entirely in the cloud on existing devices, eliminating hardware markups and passing massive savings directly to your business with transparent, all-inclusive pricing."
  },
  {
    question: "How does the WhatsApp virtual queue ticket work?",
    answer: "When a customer joins your queue via QR code or sends a message to your verified WhatsApp bot, QMova automatically generates a digital ticket. The bot sends automated real-time status updates and a friendly 5-minute reminder when their turn approaches, allowing visitors to wait comfortably in a coffee shop or their car instead of a crowded waiting room."
  },
  {
    question: "Can QMova manage both scheduled appointments and walk-in visitors together?",
    answer: "Yes. QMova features a unified smart algorithmic reception desk that dynamically slots walk-ins into the gaps between scheduled appointments. This maximizes staff productivity, eliminates counter idle time, and prevents double-booking."
  },
  {
    question: "Is there a free trial, and can I cancel anytime?",
    answer: "Yes. QMova offers a 14-day full-featured free trial with no credit card required. You can test virtual queues, custom booking links, and staff desks risk-free. All paid plans are month-to-month with no contracts and zero cancellation fees."
  }
];

export default function LandingPage() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="dark bg-[#09090b] min-h-screen font-sans text-white antialiased overflow-x-hidden selection:bg-sky-500/30">
      <SEO 
        title="Qmova | Smart Queue Management Software | Low-Cost Virtual Waiting Room"
        description="The modern, low-cost queue management and appointment scheduling platform. Launch in 3 minutes with zero hardware required. Save up to 80% vs legacy kiosks with WhatsApp virtual tickets and smart check-in."
        keywords={[
          "queue management software",
          "free queue management system",
          "low cost queue system",
          "affordable appointment scheduling",
          "virtual queue system",
          "smart waiting room software",
          "whatsapp queue tickets",
          "qr code walk in system",
          "waitwhile alternative",
          "qminder alternative",
          "qmatic alternative",
          "clinic patient queue management"
        ]}
        faq={homeFaqs}
      />
      <Head>
        <style dangerouslySetInnerHTML={{ __html: `body { background-color: #09090b !important; }` }} />
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-ui h-header-h flex items-center justify-between px-gutter border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="flex items-center gap-2">
          <Logo width={140} height={22} href="/" forceTheme="dark" />
        </div>
        <div className="hidden md:flex gap-8 font-body-sm text-zinc-400 font-medium tracking-wide">
          <Link className="hover:text-white transition-colors" href="/features">Features</Link>
          <Link className="hover:text-white transition-colors" href="/pricing">Pricing</Link>
          <Link className="hover:text-white transition-colors" href="#solutions">Solutions</Link>
          <Link className="hover:text-white transition-colors" href="#comparison">Compare</Link>
          <Link className="hover:text-white transition-colors" href="#faq">FAQ</Link>
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
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-24 pb-10 px-gutter overflow-hidden">
        {/* Dynamic Background Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent opacity-70 pointer-events-none"></div>
        <motion.div
          className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-12 z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 space-y-6 lg:space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2 rounded-full bg-emerald-400">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              </span>
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">
                ⏱️ 3-Minute Setup • ⚡ Zero Hardware • 💰 80% Lower Cost
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Smart Queue Management. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-sky-400 mt-2 block">
                Empty your waiting room in minutes.
              </span>
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-zinc-400 max-w-lg leading-relaxed font-medium">
              The modern, affordable queue management and appointment scheduling platform. Let customers wait from their phone with WhatsApp tickets while you manage walk-ins and bookings effortlessly. No \$3,000 kiosks required.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link href="/register" className="relative group w-full sm:w-auto h-[50px] lg:h-[54px] px-8 rounded-full bg-sky-600 text-white font-semibold hover:bg-sky-500 transition-all shadow-[0_0_30px_rgba(2,132,199,0.3)] flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
                <span className="relative z-10 flex items-center gap-2">
                  Start 14-Day Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link href="/book-demo" className="relative group w-full sm:w-auto h-[50px] lg:h-[54px] px-8 rounded-full bg-white/[0.03] text-white font-semibold hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95">
                <span>Book a Live Demo</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>3-Minute Self Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Hardware Needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cancel Anytime</span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2 opacity-70">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#09090b] flex items-center justify-center overflow-hidden">
                    <Image src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Active QMova Business User" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="text-sm font-medium text-zinc-400 leading-tight">
                <span className="text-white font-bold block">Trusted by 500+ modern venues</span>
                cutting lobby congestion by 65%
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 relative w-full aspect-square max-w-[600px] flex items-center justify-center group cursor-default"
          >
            {/* Dual Glow Balls */}
            <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-sky-500/30 blur-[100px] rounded-full mix-blend-screen pointer-events-none opacity-50 group-hover:opacity-80 scale-100 group-hover:scale-125 transition-all duration-700 ease-out" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] bg-purple-500/30 blur-[100px] rounded-full mix-blend-screen pointer-events-none opacity-50 group-hover:opacity-80 scale-100 group-hover:scale-125 transition-all duration-700 ease-out delay-75" />

            {/* Hover Image */}
            <Image
              src="/images/no-bg/maya-hero-section.png"
              alt="QMova Smart Queue and Virtual Waiting Room on Mobile"
              width={800}
              height={800}
              priority
              className="relative z-10 w-[120%] max-w-none h-auto object-contain drop-shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-none scale-100 group-hover:scale-105 translate-y-0 group-hover:-translate-y-4 transition-all duration-700 ease-out"
            />

            {/* Floating Ticket Confirmed Card */}
            <div className="absolute -bottom-4 right-0 z-20 pointer-events-none translate-y-0 group-hover:-translate-y-2 transition-all duration-700 ease-out">
              <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-2xl inline-block max-w-[320px]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg tracking-tight">Virtual Ticket Confirmed</p>
                    <p className="text-zinc-400 text-sm leading-tight mt-0.5">Maya joined the queue via WhatsApp.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3 Value Pillars */}
      <section className="py-12 px-gutter border-y border-white/5 bg-zinc-950/60">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Launch in 3 Minutes</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Zero IT installation or hardware wiring. Register, configure your service queues, print your QR code, and open your doors.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Zero Hardware Required</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Customers check in from their own smartphones. Staff manage counters on existing laptops, tablets, or phones.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">80% Cost Reduction</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Save \$3,500+ per location compared to legacy hardware kiosks and proprietary ticket printers. Transparent, scalable pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-gutter relative overflow-hidden bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-white">
              Everything you need to run a flawless, wait-free front desk.
            </h2>
            <p className="text-lg text-zinc-400">
              No expensive pagers. No clunky tablets. Just fast, elegant software that your visitors and staff will love.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {/* Feature 1 */}
            <Link href="/features#whatsapp" className="bg-[#0f1219] border border-white/5 rounded-2xl p-8 hover:border-emerald-500/30 transition-colors group block cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">WhatsApp Virtual Tickets</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Visitors join the queue via WhatsApp. Automated 5-minute alerts let them wait comfortably anywhere while keeping lobbies empty.
              </p>
            </Link>

            {/* Feature 2 */}
            <Link href="/features#routing" className="bg-[#0f1219] border border-white/5 rounded-2xl p-8 hover:border-purple-500/30 transition-colors group block cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Booking Page</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Launch a custom-branded booking link in seconds. Allow clients to schedule appointments 24/7 without phone tag.
              </p>
            </Link>

            {/* Feature 3 */}
            <Link href="/features#status" className="bg-[#0f1219] border border-white/5 rounded-2xl p-8 hover:border-amber-500/30 transition-colors group block cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Ticket className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">QR Code Contactless Check-In</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Print a single QR code poster for your entrance. Customers scan, choose a service, and get a digital pass immediately.
              </p>
            </Link>

            {/* Feature 4 */}
            <Link href="/features#mobile" className="bg-[#0f1219] border border-white/5 rounded-2xl p-8 hover:border-sky-500/30 transition-colors group block cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MonitorSmartphone className="w-6 h-6 text-sky-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Cloud Reception Desk</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Run your counters from any browser or tablet. Call tickets, transfer between stages, and broadcast to TV displays effortlessly.
              </p>
            </Link>
          </div>

          {/* Visual Story 1: Web Dashboard */}
          <div className="flex flex-col gap-32 mt-32">
            <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: -30 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="flex-1 relative w-full aspect-[4/3] flex items-center justify-center group cursor-default"
              >
                <div className="absolute top-0 left-0 w-[80%] h-[80%] bg-sky-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none opacity-50 group-hover:opacity-80 scale-100 group-hover:scale-125 transition-all duration-700 ease-out" />
                <div className="absolute bottom-0 right-0 w-[80%] h-[80%] bg-teal-400/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none opacity-50 group-hover:opacity-80 scale-100 group-hover:scale-125 transition-all duration-700 ease-out delay-75" />
                <Image
                  src="/images/no-bg/maya-reception.png"
                  alt="Receptionist managing digital waiting queue on QMova dashboard"
                  width={800}
                  height={600}
                  loading="lazy"
                  className="relative z-10 w-[90%] max-w-none h-auto object-contain drop-shadow-[0_0_50px_rgba(0,0,0,0.6)] pointer-events-none scale-100 group-hover:scale-105 translate-y-0 group-hover:-translate-y-3 transition-all duration-700 ease-out"
                />
              </motion.div>

              <div className="flex-1 space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Staff-Friendly Workflow</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white">Empower your front desk in 3 minutes flat.</h2>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  QMova&apos;s receptionist desk is so intuitive that staff master it in 3 minutes. It eliminates front-desk stress by intelligently slotting walk-in tickets between pre-booked appointments without delays.
                </p>
                <div className="pt-4">
                  <Link href="/features#routing" className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-2 group">
                    Explore the cloud dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Visual Story 2: WhatsApp Chatbot */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-6 lg:pl-12">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Zero App Downloads</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white">Let automated WhatsApp alerts handle the wait.</h2>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Give visitors true convenience. They join your queue via WhatsApp, see live queue positions, and get a polite 5-minute automated alert before being called to the counter.
                </p>
                <div className="pt-4">
                  <Link href="/features#whatsapp" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-2 group">
                    See the WhatsApp queue bot in action
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 30 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="flex-1 relative w-full aspect-[4/3] flex items-center justify-center group cursor-default"
              >
                <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-emerald-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none opacity-50 group-hover:opacity-80 scale-100 group-hover:scale-125 transition-all duration-700 ease-out" />
                <div className="absolute bottom-0 left-0 w-[80%] h-[80%] bg-green-400/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none opacity-50 group-hover:opacity-80 scale-100 group-hover:scale-125 transition-all duration-700 ease-out delay-75" />
                <Image
                  src="/images/no-bg/maya-whatsapp.png"
                  alt="WhatsApp Virtual Ticket Bot sending wait time updates"
                  width={800}
                  height={600}
                  loading="lazy"
                  className="relative z-10 w-[90%] max-w-none h-auto object-contain drop-shadow-[0_0_50px_rgba(0,0,0,0.6)] pointer-events-none scale-100 group-hover:scale-105 translate-y-0 group-hover:-translate-y-3 transition-all duration-700 ease-out"
                />
              </motion.div>
            </div>

            {/* Visual Story 3: Custom Booking Calendar */}
            <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: -30 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="flex-1 relative w-full aspect-[4/3] flex items-center justify-center group cursor-default"
              >
                <div className="absolute top-10 left-0 w-[80%] h-[80%] bg-purple-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none opacity-50 group-hover:opacity-80 scale-100 group-hover:scale-125 transition-all duration-700 ease-out" />
                <div className="absolute bottom-10 right-0 w-[80%] h-[80%] bg-pink-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none opacity-50 group-hover:opacity-80 scale-100 group-hover:scale-125 transition-all duration-700 ease-out delay-75" />
                <Image
                  src="/images/no-bg/maya-callendar.png"
                  alt="Custom online appointment booking calendar for salons and clinics"
                  width={800}
                  height={600}
                  loading="lazy"
                  className="relative z-10 w-[90%] max-w-none h-auto object-contain drop-shadow-[0_0_50px_rgba(0,0,0,0.6)] pointer-events-none scale-100 group-hover:scale-105 translate-y-0 group-hover:-translate-y-3 transition-all duration-700 ease-out"
                />
              </motion.div>

              <div className="flex-1 space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">24/7 Self-Booking</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white">Effortless appointment scheduling that syncs with walk-ins.</h2>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Launch a branded scheduling page in seconds. Clients reserve slots based on real-time specialist availability, automatically preventing double bookings and front-desk logjams.
                </p>
                <div className="pt-4">
                  <Link href="/features#routing" className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-2 group">
                    Create your booking page
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Visual Story 4: No Hardware */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-6 lg:pl-12">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Zero Hardware Overhead</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white">Ditch clunky \$3,000 kiosks and paper pagers.</h2>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Say goodbye to expensive touchscreens, thermal ticket paper rolls, and hardware maintenance contracts. QMova runs entirely in the cloud on the devices you already own.
                </p>
                <div className="pt-4">
                  <Link href="/features#mobile" className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-2 group">
                    Modernize your front desk today
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 30 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="flex-1 relative w-full aspect-[4/3] flex items-center justify-center group cursor-default"
              >
                <div className="absolute top-0 right-10 w-[80%] h-[80%] bg-amber-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none opacity-50 group-hover:opacity-80 scale-100 group-hover:scale-125 transition-all duration-700 ease-out" />
                <div className="absolute bottom-0 left-10 w-[80%] h-[80%] bg-orange-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none opacity-50 group-hover:opacity-80 scale-100 group-hover:scale-125 transition-all duration-700 ease-out delay-75" />
                <Image
                  src="/images/no-bg/maya-nohardware.png"
                  alt="No hardware required - cloud queue software on mobile and desktop"
                  width={800}
                  height={600}
                  loading="lazy"
                  className="relative z-10 w-[90%] max-w-none h-auto object-contain drop-shadow-[0_0_50px_rgba(0,0,0,0.6)] pointer-events-none scale-100 group-hover:scale-105 translate-y-0 group-hover:-translate-y-3 transition-all duration-700 ease-out"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions by Industry */}
      <section id="solutions" className="py-24 px-gutter border-t border-white/5 bg-zinc-950/70 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Specialized Workflows</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-3 mb-6 text-white">
              Tailored Queue Solutions for Every High-Traffic Front Desk
            </h2>
            <p className="text-lg text-zinc-400">
              Whether you manage confidential patient appointments, salon walk-in waitlists, or high-security bank counters, QMova provides pre-built workflows ready on day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/for/clinics" className="p-8 rounded-2xl bg-[#0f1219] border border-white/5 hover:border-sky-500/30 transition-all group block">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Clinics & Healthcare</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                HIPAA-conscious patient check-in, doctor assignment queues, and reduced waiting room infection exposure.
              </p>
              <span className="text-xs font-semibold text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Explore Clinic Flow <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link href="/for/salons" className="p-8 rounded-2xl bg-[#0f1219] border border-white/5 hover:border-purple-500/30 transition-all group block">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Salons & Barbershops</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Blend online client bookings with walk-in chair requests. Let clients wait at local cafes with WhatsApp reminders.
              </p>
              <span className="text-xs font-semibold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Explore Salon Flow <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link href="/for/banks" className="p-8 rounded-2xl bg-[#0f1219] border border-white/5 hover:border-emerald-500/30 transition-all group block">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Banks & Credit Unions</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Multi-teller counter routing, VIP customer prioritization, branch analytics, and bank-grade data security.
              </p>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Explore Bank Flow <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link href="/for/repair-shops" className="p-8 rounded-2xl bg-[#0f1219] border border-white/5 hover:border-amber-500/30 transition-all group block">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Auto & Repair Centers</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Track vehicle drop-offs, manage service bays, and send automated WhatsApp updates when vehicles are ready for pickup.
              </p>
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Explore Repair Flow <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Competitor & Legacy Comparison Matrix */}
      <section id="comparison" className="py-24 px-gutter border-t border-white/5 bg-[#09090b] relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Honest Value Comparison</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-3 mb-6 text-white">
              Why Forward-Thinking Businesses Choose QMova Over Legacy Kiosks
            </h2>
            <p className="text-lg text-zinc-400">
              Compare QMova with traditional hardware-heavy queue management providers (Qmatic, Qminder, Waitwhile).
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0f1219] shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-5 text-sm font-semibold text-zinc-400">Key Feature / Metric</th>
                  <th className="p-5 text-sm font-semibold text-zinc-400">Legacy Hardware Kiosks</th>
                  <th className="p-5 text-sm font-bold text-sky-400 bg-sky-500/10 border-x border-sky-500/20">QMova Cloud Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                <tr>
                  <td className="p-5 font-semibold text-white">Hardware Cost Per Location</td>
                  <td className="p-5 text-zinc-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    \$2,500 – \$8,000+ (Touchscreens, thermal printers)
                  </td>
                  <td className="p-5 font-bold text-emerald-400 bg-sky-500/5 border-x border-sky-500/20">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      \$0 (Customers use phones; staff use any screen)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-5 font-semibold text-white">Time to Deployment</td>
                  <td className="p-5 text-zinc-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    2 to 6 weeks (Shipping, technicians, wiring)
                  </td>
                  <td className="p-5 font-bold text-emerald-400 bg-sky-500/5 border-x border-sky-500/20">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      Under 3 minutes (Self-serve cloud launch)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-5 font-semibold text-white">Customer Notifications</td>
                  <td className="p-5 text-zinc-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    Clunky buzzer pagers or expensive SMS surcharges
                  </td>
                  <td className="p-5 font-bold text-emerald-400 bg-sky-500/5 border-x border-sky-500/20">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      Free WhatsApp tickets & live position web tracking
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-5 font-semibold text-white">Lobby Waiting Display</td>
                  <td className="p-5 text-zinc-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    Proprietary media player boxes (\$500+ each)
                  </td>
                  <td className="p-5 font-bold text-emerald-400 bg-sky-500/5 border-x border-sky-500/20">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      Any Smart TV via built-in web browser
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-5 font-semibold text-white">Contract Commitment</td>
                  <td className="p-5 text-zinc-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    1–3 Year lock-in with penalty cancellation fees
                  </td>
                  <td className="p-5 font-bold text-emerald-400 bg-sky-500/5 border-x border-sky-500/20">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      Month-to-month, cancel anytime with 1 click
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section id="faq" className="py-24 px-gutter border-t border-white/5 bg-black/40 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Got Questions?</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-3 mb-4 text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-400 text-base md:text-lg">
              Everything you need to know about setting up QMova, zero-hardware queueing, and low-cost pricing.
            </p>
          </div>

          <div className="space-y-4">
            {homeFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="rounded-2xl border border-white/5 bg-[#0f1219] overflow-hidden transition-colors hover:border-white/10"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-6 text-left flex justify-between items-center gap-4 cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="font-bold text-white text-base md:text-lg pr-2">
                      {faq.question}
                    </span>
                    <span className={`p-2 rounded-xl bg-white/5 text-zinc-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-sky-400' : ''}`}>
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 text-sm md:text-base text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-gutter relative overflow-hidden flex justify-center text-center border-t border-white/5">
        <div className="absolute inset-0 bg-sky-900/20"></div>
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#09090b] to-transparent"></div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Start in 3 Minutes
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
            Ready to empty your waiting room?
          </h2>
          <p className="text-xl text-zinc-400">
            Join 500+ businesses delivering a wait-free customer experience at a fraction of legacy costs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="h-[56px] px-10 rounded-full bg-sky-600 text-white font-bold hover:bg-sky-500 transition-all shadow-[0_0_40px_rgba(2,132,199,0.4)] flex items-center justify-center gap-2 text-lg hover:scale-105 active:scale-95">
              Start Free 14-Day Trial
            </Link>
            <Link href="/book-demo" className="h-[56px] px-8 rounded-full bg-white/5 text-white font-semibold hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2 text-base hover:scale-105 active:scale-95">
              Talk to Solutions Team
            </Link>
          </div>
          <p className="text-sm text-zinc-500">No credit card required • Instant 3-minute setup • Cancel anytime</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
