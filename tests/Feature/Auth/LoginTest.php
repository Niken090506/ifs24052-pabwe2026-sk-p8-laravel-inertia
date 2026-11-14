<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_render_login_page(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/Login')
            );
    }

    public function test_login_validation(): void
    {
        $response = $this->post('/login', [
            'login' => '',
            'password' => '',
        ]);

        $response->assertSessionHasErrors(['login', 'password']);
        $this->assertGuest();
    }

    public function test_login_invalid_credentials(): void
    {
        User::factory()->create([
            'username' => 'existing_user',
            'email' => 'user@test.com',
            'password' => Hash::make('correct-password'),
        ]);

        // Wrong password with email
        $response = $this->post('/login', [
            'login' => 'user@test.com',
            'password' => 'wrong-password',
        ]);
        $response->assertSessionHasErrors(['login']);

        // Wrong password with username
        $response = $this->post('/login', [
            'login' => 'existing_user',
            'password' => 'wrong-password',
        ]);
        $response->assertSessionHasErrors(['login']);

        $this->assertGuest();
    }

    public function test_member_login_with_email_redirects_to_dashboard_posts(): void
    {
        User::factory()->member()->create([
            'username' => 'member1',
            'email' => 'member@test.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->post('/login', [
            'login' => 'member@test.com',
            'password' => 'password123',
            'remember' => true,
        ]);

        $response->assertSessionHasNoErrors()
            ->assertRedirect(route('dashboard.posts.index'));

        $this->assertAuthenticated();
    }

    public function test_member_login_with_username_redirects_to_dashboard_posts(): void
    {
        User::factory()->member()->create([
            'username' => 'member_cool',
            'email' => 'cool@test.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->post('/login', [
            'login' => 'member_cool',
            'password' => 'password123',
        ]);

        $response->assertSessionHasNoErrors()
            ->assertRedirect(route('dashboard.posts.index'));

        $this->assertAuthenticated();
    }

    public function test_admin_login_redirects_to_admin_users(): void
    {
        User::factory()->admin()->create([
            'username' => 'admin_boss',
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->post('/login', [
            'login' => 'admin_boss',
            'password' => 'password123',
        ]);

        $response->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.users'));

        $this->assertAuthenticated();
    }

    public function test_authenticated_user_visiting_login_redirects(): void
    {
        $member = User::factory()->member()->create();

        $response = $this->actingAs($member)->get('/login');
        $response->assertRedirect('/dashboard');
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_login_user_action_direct_execution(): void
    {
        User::factory()->create([
            'username' => 'direct_user',
            'email' => 'direct@test.com',
            'password' => Hash::make('password123'),
        ]);

        $action = new \App\Features\Auth\Actions\LoginUserAction();

        // Successful with email
        $this->assertTrue($action->execute('direct@test.com', 'password123'));

        // Successful with username
        $this->assertTrue($action->execute('direct_user', 'password123', true));

        // Failed with wrong credentials
        $this->assertFalse($action->execute('direct_user', 'wrong-pass'));
    }
}
