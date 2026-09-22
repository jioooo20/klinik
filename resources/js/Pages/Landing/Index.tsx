import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    CalendarCheck,
    CheckCircle2,
    Clock,
    HeartPulse,
    Mail,
    MapPin,
    Menu,
    Phone,
    ShieldCheck,
    Smile,
    Stethoscope,
    Syringe,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/Components/ui/button';
import { useCounter, useHeroIntro, useRevealOnScroll } from '@/hooks/useLandingAnimation';
import { cn } from '@/lib/utils';

import {
    CLINIC,
    DOCTORS,
    FAQS,
    NAV_LINKS,
    SERVICES,
    STATS,
    STEPS,
    TESTIMONIALS,
    TRUST_BADGES,
} from './data';

import './landing.css';

const SERVICE_ICONS: Record<string, typeof Stethoscope> = {
    stethoscope: Stethoscope,
    'heart-pulse': HeartPulse,
    activity: Activity,
    smile: Smile,
    syringe: Syringe,
    'shield-check': ShieldCheck,
};

/* -------------------------------------------------------------------------- */
/* Navbar                                                                     */
/* -------------------------------------------------------------------------- */

function Navbar() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={cn(
                'sticky top-0 z-50 w-full transition-all duration-300',
                scrolled
                    ? 'border-b border-[var(--landing-line)] bg-white/85 backdrop-blur-md'
                    : 'border-b border-transparent bg-transparent',
            )}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
                <a href="#beranda" className="flex items-center gap-2.5" aria-label={CLINIC.name}>
                    <span
                        className="flex size-9 items-center justify-center rounded-xl text-white"
                        style={{ background: 'var(--landing-indigo)' }}
                    >
                        <HeartPulse className="size-5" aria-hidden />
                    </span>
                    <span className="landing-display text-lg font-bold">{CLINIC.name}</span>
                </a>

                <nav className="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            data-hero
                            className="text-sm font-medium text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-indigo)]"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 md:flex">
                    <Button asChild variant="ghost" size="sm">
                        <Link href={route('login')}>Masuk</Link>
                    </Button>
                    <Button asChild size="sm" className="rounded-full">
                        <Link href={route('login')}>
                            Daftar Online
                            <ArrowRight className="size-4" aria-hidden />
                        </Link>
                    </Button>
                </div>

                <button
                    type="button"
                    className="inline-flex size-10 items-center justify-center rounded-lg border border-[var(--landing-line)] md:hidden"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls="landing-mobile-nav"
                    aria-label={open ? 'Tutup menu' : 'Buka menu'}
                >
                    {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
                </button>
            </div>

            {open && (
                <nav
                    id="landing-mobile-nav"
                    className="border-t border-[var(--landing-line)] bg-white px-4 py-3 md:hidden"
                    aria-label="Navigasi seluler"
                >
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--landing-ink)] hover:bg-slate-100"
                            onClick={() => setOpen(false)}
                        >
                            {link.label}
                        </a>
                    ))}
                    <Link
                        href={route('login')}
                        className="mt-2 block rounded-full px-3 py-2 text-center text-sm font-semibold text-white"
                        style={{ background: 'var(--landing-indigo)' }}
                    >
                        Daftar Online
                    </Link>
                </nav>
            )}
        </header>
    );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

function Hero() {
    const ref = useHeroIntro<HTMLElement>();

    return (
        <section
            ref={ref}
            id="beranda"
            className="relative overflow-hidden pt-14 pb-20 md:pt-20 md:pb-28"
        >
            <div className="landing-mesh" aria-hidden />
            <div className="landing-dotgrid absolute inset-0 opacity-60" aria-hidden />

            <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 md:px-8 lg:grid-cols-2">
                <div>
                    <span
                        data-hero
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--landing-line)] bg-white/70 px-4 py-1.5 text-sm font-medium text-[var(--landing-indigo)]"
                    >
                        Klinik terpercaya sejak 2008
                    </span>

                    <h1
                        data-hero
                        className="mt-6 text-4xl font-extrabold leading-[1.08] md:text-6xl"
                    >
                        Sehat Anda,{' '}
                        <span
                            className="bg-clip-text text-transparent"
                            style={{
                                backgroundImage:
                                    'linear-gradient(120deg, var(--landing-indigo), var(--landing-teal))',
                            }}
                        >
                            Prioritas Kami
                        </span>
                    </h1>

                    <p
                        data-hero
                        className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--landing-muted)]"
                    >
                        {CLINIC.name} menghadirkan layanan kesehatan modern dengan pendaftaran
                        online, rekam medis digital, dan dokter berpengalaman agar setiap kunjungan
                        terasa cepat, nyaman, dan terpercaya.
                    </p>

                    <div data-hero className="mt-8 flex flex-wrap items-center gap-3">
                        <Button asChild size="lg" className="landing-pulse rounded-full">
                            <Link href={route('login')}>
                                <CalendarCheck className="size-5" aria-hidden />
                                Buat Jadwal Kunjungan
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="rounded-full">
                            <a href="#layanan">Lihat Layanan</a>
                        </Button>
                    </div>

                    <div data-hero className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
                        {TRUST_BADGES.map((badge) => (
                            <div
                                key={badge}
                                className="flex items-center gap-2 text-sm text-[var(--landing-muted)]"
                            >
                                <CheckCircle2
                                    className="size-4 text-[var(--landing-teal-text)]"
                                    aria-hidden
                                />
                                {badge}
                            </div>
                        ))}
                    </div>
                </div>

                <div data-hero className="relative">
                    <div className="landing-glass overflow-hidden rounded-3xl p-2">
                        <img
                            src="/images/patient-consultation.jpg"
                            alt="Dokter berkonsultasi dengan pasien di ruang pemeriksaan klinik"
                            className="h-[24rem] w-full rounded-2xl object-cover md:h-[30rem]"
                            width={1600}
                            height={1067}
                        />
                    </div>

                    <div className="landing-glass absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl px-5 py-4 md:-left-8">
                        <span
                            className="flex size-11 items-center justify-center rounded-xl text-white"
                            style={{ background: 'var(--landing-teal)' }}
                        >
                            <Clock className="size-5" aria-hidden />
                        </span>
                        <div>
                            <p className="text-sm font-semibold">{CLINIC.hours}</p>
                            <p className="text-xs text-[var(--landing-muted)]">Buka hari ini</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* Stats                                                                      */
/* -------------------------------------------------------------------------- */

function StatValue({ value, suffix }: { value: number; suffix: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    useCounter(ref, value, { suffix });

    // The hook overwrites this text on mount; rendering the real value here
    // (instead of a hard-coded "0") keeps the number meaningful before the
    // count-up animation runs and if JS is disabled.
    return (
        <span
            ref={ref}
            className="landing-display text-4xl font-extrabold text-[var(--landing-indigo)] md:text-5xl"
        >
            {value.toLocaleString('id-ID')}
            {suffix}
        </span>
    );
}

function Stats() {
    return (
        <section className="border-y border-[var(--landing-line)] bg-slate-50/70 py-14">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 md:grid-cols-4 md:px-8">
                {STATS.map((stat) => (
                    <div key={stat.label} className="text-center" data-reveal-group>
                        <StatValue value={stat.value} suffix={stat.suffix} />
                        <p
                            data-reveal
                            className="mt-2 text-sm font-medium text-[var(--landing-muted)]"
                        >
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* Section heading helper                                                     */
/* -------------------------------------------------------------------------- */

function SectionHeading({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description?: string;
}) {
    return (
        <div className="mx-auto max-w-2xl text-center">
            <span
                data-reveal
                className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--landing-indigo)]"
            >
                {eyebrow}
            </span>
            <h2 data-reveal className="mt-4 text-3xl font-bold md:text-4xl">
                {title}
            </h2>
            {description && (
                <p data-reveal className="mt-4 text-[var(--landing-muted)]">
                    {description}
                </p>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Services                                                                   */
/* -------------------------------------------------------------------------- */

function Services() {
    return (
        <section id="layanan" className="scroll-mt-20 py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                <SectionHeading
                    eyebrow="Layanan Kami"
                    title="Perawatan lengkap untuk seluruh keluarga"
                    description="Dari pemeriksaan umum hingga layanan penunjang, semuanya tersedia dalam satu klinik dengan alur yang mudah."
                />

                <div data-reveal-group className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {SERVICES.map((service) => {
                        const Icon = SERVICE_ICONS[service.icon] ?? Stethoscope;

                        return (
                            <article
                                key={service.title}
                                data-reveal
                                className="landing-lift group overflow-hidden rounded-2xl border border-[var(--landing-line)] bg-white"
                            >
                                <div className="relative h-44 overflow-hidden">
                                    <img
                                        src={service.image}
                                        alt={`Ilustrasi layanan ${service.title}`}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                        width={1600}
                                        height={900}
                                    />
                                    <span
                                        className="absolute left-4 top-4 flex size-11 items-center justify-center rounded-xl text-white shadow-lg"
                                        style={{ background: 'var(--landing-indigo)' }}
                                    >
                                        <Icon className="size-5" aria-hidden />
                                    </span>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold">{service.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">
                                        {service.description}
                                    </p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* Why us                                                                     */
/* -------------------------------------------------------------------------- */

const WHY_POINTS = [
    {
        icon: CalendarCheck,
        title: 'Pendaftaran online',
        body: 'Pesan jadwal kapan saja dan dapatkan nomor antrean tanpa perlu mengantre sejak pagi.',
    },
    {
        icon: ShieldCheck,
        title: 'Rekam medis aman',
        body: 'Riwayat pemeriksaan tersimpan digital dan hanya diakses oleh pihak yang berwenang.',
    },
    {
        icon: Stethoscope,
        title: 'Dokter berpengalaman',
        body: 'Tim dokter umum dan spesialis siap memberikan diagnosis serta penanganan yang tepat.',
    },
    {
        icon: Clock,
        title: 'Waktu tunggu singkat',
        body: 'Alur layanan yang tertata membuat kunjungan Anda lebih efisien dan nyaman.',
    },
];

function WhyUs() {
    return (
        <section className="relative overflow-hidden bg-slate-50/70 py-20 md:py-28">
            <div className="landing-dotgrid absolute inset-0 opacity-50" aria-hidden />
            <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 md:px-8 lg:grid-cols-2">
                <div data-reveal className="order-2 lg:order-1">
                    <div className="landing-glass overflow-hidden rounded-3xl p-2">
                        <img
                            src="/images/clinic-examination-room.jpg"
                            alt="Ruang pemeriksaan klinik yang bersih dan modern"
                            className="h-80 w-full rounded-2xl object-cover md:h-[28rem]"
                            loading="lazy"
                            width={1600}
                            height={2400}
                        />
                    </div>
                </div>

                <div className="order-1 lg:order-2">
                    <span
                        data-reveal
                        className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--landing-indigo)]"
                    >
                        Mengapa Kami
                    </span>
                    <h2 data-reveal className="mt-4 text-3xl font-bold md:text-4xl">
                        Pengalaman berobat yang tenang dan transparan
                    </h2>

                    <div data-reveal-group className="mt-8 grid gap-6 sm:grid-cols-2">
                        {WHY_POINTS.map((point) => (
                            <div key={point.title} data-reveal className="flex gap-4">
                                <span
                                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
                                    style={{ background: 'var(--landing-indigo)' }}
                                >
                                    <point.icon className="size-5" aria-hidden />
                                </span>
                                <div>
                                    <h3 className="font-semibold">{point.title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-[var(--landing-muted)]">
                                        {point.body}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* Doctors                                                                    */
/* -------------------------------------------------------------------------- */

function Doctors() {
    return (
        <section id="dokter" className="scroll-mt-20 py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                <SectionHeading
                    eyebrow="Tim Dokter"
                    title="Ditangani tenaga medis yang Anda percaya"
                    description="Setiap dokter memiliki jadwal praktik yang jelas sehingga Anda dapat memilih sesuai kebutuhan."
                />

                <div data-reveal-group className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {DOCTORS.map((doctor) => (
                        <article
                            key={doctor.name}
                            data-reveal
                            className="landing-lift overflow-hidden rounded-2xl border border-[var(--landing-line)] bg-white"
                        >
                            <div className="h-64 overflow-hidden bg-slate-100">
                                <img
                                    src={doctor.image}
                                    alt={`Foto ${doctor.name}, ${doctor.specialty} di ${CLINIC.name}`}
                                    className="h-full w-full object-cover object-top"
                                    loading="lazy"
                                    width={800}
                                    height={1000}
                                />
                            </div>
                            <div className="p-5">
                                <h3 className="font-semibold">{doctor.name}</h3>
                                <p className="mt-0.5 text-sm font-medium text-[var(--landing-teal-text)]">
                                    {doctor.specialty}
                                </p>
                                <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--landing-muted)]">
                                    <Clock className="size-3.5" aria-hidden />
                                    {doctor.schedule}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                      */
/* -------------------------------------------------------------------------- */

function Steps() {
    return (
        <section id="alur" className="scroll-mt-20 bg-slate-50/70 py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                <SectionHeading
                    eyebrow="Alur Pendaftaran"
                    title="Empat langkah menuju kunjungan Anda"
                    description="Prosesnya sederhana dan dapat diselesaikan langsung dari perangkat Anda."
                />

                <div data-reveal-group className="mt-14 grid gap-6 md:grid-cols-4">
                    {STEPS.map((step) => (
                        <div
                            key={step.step}
                            data-reveal
                            className="relative rounded-2xl border border-[var(--landing-line)] bg-white p-6"
                        >
                            <span
                                className="landing-display text-3xl font-extrabold"
                                style={{
                                    color: 'color-mix(in oklab, var(--landing-indigo) 30%, white)',
                                }}
                            >
                                {step.step}
                            </span>
                            <h3 className="mt-3 font-semibold">{step.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* Testimonials                                                               */
/* -------------------------------------------------------------------------- */

function Testimonials() {
    const items = [...TESTIMONIALS, ...TESTIMONIALS];

    return (
        <section className="py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                <SectionHeading
                    eyebrow="Testimoni"
                    title="Kepercayaan pasien adalah prioritas kami"
                />
            </div>

            <div className="landing-marquee-wrap mt-14 overflow-hidden" data-reveal>
                <ul className="landing-marquee flex w-max gap-6">
                    {items.map((item, index) => (
                        <li
                            key={`${item.name}-${index}`}
                            className="w-[20rem] shrink-0 rounded-2xl border border-[var(--landing-line)] bg-white p-6"
                        >
                            <p className="text-sm leading-relaxed text-[var(--landing-ink)]">
                                &ldquo;{item.quote}&rdquo;
                            </p>
                            <div className="mt-5 flex items-center gap-3">
                                <img
                                    src={item.avatar}
                                    alt=""
                                    aria-hidden
                                    className="size-10 rounded-full object-cover object-top"
                                    loading="lazy"
                                    width={80}
                                    height={80}
                                />
                                <div>
                                    <p className="text-sm font-semibold">{item.name}</p>
                                    <p className="text-xs text-[var(--landing-muted)]">
                                        {item.role}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                        */
/* -------------------------------------------------------------------------- */

function Faq() {
    const [open, setOpen] = useState<number | null>(0);

    return (
        <section id="faq" className="scroll-mt-20 bg-slate-50/70 py-20 md:py-28">
            <div className="mx-auto max-w-3xl px-4 md:px-8">
                <SectionHeading eyebrow="Tanya Jawab" title="Pertanyaan yang sering diajukan" />

                <div data-reveal-group className="mt-12 space-y-3">
                    {FAQS.map((faq, index) => {
                        const isOpen = open === index;
                        const panelId = `faq-panel-${index}`;
                        const buttonId = `faq-button-${index}`;

                        return (
                            <div
                                key={faq.question}
                                data-reveal
                                className="overflow-hidden rounded-xl border border-[var(--landing-line)] bg-white"
                            >
                                <h3>
                                    <button
                                        type="button"
                                        id={buttonId}
                                        aria-expanded={isOpen}
                                        aria-controls={panelId}
                                        onClick={() => setOpen(isOpen ? null : index)}
                                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                                    >
                                        <span className="font-medium">{faq.question}</span>
                                        <ArrowRight
                                            className={cn(
                                                'size-4 shrink-0 text-[var(--landing-indigo)] transition-transform',
                                                isOpen && 'rotate-90',
                                            )}
                                            aria-hidden
                                        />
                                    </button>
                                </h3>
                                <div
                                    id={panelId}
                                    role="region"
                                    aria-labelledby={buttonId}
                                    className="landing-faq-panel"
                                    data-open={isOpen}
                                >
                                    <div>
                                        <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--landing-muted)]">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* CTA band                                                                   */
/* -------------------------------------------------------------------------- */

function CtaBand() {
    return (
        <section className="px-4 py-20 md:px-8 md:py-28">
            <div
                data-reveal
                className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-6 py-16 text-center text-white md:px-16"
                style={{
                    backgroundImage:
                        'linear-gradient(120deg, var(--landing-indigo-strong), var(--landing-indigo) 45%, var(--landing-teal))',
                }}
            >
                <div className="landing-dotgrid absolute inset-0 opacity-20" aria-hidden />
                <div className="relative">
                    <h2 className="mx-auto max-w-2xl text-3xl font-bold md:text-4xl">
                        Siap memulai kunjungan Anda?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-white/85">
                        Buat jadwal secara online dalam hitungan menit dan rasakan layanan
                        kesehatan yang lebih mudah bersama {CLINIC.name}.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Button
                            asChild
                            size="lg"
                            className="rounded-full bg-white text-[var(--landing-indigo)] hover:bg-white/90"
                        >
                            <Link href={route('login')}>
                                <CalendarCheck className="size-5" aria-hidden />
                                Daftar Sekarang
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="rounded-full border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white"
                        >
                            <a href={`tel:${CLINIC.phone.replace(/[^\d+]/g, '')}`}>
                                <Phone className="size-5" aria-hidden />
                                Hubungi Kami
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

function Footer() {
    return (
        <footer className="border-t border-[var(--landing-line)] bg-white">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
                <div className="md:col-span-2">
                    <div className="flex items-center gap-2.5">
                        <span
                            className="flex size-9 items-center justify-center rounded-xl text-white"
                            style={{ background: 'var(--landing-indigo)' }}
                        >
                            <HeartPulse className="size-5" aria-hidden />
                        </span>
                        <span className="landing-display text-lg font-bold">{CLINIC.name}</span>
                    </div>
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--landing-muted)]">
                        Layanan kesehatan terpadu dengan pendaftaran online dan rekam medis digital
                        untuk pengalaman berobat yang lebih baik.
                    </p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider">Kontak</h3>
                    <ul className="mt-4 space-y-3 text-sm text-[var(--landing-muted)]">
                        <li className="flex items-start gap-2">
                            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                            {CLINIC.address}
                        </li>
                        <li className="flex items-center gap-2">
                            <Phone className="size-4 shrink-0" aria-hidden />
                            <a
                                href={`tel:${CLINIC.phone.replace(/[^\d+]/g, '')}`}
                                className="hover:text-[var(--landing-indigo)]"
                            >
                                {CLINIC.phone}
                            </a>
                        </li>
                        <li className="flex items-center gap-2">
                            <Mail className="size-4 shrink-0" aria-hidden />
                            <a
                                href={`mailto:${CLINIC.email}`}
                                className="hover:text-[var(--landing-indigo)]"
                            >
                                {CLINIC.email}
                            </a>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider">
                        Jam Operasional
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm text-[var(--landing-muted)]">
                        <li className="flex items-center gap-2">
                            <Clock className="size-4 shrink-0" aria-hidden />
                            {CLINIC.hours}
                        </li>
                        <li>Minggu &amp; libur nasional: sesuai pengumuman</li>
                    </ul>
                    <Button asChild size="sm" className="mt-5 rounded-full">
                        <Link href={route('login')}>Daftar Online</Link>
                    </Button>
                </div>
            </div>

            <div className="border-t border-[var(--landing-line)] py-6">
                <p className="text-center text-xs text-[var(--landing-muted)]">
                    &copy; {new Date().getFullYear()} {CLINIC.name}. Seluruh hak cipta dilindungi.
                </p>
            </div>
        </footer>
    );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function LandingIndex() {
    const root = useRevealOnScroll<HTMLDivElement>();

    return (
        <>
            <Head title={`${CLINIC.name} - ${CLINIC.tagline}`}>
                <meta
                    name="description"
                    content={`${CLINIC.name}: layanan kesehatan modern dengan pendaftaran online, rekam medis digital, dan dokter berpengalaman.`}
                />
            </Head>

            <div ref={root} className="landing min-h-screen bg-white">
                <a
                    href="#beranda"
                    className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
                >
                    Lewati ke konten utama
                </a>
                <Navbar />
                <main>
                    <Hero />
                    <Stats />
                    <Services />
                    <WhyUs />
                    <Doctors />
                    <Steps />
                    <Testimonials />
                    <Faq />
                    <CtaBand />
                </main>
                <Footer />
            </div>
        </>
    );
}
