<?php

namespace Tests\Feature\Admin;

use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminUserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_admin_users(): void
    {
        $this->get('/admin/users')->assertRedirect('/login');
    }

    public function test_member_cannot_access_admin_users(): void
    {
        $member = User::factory()->member()->create();

        $this->actingAs($member)
            ->get('/admin/users')
            ->assertStatus(403);
    }

    public function test_admin_can_view_user_list(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(2)->member()->create();

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/UserList')
                ->has('users.data', 3)
            );
    }

    public function test_admin_can_filter_user_list(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create(['name' => 'Charlie Chaplin', 'username' => 'charlie']);
        User::factory()->create(['name' => 'Diana Prince', 'username' => 'diana']);

        $response = $this->actingAs($admin)->get('/admin/users?search=Charlie');
        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/UserList')
                ->has('users.data', 1)
                ->where('filters.search', 'Charlie')
            );
    }

    public function test_admin_can_view_and_export_specific_user_posts(): void
    {
        $admin = User::factory()->admin()->create();
        $targetUser = User::factory()->member()->create(['name' => 'Target Writer']);
        Post::factory()->count(2)->create(['user_id' => $targetUser->id]);

        $response = $this->actingAs($admin)->get("/admin/users/{$targetUser->id}/posts");

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/UserPostList')
                ->where('targetUser.name', 'Target Writer')
                ->has('posts.data', 2)
                ->has('categories')
            );

        $exportResponse = $this->actingAs($admin)->get("/admin/users/{$targetUser->id}/posts/export");
        $exportResponse->assertStatus(200);
    }

    public function test_admin_can_filter_specific_user_posts(): void
    {
        $admin = User::factory()->admin()->create();
        $targetUser = User::factory()->member()->create(['name' => 'Writer']);
        Post::factory()->create([
            'user_id' => $targetUser->id,
            'title' => 'Teknologi Masa Depan',
            'category' => 'Teknologi',
            'is_published' => true,
        ]);
        Post::factory()->create([
            'user_id' => $targetUser->id,
            'title' => 'Ide Bisnis',
            'category' => 'Bisnis',
            'is_published' => false,
        ]);

        $publishedRes = $this->actingAs($admin)->get("/admin/users/{$targetUser->id}/posts?search=Teknologi&category=Teknologi&status=published");
        $publishedRes->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/UserPostList')
                ->has('posts.data', 1)
                ->where('filters.status', 'published')
            );

        $draftRes = $this->actingAs($admin)->get("/admin/users/{$targetUser->id}/posts?status=draft");
        $draftRes->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/UserPostList')
                ->has('posts.data', 1)
                ->where('filters.status', 'draft')
            );
    }
}
