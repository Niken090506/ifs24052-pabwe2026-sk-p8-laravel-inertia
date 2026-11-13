<?php

namespace App\Features\Post\Repositories;

use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Models\Post;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PostRepository implements PostRepositoryInterface
{
    public function findById(int $id): ?Post
    {
        return Post::with('user')->find($id);
    }

    public function findBySlug(string $slug): ?Post
    {
        return Post::with('user')->where('slug', $slug)->first();
    }

    public function getPublishedPaginated(?string $search = null, ?string $category = null, int $perPage = 9): LengthAwarePaginator
    {
        $query = Post::with('user')->where('is_published', true)->latest('published_at');

        if ($search !== null && trim($search) !== '') {
            $term = '%'.trim($search).'%';
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)
                    ->orWhere('excerpt', 'like', $term)
                    ->orWhere('content', 'like', $term);
            });
        }

        if ($category !== null && trim($category) !== '') {
            $query->where('category', $category);
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function getUserPostsPaginated(
        int $userId,
        ?string $search = null,
        ?string $category = null,
        ?string $status = null,
        int $perPage = 10
    ): LengthAwarePaginator {
        $query = Post::with('user')->where('user_id', $userId)->latest();

        if ($search !== null && trim($search) !== '') {
            $term = '%'.trim($search).'%';
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)
                    ->orWhere('content', 'like', $term)
                    ->orWhere('excerpt', 'like', $term);
            });
        }

        if ($category !== null && trim($category) !== '') {
            $query->where('category', $category);
        }

        if ($status === 'published') {
            $query->where('is_published', true);
        } elseif ($status === 'draft') {
            $query->where('is_published', false);
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function getAllPostsPaginated(
        ?string $search = null,
        ?string $category = null,
        ?string $status = null,
        int $perPage = 10
    ): LengthAwarePaginator {
        $query = Post::with('user')->latest();

        if ($search !== null && trim($search) !== '') {
            $term = '%'.trim($search).'%';
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)
                    ->orWhere('content', 'like', $term)
                    ->orWhereHas('user', function ($uq) use ($term) {
                        $uq->where('name', 'like', $term)
                            ->orWhere('username', 'like', $term);
                    });
            });
        }

        if ($category !== null && trim($category) !== '') {
            $query->where('category', $category);
        }

        if ($status === 'published') {
            $query->where('is_published', true);
        } elseif ($status === 'draft') {
            $query->where('is_published', false);
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * @return array{total: int, published: int, draft: int}
     */
    public function getUserStats(int $userId): array
    {
        $total = Post::where('user_id', $userId)->count();
        $published = Post::where('user_id', $userId)->where('is_published', true)->count();
        $draft = $total - $published;

        return [
            'total' => $total,
            'published' => $published,
            'draft' => $draft,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Post
    {
        return Post::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Post $post, array $data): bool
    {
        return $post->update($data);
    }

    public function delete(Post $post): bool
    {
        return (bool) $post->delete();
    }

    /**
     * @param  array<int, array<string, mixed>>  $records
     */
    public function insertMany(array $records): int
    {
        if (empty($records)) {
            return 0;
        }

        Post::insert($records);

        return count($records);
    }

    /**
     * @return Collection<int, Post>
     */
    public function getAllUserPosts(int $userId): Collection
    {
        return Post::with('user')->where('user_id', $userId)->latest()->get();
    }

    /**
     * @return Collection<int, Post>
     */
    public function getAllPosts(): Collection
    {
        return Post::with('user')->latest()->get();
    }
}

