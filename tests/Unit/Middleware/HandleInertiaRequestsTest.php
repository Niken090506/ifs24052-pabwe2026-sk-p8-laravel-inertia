<?php

namespace Tests\Unit\Middleware;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class HandleInertiaRequestsTest extends TestCase
{
    use RefreshDatabase;

    public function test_handle_inertia_shares_expected_data(): void
    {
        $middleware = new HandleInertiaRequests();

        $user = User::factory()->create([
            'name' => 'John Doe',
            'username' => 'johndoe',
            'email' => 'john@example.com',
            'role' => 'member',
            'profile_photo_path' => 'photo.jpg',
        ]);

        $session = $this->app['session.store'];
        $session->put('success', 'Operation successful');
        $session->put('error', 'Something failed');
        $session->put('aiGeneratedItems', [['title' => 'AI Title']]);

        $request = Request::create('/');
        $request->setLaravelSession($session);
        $request->setUserResolver(fn () => $user);

        $shared = $middleware->share($request);

        $this->assertArrayHasKey('auth', $shared);
        $this->assertArrayHasKey('flash', $shared);
        $this->assertArrayHasKey('appName', $shared);

        $this->assertSame($user->id, $shared['auth']['user']['id']);
        $this->assertSame('johndoe', $shared['auth']['user']['username']);

        $this->assertSame('Operation successful', $shared['flash']['success']());
        $this->assertSame('Something failed', $shared['flash']['error']());
        $this->assertSame([['title' => 'AI Title']], $shared['flash']['aiGeneratedItems']());

        $this->assertNull($middleware->version($request));
    }

    public function test_handle_inertia_with_guest_user(): void
    {
        $middleware = new HandleInertiaRequests();
        $session = $this->app['session.store'];

        $request = Request::create('/');
        $request->setLaravelSession($session);
        $request->setUserResolver(fn () => null);

        $shared = $middleware->share($request);

        $this->assertNull($shared['auth']['user']);
    }
}
