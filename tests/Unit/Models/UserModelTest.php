<?php

namespace Tests\Unit\Models;

use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_role_helpers(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->member()->create();

        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($admin->isMember());

        $this->assertTrue($member->isMember());
        $this->assertFalse($member->isAdmin());
    }

    public function test_user_posts_relationship(): void
    {
        $user = User::factory()->create();
        Post::factory()->count(3)->create(['user_id' => $user->id]);

        $this->assertInstanceOf(HasMany::class, $user->posts());
        $this->assertCount(3, $user->posts);
        $this->assertInstanceOf(Post::class, $user->posts->first());
    }

    public function test_user_casts(): void
    {
        $user = User::factory()->create([
            'username' => 'testuser',
            'password' => 'secret123',
        ]);

        $this->assertSame('testuser', $user->username);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotSame('secret123', $user->password);
    }

    public function test_profile_photo_url_helper(): void
    {
        Storage::fake('public');

        $userWithoutPhoto = User::factory()->create(['profile_photo_path' => null]);
        $this->assertStringContainsString('ui-avatars.com', $userWithoutPhoto->profilePhotoUrl());

        Storage::disk('public')->put('profile-photos/avatar.png', 'content');
        $userWithPhoto = User::factory()->create(['profile_photo_path' => 'profile-photos/avatar.png']);
        $this->assertStringContainsString('avatar.png', $userWithPhoto->profilePhotoUrl());

        $userWithMissingFile = User::factory()->create(['profile_photo_path' => 'profile-photos/missing.png']);
        $this->assertStringContainsString('ui-avatars.com', $userWithMissingPhoto = $userWithMissingFile->profilePhotoUrl());
    }
}
