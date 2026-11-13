import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

export default function AppLayout({ children, isPublic = false }) {
    const { auth, flash, appName = 'BlogVerse Pro' } = usePage().props;
    const user = auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setAvatarError(false);
    }, [user?.profile_photo_path]);

    useEffect(() => {
        const removeStart = router.on('start', () => setIsProcessing(true));
        const removeFinish = router.on('finish', () => setIsProcessing(false));
        const removeError = router.on('error', () => setIsProcessing(false));
        return () => {
            removeStart();
            removeFinish();
            removeError();
        };
    }, []);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    // If isPublic is true, render the Public Layout without Sidebar
    if (isPublic) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
                {/* Top Global Loading Progress Bar */}
                {isProcessing && (
                    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                        <div className="h-full bg-white/50 w-full animate-pulse"></div>
                    </div>
                )}

                {/* Floating Action Processing Badge */}
                {isProcessing && (
                    <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-semibold backdrop-blur-sm border border-slate-700/60 animate-fadeIn">
                        <svg className="animate-spin w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Memproses tindakan...</span>
                    </div>
                )}

                {/* Sticky Top Navbar (Tanpa Sidebar untuk Halaman Publik) */}
                <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        {/* Brand Logo */}
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                                B
                            </div>
                            <div>
                                <span className="font-extrabold text-slate-900 text-lg tracking-tight block">
                                    {appName}
                                </span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                    Blog & Publikasi
                                </span>
                            </div>
                        </Link>

                        {/* Public Navigation Links */}
                        <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-600">
                            <Link href="/" className="hover:text-blue-600 transition">
                                Beranda
                            </Link>
                            <Link href="/articles" className="hover:text-blue-600 transition">
                                Jelajah Artikel
                            </Link>
                        </nav>

                        {/* Right Actions: Auth or Profile */}
                        <div className="flex items-center space-x-3">
                            {user ? (
                                <div className="flex items-center space-x-3">
                                    <Link
                                        href={user.role === 'admin' ? '/admin/users' : '/dashboard/posts'}
                                        className="inline-flex items-center space-x-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition border border-blue-200/60"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                        <span>{user.role === 'admin' ? 'Panel Admin' : 'Dashboard Penulis'}</span>
                                    </Link>
                                    <Link
                                        href="/profile"
                                        className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0"
                                        title="Profil Akun"
                                    >
                                        {user.profile_photo_path && !avatarError ? (
                                            <img
                                                src={`/storage/${user.profile_photo_path}`}
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                                onError={() => setAvatarError(true)}
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-slate-700">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        aria-label="Keluar (Logout)"
                                        className="p-2 text-slate-400 hover:text-rose-600 transition rounded-xl hover:bg-rose-50"
                                        title="Keluar (Logout)"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                                    >
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Masuk (Login)</span>
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        <span>Daftar (Register)</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content Area: Full Width Reading Layout */}
                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
                            <div className="flex items-center space-x-3">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">&#10003;</span>
                                <span>{flash.success}</span>
                            </div>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-sm flex items-center justify-between shadow-xs">
                            <div className="flex items-center space-x-3">
                                <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">!</span>
                                <span>{flash.error}</span>
                            </div>
                        </div>
                    )}

                    {children}
                </main>

                {/* Footer Editorial di Bagian Bawah */}
                <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                            <div className="md:col-span-2 space-y-3">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                        B
                                    </div>
                                    <span className="text-white font-bold text-lg tracking-tight">{appName}</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                                    Platform publikasi artikel multi-tier modern dengan arsitektur Clean Architecture & Feature-First bertenaga Laravel 13, Inertia.js, React, dan AI OpenAI.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Navigasi Publik</h4>
                                <ul className="space-y-2 text-xs">
                                    <li>
                                        <Link href="/" className="hover:text-white transition">Beranda Publik</Link>
                                    </li>
                                    <li>
                                        <Link href="/articles" className="hover:text-white transition">Jelajah Artikel</Link>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Akses Komunitas</h4>
                                <ul className="space-y-2 text-xs">
                                    <li>
                                        <Link href="/login" className="hover:text-white transition flex items-center space-x-1.5">
                                            <span>Halaman Login (Masuk)</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/register" className="hover:text-white transition flex items-center space-x-1.5">
                                            <span>Halaman Register (Daftar Penulis)</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p>&copy; {new Date().getFullYear()} {appName}. Hak cipta dilindungi.</p>
                            <p>Praktik Laravel 13, Inertia.js & React (Feature-First)</p>
                        </div>
                    </div>
                </footer>
            </div>
        );
    }

    // Authenticated / Dashboard Layout with Sidebar
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
            {/* Top Global Loading Progress Bar */}
            {isProcessing && (
                <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                    <div className="h-full bg-white/50 w-full animate-pulse"></div>
                </div>
            )}

            {/* Floating Action Processing Badge */}
            {isProcessing && (
                <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-semibold backdrop-blur-sm border border-slate-700/60 animate-fadeIn">
                    <svg className="animate-spin w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Memproses tindakan...</span>
                </div>
            )}

            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        B
                    </div>
                    <span className="font-bold text-slate-800 text-lg">{appName}</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none"
                    aria-label="Toggle Navigation"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {mobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Sidebar Navigation */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Brand Logo */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            B
                        </div>
                        <div>
                            <span className="font-bold text-slate-900 text-lg tracking-tight block">{appName}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                {user?.role === 'admin' ? 'Panel Admin' : 'Penulis Pro'}
                            </span>
                        </div>
                    </Link>
                </div>

                {/* User Card */}
                {user && (
                    <div className="p-4 mx-4 my-4 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 text-white font-bold flex items-center justify-center shrink-0 border border-slate-200">
                            {user.profile_photo_path && !avatarError ? (
                                <img
                                    src={`/storage/${user.profile_photo_path}`}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                user.name?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">@{user.username}</p>
                            <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                )}

                {/* Navigation Menu */}
                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                    {/* View Public Blog */}
                    <Link
                        href="/"
                        className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 transition"
                    >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Lihat Blog Publik</span>
                    </Link>

                    <div className="pt-2 pb-1">
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Menu Penulis
                        </p>
                    </div>

                    <Link
                        href="/dashboard/posts"
                        className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 transition"
                    >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <span>Artikel Saya</span>
                    </Link>

                    <Link
                        href="/profile"
                        className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 transition"
                    >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Edit Profil Penulis</span>
                    </Link>

                    {/* Admin Section */}
                    {user?.role === 'admin' && (
                        <>
                            <div className="pt-4 pb-1">
                                <p className="px-3 text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                                    Panel Admin
                                </p>
                            </div>

                            <Link
                                href="/admin/users"
                                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-600 hover:bg-purple-50 transition"
                            >
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <span>Manajemen Pengguna</span>
                            </Link>

                            <Link
                                href="/admin/posts"
                                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-600 hover:bg-purple-50 transition"
                            >
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Semua Artikel Sistem</span>
                            </Link>
                        </>
                    )}
                </nav>

                {/* Bottom Logout Button */}
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-semibold transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Keluar Akun</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
                        <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">&#10003;</span>
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-sm flex items-center justify-between shadow-xs">
                        <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">!</span>
                            <span>{flash.error}</span>
                        </div>
                    </div>
                )}

                {children}
            </main>
        </div>
    );
}

