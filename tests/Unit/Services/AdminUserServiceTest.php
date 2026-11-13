<?php

namespace Tests\Unit\Services;

use App\Features\Admin\Services\AdminUserService;
use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserServiceTest extends TestCase
{
    use RefreshDatabase;

    private AdminUserService $service;
    private PostRepositoryInterface $postRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->postRepository = $this->app->make(PostRepositoryInterface::class);
        $this->service = new AdminUserService($this->postRepository);
    }

    public function test_get_users_list_and_search(): void
    {
        User::factory()->create([
            'name' => 'Charlie Chaplin',
            'username' => 'charlie',
            'email' => 'charlie@example.com',
        ]);
        User::factory()->create([
            'name' => 'Diana Prince',
            'username' => 'diana',
            'email' => 'diana@example.com',
        ]);

        $list = $this->service->getUsersList();
        $this->assertCount(2, $list->items());

        $searchedName = $this->service->getUsersList('Charlie');
        $this->assertCount(1, $searchedName->items());

        $searchedUsername = $this->service->getUsersList('diana');
        $this->assertCount(1, $searchedUsername->items());

        $searchedEmail = $this->service->getUsersList('example.com');
        $this->assertCount(2, $searchedEmail->items());
    }

    public function test_get_user_posts_delegates_to_repository(): void
    {
        $user = User::factory()->create();
        Post::factory()->count(2)->create(['user_id' => $user->id]);

        $posts = $this->service->getUserPosts($user->id);
        $this->assertCount(2, $posts->items());
    }

    public function test_get_all_posts_delegates_to_repository(): void
    {
        Post::factory()->count(3)->create();

        $posts = $this->service->getAllPosts();
        $this->assertCount(3, $posts->items());
    }
}
