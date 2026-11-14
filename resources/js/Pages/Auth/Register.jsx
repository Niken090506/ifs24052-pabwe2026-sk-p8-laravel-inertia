import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Head title="Daftar Akun Penulis - BlogVerse Pro" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link href="/" className="inline-flex w-12 h-12 rounded-2xl bg-blue-600 items-center justify-center text-white font-extrabold text-2xl shadow-md">
                    B
                </Link>
                <h1 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
                    BlogVerse Pro
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Bergabung menjadi penulis dan publikasikan karya Anda
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-700">Nama Lengkap</label>
                            <input
                                id="reg-name"
                                aria-label="Nama Lengkap"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2 rounded-xl border border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Contoh: Alex Ferguson"
                            />
                            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="reg-username" className="block text-sm font-semibold text-slate-700">Username</label>
                            <input
                                id="reg-username"
                                aria-label="Username"
                                type="text"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2 rounded-xl border border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="alex_ferguson"
                            />
                            {errors.username && <p className="mt-1 text-xs text-rose-600">{errors.username}</p>}
                        </div>

                        <div>
                            <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700">Email</label>
                            <input
                                id="reg-email"
                                aria-label="Email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2 rounded-xl border border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="alex@example.com"
                            />
                            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700">Password</label>
                            <input
                                id="reg-password"
                                aria-label="Password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2 rounded-xl border border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Minimal 8 karakter"
                            />
                            {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
                        </div>

                        <div>
                            <label htmlFor="reg-password-confirmation" className="block text-sm font-semibold text-slate-700">Konfirmasi Password</label>
                            <input
                                id="reg-password-confirmation"
                                aria-label="Konfirmasi Password"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2 rounded-xl border border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Ulangi password"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
                            >
                                {processing ? 'Mendaftarkan Akun...' : 'Daftar Sebagai Penulis'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-600">Sudah memiliki akun? </span>
                        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                            Masuk di sini
                        </Link>
                    </div>

                    <div className="mt-4 text-center">
                        <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition">
                            &larr; Kembali ke Beranda Publik
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

