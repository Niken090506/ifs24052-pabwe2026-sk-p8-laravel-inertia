<?php

namespace Tests\Unit\Services;

use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Models\Post;
use App\Features\Post\Services\PostExcelService;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Tests\TestCase;

class PostExcelServiceTest extends TestCase
{
    use RefreshDatabase;

    private PostExcelService $service;
    private PostRepositoryInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = $this->app->make(PostRepositoryInterface::class);
        $this->service = new PostExcelService($this->repository);
    }

    public function test_build_spreadsheet_and_export_response(): void
    {
        $user = User::factory()->create(['name' => 'Jane Doe']);
        $post = Post::factory()->published()->create([
            'user_id' => $user->id,
            'title' => 'Sample Article',
            'category' => 'Teknologi',
            'excerpt' => 'An excerpt',
            'content' => 'Article content',
        ]);

        $posts = new Collection([$post]);
        $spreadsheet = $this->service->buildSpreadsheet($posts, 'My Sheet');

        $this->assertInstanceOf(Spreadsheet::class, $spreadsheet);
        $sheet = $spreadsheet->getActiveSheet();
        $this->assertSame('My Sheet', $sheet->getTitle());
        $this->assertSame('No', $sheet->getCell('A1')->getValue());
        $this->assertSame('Sample Article', $sheet->getCell('B2')->getValue());
        $this->assertSame('Published', $sheet->getCell('F2')->getValue());
        $this->assertSame('Jane Doe', $sheet->getCell('G2')->getValue());

        $response = $this->service->exportToResponse($posts, 'test.xlsx');
        $this->assertInstanceOf(StreamedResponse::class, $response);
        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_build_spreadsheet_with_empty_and_draft_posts(): void
    {
        $post = Post::factory()->draft()->make([
            'user_id' => null,
            'excerpt' => null,
            'published_at' => null,
        ]);

        $spreadsheet = $this->service->buildSpreadsheet(new Collection([$post]));
        $sheet = $spreadsheet->getActiveSheet();
        $this->assertSame('-', $sheet->getCell('D2')->getValue());
        $this->assertSame('Draft', $sheet->getCell('F2')->getValue());
        $this->assertSame('-', $sheet->getCell('G2')->getValue());
        $this->assertSame('-', $sheet->getCell('H2')->getValue());
    }

    public function test_import_from_excel_file(): void
    {
        $user = User::factory()->create();

        // Create temporary spreadsheet file
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['No', 'Title', 'Category', 'Excerpt', 'Content', 'Status'],
            [1, 'Excel Imported Post 1', 'Bisnis', 'Excerpt 1', 'Content 1', 'Published'],
            [2, 'Excel Imported Post 2', 'InvalidCategory', '-', '-', 'draft'],
            ['Article from Col A', '', 'Umum', '-', '-', 'draft'],
            ['No', 'Title', 'Header Repeated', '', '', ''],
        ]);

        $tempPath = tempnam(sys_get_temp_dir(), 'test_import') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        $result = $this->service->import($tempPath, $user->id);
        @unlink($tempPath);

        $this->assertSame(3, $result['imported']);
        $this->assertEmpty($result['errors']);

        $importedPosts = Post::where('user_id', $user->id)->get();
        $this->assertCount(3, $importedPosts);

        $post1 = $importedPosts->firstWhere('title', 'Excel Imported Post 1');
        $this->assertNotNull($post1);
        $this->assertSame('Bisnis', $post1->category);
        $this->assertTrue($post1->is_published);

        $post2 = $importedPosts->firstWhere('title', 'Excel Imported Post 2');
        $this->assertNotNull($post2);
        $this->assertSame('Umum', $post2->category); // Fallback category
        $this->assertFalse($post2->is_published);
        $this->assertNull($post2->excerpt);
        $this->assertSame('', $post2->content);
    }
}
