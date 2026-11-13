import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import MarkdownEditor from '../../Components/MarkdownEditor';

export default function PostIndex({ posts, filters = {}, categories = [], stats = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [activeMenuId, setActiveMenuId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.post-menu-container')) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Form Modal (Create / Edit) - Full Screen
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const form = useForm({
        title: '',
        category: categories[0]?.value || 'Teknologi',
        excerpt: '',
        content: '',
        is_published: false,
    });

    // Delete Modal
    const [deletingPost, setDeletingPost] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Import Modal
    const [showImportModal, setShowImportModal] = useState(false);
    const importForm = useForm({
        importFile: null,
    });

    // AI Generator Modal
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiCount, setAiCount] = useState(3);
    const [aiIsGenerating, setAiIsGenerating] = useState(false);
    const [aiGeneratedItems, setAiGeneratedItems] = useState([]);
    const [aiSelectedIndices, setAiSelectedIndices] = useState([]);
    const [aiErrorMessage, setAiErrorMessage] = useState('');
    const [isSavingAi, setIsSavingAi] = useState(false);

    const handleFilterChange = (newSearch, newCategory, newStatus) => {
        router.get('/dashboard/posts', {
            search: newSearch,
            category: newCategory,
            status: newStatus,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const openCreateModal = () => {
        setEditingPost(null);
        form.setData({
            title: '',
            category: categories[0]?.value || 'Teknologi',
            excerpt: '',
            content: '',
            is_published: false,
        });
        form.clearErrors();
        setShowFormModal(true);
    };

    const openEditModal = (post) => {
        setEditingPost(post);
        form.setData({
            title: post.title,
            category: post.category,
            excerpt: post.excerpt || '',
            content: post.content || '',
            is_published: Boolean(post.is_published),
        });
        form.clearErrors();
        setShowFormModal(true);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (editingPost) {
            form.put(`/dashboard/posts/${editingPost.id}`, {
                onSuccess: () => setShowFormModal(false),
            });
        } else {
            form.post('/dashboard/posts', {
                onSuccess: () => setShowFormModal(false),
            });
        }
    };

    const togglePublish = (post) => {
        router.patch(`/dashboard/posts/${post.id}/publish`, {}, {
            preserveScroll: true,
        });
    };

    const executeDelete = () => {
        if (!deletingPost) return;
        setIsDeleting(true);
        router.delete(`/dashboard/posts/${deletingPost.id}`, {
            onSuccess: () => setDeletingPost(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    const submitImport = (e) => {
        e.preventDefault();
        importForm.post('/dashboard/posts/import', {
            forceFormData: true,
            onSuccess: () => {
                setShowImportModal(false);
                importForm.reset();
            },
        });
    };

    const generateAi = async () => {
        if (!aiPrompt.trim()) return;
        setAiIsGenerating(true);
        setAiErrorMessage('');

        try {
            const res = await fetch('/dashboard/posts/ai-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    aiPrompt: aiPrompt,
                    count: Number(aiCount),
                    aiCount: Number(aiCount),
                }),
            });

            const data = await res.json();
            if (!res.ok || data.success === false) {
                setAiErrorMessage(data.message || 'Gagal menghasilkan artikel dengan AI.');
            } else {
                const list = data.posts || data.items || [];
                setAiGeneratedItems(list);
                setAiSelectedIndices(list.map((_, i) => i));
            }
        } catch (err) {
            setAiErrorMessage(err.message || 'Terjadi kesalahan jaringan.');
        } finally {
            setAiIsGenerating(false);
        }
    };

    const toggleAiSelect = (index) => {
        if (aiSelectedIndices.includes(index)) {
            setAiSelectedIndices(aiSelectedIndices.filter((i) => i !== index));
        } else {
            setAiSelectedIndices([...aiSelectedIndices, index]);
        }
    };

    const saveAiGenerated = () => {
        const selected = aiSelectedIndices.map((i) => aiGeneratedItems[i]);
        if (selected.length === 0) return;

        setIsSavingAi(true);
        router.post('/dashboard/posts/ai-save', { items: selected, posts: selected }, {
            onSuccess: () => {
                setShowAiModal(false);
                setAiGeneratedItems([]);
                setAiSelectedIndices([]);
                setAiPrompt('');
            },
            onFinish: () => setIsSavingAi(false),
        });
    };

    return (
        <AppLayout>
            <Head title="Manajemen Artikel Saya - BlogVerse Pro" />

            <div className="w-full space-y-6">
                {/* Header Title */}
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manajemen Artikel Penulis</h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Kelola tulisan Anda, pantau status publikasi, impor/ekspor data Excel, dan buat artikel instan bertenaga AI.
                    </p>
                </div>

                {/* 1. Ringkasan Statistik */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total Artikel */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500">Total Artikel</span>
                            <h3 className="text-2xl font-black text-slate-900 leading-tight">{stats.total ?? 0}</h3>
                        </div>
                    </div>

                    {/* Total Selesai (Publikasi) */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500">Total Selesai (Publikasi)</span>
                            <h3 className="text-2xl font-black text-emerald-600 leading-tight">{stats.published ?? 0}</h3>
                        </div>
                    </div>

                    {/* Belum Selesai (Draf) */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xl shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500">Belum Selesai (Draf)</span>
                            <h3 className="text-2xl font-black text-amber-600 leading-tight">{stats.draft ?? 0}</h3>
                        </div>
                    </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Tulis Artikel Baru</span>
                    </button>

                    <button
                        onClick={() => setShowAiModal(true)}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                    >
                        <svg className="w-4 h-4 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>AI Article Generator</span>
                    </button>

                    <a
                        href="/dashboard/posts/export"
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-xs transition"
                    >
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export Excel</span>
                    </a>

                    <button
                        onClick={() => setShowImportModal(true)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-xs transition"
                    >
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Import Excel</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Cari artikel berdasarkan judul atau konten..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilterChange(e.target.value, categoryFilter, statusFilter);
                            }}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="sm:w-44">
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                handleFilterChange(search, e.target.value, statusFilter);
                            }}
                            className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:w-36">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                handleFilterChange(search, categoryFilter, e.target.value);
                            }}
                            className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Status</option>
                            <option value="published">Dipublikasikan</option>
                            <option value="draft">Draf</option>
                        </select>
                    </div>
                </div>

                {/* 2. Daftar Artikel Penulis: List View (Bukan Card, Tanpa Deskripsi Panjang) */}
                {posts?.data?.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-slate-800">Belum Ada Artikel</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Mulai tulis artikel baru atau manfaatkan fitur AI Article Generator untuk membuat draf instan.
                        </p>
                        <button
                            onClick={openCreateModal}
                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                        >
                            + Tulis Artikel Baru
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100">
                        {posts.data.map((post) => {
                            const isPub = post.is_published;
                            return (
                                <div
                                    key={post.id}
                                    className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                                        isPub ? 'hover:bg-slate-50/80' : 'bg-slate-50/50 hover:bg-slate-50'
                                    }`}
                                >
                                    {/* Left: Info ringkas tanpa deskripsi */}
                                    <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                                        {/* Status Icon Indicator */}
                                        <button
                                            type="button"
                                            onClick={() => togglePublish(post)}
                                            title={isPub ? 'Jadikan Draf' : 'Publikasikan Sekarang'}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                                                isPub
                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                            }`}
                                        >
                                            {isPub ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                        </button>

                                        {/* Title & Metadata (Ringkas) */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center space-x-2">
                                                <Link
                                                    href={`/dashboard/posts/${post.id}`}
                                                    className="font-bold text-sm text-slate-900 hover:text-blue-600 truncate block"
                                                >
                                                    {post.title}
                                                </Link>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                    {post.category}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    isPub ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {isPub ? 'Dipublikasikan' : 'Draf'}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {post.created_at ? new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Menu Tindakan Kebab (â‹®) */}
                                    <div className="relative post-menu-container flex items-center space-x-2 shrink-0">
                                        {/* Quick Toggle Button */}
                                        <button
                                            type="button"
                                            onClick={() => togglePublish(post)}
                                            className={`text-xs px-2.5 py-1 font-bold rounded-lg transition ${
                                                isPub
                                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            }`}
                                        >
                                            {isPub ? 'Jadikan Draf' : 'Publikasikan'}
                                        </button>

                                        {/* Kebab Dots Button */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === post.id ? null : post.id);
                                            }}
                                            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold transition"
                                            aria-label="Menu Tindakan"
                                        >
                                            <span className="text-lg leading-none">â‹®</span>
                                        </button>

                                        {/* Dropdown Menu Items */}
                                        {activeMenuId === post.id && (
                                            <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-30">
                                                {/* Detail (Ikon mata, warna teks primary) */}
                                                <Link
                                                    href={`/dashboard/posts/${post.id}`}
                                                    className="w-full px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center space-x-2.5 transition text-left"
                                                    onClick={() => setActiveMenuId(null)}
                                                >
                                                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    <span>Detail</span>
                                                </Link>

                                                {/* Ubah Edit (Ikon pensil, warna teks primary) */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveMenuId(null);
                                                        openEditModal(post);
                                                    }}
                                                    className="w-full px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center space-x-2.5 transition text-left"
                                                >
                                                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    <span>Ubah Edit</span>
                                                </button>

                                                <div className="border-t border-slate-100 my-1"></div>

                                                {/* Hapus (Ikon tempat sampah, warna teks merah) */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveMenuId(null);
                                                        setDeletingPost(post);
                                                    }}
                                                    className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2.5 transition text-left"
                                                >
                                                    <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    <span>Hapus</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

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
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : link.url
                                            ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                            : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 3. Modal Tambah dan Ubah Full Screen dengan Distinct Colored Header & Footer */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white">
                    {/* Header: Warna Kontras (Biru untuk Tambah, Indigo untuk Edit) */}
                    <div className={`px-6 md:px-8 py-4 ${
                        editingPost ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'
                    } flex items-center justify-between shrink-0 shadow-xs`}>
                        <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                                {editingPost ? 'âœ' : '+'}
                            </span>
                            <div>
                                <h3 className="text-base font-bold leading-tight">
                                    {editingPost ? 'Ubah Artikel' : 'Tulis Artikel Baru'}
                                </h3>
                                <p className="text-xs text-white/80">Lengkapi judul, kategori, ringkasan pemikat, dan konten artikel lengkap</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFormModal(false)}
                            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-black/10 transition"
                        >
                            âœ•
                        </button>
                    </div>

                    {/* Modal Body */}
                    <form onSubmit={submitForm} className="flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="flex-1 p-6 md:p-8 space-y-5 overflow-y-auto w-full max-w-5xl mx-auto">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Judul Artikel *
                                </label>
                                <input
                                    type="text"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    required
                                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 font-bold"
                                    placeholder="Contoh: Menguasai Laravel 13 dan Inertia.js React"
                                />
                                {form.errors.title && <p className="text-xs text-rose-600 mt-1">{form.errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Kategori *
                                    </label>
                                    <select
                                        value={form.data.category}
                                        onChange={(e) => form.setData('category', e.target.value)}
                                        className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 font-semibold"
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
                                            type="checkbox"
                                            checked={form.data.is_published}
                                            onChange={(e) => form.setData('is_published', e.target.checked)}
                                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
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
                                    className="mt-1 w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ringkasan 1-2 kalimat pengantar pembaca..."
                                />
                                {form.errors.excerpt && <p className="text-xs text-rose-600 mt-1">{form.errors.excerpt}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Konten Artikel Lengkap (TOAST UI Markdown Editor) *
                                </label>
                                <MarkdownEditor
                                    value={form.data.content}
                                    onChange={(md) => form.setData('content', md)}
                                    height="380px"
                                    placeholder="Tuliskan isi artikel Anda dalam format Markdown lengkap..."
                                />
                                {form.errors.content && <p className="text-xs text-rose-600 mt-1">{form.errors.content}</p>}
                            </div>
                        </div>

                        {/* Footer: Warna Kontras & Tombol Aksi di Sebelah Kanan */}
                        <div className="px-6 md:px-8 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowFormModal(false)}
                                className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition disabled:opacity-50 flex items-center space-x-2 ${
                                    editingPost ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {form.processing ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <span>{editingPost ? 'Perbarui Artikel' : 'Simpan Artikel'}</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-900">Hapus Artikel Ini?</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Anda akan menghapus artikel "{deletingPost.title}". Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>
                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingPost(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={executeDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Excel Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">Impor Artikel dari Excel</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700">âœ•</button>
                        </div>
                        <form onSubmit={submitImport} className="space-y-4">
                            <p className="text-xs text-slate-500">
                                Pilih file spreadsheet (.xlsx, .xls, .csv). Kolom yang dibaca: No, Title, Category, Excerpt, Content, Status.
                            </p>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => importForm.setData('importFile', e.target.files[0])}
                                required
                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {importForm.errors.importFile && <p className="text-xs text-rose-600">{importForm.errors.importFile}</p>}
                            <div className="flex items-center justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={importForm.processing}
                                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                                >
                                    {importForm.processing ? 'Mengunggah...' : 'Unggah & Impor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Generator Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                            <div className="flex items-center space-x-2">
                                <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">âœ¨</span>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">AI Article Generator</h3>
                                    <p className="text-xs text-slate-400">Buat draf artikel instan dengan bantuan OpenAI</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-700">âœ•</button>
                        </div>

                        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                            {aiErrorMessage && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                                    {aiErrorMessage}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Topik atau Instruksi Penulisan
                                </label>
                                <textarea
                                    rows={3}
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Contoh: Berikan ide artikel tentang tren kecerdasan buatan dalam rekayasa perangkat lunak modern..."
                                    className="mt-1 w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Jumlah Artikel (Input Angka: 1 - 5)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={aiCount}
                                    onChange={(e) => setAiCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                                    className="mt-1 w-32 p-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={generateAi}
                                disabled={aiIsGenerating || !aiPrompt.trim()}
                                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {aiIsGenerating ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Menghasilkan Draf dengan AI...</span>
                                    </>
                                ) : (
                                    <span>Hasilkan Draf Sekarang</span>
                                )}
                            </button>

                            {/* Generated Items Preview */}
                            {aiGeneratedItems.length > 0 && (
                                <div className="space-y-3 pt-3 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-700">Pilih Artikel yang Ingin Disimpan:</span>
                                        <span className="text-purple-600 font-semibold">{aiSelectedIndices.length} dipilih</span>
                                    </div>
                                    <div className="space-y-2 max-h-56 overflow-y-auto">
                                        {aiGeneratedItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => toggleAiSelect(idx)}
                                                className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                                                    aiSelectedIndices.includes(idx)
                                                        ? 'bg-purple-50/70 border-purple-300'
                                                        : 'bg-white border-slate-200 opacity-60'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={aiSelectedIndices.includes(idx)}
                                                    onChange={() => {}}
                                                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                                                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-100 text-purple-700">
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.excerpt}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {aiGeneratedItems.length > 0 && (
                            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowAiModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={saveAiGenerated}
                                    disabled={aiSelectedIndices.length === 0 || isSavingAi}
                                    className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs disabled:opacity-50"
                                >
                                    {isSavingAi ? 'Menyimpan...' : `Simpan ${aiSelectedIndices.length} Artikel Terpilih`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

