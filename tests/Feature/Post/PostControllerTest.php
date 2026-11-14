<?php

namespace Tests\Feature\Post;

use App\Features\Ai\Contracts\AiClientInterface;
use App\Features\Ai\DTO\GeneratedPostItem;
use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_guest_cannot_access_dashboard_posts(): void
    {
        $this->get('/dashboard/posts')->assertRedirect('/login');
    }

    public function test_index_renders_posts_and_stats_for_member(): void
    {
        $user = User::factory()->member()->create();
        Post::factory()->count(2)->published()->create(['user_id' => $user->id]);
        Post::factory()->draft()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get('/dashboard/posts')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Post/Index')
                ->has('posts.data', 3)
                ->where('stats.total', 3)
                ->where('stats.published', 2)
                ->where('stats.draft', 1)
                ->has('categories')
            );

        // Test with filters
        $this->actingAs($user)
            ->get('/dashboard/posts?search=Test&category=Teknologi&status=published')
            ->assertStatus(200);

        $this->actingAs($user)
            ->get('/dashboard/posts?status=draft')
            ->assertStatus(200);
    }

    public function test_store_validation_and_creation(): void
    {
        $user = User::factory()->member()->create();

        // Validation fail
        $this->actingAs($user)
            ->post('/dashboard/posts', [
                'title' => '',
                'category' => 'InvalidCategory',
                'content' => '',
            ])
            ->assertSessionHasErrors(['title', 'category', 'content']);

        // Success
        $this->actingAs($user)
            ->post('/dashboard/posts', [
                'title' => 'Title Post Baru',
                'category' => 'Teknologi',
                'excerpt' => 'Kutipan singkat',
                'content' => '# Konten Lengkap Markdown',
                'is_published' => true,
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('posts', [
            'user_id' => $user->id,
            'title' => 'Title Post Baru',
            'is_published' => true,
        ]);
    }

    public function test_show_renders_post_detail(): void
    {
        $user = User::factory()->member()->create();
        $post = Post::factory()->published()->create([
            'user_id' => $user->id,
            'title' => 'Detail Artikel Test',
        ]);

        $this->actingAs($user)
            ->get("/dashboard/posts/{$post->id}")
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Post/Show')
                ->where('post.id', $post->id)
                ->where('post.title', 'Detail Artikel Test')
                ->where('post.author.id', $user->id)
            );
    }

    public function test_update_validation_and_success(): void
    {
        $user = User::factory()->member()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->put("/dashboard/posts/{$post->id}", [
                'title' => '',
                'category' => 'Invalid',
                'content' => '',
            ])
            ->assertSessionHasErrors(['title', 'category', 'content']);

        $this->actingAs($user)
            ->put("/dashboard/posts/{$post->id}", [
                'title' => 'Judul Baru Diperbarui',
                'category' => 'Bisnis',
                'excerpt' => 'Excerpt baru',
                'content' => 'Konten baru diperbarui',
                'is_published' => true,
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        $fresh = $post->fresh();
        $this->assertSame('Judul Baru Diperbarui', $fresh->title);
        $this->assertSame('Bisnis', $fresh->category);
        $this->assertTrue($fresh->is_published);
    }

    public function test_destroy_post(): void
    {
        $user = User::factory()->member()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->delete("/dashboard/posts/{$post->id}")
            ->assertRedirect(route('dashboard.posts.index'))
            ->assertSessionHas('success');

        $this->assertNull(Post::find($post->id));
    }

    public function test_toggle_publish(): void
    {
        $user = User::factory()->member()->create();
        $post = Post::factory()->draft()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->patch("/dashboard/posts/{$post->id}/publish")
            ->assertSessionHas('success', 'Artikel berhasil dipublikasikan.');

        $this->assertTrue($post->fresh()->is_published);

        $this->actingAs($user)
            ->patch("/dashboard/posts/{$post->id}/publish")
            ->assertSessionHas('success', 'Artikel diubah menjadi draf.');

        $this->assertFalse($post->fresh()->is_published);
    }

    public function test_update_and_delete_cover(): void
    {
        $user = User::factory()->member()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->image('cover.png', 800, 600);

        $this->actingAs($user)
            ->post("/dashboard/posts/{$post->id}/cover", ['cover' => $file])
            ->assertSessionHas('success');

        $this->assertNotNull($post->fresh()->cover_image_path);

        $this->actingAs($user)
            ->delete("/dashboard/posts/{$post->id}/cover")
            ->assertSessionHas('success');

        $this->assertNull($post->fresh()->cover_image_path);
    }

    public function test_export_and_import_excel(): void
    {
        $user = User::factory()->member()->create();
        Post::factory()->count(2)->create(['user_id' => $user->id]);

        // Export
        $exportResponse = $this->actingAs($user)->get('/dashboard/posts/export');
        $exportResponse->assertStatus(200);
        $this->assertNotEmpty($exportResponse->streamedContent());

        // Import
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['No', 'Title', 'Category', 'Excerpt', 'Content', 'Status'],
            [1, 'Imported from Test', 'Teknologi', 'Excerpt', 'Content', 'Published'],
        ]);

        $tempPath = tempnam(sys_get_temp_dir(), 'test_import') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        $file = new UploadedFile($tempPath, 'test_import.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);

        $this->actingAs($user)
            ->post('/dashboard/posts/import', ['importFile' => $file])
            ->assertSessionHas('success');

        @unlink($tempPath);

        // Import with no file returns error
        $this->actingAs($user)
            ->post('/dashboard/posts/import')
            ->assertSessionHas('error');
    }

    public function test_generate_ai(): void
    {
        $user = User::factory()->member()->create();

        $mockAi = $this->createMock(AiClientInterface::class);
        $mockAi->method('generatePosts')->willReturn([
            new GeneratedPostItem('AI Title', 'Teknologi', 'Excerpt', '# Content'),
        ]);
        $this->app->instance(AiClientInterface::class, $mockAi);

        // Empty prompt -> 422
        $this->actingAs($user)
            ->postJson('/dashboard/posts/ai-generate', ['prompt' => ''])
            ->assertStatus(422);

        // Invalid count (< 1 or > 10) -> 422
        $this->actingAs($user)
            ->postJson('/dashboard/posts/ai-generate', ['prompt' => 'Topic', 'count' => 0])
            ->assertStatus(422);

        $this->actingAs($user)
            ->postJson('/dashboard/posts/ai-generate', ['prompt' => 'Topic', 'count' => 11])
            ->assertStatus(422);

        // Success with standard params
        $response = $this->actingAs($user)
            ->postJson('/dashboard/posts/ai-generate', [
                'prompt' => 'Kecerdasan Buatan',
                'count' => 1,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'posts' => [
                    ['title' => 'AI Title', 'category' => 'Teknologi'],
                ],
            ]);

        // Success with alternate param names aiPrompt and aiCount
        $responseAlt = $this->actingAs($user)
            ->postJson('/dashboard/posts/ai-generate', [
                'aiPrompt' => 'Kecerdasan Buatan Alt',
                'aiCount' => 2,
            ]);
        $responseAlt->assertStatus(200);
    }

    public function test_generate_ai_exception_handling(): void
    {
        $user = User::factory()->member()->create();

        $mockAi = $this->createMock(AiClientInterface::class);
        $mockAi->method('generatePosts')->willThrowException(new \RuntimeException('AI Service Error'));
        $this->app->instance(AiClientInterface::class, $mockAi);

        $this->actingAs($user)
            ->postJson('/dashboard/posts/ai-generate', [
                'prompt' => 'Test Topic',
                'count' => 3,
            ])
            ->assertStatus(500)
            ->assertJson([
                'success' => false,
                'message' => 'AI Service Error',
            ]);
    }

    public function test_save_ai(): void
    {
        $user = User::factory()->member()->create();

        // Empty items -> error
        $this->actingAs($user)
            ->post('/dashboard/posts/ai-save', ['items' => []])
            ->assertSessionHas('error');

        // Non-array input -> error
        $this->actingAs($user)
            ->post('/dashboard/posts/ai-save', ['items' => 'not-an-array'])
            ->assertSessionHas('error');

        // Valid items -> success
        $this->actingAs($user)
            ->post('/dashboard/posts/ai-save', [
                'items' => [
                    [
                        'title' => 'Saved AI Post 1',
                        'category' => 'Pendidikan',
                        'content' => 'Content from AI',
                    ],
                ],
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('posts', [
            'user_id' => $user->id,
            'title' => 'Saved AI Post 1',
        ]);

        // Valid with alternate param name 'posts'
        $this->actingAs($user)
            ->post('/dashboard/posts/ai-save', [
                'posts' => [
                    [
                        'title' => 'Saved AI Post from posts param',
                        'category' => 'Bisnis',
                        'content' => 'Content from AI',
                    ],
                ],
            ])
            ->assertSessionHas('success');
    }
}
