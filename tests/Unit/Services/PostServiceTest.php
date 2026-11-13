<?php

namespace Tests\Unit\Services;

use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Models\Post;
use App\Features\Post\Services\PostService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostServiceTest extends TestCase
{
    use RefreshDatabase;

    private PostService $service;
    private PostRepositoryInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = $this->app->make(PostRepositoryInterface::class);
        $this->service = new PostService($this->repository);
        Storage::fake('public');
    }

    public function test_generate_unique_slug(): void
    {
        $user = User::factory()->create();
        Post::factory()->create(['user_id' => $user->id, 'slug' => 'sample-article']);

        $emptySlug = $this->service->generateUniqueSlug('');
        $this->assertSame('artikel', $emptySlug);

        $newSlug = $this->service->generateUniqueSlug('Sample Article');
        $this->assertSame('sample-article-1', $newSlug);
    }

    public function test_create_and_update_post(): void
    {
        $user = User::factory()->create();

        $post = $this->service->createPost($user->id, [
            'title' => 'My First Post',
            'category' => 'Teknologi',
            'excerpt' => 'An excerpt',
            'content' => '# Content here',
            'is_published' => true,
        ]);

        $this->assertSame('my-first-post', $post->slug);
        $this->assertTrue($post->is_published);
        $this->assertNotNull($post->published_at);

        // Update post with new title, excerpt, content, and unpublish
        $this->service->updatePost($post, [
            'title' => 'My Updated Post',
            'category' => 'Bisnis',
            'excerpt' => 'Updated excerpt',
            'content' => 'New content',
            'is_published' => false,
        ]);

        $fresh = $post->fresh();
        $this->assertSame('My Updated Post', $fresh->title);
        $this->assertSame('my-updated-post', $fresh->slug);
        $this->assertSame('Bisnis', $fresh->category);
        $this->assertSame('Updated excerpt', $fresh->excerpt);
        $this->assertFalse($fresh->is_published);
        $this->assertNull($fresh->published_at);

        // Re-publish
        $this->service->updatePost($fresh, [
            'is_published' => true,
        ]);
        $this->assertTrue($fresh->fresh()->is_published);
        $this->assertNotNull($fresh->fresh()->published_at);
    }

    public function test_toggle_publication(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->draft()->create(['user_id' => $user->id]);

        $this->service->togglePublication($post);
        $this->assertTrue($post->fresh()->is_published);
        $this->assertNotNull($post->fresh()->published_at);

        $this->service->togglePublication($post->fresh());
        $this->assertFalse($post->fresh()->is_published);
        $this->assertNull($post->fresh()->published_at);
    }

    public function test_update_delete_cover_and_delete_post(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->image('cover.png', 600, 400);
        $path = $this->service->updateCover($post, $file);

        $this->assertSame($path, $post->fresh()->cover_image_path);
        Storage::disk('public')->assertExists($path);

        // Update cover replaces previous
        $file2 = UploadedFile::fake()->image('cover2.png', 600, 400);
        $path2 = $this->service->updateCover($post->fresh(), $file2);
        Storage::disk('public')->assertMissing($path);
        Storage::disk('public')->assertExists($path2);

        // Delete cover
        $this->assertTrue($this->service->deleteCover($post->fresh()));
        $this->assertNull($post->fresh()->cover_image_path);
        Storage::disk('public')->assertMissing($path2);

        // Delete cover on post with no cover returns true
        $this->assertTrue($this->service->deleteCover($post->fresh()));

        // Put cover back to test deletePost removes it
        $this->service->updateCover($post->fresh(), $file);
        $this->assertTrue($this->service->deletePost($post->fresh()));
        $this->assertNull(Post::find($post->id));
    }

    public function test_save_batch(): void
    {
        $user = User::factory()->create();

        $items = [
            ['title' => '', 'category' => 'Umum'],
            [
                'title' => 'Batch Item 1',
                'category' => 'Pendidikan',
                'excerpt' => 'Ex 1',
                'content' => 'Content 1',
                'is_published' => true,
            ],
            [
                'title' => 'Batch Item 2',
                'category' => null,
                'excerpt' => null,
                'content' => null,
                'is_published' => false,
            ],
        ];

        $count = $this->service->saveBatch($user->id, $items);
        $this->assertSame(2, $count);
        $this->assertCount(2, Post::where('user_id', $user->id)->get());
    }
}
