<?php

namespace App\Features\Post\Controllers;

use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Enums\PostCategory;
use App\Features\Post\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PublicPostController
{
    public function __construct(
        protected PostRepositoryInterface $postRepository
    ) {}

    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $category = $request->query('category');

        $posts = $this->postRepository->getPublishedPaginated(
            $search ?: null,
            $category ?: null,
            9
        );

        return Inertia::render('Public/PostIndex', [
            'posts' => $posts,
            'filters' => [
                'search' => $search ?? '',
                'category' => $category ?? '',
            ],
            'categories' => PostCategory::options(),
        ]);
    }

    public function show(string $slug): Response
    {
        $post = $this->postRepository->findBySlug($slug);

        if (!$post) {
            abort(404, 'Artikel tidak ditemukan.');
        }

        $user = Auth::user();
        if (!$post->is_published && (!$user || ($user->id !== $post->user_id && !$user->isAdmin()))) {
            abort(404, 'Artikel belum dipublikasikan.');
        }

        $relatedPosts = Post::where('is_published', true)
            ->where('id', '!=', $post->id)
            ->where('category', $post->category)
            ->latest('published_at')
            ->take(3)
            ->get();

        if ($relatedPosts->isEmpty()) {
            $relatedPosts = Post::where('is_published', true)
                ->where('id', '!=', $post->id)
                ->latest('published_at')
                ->take(3)
                ->get();
        }

        return Inertia::render('Public/PostShow', [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'category' => $post->category,
                'excerpt' => $post->excerpt,
                'content' => $post->content,
                'cover_image_path' => $post->cover_image_path,
                'is_published' => $post->is_published,
                'published_at' => $post->published_at ? $post->published_at->format('d M Y') : null,
                'created_at' => $post->created_at->format('d M Y'),
                'author' => [
                    'id' => $post->user->id,
                    'name' => $post->user->name,
                    'username' => $post->user->username,
                    'profile_photo_path' => $post->user->profile_photo_path,
                ],
            ],
            'relatedPosts' => $relatedPosts,
        ]);
    }
}

