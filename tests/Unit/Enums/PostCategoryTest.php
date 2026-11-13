<?php

namespace Tests\Unit\Enums;

use App\Features\Post\Enums\PostCategory;
use PHPUnit\Framework\TestCase;

class PostCategoryTest extends TestCase
{
    public function test_post_category_labels_and_values(): void
    {
        $this->assertSame('Teknologi & Koding', PostCategory::TEKNOLOGI->label());
        $this->assertSame('Pendidikan & Tutorial', PostCategory::PENDIDIKAN->label());
        $this->assertSame('Gaya Hidup & Produktivitas', PostCategory::GAYA_HIDUP->label());
        $this->assertSame('Bisnis & Karir', PostCategory::BISNIS->label());
        $this->assertSame('Opini & Pemikiran', PostCategory::OPINI->label());
        $this->assertSame('Umum', PostCategory::UMUM->label());

        $values = PostCategory::values();
        $this->assertContains('Teknologi', $values);
        $this->assertContains('Pendidikan', $values);
        $this->assertContains('Gaya Hidup', $values);
        $this->assertContains('Bisnis', $values);
        $this->assertContains('Opini', $values);
        $this->assertContains('Umum', $values);

        $options = PostCategory::options();
        $this->assertCount(6, $options);
        $this->assertSame(['value' => 'Teknologi', 'label' => 'Teknologi & Koding'], $options[0]);
    }
}
