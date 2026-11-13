<?php

namespace App\Features\Post\Contracts;

use App\Features\Post\Models\Post;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PostRepositoryInterface
{
    public function findById(int $id): ?Post;

    public function findBySlug(string $slug): ?Post;

    public function getPublishedPaginated(?string $search = null, ?string $category = null, int $perPage = 9): LengthAwarePaginator;

    public function getUserPostsPaginated(
        int $userId,
        ?string $search = null,
        ?string $category = null,
        ?string $status = null,
        int $perPage = 10
    ): LengthAwarePaginator;

    public function getAllPostsPaginated(
        ?string $search = null,
        ?string $category = null,
        ?string $status = null,
        int $perPage = 10
    ): LengthAwarePaginator;

    /**
     * @return array{total: int, published: int, draft: int}
     */
    public function getUserStats(int $userId): array;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Post;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Post $post, array $data): bool;

    public function delete(Post $post): bool;

    /**
     * @param  array<int, array<string, mixed>>  $records
     */
    public function insertMany(array $records): int;

    /**
     * @return Collection<int, Post>
     */
    public function getAllUserPosts(int $userId): Collection;

    /**
     * @return Collection<int, Post>
     */
    public function getAllPosts(): Collection;
}

