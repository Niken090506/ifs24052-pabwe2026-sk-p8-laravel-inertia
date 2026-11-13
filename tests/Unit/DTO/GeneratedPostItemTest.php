<?php

namespace Tests\Unit\DTO;

use App\Features\Ai\DTO\GeneratedPostItem;
use PHPUnit\Framework\TestCase;

class GeneratedPostItemTest extends TestCase
{
    public function test_generated_post_item_properties_and_to_array(): void
    {
        $dto = new GeneratedPostItem(
            title: 'Test Post Title',
            category: 'Teknologi',
            excerpt: 'Brief summary',
            content: '# Main content',
            isPublished: true,
        );

        $this->assertSame('Test Post Title', $dto->title);
        $this->assertSame('Teknologi', $dto->category);
        $this->assertSame('Brief summary', $dto->excerpt);
        $this->assertSame('# Main content', $dto->content);
        $this->assertTrue($dto->isPublished);

        $array = $dto->toArray();

        $this->assertSame([
            'title' => 'Test Post Title',
            'category' => 'Teknologi',
            'excerpt' => 'Brief summary',
            'content' => '# Main content',
            'is_published' => true,
        ], $array);
    }

    public function test_default_is_published_is_false(): void
    {
        $dto = new GeneratedPostItem(
            title: 'Draft Title',
            category: 'Bisnis',
            excerpt: null,
            content: 'Draft content',
        );

        $this->assertFalse($dto->isPublished);
        $this->assertNull($dto->excerpt);
    }
}
