<?php

namespace Tests\Unit\Providers;

use App\Features\Ai\Contracts\AiClientInterface;
use App\Features\Ai\Services\OpenAiPostGeneratorService;
use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Repositories\PostRepository;
use App\Models\User;
use App\Providers\AppServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AppServiceProviderTest extends TestCase
{
    public function test_service_bindings_and_register(): void
    {
        $provider = new AppServiceProvider($this->app);
        $provider->register();

        $repo = app(PostRepositoryInterface::class);
        $this->assertInstanceOf(PostRepository::class, $repo);

        $ai = app(AiClientInterface::class);
        $this->assertInstanceOf(OpenAiPostGeneratorService::class, $ai);
    }

    public function test_force_https_configuration(): void
    {
        config(['app.force_https' => true]);

        $provider = new AppServiceProvider($this->app);
        $provider->boot();

        $generated = URL::to('/test');
        $this->assertStringStartsWith('https://', $generated);

        // Reset
        config(['app.force_https' => false]);
    }

    public function test_boot_in_production_environment(): void
    {
        config(['app.force_https' => false]);
        $origEnv = $this->app['env'];
        $this->app['env'] = 'production';

        $provider = new AppServiceProvider($this->app);
        $provider->boot();

        $this->assertStringStartsWith('https://', URL::to('/test'));

        // Reset
        $this->app['env'] = $origEnv;
    }

    public function test_rate_limiters(): void
    {
        $guestRequest = Request::create('/test', 'GET');

        $user = new User();
        $user->id = 42;
        $authRequest = Request::create('/test', 'GET');
        $authRequest->setUserResolver(fn () => $user);

        foreach (['1000-per-second', 'global', 'api'] as $limiterName) {
            $limiter = RateLimiter::limiter($limiterName);
            $this->assertNotNull($limiter);

            // Test guest branch (falls back to IP)
            $guestResult = $limiter($guestRequest);
            $this->assertEquals(1000, $guestResult->maxAttempts);

            // Test authenticated user branch (uses user ID)
            $authResult = $limiter($authRequest);
            $this->assertEquals(1000, $authResult->maxAttempts);
        }
    }
}
