import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function UserPostList({ targetUser, posts, filters = {}, categories = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilterChange = (newSearch, newCategory, newStatus) => {
        router.get(`/admin/users/${targetUser.id}/posts`, {
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
            <Head title={`Artikel: ${targetUser.name} - Admin`} />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Kembali ke Manajemen Pengguna</span>
                        </Link>

                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                Artikel Penulis: {targetUser.name}
                            </h1>
                            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                                @{targetUser.username}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Mode Admin: Anda dapat memantau dan mengekspor seluruh artikel yang dibuat oleh pengguna ini (read-only).
                        </p>
                    </div>

                    <a
                        href={`/admin/users/${targetUser.id}/posts/export`}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export Excel Artikel User Ini</span>
                    </a>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Cari judul atau isi artikel..."
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
                            id="user-post-filter-category"
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
                            id="user-post-filter-status"
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
                                    <th className="px-6 py-3.5">Kategori</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5">Tanggal</th>
                                    <th className="px-6 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {posts?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-600">
                                            Pengguna ini belum memiliki artikel yang cocok dengan filter.
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

