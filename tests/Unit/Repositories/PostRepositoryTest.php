<?php

namespace Tests\Unit\Repositories;

use App\Features\Post\Models\Post;
use App\Features\Post\Repositories\PostRepository;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private PostRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new PostRepository();
    }

    public function test_find_by_id_and_slug(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create([
            'user_id' => $user->id,
            'slug' => 'test-post-unique-slug',
        ]);

        $foundById = $this->repository->findById($post->id);
        $this->assertNotNull($foundById);
        $this->assertSame($post->id, $foundById->id);

        $foundBySlug = $this->repository->findBySlug('test-post-unique-slug');
        $this->assertNotNull($foundBySlug);
        $this->assertSame($post->id, $foundBySlug->id);

        $this->assertNull($this->repository->findById(99999));
        $this->assertNull($this->repository->findBySlug('non-existent'));
    }

    public function test_get_published_paginated_with_search_and_category(): void
    {
        $user = User::factory()->create();
        Post::factory()->create([
            'user_id' => $user->id,
            'title' => 'Laravel 13 Architecture',
            'category' => 'Teknologi',
            'is_published' => true,
        ]);
        Post::factory()->create([
            'user_id' => $user->id,
            'title' => 'Healthy Cooking',
            'category' => 'Gaya Hidup',
            'is_published' => true,
        ]);
        Post::factory()->create([
            'user_id' => $user->id,
            'title' => 'Draft Tutorial',
            'category' => 'Teknologi',
            'is_published' => false,
        ]);

        $allPublished = $this->repository->getPublishedPaginated();
        $this->assertCount(2, $allPublished->items());

        $filteredSearch = $this->repository->getPublishedPaginated(search: 'Architecture');
        $this->assertCount(1, $filteredSearch->items());

        $filteredCategory = $this->repository->getPublishedPaginated(category: 'Gaya Hidup');
        $this->assertCount(1, $filteredCategory->items());
    }

    public function test_get_user_posts_paginated(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Post::factory()->create([
            'user_id' => $user->id,
            'title' => 'User Post 1',
            'category' => 'Teknologi',
            'is_published' => true,
        ]);
        Post::factory()->create([
            'user_id' => $user->id,
            'title' => 'User Post 2',
            'category' => 'Bisnis',
            'is_published' => false,
        ]);
        Post::factory()->create([
            'user_id' => $otherUser->id,
            'title' => 'Other Post',
            'is_published' => true,
        ]);

        $userPosts = $this->repository->getUserPostsPaginated($user->id);
        $this->assertCount(2, $userPosts->items());

        $publishedOnly = $this->repository->getUserPostsPaginated($user->id, status: 'published');
        $this->assertCount(1, $publishedOnly->items());

        $draftOnly = $this->repository->getUserPostsPaginated($user->id, status: 'draft');
        $this->assertCount(1, $draftOnly->items());

        $searched = $this->repository->getUserPostsPaginated($user->id, search: 'Post 1', category: 'Teknologi');
        $this->assertCount(1, $searched->items());
    }

    public function test_get_all_posts_paginated(): void
    {
        $user = User::factory()->create(['name' => 'Alice']);
        Post::factory()->create([
            'user_id' => $user->id,
            'title' => 'Super Post',
            'category' => 'Opini',
            'is_published' => true,
        ]);
        Post::factory()->create([
            'user_id' => $user->id,
            'title' => 'Draft Post',
            'category' => 'Opini',
            'is_published' => false,
        ]);

        $all = $this->repository->getAllPostsPaginated();
        $this->assertCount(2, $all->items());

        $byStatus = $this->repository->getAllPostsPaginated(status: 'draft');
        $this->assertCount(1, $byStatus->items());

        $bySearch = $this->repository->getAllPostsPaginated(search: 'Alice');
        $this->assertCount(2, $bySearch->items());

        $byCat = $this->repository->getAllPostsPaginated(category: 'Opini');
        $this->assertCount(2, $byCat->items());
    }

    public function test_get_user_stats(): void
    {
        $user = User::factory()->create();
        Post::factory()->count(2)->published()->create(['user_id' => $user->id]);
        Post::factory()->count(3)->draft()->create(['user_id' => $user->id]);

        $stats = $this->repository->getUserStats($user->id);

        $this->assertSame(5, $stats['total']);
        $this->assertSame(2, $stats['published']);
        $this->assertSame(3, $stats['draft']);
    }

    public function test_create_update_delete_and_insert_many(): void
    {
        $user = User::factory()->create();

        $post = $this->repository->create([
            'user_id' => $user->id,
            'title' => 'Created Title',
            'slug' => 'created-title',
            'category' => 'Teknologi',
            'content' => 'Content here',
            'is_published' => false,
        ]);

        $this->assertInstanceOf(Post::class, $post);
        $this->assertSame('Created Title', $post->title);

        $updated = $this->repository->update($post, ['title' => 'Updated Title']);
        $this->assertTrue($updated);
        $this->assertSame('Updated Title', $post->fresh()->title);

        $deleted = $this->repository->delete($post);
        $this->assertTrue($deleted);
        $this->assertNull(Post::find($post->id));

        $emptyInsert = $this->repository->insertMany([]);
        $this->assertSame(0, $emptyInsert);

        $count = $this->repository->insertMany([
            [
                'user_id' => $user->id,
                'title' => 'Batch 1',
                'slug' => 'batch-1',
                'category' => 'Umum',
                'excerpt' => null,
                'content' => 'Content 1',
                'cover_image_path' => null,
                'is_published' => false,
                'published_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Batch 2',
                'slug' => 'batch-2',
                'category' => 'Umum',
                'excerpt' => null,
                'content' => 'Content 2',
                'cover_image_path' => null,
                'is_published' => false,
                'published_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->assertSame(2, $count);
        $this->assertCount(2, $this->repository->getAllUserPosts($user->id));
        $this->assertCount(2, $this->repository->getAllPosts());
    }
}
