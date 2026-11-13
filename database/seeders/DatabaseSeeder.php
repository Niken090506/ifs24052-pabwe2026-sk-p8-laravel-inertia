<?php

namespace Database\Seeders;

use App\Features\Post\Enums\PostCategory;
use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'username' => 'admin',
                'password' => Hash::make('admin'),
                'role' => 'admin',
            ]
        );

        $member = User::firstOrCreate(
            ['email' => 'member@example.com'],
            [
                'name' => 'Member User',
                'username' => 'member',
                'password' => Hash::make('member'),
                'role' => 'member',
            ]
        );

        $posts = [
            [
                'user_id' => $member->id,
                'title' => 'Panduan Lengkap Laravel 13 dan Inertia.js React',
                'category' => PostCategory::TEKNOLOGI->value,
                'excerpt' => 'Pelajari arsitektur modern perpaduan Laravel 13, Inertia.js v2, dan React dengan pendekatan Feature-First.',
                'content' => "# Panduan Lengkap Laravel 13 & Inertia.js React\n\nLaravel 13 menghadirkan performa tinggi dan ekosistem modern yang sangat serasi dipadukan bersama Inertia.js dan React.\n\n## Keunggulan Monolith Modern\n- Tidak perlu membuat REST API manual untuk frontend sendiri\n- State routing dikelola mulus oleh Inertia\n- Menggabungkan keandalan backend Laravel dengan interaktivitas React\n\n```bash\ncomposer require inertiajs/inertia-laravel:^2.0\nnpm install @inertiajs/react react react-dom\n```\n\nSelamat mengeksplorasi pembuatan aplikasi berkualitas tinggi!",
                'is_published' => true,
                'published_at' => now()->subDays(2),
            ],
            [
                'user_id' => $member->id,
                'title' => 'Tips Produktivitas Penulis Konten Digital',
                'category' => PostCategory::GAYA_HIDUP->value,
                'excerpt' => 'Strategi menyusun jadwal riset, menulis draf awal, hingga penyuntingan akhir artikel blog profesional.',
                'content' => "# Tips Produktivitas Penulis Konten Digital\n\nMenjadi penulis yang konsisten membutuhkan kebiasaan terstruktur dan lingkungan kerja yang kondusif.\n\n### 1. Blok Waktu Menulis\nSisihkan 90 menit setiap pagi tanpa distraksi media sosial.\n\n### 2. Gunakan Format Markdown\nMarkdown membantu Anda fokus pada struktur tulisan tanpa terganggu styling manual.\n\n### 3. Review Berkala\nSimpan sebagai draf sebelum membaca ulang dengan pikiran segar keesokan harinya.",
                'is_published' => true,
                'published_at' => now()->subDay(),
            ],
            [
                'user_id' => $member->id,
                'title' => 'Draf: Eksplorasi Model AI untuk Asisten Penulisan',
                'category' => PostCategory::TEKNOLOGI->value,
                'excerpt' => 'Catatan eksperimen penggunaan model bahasa generatif untuk merumuskan ide artikel dan outline cepat.',
                'content' => "# Eksplorasi Model AI untuk Asisten Penulisan\n\n*(Artikel ini masih berstatus draf internal)*\n\nRiset perbandingan respons model AI terhadap prompt pembuatan artikel teknis dan kreatif.",
                'is_published' => false,
                'published_at' => null,
            ],
            [
                'user_id' => $admin->id,
                'title' => 'Pengumuman Komunitas BlogVerse: Panduan Standar Penulisan',
                'category' => PostCategory::UMUM->value,
                'excerpt' => 'Panduan etika, format penulisan, serta kriteria mutu artikel yang dipublikasikan di BlogVerse Pro.',
                'content' => "# Standar Penulisan Komunitas BlogVerse\n\nSelamat datang seluruh penulis di BlogVerse Pro! Untuk menjaga kualitas ekosistem literasi digital, mohon perhatikan ketentuan berikut:\n\n1. Cantumkan kategori artikel yang relevan.\n2. Berikan ringkasan (excerpt) 1-2 kalimat pemikat.\n3. Gunakan heading dan format Markdown yang rapi.\n\nMari berkarya bersama!",
                'is_published' => true,
                'published_at' => now()->subHours(12),
            ],
        ];

        foreach ($posts as $postData) {
            $slug = Str::slug($postData['title']);
            Post::firstOrCreate(
                ['slug' => $slug],
                [
                    'user_id' => $postData['user_id'],
                    'title' => $postData['title'],
                    'category' => $postData['category'],
                    'excerpt' => $postData['excerpt'],
                    'content' => $postData['content'],
                    'is_published' => $postData['is_published'],
                    'published_at' => $postData['published_at'],
                ]
            );
        }
    }
}

