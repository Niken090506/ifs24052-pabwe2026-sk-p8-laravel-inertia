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
}
