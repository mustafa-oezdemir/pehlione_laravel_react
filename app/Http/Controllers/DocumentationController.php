<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DocumentationController extends Controller
{
    public function index(?string $section = null, ?string $document = null): Response
    {
        return $this->render($section, $document);
    }

    public function section(string $section): Response
    {
        return $this->render($section);
    }

    public function show(string $section, string $document): Response
    {
        return $this->render($section, $document);
    }

    private function render(?string $sectionSlug = null, ?string $documentSlug = null): Response
    {
        $allSections = $this->scanSections();
        $sections = $this->filterSectionsForUser($allSections);
        $restrictedAccess = $allSections->isNotEmpty() && $sections->isEmpty();

        if ($sections->isEmpty()) {
            if ($sectionSlug && $allSections->contains('slug', $sectionSlug)) {
                abort(403);
            }

            return Inertia::render('docs/index', [
                'sections' => [],
                'current' => ['section' => null, 'document' => null],
                'document' => null,
                'access' => ['restricted' => $restrictedAccess],
            ]);
        }

        $sectionIndex = $sections->keyBy('slug');
        $activeSection = $sectionSlug ? $sectionIndex->get($sectionSlug) : $sections->first();

        if (! $activeSection) {
            abort($sectionSlug ? 403 : 404);
        }

        $documentPayload = null;

        if ($documentSlug) {
            $documentRecord = collect($activeSection['files'])->firstWhere('slug', $documentSlug);

            if (! $documentRecord) {
                abort(404);
            }

            $documentPayload = [
                'slug' => $documentRecord['slug'],
                'title' => $documentRecord['title'],
                'html' => Str::markdown(File::get($documentRecord['path'])),
            ];
        }

        $sectionsForView = $sections->map(function ($section) {
            return [
                'slug' => $section['slug'],
                'title' => $section['title'],
                'summary' => $section['summary'],
                'fileCount' => $section['file_count'],
                'files' => collect($section['files'])
                    ->map(fn ($file) => Arr::only($file, ['slug', 'title', 'summary']))
                    ->values(),
            ];
        })->values();

        return Inertia::render('docs/index', [
            'sections' => $sectionsForView,
            'current' => [
                'section' => $activeSection['slug'],
                'document' => $documentPayload['slug'] ?? null,
            ],
            'document' => $documentPayload,
            'access' => ['restricted' => $restrictedAccess],
        ]);
    }

    private function filterSectionsForUser(Collection $sections): Collection
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            return $sections
                ->filter(fn ($section) => empty($this->restrictedRolesFor($section['slug'])))
                ->values();
        }

        return $sections
            ->filter(fn ($section) => $this->userCanAccessSection($user, $section['slug']))
            ->values();
    }

    private function scanSections()
    {
        $docsPath = base_path('.docs');

        if (! File::exists($docsPath)) {
            return collect();
        }

        return collect(File::directories($docsPath))
            ->sort()
            ->map(fn ($directory) => $this->makeSection($directory))
            ->filter(fn ($section) => $section['file_count'] > 0)
            ->values();
    }

    private function makeSection(string $directory): array
    {
        $folder = basename($directory);
        $title = $this->formatTitle($folder);
        $slug = Str::slug($title) ?: Str::slug($folder);

        $files = collect(File::files($directory))
            ->filter(fn ($file) => Str::lower($file->getExtension()) === 'md')
            ->map(fn ($file) => $this->makeDocument($file->getRealPath()))
            ->filter()
            ->values();

        return [
            'slug' => $slug,
            'title' => $title,
            'file_count' => $files->count(),
            'files' => $files->all(),
            'summary' => $files->first()['summary'] ?? null,
            'path' => $directory,
        ];
    }

    private function makeDocument(string $filePath): ?array
    {
        if (! File::exists($filePath)) {
            return null;
        }

        $filename = pathinfo($filePath, PATHINFO_FILENAME);
        $title = $this->formatTitle($filename);
        $slug = Str::slug($title) ?: Str::slug($filename);

        $content = Str::of(File::get($filePath))->replace(["\r\n", "\r"], "\n");
        $excerpt = $content
            ->split('/\n{2,}/')
            ->filter(fn ($chunk) => Str::of($chunk)->trim()->isNotEmpty())
            ->map(fn ($chunk) => Str::of($chunk)->replace('#', '')->trim())
            ->first();

        return [
            'slug' => $slug,
            'title' => $title,
            'summary' => optional($excerpt)->limit(140),
            'path' => $filePath,
        ];
    }

    private function formatTitle(string $value): string
    {
        return (string) Str::of($value)
            ->replace(['#', '_', '-'], ' ')
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->ucfirst();
    }

    private function userCanAccessSection(User $user, string $sectionSlug): bool
    {
        $restricted = $this->restrictedRolesFor($sectionSlug);

        if (empty($restricted)) {
            return true;
        }

        $role = $user->role;

        if (! $role instanceof Role) {
            return false;
        }

        if (in_array($role, $this->supervisorRoles(), true)) {
            return true;
        }

        return in_array($role, $restricted, true);
    }

    /**
     * @return array<int, Role>
     */
    private function restrictedRolesFor(string $sectionSlug): array
    {
        $configured = config('docs.restricted_sections', []);

        $roles = $configured[$sectionSlug] ?? [];

        return array_values(array_filter(array_map(
            static fn (string $value) => Role::tryFrom($value),
            $roles
        )));
    }

    /**
     * @return array<int, Role>
     */
    private function supervisorRoles(): array
    {
        $roles = config('docs.supervisor_roles', []);

        if (empty($roles)) {
            return Role::supervisors();
        }

        return array_values(array_filter(array_map(
            static fn (string $value) => Role::tryFrom($value),
            $roles
        )));
    }
}
