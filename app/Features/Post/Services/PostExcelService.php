<?php

namespace App\Features\Post\Services;

use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Enums\PostCategory;
use App\Features\Post\Models\Post;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PostExcelService
{
    public function __construct(
        protected PostRepositoryInterface $postRepository
    ) {}

    /**
     * Build a Spreadsheet instance containing posts data.
     *
     * @param  Collection<int, Post>  $posts
     */
    public function buildSpreadsheet(Collection $posts, string $sheetTitle = 'Articles'): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(substr($sheetTitle, 0, 31));

        $headers = ['No', 'Title', 'Category', 'Excerpt', 'Content', 'Status', 'Author', 'Published At', 'Created At'];
        $columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

        foreach ($headers as $index => $header) {
            $sheet->setCellValue("{$columns[$index]}1", $header);
        }

        // Header Styling
        $headerRange = 'A1:I1';
        $sheet->getStyle($headerRange)->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($headerRange)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('2563EB');
        $sheet->getStyle($headerRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $rowNumber = 2;
        foreach ($posts as $idx => $post) {
            $sheet->setCellValue("A{$rowNumber}", $idx + 1);
            $sheet->setCellValue("B{$rowNumber}", $post->title);
            $sheet->setCellValue("C{$rowNumber}", $post->category);
            $sheet->setCellValue("D{$rowNumber}", $post->excerpt ?? '-');
            $sheet->setCellValue("E{$rowNumber}", $post->content);
            $sheet->setCellValue("F{$rowNumber}", $post->is_published ? 'Published' : 'Draft');
            $sheet->setCellValue("G{$rowNumber}", $post->user ? $post->user->name : '-');
            $sheet->setCellValue("H{$rowNumber}", $post->published_at ? $post->published_at->format('Y-m-d H:i') : '-');
            $sheet->setCellValue("I{$rowNumber}", $post->created_at ? $post->created_at->format('Y-m-d H:i') : '-');
            $rowNumber++;
        }

        $lastRow = max(2, $rowNumber - 1);
        $sheet->getStyle("A1:I{$lastRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        foreach ($columns as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        return $spreadsheet;
    }

    /**
     * Export posts as a downloadable streamed response.
     *
     * @param  Collection<int, Post>  $posts
     */
    public function exportToResponse(Collection $posts, string $filename = 'articles.xlsx'): StreamedResponse
    {
        $spreadsheet = $this->buildSpreadsheet($posts);

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Import posts from an uploaded spreadsheet file path.
     *
     * @return array{imported: int, errors: array<int, string>}
     */
    public function import(string $filePath, int $userId): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);

        $imported = 0;
        $errors = [];
        $recordsToInsert = [];
        $now = Carbon::now();

        $isFirst = true;
        $rowIndex = 1;

        $validCategories = PostCategory::values();

        foreach ($rows as $row) {
            if ($isFirst) {
                $isFirst = false;
                $rowIndex++;
                continue;
            }

            $title = isset($row['B']) && trim((string) $row['B']) !== '' ? trim((string) $row['B']) : (isset($row['A']) ? trim((string) $row['A']) : '');
            $categoryRaw = isset($row['C']) ? trim((string) $row['C']) : PostCategory::UMUM->value;
            $excerpt = isset($row['D']) ? trim((string) $row['D']) : null;
            $content = isset($row['E']) ? trim((string) $row['E']) : '';
            $statusRaw = isset($row['F']) ? strtolower(trim((string) $row['F'])) : 'draft';

            // Skip header if repeated
            if ($title === '' || strtolower($title) === 'no' || strtolower($title) === 'title') {
                $rowIndex++;
                continue;
            }

            $category = in_array($categoryRaw, $validCategories, true) ? $categoryRaw : PostCategory::UMUM->value;
            $isPublished = in_array($statusRaw, ['published', 'publikasi', '1', 'true'], true);

            $baseSlug = Str::slug($title);
            if (empty($baseSlug)) {
                $baseSlug = 'artikel';
            }
            $slug = $baseSlug.'-'.uniqid();

            $recordsToInsert[] = [
                'user_id' => $userId,
                'title' => substr($title, 0, 255),
                'slug' => $slug,
                'category' => $category,
                'excerpt' => $excerpt === '-' ? null : $excerpt,
                'content' => $content === '-' ? '' : $content,
                'cover_image_path' => null,
                'is_published' => $isPublished,
                'published_at' => $isPublished ? $now : null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            $imported++;
            $rowIndex++;
        }

        if (!empty($recordsToInsert)) {
            $this->postRepository->insertMany($recordsToInsert);
        }

        return [
            'imported' => $imported,
            'errors' => $errors,
        ];
    }
}

