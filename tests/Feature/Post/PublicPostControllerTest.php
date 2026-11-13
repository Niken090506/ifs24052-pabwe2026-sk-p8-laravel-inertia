<?php

namespace Tests\Feature\Post;

use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicPostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_renders_published_posts(): void
    {
        $user = User::factory()->create();
        Post::factory()->count(2)->published()->create(['user_id' => $user->id]);
        Post::factory()->draft()->create(['user_id' => $user->id]);

        $response = $this->get('/articles');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/PostIndex')
                ->has('posts.data', 2)
                ->has('categories')
                ->where('filters.search', '')
            );
    }

    public function test_show_published_post_success(): void
    {
        $author = User::factory()->create(['name' => 'Author A']);
        $post = Post::factory()->published()->create([
            'user_id' => $author->id,
            'slug' => 'artikel-keren',
            'category' => 'Teknologi',
        ]);

        $related = Post::factory()->published()->create([
            'user_id' => $author->id,
            'slug' => 'artikel-lain',
            'category' => 'Teknologi',
        ]);

        $response = $this->get('/articles/artikel-keren');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/PostShow')
                ->where('post.slug', 'artikel-keren')
                ->where('post.author.name', 'Author A')
                ->has('relatedPosts', 1)
            );
    }

    public function test_show_non_existent_slug_aborts_404(): void
    {
        $this->get('/articles/slug-tidak-ada')->assertStatus(404);
    }

    public function test_show_draft_post(): void
    {
        $author = User::factory()->member()->create();
        $otherMember = User::factory()->member()->create();
        $admin = User::factory()->admin()->create();

        $draft = Post::factory()->draft()->create([
            'user_id' => $author->id,
            'slug' => 'draf-rahasia',
        ]);

        // Guest -> 404
        $this->get('/articles/draf-rahasia')->assertStatus(404);

        // Other member -> 404
        $this->actingAs($otherMember)->get('/articles/draf-rahasia')->assertStatus(404);

        // Author -> 200
        $this->actingAs($author)->get('/articles/draf-rahasia')->assertStatus(200);

        // Admin -> 200
        $this->actingAs($admin)->get('/articles/draf-rahasia')->assertStatus(200);
    }
}
