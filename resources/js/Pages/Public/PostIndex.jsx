import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function PostIndex({ posts, filters = {}, categories = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');

    const handleFilterChange = (newSearch, newCategory) => {
        router.get('/articles', {
            search: newSearch,
            category: newCategory,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleFilterChange(search, selectedCategory);
    };

    const handleCategoryClick = (catValue) => {
        const nextCat = selectedCategory === catValue ? '' : catValue;
        setSelectedCategory(nextCat);
        handleFilterChange(search, nextCat);
    };

    return (
        <AppLayout isPublic={true}>
            <Head title="Jelajah Artikel & Opini - BlogVerse Pro" />

            <div className="space-y-10">
                {/* Hero Banner Beranda */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 text-white p-8 md:p-14 shadow-lg">
                    <div className="relative z-10 max-w-3xl space-y-4">
                        <span className="inline-block bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Platform Publikasi Artikel Digital
                        </span>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                            Eksplorasi Ide, Pengetahuan, dan Inspirasi Terkini.
                        </h1>
                        <p className="text-blue-100 text-sm md:text-base leading-relaxed">
                            Temukan beragam artikel berkualitas dari para praktisi dan penulis komunitas seputar teknologi, bisnis, edukasi, hingga gaya hidup produktif.
                        </p>

                        {/* Tombol Call-to-Action (CTA) Halaman Login dan Register di Bawah Deskripsi */}
                        <div className="pt-4 flex flex-wrap items-center gap-3">
                            <Link
                                href="/login"
                                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-md transition hover:-translate-y-0.5"
                            >
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                <span>Halaman Login (Masuk)</span>
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-500/30 hover:bg-blue-500/50 text-white border border-white/30 font-bold text-xs backdrop-blur-md transition hover:-translate-y-0.5"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                <span>Halaman Register (Daftar Penulis)</span>
                            </Link>
                        </div>
                    </div>

                    {/* Decorative Background Circles */}
                    <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute right-40 top-0 w-60 h-60 bg-blue-400/20 rounded-full blur-xl pointer-events-none"></div>
                </div>

                {/* Search Bar & Filters */}
                <div className="space-y-4">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-2xl">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                aria-label="Cari artikel"
                                placeholder="Cari artikel berdasarkan judul atau konten..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-xs transition"
                        >
                            Cari
                        </button>
                    </form>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <button
                            type="button"
                            onClick={() => handleCategoryClick('')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                                selectedCategory === ''
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            Semua Kategori
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => handleCategoryClick(cat.value)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                                    selectedCategory === cat.value
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Articles Grid */}
                {posts?.data?.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-xs">
                        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Tidak Ada Artikel Ditemukan</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Coba ubah kata kunci pencarian atau pilih kategori yang lain.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.data.map((post) => (
                            <article
                                key={post.id}
                                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col overflow-hidden group"
                            >
                                {/* Cover Image or Pattern */}
                                <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                                    {post.cover_image_path ? (
                                        <img
                                            src={`/storage/${post.cover_image_path}`}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 flex items-center justify-center p-6 text-center">
                                            <span className="font-extrabold text-slate-400 text-lg tracking-tight">
                                                {post.category}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 text-blue-700 backdrop-blur-md shadow-xs">
                                            {post.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                                            <Link href={`/articles/${post.slug}`}>
                                                {post.title}
                                            </Link>
                                        </h2>
                                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                                            {post.excerpt || post.content?.substring(0, 150) + '...'}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center space-x-2.5">
                                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                {post.user?.name?.charAt(0).toUpperCase() || 'P'}
                                            </div>
                                            <div className="text-[11px]">
                                                <p className="font-bold text-slate-800 leading-none">{post.user?.name}</p>
                                                <p className="text-slate-400 mt-0.5">{post.published_at ? new Date(post.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</p>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/articles/${post.slug}`}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                        >
                                            <span>Baca</span>
                                            <span>&rarr;</span>
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {posts?.links?.length > 3 && (
                    <div className="flex items-center justify-center space-x-1 pt-6">
                        {posts.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                                    link.active
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                        : link.url
                                            ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                            : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

