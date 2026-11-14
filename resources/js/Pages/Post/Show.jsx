import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import MarkdownViewer from '../../Components/MarkdownViewer';
import MarkdownEditor from '../../Components/MarkdownEditor';

export default function PostShow({ post, categories = [] }) {
    const isPub = post.is_published;

    // Cover Form
    const [coverFile, setCoverFile] = useState(null);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [isDeletingCover, setIsDeletingCover] = useState(false);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const form = useForm({
        title: post.title,
        category: post.category,
        excerpt: post.excerpt || '',
        content: post.content || '',
        is_published: Boolean(post.is_published),
    });

    const handleUploadCover = (e) => {
        e.preventDefault();
        if (!coverFile) return;

        setIsUploadingCover(true);
        const data = new FormData();
        data.append('cover', coverFile);

        router.post(`/dashboard/posts/${post.id}/cover`, data, {
            forceFormData: true,
            onFinish: () => {
                setIsUploadingCover(false);
                setCoverFile(null);
            },
        });
    };

    const handleDeleteCover = () => {
        setIsDeletingCover(true);
        router.delete(`/dashboard/posts/${post.id}/cover`, {
            onFinish: () => setIsDeletingCover(false),
        });
    };

    const togglePublish = () => {
        router.patch(`/dashboard/posts/${post.id}/publish`, {}, {
            preserveScroll: true,
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        form.put(`/dashboard/posts/${post.id}`, {
            onSuccess: () => setShowEditModal(false),
        });
    };

    return (
        <AppLayout>
            <Head title={`${post.title} - Penulis`} />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Top Nav & Breadcrumbs */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <Link
                            href="/dashboard/posts"
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Kembali ke Artikel Saya</span>
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{post.title}</h1>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0">
                        <button
                            type="button"
                            onClick={togglePublish}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
                                isPub
                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                            }`}
                        >
                            {isPub ? 'Jadikan Draf' : 'Publikasikan Artikel'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowEditModal(true)}
                            className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
                        >
                            Ubah Edit
                        </button>
                    </div>
                </div>

                {/* Status Badges & Info */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
                            {post.category}
                        </span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            isPub ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}>
                            Status: {isPub ? 'Dipublikasikan' : 'Draf Pribadi'}
                        </span>
                        {isPub && (
                            <Link
                                href={`/articles/${post.slug}`}
                                className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1 ml-2"
                            >
                                <span>Lihat di Halaman Publik</span>
                                <span>&rarr;</span>
                            </Link>
                        )}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                        Dibuat: {post.created_at} | Terakhir diubah: {post.updated_at}
                    </div>
                </div>

                {/* Cover Image Upload / Management Section */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Foto Sampul Artikel (Cover Image)</h3>

                    {post.cover_image_path ? (
                        <div className="space-y-3">
                            <div className="max-h-80 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                <img
                                    src={`/storage/${post.cover_image_path}`}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    type="button"
                                    onClick={handleDeleteCover}
                                    disabled={isDeletingCover}
                                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-200"
                                >
                                    {isDeletingCover ? 'Menghapus...' : 'Hapus Foto Sampul'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                            <p className="text-xs text-slate-500">Belum ada foto sampul untuk artikel ini.</p>
                            <form onSubmit={handleUploadCover} className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <input
                                    id="post-cover-upload"
                                    aria-label="Pilih foto sampul artikel"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setCoverFile(e.target.files[0])}
                                    required
                                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <button
                                    type="submit"
                                    disabled={!coverFile || isUploadingCover}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                                >
                                    {isUploadingCover ? 'Mengunggah...' : 'Unggah Sampul'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Excerpt Section */}
                {post.excerpt && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                            Ringkasan Pemikat (Excerpt)
                        </span>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {post.excerpt}
                        </p>
                    </div>
                )}

                {/* Markdown Content (Rendered via TOAST UI Viewer) */}
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block pb-2 border-b border-slate-100">
                        Konten Artikel (Format Markdown)
                    </span>
                    <div className="prose prose-slate max-w-none pt-2">
                        <MarkdownViewer content={post.content} />
                    </div>
                </div>
            </div>

            {/* Edit Modal (Full Screen) */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white">
                    <div className="px-6 md:px-8 py-4 bg-indigo-600 text-white flex items-center justify-between shrink-0 shadow-xs">
                        <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">✓</span>
                            <div>
                                <h3 className="text-base font-bold leading-tight">Ubah Artikel</h3>
                                <p className="text-xs text-white/90">Perbarui judul, kategori, ringkasan, atau isi markdown artikel Anda</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowEditModal(false)}
                            aria-label="Tutup modal ubah artikel"
                            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-black/10 transition"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={submitEdit} className="flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="flex-1 p-6 md:p-8 space-y-5 overflow-y-auto w-full max-w-5xl mx-auto">
                            <div>
                                <label htmlFor="edit-post-title" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Judul Artikel *
                                </label>
                                <input
                                    id="edit-post-title"
                                    type="text"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    required
                                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                />
                                {form.errors.title && <p className="text-xs text-rose-600 mt-1">{form.errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="edit-post-category" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Kategori *
                                    </label>
                                    <select
                                        id="edit-post-category"
                                        aria-label="Kategori Artikel"
                                        value={form.data.category}
                                        onChange={(e) => form.setData('category', e.target.value)}
                                        className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 font-semibold"
                                    >
                                        {categories.map((c) => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                    {form.errors.category && <p className="text-xs text-rose-600 mt-1">{form.errors.category}</p>}
                                </div>

                                <div className="flex items-center pt-6">
                                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700 cursor-pointer">
                                        <input
                                            id="edit-post-publish"
                                            aria-label="Publikasikan ke Pembaca Umum"
                                            type="checkbox"
                                            checked={form.data.is_published}
                                            onChange={(e) => form.setData('is_published', e.target.checked)}
                                            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        <span>Publikasikan ke Pembaca Umum</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Ringkasan Pemikat (Excerpt)
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.data.excerpt}
                                    onChange={(e) => form.setData('excerpt', e.target.value)}
                                    className="mt-1 w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Konten Artikel Lengkap (TOAST UI Markdown Editor) *
                                </label>
                                <MarkdownEditor
                                    value={form.data.content}
                                    onChange={(md) => form.setData('content', md)}
                                    height="380px"
                                />
                                {form.errors.content && <p className="text-xs text-rose-600 mt-1">{form.errors.content}</p>}
                            </div>
                        </div>

                        <div className="px-6 md:px-8 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
                            >
                                {form.processing ? 'Menyimpan...' : 'Perbarui Artikel'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AppLayout>
    );
}

