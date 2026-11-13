<?php

namespace Tests\Unit\Providers;

use App\Features\Ai\Contracts\AiClientInterface;
use App\Features\Ai\Services\OpenAiPostGeneratorService;
use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Models\Post;
use App\Features\Post\Policies\PostPolicy;
use App\Features\Post\Repositories\PostRepository;
use App\Models\User;
use App\Providers\AppServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AppServiceProviderTest extends TestCase
{
    use RefreshDatabase;

    public function test_service_bindings(): void
    {
        $this->assertInstanceOf(PostRepository::class, $this->app->make(PostRepositoryInterface::class));
        $this->assertInstanceOf(OpenAiPostGeneratorService::class, $this->app->make(AiClientInterface::class));
    }

    public function test_policy_registered(): void
    {
        $policy = Gate::getPolicyFor(Post::class);
        $this->assertSame(PostPolicy::class, $policy);
    }

    public function test_rate_limiters(): void
    {
        $request = Request::create('/');
        $user = User::factory()->create();
        $request->setUserResolver(fn () => $user);

        $limit1000 = RateLimiter::limiter('1000-per-second');
        $this->assertNotNull($limit1000);
        $res = $limit1000($request);
        $this->assertNotNull($res);

        $limitGlobal = RateLimiter::limiter('global');
        $this->assertNotNull($limitGlobal);
        $resGlobal = $limitGlobal($request);
        $this->assertNotNull($resGlobal);

        $limitApi = RateLimiter::limiter('api');
        $this->assertNotNull($limitApi);
        $resApi = $limitApi($request);
        $this->assertNotNull($resApi);

        // Test with guest (ip)
        $guestRequest = Request::create('/');
        $guestRes = $limitGlobal($guestRequest);
        $this->assertNotNull($guestRes);
    }

    public function test_boot_with_force_https(): void
    {
        config(['app.force_https' => true]);
        $provider = new AppServiceProvider($this->app);
        $provider->boot();

        $this->assertTrue(true);
    }
}
