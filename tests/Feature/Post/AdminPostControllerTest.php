<?php

namespace Tests\Feature\Post;

use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminPostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_admin_posts(): void
    {
        $this->get('/admin/posts')->assertRedirect('/login');
    }

    public function test_member_cannot_access_admin_posts(): void
    {
        $member = User::factory()->member()->create();

        $this->actingAs($member)
            ->get('/admin/posts')
            ->assertStatus(403);
    }

    public function test_admin_can_view_all_posts(): void
    {
        $admin = User::factory()->admin()->create();
        Post::factory()->count(3)->create();

        $response = $this->actingAs($admin)->get('/admin/posts');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/PostList')
                ->has('posts.data', 3)
                ->has('categories')
            );
    }

    public function test_admin_can_export_all_posts(): void
    {
        $admin = User::factory()->admin()->create();
        Post::factory()->count(2)->create();

        $response = $this->actingAs($admin)->get('/admin/posts/export');
        $response->assertStatus(200);
    }
}
