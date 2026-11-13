<?php

namespace App\Features\Ai\DTO;

class GeneratedPostItem
{
    public function __construct(
        public string $title,
        public string $category,
        public ?string $excerpt,
        public string $content,
        public bool $isPublished = false,
    ) {}

    /**
     * @return array{title: string, category: string, excerpt: ?string, content: string, is_published: bool}
     */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'category' => $this->category,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'is_published' => $this->isPublished,
        ];
    }
}

