<?php

namespace App\Features\Post\Services;

use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Enums\PostCategory;
use App\Features\Post\Models\Post;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PostService
{
    public function __construct(
        protected PostRepositoryInterface $postRepository
    ) {}

    public function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($title);
        if (empty($baseSlug)) {
            $baseSlug = 'artikel';
        }
        $slug = $baseSlug;
        $counter = 1;

        while (Post::where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createPost(int $userId, array $data): Post
    {
        $slug = $this->generateUniqueSlug($data['title']);
        $isPublished = (bool) ($data['is_published'] ?? false);

        return $this->postRepository->create([
            'user_id' => $userId,
            'title' => $data['title'],
            'slug' => $slug,
            'category' => $data['category'],
            'excerpt' => $data['excerpt'] ?? null,
            'content' => $data['content'],
            'cover_image_path' => $data['cover_image_path'] ?? null,
            'is_published' => $isPublished,
            'published_at' => $isPublished ? now() : null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updatePost(Post $post, array $data): bool
    {
        $updateData = [];

        if (isset($data['title']) && $data['title'] !== $post->title) {
            $updateData['title'] = $data['title'];
            $updateData['slug'] = $this->generateUniqueSlug($data['title'], $post->id);
        }

        if (isset($data['category'])) {
            $updateData['category'] = $data['category'];
        }

        if (array_key_exists('excerpt', $data)) {
            $updateData['excerpt'] = $data['excerpt'];
        }

        if (isset($data['content'])) {
            $updateData['content'] = $data['content'];
        }

        if (array_key_exists('is_published', $data)) {
            $isPublished = (bool) $data['is_published'];
            $updateData['is_published'] = $isPublished;

            if ($isPublished && !$post->published_at) {
                $updateData['published_at'] = now();
            } elseif (!$isPublished) {
                $updateData['published_at'] = null;
            }
        }

        return $this->postRepository->update($post, $updateData);
    }

    public function togglePublication(Post $post): bool
    {
        $newStatus = !$post->is_published;

        return $this->postRepository->update($post, [
            'is_published' => $newStatus,
            'published_at' => $newStatus ? ($post->published_at ?? now()) : null,
        ]);
    }

    public function updateCover(Post $post, UploadedFile $file): string
    {
        if ($post->cover_image_path) {
            Storage::disk('public')->delete($post->cover_image_path);
        }

        $path = $file->store('covers', 'public');
        $this->postRepository->update($post, ['cover_image_path' => $path]);

        return $path;
    }

    public function deleteCover(Post $post): bool
    {
        if ($post->cover_image_path) {
            Storage::disk('public')->delete($post->cover_image_path);
            return $this->postRepository->update($post, ['cover_image_path' => null]);
        }

        return true;
    }

    public function deletePost(Post $post): bool
    {
        if ($post->cover_image_path) {
            Storage::disk('public')->delete($post->cover_image_path);
        }

        return $this->postRepository->delete($post);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    public function saveBatch(int $userId, array $items): int
    {
        $records = [];
        $now = now();

        foreach ($items as $item) {
            $title = trim((string) ($item['title'] ?? ''));
            if ($title === '') {
                continue;
            }

            $slug = $this->generateUniqueSlug($title);
            $category = !empty($item['category']) ? (string) $item['category'] : PostCategory::UMUM->value;

            $records[] = [
                'user_id' => $userId,
                'title' => substr($title, 0, 255),
                'slug' => $slug,
                'category' => $category,
                'excerpt' => !empty($item['excerpt']) ? (string) $item['excerpt'] : null,
                'content' => !empty($item['content']) ? (string) $item['content'] : '',
                'cover_image_path' => null,
                'is_published' => (bool) ($item['is_published'] ?? false),
                'published_at' => !empty($item['is_published']) ? $now : null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        return $this->postRepository->insertMany($records);
    }
}

