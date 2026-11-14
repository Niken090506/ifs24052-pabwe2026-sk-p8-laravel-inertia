import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function PostList({ posts, filters = {}, categories = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilterChange = (newSearch, newCategory, newStatus) => {
        router.get('/admin/posts', {
            search: newSearch,
            category: newCategory,
            status: newStatus,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout>
            <Head title="Monitoring Seluruh Artikel - Admin" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            Monitoring Seluruh Artikel
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Pantau seluruh konten artikel yang dibuat oleh seluruh pengguna pada platform BlogVerse Pro
                        </p>
                    </div>

                    <a
                        href="/admin/posts/export"
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export Semua Artikel ke Excel</span>
                    </a>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <input
                            id="admin-search-posts"
                            aria-label="Cari judul artikel, konten, atau nama penulis"
                            type="text"
                            placeholder="Cari judul artikel, konten, atau nama penulis..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilterChange(e.target.value, category, status);
                            }}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="sm:w-44">
                        <select
                            id="admin-filter-category"
                            aria-label="Filter Kategori Artikel"
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                handleFilterChange(search, e.target.value, status);
                            }}
                            className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:w-36">
                        <select
                            id="admin-filter-status"
                            aria-label="Filter Status Publikasi"
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                handleFilterChange(search, category, e.target.value);
                            }}
                            className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Semua Status</option>
                            <option value="published">Dipublikasikan</option>
                            <option value="draft">Draf</option>
                        </select>
                    </div>
                </div>

                {/* Posts Table */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-6 py-3.5">Judul Artikel</th>
                                    <th className="px-6 py-3.5">Penulis</th>
                                    <th className="px-6 py-3.5">Kategori</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5">Tanggal</th>
                                    <th className="px-6 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {posts?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-600">
                                            Tidak ada artikel yang sesuai dengan kriteria filter.
                                        </td>
                                    </tr>
                                ) : (
                                    posts.data.map((post) => (
                                        <tr key={post.id} className="hover:bg-slate-50/60 transition">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{post.title}</p>
                                                <p className="text-slate-600 text-[11px] line-clamp-1">{post.excerpt || 'Tidak ada ringkasan'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                        {post.user?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{post.user?.name}</p>
                                                        <p className="text-[10px] text-slate-600">@{post.user?.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full text-[10px]">
                                                    {post.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    post.is_published
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {post.is_published ? 'Dipublikasikan' : 'Draf'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {post.created_at ? new Date(post.created_at).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {post.is_published ? (
                                                    <Link
                                                        href={`/articles/${post.slug}`}
                                                        className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                                                    >
                                                        <span>Lihat Publik</span>
                                                        <span>&rarr;</span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-slate-600 italic">Draf Internal</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {posts?.links?.length > 3 && (
                    <div className="flex items-center justify-center space-x-1 pt-4">
                        {posts.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                                    link.active
                                        ? 'bg-purple-600 text-white border-purple-600'
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

