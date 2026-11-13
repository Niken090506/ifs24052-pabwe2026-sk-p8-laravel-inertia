<?php

namespace App\Features\Ai\Services;

use App\Features\Ai\Contracts\AiClientInterface;
use App\Features\Ai\DTO\GeneratedPostItem;
use App\Features\Post\Enums\PostCategory;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAiPostGeneratorService implements AiClientInterface
{
    protected string $endpoint;
    protected string $apiKey;
    protected string $model;

    public function __construct(
        ?string $endpoint = null,
        ?string $apiKey = null,
        ?string $model = null,
    ) {
        $resolvedEndpoint = (string) ($endpoint ?? config('openai.endpoint', 'https://api.openai.com/v1'));
        $resolvedKey = (string) ($apiKey ?? config('openai.key', ''));

        // Toleransi jika nilai OPENAI_ENDPOINT dan OPENAI_KEY tertukar di .env
        if ((str_starts_with($resolvedKey, 'http://') || str_starts_with($resolvedKey, 'https://')) &&
            (!str_starts_with($resolvedEndpoint, 'http://') && !str_starts_with($resolvedEndpoint, 'https://'))) {
            $temp = $resolvedEndpoint;
            $resolvedEndpoint = $resolvedKey;
            $resolvedKey = $temp;
        }

        // Pastikan scheme http:// atau https:// selalu ada
        if (!empty($resolvedEndpoint) && !str_starts_with($resolvedEndpoint, 'http://') && !str_starts_with($resolvedEndpoint, 'https://')) {
            $resolvedEndpoint = 'https://'.$resolvedEndpoint;
        }

        $this->endpoint = rtrim($resolvedEndpoint, '/');
        $this->apiKey = $resolvedKey;
        $this->model = $model ?? (string) config('openai.model', 'gpt-4o-mini');
    }

    /**
     * Generate multiple structured post items based on a user prompt.
     *
     * @return array<int, GeneratedPostItem>
     *
     * @throws RuntimeException
     */
    public function generatePosts(string $prompt, int $count = 3): array
    {
        $prompt = trim($prompt);
        if ($prompt === '') {
            throw new RuntimeException('Prompt tidak boleh kosong.');
        }

        $count = max(1, $count);
        $categoriesList = implode(', ', PostCategory::values());

        $systemPrompt = <<<SYS
You are an expert editorial writer for a modern blog platform called BlogVerse Pro.
Your task is to generate exactly {$count} realistic, engaging, and well-structured blog articles based on the user's request.

Available categories are strictly one of: {$categoriesList}.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "posts": [
    {
      "title": "Engaging article headline (max 100 chars)",
      "category": "One of: {$categoriesList}",
      "excerpt": "Catchy 1-2 sentence preview hook (max 200 chars)",
      "content": "Comprehensive markdown content formatted with headings, bullet points, and paragraphs"
    }
  ]
}

Do not include any conversational text, introductory words, or explanations outside the JSON.
SYS;

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiKey}",
            'Content-Type' => 'application/json',
        ])->timeout(30)->post("{$this->endpoint}/chat/completions", [
            'model' => $this->model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.7,
        ]);

        if (!$response->successful()) {
            $errorMessage = $response->json('error.message') ?? "Request failed with status code {$response->status()}";
            throw new RuntimeException("OpenAI API Error: {$errorMessage}");
        }

        $rawContent = (string) $response->json('choices.0.message.content');

        return $this->parseContent($rawContent);
    }

    /**
     * Parse raw string content into an array of GeneratedPostItem.
     *
     * @return array<int, GeneratedPostItem>
     */
    public function parseContent(string $rawContent): array
    {
        $cleanContent = trim($rawContent);

        // Remove Markdown code fences if present
        if (str_starts_with($cleanContent, '```')) {
            $cleanContent = preg_replace('/^```(?:json)?\s*/i', '', $cleanContent);
            $cleanContent = preg_replace('/\s*```$/', '', $cleanContent);
            $cleanContent = trim((string) $cleanContent);
        }

        $decoded = json_decode($cleanContent, true);

        if (!is_array($decoded)) {
            throw new RuntimeException('AI mengembalikan format respon yang tidak valid.');
        }

        // Support both {"posts": [...]} and [...]
        $items = isset($decoded['posts']) && is_array($decoded['posts'])
            ? $decoded['posts']
            : (array_is_list($decoded) ? $decoded : []);

        if (empty($items)) {
            throw new RuntimeException('Tidak ada artikel yang berhasil di-generate dari AI.');
        }

        $validCategories = PostCategory::values();
        $results = [];

        foreach ($items as $item) {
            if (!is_array($item) || empty($item['title'])) {
                continue;
            }

            $title = trim((string) $item['title']);
            $catRaw = isset($item['category']) ? trim((string) $item['category']) : PostCategory::UMUM->value;
            $category = in_array($catRaw, $validCategories, true) ? $catRaw : PostCategory::UMUM->value;

            $excerpt = isset($item['excerpt']) && trim((string) $item['excerpt']) !== ''
                ? trim((string) $item['excerpt'])
                : null;

            $content = isset($item['content']) && trim((string) $item['content']) !== ''
                ? trim((string) $item['content'])
                : "# {$title}\n\nKonten artikel dihasilkan oleh AI.";

            $results[] = new GeneratedPostItem(
                title: $title,
                category: $category,
                excerpt: $excerpt,
                content: $content,
                isPublished: false,
            );
        }

        if (empty($results)) {
            throw new RuntimeException('Format item artikel yang dikembalikan AI tidak sesuai spesifikasi.');
        }

        return $results;
    }
}

