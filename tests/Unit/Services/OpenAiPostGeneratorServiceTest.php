<?php

namespace Tests\Unit\Services;

use App\Features\Ai\Services\OpenAiPostGeneratorService;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class OpenAiPostGeneratorServiceTest extends TestCase
{
    public function test_empty_prompt_throws_exception(): void
    {
        $service = new OpenAiPostGeneratorService('https://api.openai.com/v1', 'mock-key', 'gpt-4o-mini');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Prompt tidak boleh kosong.');
        $service->generatePosts('   ');
    }

    public function test_successful_generation(): void
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'posts' => [
                                    [
                                        'title' => 'Artikel 1',
                                        'category' => 'Teknologi',
                                        'excerpt' => 'Deskripsi 1',
                                        'content' => '# Content 1',
                                    ],
                                    [
                                        'title' => 'Artikel 2',
                                        'category' => 'InvalidCategory',
                                        'excerpt' => '',
                                        'content' => '',
                                    ],
                                ],
                            ]),
                        ],
                    ],
                ],
            ], 200),
        ]);

        $service = new OpenAiPostGeneratorService('https://api.openai.com/v1', 'mock-key', 'gpt-4o-mini');
        $results = $service->generatePosts('Buatkan 2 artikel', 2);

        $this->assertCount(2, $results);
        $this->assertSame('Artikel 1', $results[0]->title);
        $this->assertSame('Teknologi', $results[0]->category);
        $this->assertSame('Deskripsi 1', $results[0]->excerpt);
        $this->assertSame('# Content 1', $results[0]->content);
        $this->assertFalse($results[0]->isPublished);

        $this->assertSame('Artikel 2', $results[1]->title);
        $this->assertSame('Umum', $results[1]->category); // Fallback category
        $this->assertNull($results[1]->excerpt);
        $this->assertStringContainsString('Artikel 2', $results[1]->content);
    }

    public function test_api_failure_throws_exception(): void
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'error' => [
                    'message' => 'Invalid API Key provided',
                ],
            ], 401),
        ]);

        $service = new OpenAiPostGeneratorService('https://api.openai.com/v1', 'mock-key', 'gpt-4o-mini');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('OpenAI API Error: Invalid API Key provided');
        $service->generatePosts('Ide artikel teknologi');
    }

    public function test_api_failure_without_json_message(): void
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response('Server Error', 500),
        ]);

        $service = new OpenAiPostGeneratorService('https://api.openai.com/v1', 'mock-key', 'gpt-4o-mini');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('OpenAI API Error: Request failed with status code 500');
        $service->generatePosts('Ide artikel teknologi');
    }

    public function test_parse_content_with_markdown_fences(): void
    {
        $service = new OpenAiPostGeneratorService('https://api.openai.com/v1', 'mock-key', 'gpt-4o-mini');
        $raw = "```json\n[{\"title\": \"Code Fence Article\", \"category\": \"Bisnis\"}]\n```";

        $results = $service->parseContent($raw);
        $this->assertCount(1, $results);
        $this->assertSame('Code Fence Article', $results[0]->title);
    }

    public function test_parse_content_invalid_json(): void
    {
        $service = new OpenAiPostGeneratorService('https://api.openai.com/v1', 'mock-key', 'gpt-4o-mini');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('AI mengembalikan format respon yang tidak valid.');
        $service->parseContent('Not valid JSON');
    }

    public function test_parse_content_empty_posts(): void
    {
        $service = new OpenAiPostGeneratorService('https://api.openai.com/v1', 'mock-key', 'gpt-4o-mini');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Tidak ada artikel yang berhasil di-generate dari AI.');
        $service->parseContent('{"posts": []}');
    }

    public function test_parse_content_no_valid_items(): void
    {
        $service = new OpenAiPostGeneratorService('https://api.openai.com/v1', 'mock-key', 'gpt-4o-mini');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Format item artikel yang dikembalikan AI tidak sesuai spesifikasi.');
        $service->parseContent('{"posts": [{"invalid_key": "val"}]}');
    }

    public function test_constructor_handles_swapped_endpoint_and_key(): void
    {
        Http::fake([
            'https://ai.example.com/v1/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => '{"posts":[{"title":"Artikel"}]}']]],
            ]),
        ]);

        $service = new OpenAiPostGeneratorService('sk-secret-key', 'https://ai.example.com/v1');
        $posts = $service->generatePosts('Rencana');
        $this->assertCount(1, $posts);
    }

    public function test_constructor_auto_prefixes_https(): void
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => '{"posts":[{"title":"Artikel"}]}']]],
            ]),
        ]);

        $service = new OpenAiPostGeneratorService('api.openai.com/v1', 'mock-key');
        $posts = $service->generatePosts('Rencana');
        $this->assertCount(1, $posts);
    }
}
