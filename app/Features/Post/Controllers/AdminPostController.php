<?php

namespace App\Features\Post\Controllers;

use App\Features\Admin\Services\AdminUserService;
use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Enums\PostCategory;
use App\Features\Post\Services\PostExcelService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminPostController
{
    public function index(Request $request, AdminUserService $adminService): Response
    {
        $search = $request->query('search');
        $category = $request->query('category');
        $status = $request->query('status');

        $posts = $adminService->getAllPosts(
            $search ?: null,
            $category ?: null,
            $status ?: null,
            10
        );

        return Inertia::render('Admin/PostList', [
            'posts' => $posts,
            'filters' => [
                'search' => $search ?? '',
                'category' => $category ?? '',
                'status' => $status ?? '',
            ],
            'categories' => PostCategory::options(),
        ]);
    }

    public function export(PostRepositoryInterface $postRepository, PostExcelService $excelService): StreamedResponse
    {
        $posts = $postRepository->getAllPosts();

        return $excelService->exportToResponse($posts, 'all-posts-'.now()->format('Ymd-His').'.xlsx');
    }
}

