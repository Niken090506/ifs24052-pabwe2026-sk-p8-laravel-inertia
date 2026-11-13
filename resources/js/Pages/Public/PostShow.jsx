import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import MarkdownViewer from '../../Components/MarkdownViewer';

export default function PostShow({ post, relatedPosts = [] }) {
    return (
        <AppLayout isPublic={true}>
            <Head title={`${post.title} - BlogVerse Pro`} />

            <div className="max-w-4xl mx-auto space-y-10">
                {/* Back / Breadcrumbs */}
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
                    <Link href="/" className="hover:text-blue-600 transition">
                        Beranda
                    </Link>
                    <span>/</span>
                    <Link href="/articles" className="hover:text-blue-600 transition">
                        Artikel
                    </Link>
                    <span>/</span>
                    <span className="text-slate-800 truncate max-w-xs">{post.title}</span>
                </div>

                {/* Article Header */}
                <header className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            {post.category}
                        </span>
                        <span className="text-xs text-slate-400">
                            Dipublikasikan pada {post.published_at || post.created_at}
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        {post.title}
                    </h1>

                    {post.excerpt && (
                        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
                            {post.excerpt}
                        </p>
                    )}

                    {/* Author Bar */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-11 h-11 rounded-full overflow-hidden bg-blue-100 border border-slate-200 flex items-center justify-center font-bold text-blue-700 text-sm">
                                {post.author.profile_photo_path ? (
                                    <img
                                        src={`/storage/${post.author.profile_photo_path}`}
                                        alt={post.author.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    post.author.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">{post.author.name}</h3>
                                <p className="text-xs text-slate-400">Penulis di BlogVerse Pro</p>
                            </div>
                        </div>

                        <Link
                            href="/articles"
                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                        >
                            &larr; Kembali ke Daftar
                        </Link>
                    </div>
                </header>

                {/* Cover Image */}
                {post.cover_image_path && (
                    <div className="rounded-3xl overflow-hidden shadow-md max-h-[460px] w-full bg-slate-100">
                        <img
                            src={`/storage/${post.cover_image_path}`}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Article Body Content (Markdown) */}
                <article className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs prose prose-slate max-w-none">
                    <MarkdownViewer content={post.content} />
                </article>

                {/* Bagian Bawah Halaman Baca Artikel: Kartu Ajakan Komunitas */}
                <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 sm:p-10 shadow-md">
                    <div className="max-w-2xl space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                            Komunitas Penulis BlogVerse
                        </span>
                        <h3 className="text-2xl font-bold tracking-tight">
                            Punya wawasan menarik yang ingin Anda bagikan kepada pembaca?
                        </h3>
                        <p className="text-sm text-blue-100 leading-relaxed">
                            Bergabunglah bersama komunitas kami! Anda dapat mulai menulis artikel dengan editor markdown, menghasilkan draf instan menggunakan AI, dan mempublikasikan karya terbaik Anda.
                        </p>
                        <div className="pt-3 flex flex-wrap items-center gap-3">
                            <Link
                                href="/login"
                                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs transition"
                            >
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                <span>Halaman Login</span>
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-500/40 hover:bg-blue-500/60 text-white border border-white/30 font-bold text-xs rounded-xl transition"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                <span>Halaman Register</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Related Articles */}
                {relatedPosts.length > 0 && (
                    <div className="space-y-6 pt-4 border-t border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                            Artikel Lainnya yang Relevan
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {relatedPosts.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/articles/${item.slug}`}
                                    className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition group flex flex-col justify-between"
                                >
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                            {item.category}
                                        </span>
                                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {item.excerpt || item.content?.substring(0, 100)}
                                        </p>
                                    </div>
                                    <span className="mt-4 text-xs font-semibold text-blue-600 flex items-center space-x-1">
                                        <span>Baca Artikel</span>
                                        <span>&rarr;</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

