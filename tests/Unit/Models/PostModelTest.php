<?php

namespace Tests\Unit\Models;

use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_post_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $post->user);
        $this->assertSame($user->id, $post->user->id);
    }

    public function test_post_scopes(): void
    {
        Post::factory()->published()->create();
        Post::factory()->draft()->create();

        $this->assertCount(1, Post::published()->get());
        $this->assertCount(1, Post::draft()->get());
    }

    public function test_cover_image_url(): void
    {
        Storage::fake('public');

        $postWithoutCover = Post::factory()->create(['cover_image_path' => null]);
        $this->assertNull($postWithoutCover->coverImageUrl());

        Storage::disk('public')->put('post-covers/test.jpg', 'img');
        $postWithCover = Post::factory()->create(['cover_image_path' => 'post-covers/test.jpg']);
        $this->assertStringContainsString('post-covers/test.jpg', $postWithCover->coverImageUrl());
    }

    public function test_post_casts(): void
    {
        $post = Post::factory()->published()->create();

        $this->assertIsBool($post->is_published);
        $this->assertTrue($post->is_published);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $post->published_at);
    }
}
