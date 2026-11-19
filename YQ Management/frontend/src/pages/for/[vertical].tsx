import { GetStaticProps, GetStaticPaths } from 'next';
import MarketingLayout from '@/components/MarketingLayout';
import Link from 'next/link';
import { CheckCircle2, Clock, Zap, DollarSign, ArrowRight, Sparkles } from 'lucide-react';

interface VerticalData {
  id: string;
  name: string;
  title: string;
  description: string;
  keywords: string[];
  features: string[];
  benefits: string[];
  heroImage: string;
}

const verticals: Record<string, VerticalData> = {
  clinics: {
    id: 'clinics',
    name: 'Clinics & Healthcare',
    title: 'Patient Queue Management & Virtual Waiting Rooms for Clinics',
    description: 'Eliminate crowded waiting rooms, safeguard patient privacy, and streamline check-ins with WhatsApp queue tickets and zero hardware kiosks. Set up in 3 minutes.',
    keywords: [
      'patient queue management system',
      'clinic waiting room software',
      'hospital outpatient queue',
      'contactless patient check in',
      'whatsapp patient queue',
      'affordable clinic queue software',
      'zero hardware medical queue'
    ],
    features: [
      'HIPAA & POPIA compliant WhatsApp ticket updates',
      'Contactless QR code patient check-in',
      'Automated appointment reminders & ETA updates',
      'Doctor & specialty-specific multi-counter queues',
      'Smart TV lobby display with AI voice announcements'
    ],
    benefits: [
      'Reduce patient walk-outs and no-shows by 40%',
      'Eliminate physical waiting room congestion completely',
      'Free up front-desk nurses and receptionists from phone inquiries',
      'Save $3,000+ per location compared to legacy touchscreen kiosks'
    ],
    heroImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000'
  },
  salons: {
    id: 'salons',
    name: 'Salons & Barbershops',
    title: 'Smart Walk-In Queue & Appointment Booking for Salons & Barbershops',
    description: 'Keep styling chairs full and clients relaxed. Customers wait at nearby cafes with WhatsApp wait time tracking. Launch in 3 minutes on any tablet or phone.',
    keywords: [
      'salon queue management software',
      'barbershop waitlist app',
      'salon walk in queue system',
      'whatsapp salon booking',
      'virtual waiting room for barbershops',
      'affordable salon software'
    ],
    features: [
      'Live WhatsApp wait time estimates & position tracking',
      'Unified walk-ins and scheduled online appointments',
      'Stylist and chair workload balancing',
      'Automated 5-minute return reminders',
      'One-tap Google Review booster for 5-star ratings'
    ],
    benefits: [
      'Increase chair utilization and daily client turnover',
      'Delight clients by letting them wait anywhere instead of a crowded foyer',
      'Eliminate chaotic paper clipboards and manual sign-in sheets',
      'Zero expensive kiosk hardware needed—runs on your phone or iPad'
    ],
    heroImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=2000'
  },
  banks: {
    id: 'banks',
    name: 'Banks & Financial Branches',
    title: 'Enterprise Queue Management & Teller Routing for Banks & Financial Branches',
    description: 'High-security, multi-counter branch routing with zero hardware kiosks. Prioritize VIP clients, reduce lobby congestion, and get real-time branch analytics.',
    keywords: [
      'bank queue management system',
      'financial branch customer flow',
      'teller queue routing software',
      'branch lobby waiting system',
      'multi-teller queue system',
      'virtual banking queue'
    ],
    features: [
      'Multi-teller skill-based service desk routing',
      'VIP customer prioritization and tier SLA rules',
      'Real-time branch wait time analytics and executive reporting',
      'Turn standard smart TVs into branded lobby queue boards',
      'Enterprise role-based access control and security compliance'
    ],
    benefits: [
      'Optimize teller service times and reduce peak-hour lobby bottlenecks',
      'Deliver a modern, premium VIP visitor experience',
      'Eliminate bulky ticket printer dispensers and technician callouts',
      'Cut branch queue infrastructure costs by up to 80%'
    ],
    heroImage: 'https://images.unsplash.com/photo-1501167737229-873b757e84cc?auto=format&fit=crop&q=80&w=2000'
  },
  'repair-shops': {
    id: 'repair-shops',
    name: 'Auto & Repair Centers',
    title: 'Customer Queue & Job Status Tracking for Auto Centers & Repair Shops',
    description: 'Automate customer notifications when vehicles or devices are ready for pickup. Eliminate "is it ready yet?" phone calls with live WhatsApp status tracking.',
    keywords: [
      'repair shop queue software',
      'auto repair customer flow',
      'vehicle pickup tracking software',
      'whatsapp job status updates',
      'service bay queue management',
      'mechanic shop waiting system'
    ],
    features: [
      'Status-based WhatsApp alerts (In Progress, Ready for Pickup)',
      'Separate drop-off, diagnostic, and pick-up queues',
      'Technician service bay management and notes',
      'Contactless QR code drop-off check-in',
      'Automated customer reviews upon ticket completion'
    ],
    benefits: [
      'Eliminate constant "is my car ready?" phone interruptions',
      'Accelerate vehicle turnaround times and front-desk handovers',
      'Build customer trust with crystal-clear progress updates',
      'Full cloud setup with zero hardware purchase needed'
    ],
    heroImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000'
  }
};

export default function VerticalPage({ data }: { data: VerticalData }) {
  if (!data) return null;

  return (
    <MarketingLayout
      title={`${data.title} | QMova`}
      description={data.description}
      keywords={data.keywords}
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'Solutions', url: '/#solutions' },
        { name: data.name, url: `/for/${data.id}` }
      ]}
    >
      <main className="bg-[#09090b] text-white min-h-screen pt-24 selection:bg-sky-500/30">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 px-6 md:px-12 border-b border-white/5">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img src={data.heroImage} alt={data.title} className="w-full h-full object-cover opacity-15" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
          </div>
          
          <div className="relative z-10 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Clock className="w-3.5 h-3.5" /> 3-Minute Cloud Setup
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-3.5 h-3.5" /> Zero Hardware Required
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <DollarSign className="w-3.5 h-3.5" /> 80% Lower Cost vs Kiosks
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-2xl max-w-4xl">
              {data.title}
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-300 max-w-3xl leading-relaxed">
              {data.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/register" 
                className="h-12 px-8 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all shadow-[0_0_25px_rgba(14,165,233,0.35)] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 text-sm"
              >
                Start Free 14-Day Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/book-demo" 
                className="h-12 px-6 rounded-full bg-white/5 text-zinc-200 font-semibold hover:bg-white/10 hover:text-white transition-all border border-white/10 flex items-center justify-center text-sm"
              >
                Schedule Live Walkthrough
              </Link>
            </div>
          </div>
        </section>

        {/* Features & Benefits */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Business Benefits</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Why modern {data.name.toLowerCase()} choose QMova
              </h2>
              <div className="space-y-4 pt-2">
                {data.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#0f1219] p-7 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Core Capabilities</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Turnkey Features Included</h3>
              </div>
              <ul className="space-y-3.5">
                {data.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 mt-2"></span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-white/5">
                <Link
                  href="/register"
                  className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Sparkles className="w-4 h-4 text-sky-400" /> Test In Your Venue Free
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 px-6 border-t border-white/5 bg-gradient-to-b from-transparent to-sky-950/20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Launch in under 3 minutes
            </h2>
            <p className="text-zinc-400 text-base max-w-xl mx-auto">
              No hardware to order. No technicians to wait for. Start your 14-day free trial right now.
            </p>
            <div className="flex justify-center">
              <Link
                href="/register"
                className="h-12 px-8 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all shadow-[0_0_25px_rgba(14,165,233,0.35)] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 text-sm"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = Object.keys(verticals).map((vertical) => ({
    params: { vertical },
  }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const vertical = params?.vertical as string;
  const data = verticals[vertical];

  if (!data) {
    return { notFound: true };
  }

  return {
    props: { data },
  };
};