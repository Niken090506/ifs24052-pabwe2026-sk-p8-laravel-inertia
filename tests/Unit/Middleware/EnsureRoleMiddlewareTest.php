<?php

namespace Tests\Unit\Middleware;

use App\Http\Middleware\EnsureRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class EnsureRoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private EnsureRole $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new EnsureRole();
    }

    public function test_aborts_when_user_is_guest(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(403);

        $request = Request::create('/admin/users');
        $this->middleware->handle($request, fn () => response('ok'), 'admin');
    }

    public function test_aborts_when_role_does_not_match(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(403);

        $user = User::factory()->member()->create();
        $request = Request::create('/admin/users');
        $request->setUserResolver(fn () => $user);

        $this->middleware->handle($request, fn () => response('ok'), 'admin');
    }

    public function test_passes_when_role_matches(): void
    {
        $user = User::factory()->admin()->create();
        $request = Request::create('/admin/users');
        $request->setUserResolver(fn () => $user);

        $response = $this->middleware->handle($request, fn () => response('passed'), 'admin');
        $this->assertSame('passed', $response->getContent());
    }
}
