<?php

namespace App\Features\Post\Controllers;

use App\Features\Ai\Contracts\AiClientInterface;
use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Enums\PostCategory;
use App\Features\Post\Models\Post;
use App\Features\Post\Services\PostExcelService;
use App\Features\Post\Services\PostService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PostController
{
    public function __construct(
        protected PostRepositoryInterface $postRepository,
        protected PostService $postService,
        protected PostExcelService $excelService,
    ) {}

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = Auth::user();

        $search = $request->query('search');
        $category = $request->query('category');
        $status = $request->query('status');

        $posts = $this->postRepository->getUserPostsPaginated(
            $user->id,
            $search ?: null,
            $category ?: null,
            $status ?: null,
            10
        );

        $stats = $this->postRepository->getUserStats($user->id);

        return Inertia::render('Post/Index', [
            'posts' => $posts,
            'stats' => $stats,
            'filters' => [
                'search' => $search ?? '',
                'category' => $category ?? '',
                'status' => $status ?? '',
            ],
            'categories' => PostCategory::options(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', Rule::in(PostCategory::values())],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $this->postService->createPost($user->id, $validated);

        return back()->with('success', 'Artikel berhasil dibuat.');
    }

    public function show(Post $post): Response
    {
        $post->load('user');

        return Inertia::render('Post/Show', [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'category' => $post->category,
                'excerpt' => $post->excerpt,
                'content' => $post->content,
                'cover_image_path' => $post->cover_image_path,
                'cover_image_url' => $post->coverImageUrl(),
                'is_published' => $post->is_published,
                'published_at' => $post->published_at ? $post->published_at->format('d M Y H:i') : null,
                'created_at' => $post->created_at->format('d M Y H:i'),
                'updated_at' => $post->updated_at->format('d M Y H:i'),
                'author' => [
                    'id' => $post->user->id,
                    'name' => $post->user->name,
                    'username' => $post->user->username,
                ],
            ],
            'categories' => PostCategory::options(),
        ]);
    }

    public function update(Request $request, Post $post): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', Rule::in(PostCategory::values())],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $this->postService->updatePost($post, $validated);

        return back()->with('success', 'Artikel berhasil diperbarui.');
    }

    public function destroy(Post $post): RedirectResponse
    {
        $this->postService->deletePost($post);

        return redirect()->route('dashboard.posts.index')->with('success', 'Artikel berhasil dihapus.');
    }

    public function togglePublish(Post $post): RedirectResponse
    {
        $this->postService->togglePublication($post);

        $fresh = $post->fresh();
        $message = $fresh && $fresh->is_published
            ? 'Artikel berhasil dipublikasikan.'
            : 'Artikel diubah menjadi draf.';

        return back()->with('success', $message);
    }

    public function updateCover(Request $request, Post $post): RedirectResponse
    {
        $request->validate([
            'cover' => ['required', 'image', 'max:5120'],
        ]);

        $this->postService->updateCover($post, $request->file('cover'));

        return back()->with('success', 'Foto sampul berhasil diperbarui.');
    }

    public function deleteCover(Post $post): RedirectResponse
    {
        $this->postService->deleteCover($post);

        return back()->with('success', 'Foto sampul berhasil dihapus.');
    }

    public function exportExcel(): StreamedResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $posts = $this->postRepository->getAllUserPosts($user->id);

        return $this->excelService->exportToResponse($posts, 'my-articles-'.now()->format('Ymd-His').'.xlsx');
    }

    public function importExcel(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $request->validate([
            'importFile' => ['nullable', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
            'file' => ['nullable', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ]);

        $file = $request->file('importFile') ?? $request->file('file');
        if (! $file) {
            return back()->with('error', 'File Excel wajib diunggah.');
        }

        $result = $this->excelService->import($file->getRealPath(), $user->id);

        return back()->with('success', "Berhasil mengimpor {$result['imported']} artikel.");
    }

    public function generateAi(Request $request, AiClientInterface $aiService): JsonResponse
    {
        $prompt = (string) ($request->input('prompt') ?? $request->input('aiPrompt') ?? '');
        $count = (int) ($request->input('count') ?? $request->input('aiCount') ?? 3);

        if (trim($prompt) === '') {
            return response()->json([
                'success' => false,
                'message' => 'Prompt tidak boleh kosong.',
            ], 422);
        }

        if ($count < 1 || $count > 10) {
            return response()->json([
                'success' => false,
                'message' => 'Jumlah artikel harus antara 1 sampai 10.',
            ], 422);
        }

        try {
            $items = $aiService->generatePosts($prompt, $count);

            return response()->json([
                'success' => true,
                'posts' => array_map(fn ($item) => $item->toArray(), $items),
                'items' => array_map(fn ($item) => $item->toArray(), $items),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function saveAi(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $items = $request->input('items') ?? $request->input('posts') ?? [];

        if (! is_array($items) || empty($items)) {
            return back()->with('error', 'Tidak ada artikel yang dipilih untuk disimpan.');
        }

        $savedCount = $this->postService->saveBatch($user->id, $items);

        return back()->with('success', "Berhasil menyimpan {$savedCount} artikel dari AI.");
    }
}

