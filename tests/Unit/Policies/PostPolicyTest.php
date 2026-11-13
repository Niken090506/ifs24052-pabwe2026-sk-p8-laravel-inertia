<?php

namespace Tests\Unit\Policies;

use App\Features\Post\Models\Post;
use App\Features\Post\Policies\PostPolicy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostPolicyTest extends TestCase
{
    use RefreshDatabase;

    private PostPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new PostPolicy();
    }

    public function test_view_any_is_always_true(): void
    {
        $this->assertTrue($this->policy->viewAny(null));
        $user = User::factory()->make();
        $this->assertTrue($this->policy->viewAny($user));
    }

    public function test_view_published_post_is_allowed_for_anyone(): void
    {
        $post = Post::factory()->published()->make();
        $this->assertTrue($this->policy->view(null, $post));
    }

    public function test_view_draft_post(): void
    {
        $owner = User::factory()->make(['id' => 10]);
        $otherUser = User::factory()->make(['id' => 20, 'role' => 'member']);
        $admin = User::factory()->admin()->make(['id' => 30]);

        $post = Post::factory()->draft()->make(['user_id' => 10]);

        $this->assertFalse($this->policy->view(null, $post));
        $this->assertFalse($this->policy->view($otherUser, $post));
        $this->assertTrue($this->policy->view($owner, $post));
        $this->assertTrue($this->policy->view($admin, $post));
    }

    public function test_create_is_allowed_for_authenticated_user(): void
    {
        $user = User::factory()->make();
        $this->assertTrue($this->policy->create($user));
    }

    public function test_update_and_delete_only_allowed_for_owner(): void
    {
        $owner = User::factory()->make(['id' => 5]);
        $other = User::factory()->make(['id' => 8]);
        $post = Post::factory()->make(['user_id' => 5]);

        $this->assertTrue($this->policy->update($owner, $post));
        $this->assertFalse($this->policy->update($other, $post));

        $this->assertTrue($this->policy->delete($owner, $post));
        $this->assertFalse($this->policy->delete($other, $post));
    }
}
