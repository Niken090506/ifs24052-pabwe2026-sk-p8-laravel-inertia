<?php

namespace Tests\Unit\Middleware;

use App\Features\Post\Models\Post;
use App\Http\Middleware\EnsurePostOwnership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class EnsurePostOwnershipMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private EnsurePostOwnership $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new EnsurePostOwnership();
    }

    public function test_aborts_401_if_user_not_authenticated(): void
    {
        $this->expectException(HttpException::class);

        $request = Request::create('/dashboard/posts');
        $this->middleware->handle($request, fn () => new Response('ok'));
    }

    public function test_member_accessing_different_user_route_param_aborts_403(): void
    {
        $this->expectException(HttpException::class);

        $user1 = User::factory()->member()->create();
        $user2 = User::factory()->member()->create();

        $request = Request::create("/admin/users/{$user2->id}/posts");
        $request->setUserResolver(fn () => $user1);
        $request->setRouteResolver(function () use ($user2) {
            $route = new \Illuminate\Routing\Route('GET', 'admin/users/{user}/posts', []);
            $route->parameters = ['user' => $user2];
            return $route;
        });

        $this->middleware->handle($request, fn () => new Response('ok'));
    }

    public function test_member_accessing_different_user_id_scalar_route_param_aborts_403(): void
    {
        $this->expectException(HttpException::class);

        $user1 = User::factory()->member()->create();

        $request = Request::create('/admin/users/999/posts');
        $request->setUserResolver(fn () => $user1);
        $request->setRouteResolver(function () {
            $route = new \Illuminate\Routing\Route('GET', 'admin/users/{user}/posts', []);
            $route->parameters = ['user' => 999];
            return $route;
        });

        $this->middleware->handle($request, fn () => new Response('ok'));
    }

    public function test_member_accessing_other_post_aborts_403(): void
    {
        $this->expectException(HttpException::class);

        $member = User::factory()->member()->create();
        $otherPost = Post::factory()->create();

        $request = Request::create("/dashboard/posts/{$otherPost->id}");
        $request->setUserResolver(fn () => $member);
        $request->setRouteResolver(function () use ($otherPost) {
            $route = new \Illuminate\Routing\Route('GET', 'dashboard/posts/{post}', []);
            $route->parameters = ['post' => $otherPost];
            return $route;
        });

        $this->middleware->handle($request, fn () => new Response('ok'));
    }

    public function test_scalar_post_id_resolves_and_checks_ownership(): void
    {
        $this->expectException(HttpException::class);

        $member = User::factory()->member()->create();
        $otherPost = Post::factory()->create();

        $request = Request::create("/dashboard/posts/{$otherPost->id}");
        $request->setUserResolver(fn () => $member);
        $request->setRouteResolver(function () use ($otherPost) {
            $route = new \Illuminate\Routing\Route('GET', 'dashboard/posts/{post}', []);
            $route->parameters = ['post' => $otherPost->id];
            return $route;
        });

        $this->middleware->handle($request, fn () => new Response('ok'));
    }

    public function test_unsafe_method_on_other_users_post_aborts_403_even_for_admin(): void
    {
        $this->expectException(HttpException::class);

        $admin = User::factory()->admin()->create();
        $otherPost = Post::factory()->create();

        $request = Request::create("/dashboard/posts/{$otherPost->id}", 'DELETE');
        $request->setUserResolver(fn () => $admin);
        $request->setRouteResolver(function () use ($otherPost) {
            $route = new \Illuminate\Routing\Route('DELETE', 'dashboard/posts/{post}', []);
            $route->parameters = ['post' => $otherPost];
            return $route;
        });

        $this->middleware->handle($request, fn () => new Response('ok'));
    }

    public function test_owner_accessing_own_post_passes(): void
    {
        $user = User::factory()->member()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $request = Request::create("/dashboard/posts/{$post->id}");
        $request->setUserResolver(fn () => $user);
        $request->setRouteResolver(function () use ($post) {
            $route = new \Illuminate\Routing\Route('GET', 'dashboard/posts/{post}', []);
            $route->parameters = ['post' => $post];
            return $route;
        });

        $response = $this->middleware->handle($request, fn () => new Response('passed'));
        $this->assertSame('passed', $response->getContent());
    }

    public function test_member_accessing_own_user_route_param_passes(): void
    {
        $user = User::factory()->member()->create();

        $request = Request::create("/admin/users/{$user->id}/posts");
        $request->setUserResolver(fn () => $user);
        $request->setRouteResolver(function () use ($user) {
            $route = new \Illuminate\Routing\Route('GET', 'admin/users/{user}/posts', []);
            $route->parameters = ['user' => $user];
            return $route;
        });

        $response = $this->middleware->handle($request, fn () => new Response('passed'));
        $this->assertSame('passed', $response->getContent());
    }

    public function test_non_existent_post_id_passes_ownership_middleware(): void
    {
        $user = User::factory()->member()->create();

        $request = Request::create('/dashboard/posts/999999');
        $request->setUserResolver(fn () => $user);
        $request->setRouteResolver(function () {
            $route = new \Illuminate\Routing\Route('GET', 'dashboard/posts/{post}', []);
            $route->parameters = ['post' => 999999];
            return $route;
        });

        $response = $this->middleware->handle($request, fn () => new Response('passed'));
        $this->assertSame('passed', $response->getContent());
    }

    public function test_owner_performing_unsafe_method_passes(): void
    {
        $user = User::factory()->member()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $request = Request::create("/dashboard/posts/{$post->id}", 'DELETE');
        $request->setUserResolver(fn () => $user);
        $request->setRouteResolver(function () use ($post) {
            $route = new \Illuminate\Routing\Route('DELETE', 'dashboard/posts/{post}', []);
            $route->parameters = ['post' => $post];
            return $route;
        });

        $response = $this->middleware->handle($request, fn () => new Response('passed'));
        $this->assertSame('passed', $response->getContent());
    }
}
