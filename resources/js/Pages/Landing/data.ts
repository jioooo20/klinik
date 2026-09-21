/**
 * Static content for the public landing page.
 * Kept separate from the component so copy can be tuned without touching layout.
 */

export interface ServiceItem {
    icon: string;
    title: string;
    description: string;
    image: string;
}

export interface DoctorItem {
    name: string;
    specialty: string;
    schedule: string;
    image: string;
}

export interface TestimonialItem {
    name: string;
    role: string;
    quote: string;
    avatar: string;
}

export interface FaqItem {
    question: string;
    answer: string;
}

export interface StepItem {
    step: string;
    title: string;
    description: string;
}

export const CLINIC = {
    name: 'Klinik Sehat Sentosa',
    tagline: 'Sehat Anda, Prioritas Kami',
    phone: '(021) 555-0123',
    whatsapp: '0812-3456-7890',
    email: 'halo@sehatsentosa.id',
    address: 'Jl. Kesehatan Raya No. 24, Jakarta Selatan, DKI Jakarta 12140',
    hours: 'Senin - Sabtu, 08.00 - 21.00 WIB',
};

export const NAV_LINKS = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Layanan', href: '#layanan' },
    { label: 'Dokter', href: '#dokter' },
    { label: 'Alur', href: '#alur' },
    { label: 'Tanya Jawab', href: '#faq' },
];

export const TRUST_BADGES = [
    'Terdaftar Kemenkes',
    'Mitra BPJS Kesehatan',
    'ISO 9001:2015',
    'Laboratorium Terakreditasi',
];

export const STATS = [
    { value: 12000, suffix: '+', label: 'Pasien terlayani' },
    { value: 18, suffix: ' tahun', label: 'Pengalaman melayani' },
    { value: 24, suffix: ' dokter', label: 'Dokter & spesialis' },
    { value: 98, suffix: '%', label: 'Kepuasan pasien' },
];

export const SERVICES: ServiceItem[] = [
    {
        icon: 'stethoscope',
        title: 'Pemeriksaan Umum',
        description:
            'Konsultasi dokter umum, diagnosis, dan penanganan keluhan harian dengan alur cepat dan nyaman.',
        image: '/images/patient-consultation.jpg',
    },
    {
        icon: 'heart-pulse',
        title: 'Kesehatan Anak',
        description:
            'Pemantauan tumbuh kembang, imunisasi, dan konsultasi kesehatan anak bersama dokter spesialis anak.',
        image: '/images/hospital-corridor.jpg',
    },
    {
        icon: 'activity',
        title: 'Laboratorium',
        description:
            'Pemeriksaan darah, urine, dan penunjang diagnostik dengan hasil akurat dan waktu tunggu singkat.',
        image: '/images/laboratory-work.jpg',
    },
    {
        icon: 'smile',
        title: 'Klinik Gigi',
        description:
            'Perawatan gigi preventif hingga estetika, ditangani dokter gigi berpengalaman dengan peralatan modern.',
        image: '/images/dental-clinic-room.jpg',
    },
    {
        icon: 'syringe',
        title: 'Vaksinasi',
        description:
            'Layanan imunisasi anak dan dewasa dengan jadwal lengkap serta pencatatan rekam medis digital.',
        image: '/images/medical-instruments.jpg',
    },
    {
        icon: 'shield-check',
        title: 'Rekam Medis Digital',
        description:
            'Riwayat kunjungan, hasil pemeriksaan, dan resep tersimpan rapi dan dapat diakses kembali.',
        image: '/images/clinic-examination-room.jpg',
    },
];

export const DOCTORS: DoctorItem[] = [
    {
        name: 'dr. Budi Santoso',
        specialty: 'Dokter Umum',
        schedule: 'Senin - Jumat, 08.00 - 15.00',
        image: '/images/doctor-male-portrait.jpg',
    },
    {
        name: 'dr. Siti Aminah',
        specialty: 'Spesialis Anak',
        schedule: 'Selasa - Sabtu, 09.00 - 16.00',
        image: '/images/doctor-female-portrait.jpg',
    },
    {
        name: 'dr. Rina Wijaya',
        specialty: 'Dokter Gigi',
        schedule: 'Senin - Kamis, 10.00 - 18.00',
        image: '/images/doctor-female-2-portrait.jpg',
    },
    {
        name: 'dr. Andi Pratama',
        specialty: 'Dokter Umum',
        schedule: 'Jumat - Sabtu, 13.00 - 21.00',
        image: '/images/doctor-male-2-portrait.jpg',
    },
];

export const STEPS: StepItem[] = [
    {
        step: '01',
        title: 'Pilih Jadwal',
        description: 'Tentukan tanggal dan jam kunjungan yang paling sesuai dengan kebutuhan Anda.',
    },
    {
        step: '02',
        title: 'Lengkapi Data',
        description: 'Isi data diri pasien dengan cepat dan aman langsung dari halaman pendaftaran.',
    },
    {
        step: '03',
        title: 'Konfirmasi',
        description: 'Terima nomor antrean dan konfirmasi jadwal kunjungan Anda secara otomatis.',
    },
    {
        step: '04',
        title: 'Datang & Diperiksa',
        description: 'Hadir sesuai jadwal, lalu diperiksa oleh dokter tanpa menunggu lama.',
    },
];

export const TESTIMONIALS: TestimonialItem[] = [
    {
        name: 'Ratna Kusuma',
        role: 'Pasien Umum',
        quote:
            'Pendaftaran online-nya sangat memudahkan. Saya datang sesuai jadwal dan langsung ditangani tanpa antre lama.',
        avatar: '/images/doctor-female-portrait.jpg',
    },
    {
        name: 'Hendra Setiawan',
        role: 'Orang Tua Pasien',
        quote:
            'Anak saya rutin imunisasi di sini. Dokternya sabar dan hasilnya tercatat rapi di rekam medis digital.',
        avatar: '/images/doctor-male-portrait.jpg',
    },
    {
        name: 'Maya Larasati',
        role: 'Pasien Gigi',
        quote:
            'Perawatan giginya nyaman dan tempatnya bersih. Hasil pemeriksaan langsung dikirim ke rekam medis saya.',
        avatar: '/images/doctor-female-2-portrait.jpg',
    },
    {
        name: 'Bayu Nugroho',
        role: 'Pasien Umum',
        quote:
            'Jadwal dokter jelas dan prosesnya transparan. Saya bisa pantau riwayat kunjungan kapan saja.',
        avatar: '/images/doctor-male-2-portrait.jpg',
    },
];

export const FAQS: FaqItem[] = [
    {
        question: 'Bagaimana cara mendaftar sebagai pasien baru?',
        answer:
            'Anda dapat membuat akun pasien, melengkapi data diri, lalu memilih jadwal kunjungan langsung melalui halaman pendaftaran online. Nomor antrean akan muncul setelah jadwal dikonfirmasi.',
    },
    {
        question: 'Apakah klinik menerima BPJS Kesehatan?',
        answer:
            'Ya. Klinik kami bekerja sama dengan BPJS Kesehatan. Silakan membawa kartu BPJS dan identitas saat kunjungan untuk proses verifikasi.',
    },
    {
        question: 'Jam berapa klinik beroperasi?',
        answer:
            'Kami melayani Senin sampai Sabtu pukul 08.00 - 21.00 WIB. Untuk hari libur nasional, jadwal dapat berbeda dan akan diinformasikan melalui halaman ini.',
    },
    {
        question: 'Apakah hasil pemeriksaan bisa diakses kembali?',
        answer:
            'Tentu. Seluruh hasil pemeriksaan, resep, dan riwayat kunjungan tersimpan pada rekam medis digital Anda dan dapat dilihat kembali melalui akun pasien.',
    },
    {
        question: 'Apakah bisa memilih dokter tertentu?',
        answer:
            'Bisa. Saat memilih jadwal, Anda dapat melihat daftar dokter beserta spesialisasi dan jam praktiknya, lalu menentukan dokter yang Anda inginkan.',
    },
    {
        question: 'Bagaimana jika saya perlu membatalkan jadwal?',
        answer:
            'Jadwal kunjungan yang belum berlangsung dapat dibatalkan melalui akun pasien sehingga slot tersebut dapat digunakan pasien lain.',
    },
];