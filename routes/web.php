<?php

use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentationController;
use App\Http\Controllers\OrderPreparationController;
use App\Http\Controllers\OrderShipmentController;
use App\Http\Controllers\MailLogController;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::view('/swagger', 'swagger')->name('swagger');
Route::get('/openapi.yaml', fn () => response()->file(
    resource_path('openapi/openapi.yaml'),
    ['Content-Type' => 'application/yaml; charset=UTF-8']
))->name('openapi');

Route::get('/', function () {
    return Inertia::render('home');
})->name('home');

Route::get('/about', fn () => Inertia::render('about'))->name('about');
Route::get('/connection', fn () => Inertia::render('connection'))->name('connection');
Route::get('/products', function () {
    $categories = Category::query()
        ->with(['products' => fn ($query) => $query->where('is_active', true)->orderBy('name')])
        ->orderBy('name')
        ->get()
        ->map(fn ($category) => [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'products' => $category->products->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'sku' => $product->sku,
                'summary' => $product->summary,
                'description' => $product->description,
                'size_profile' => $product->size_profile,
                'available_sizes' => $product->available_sizes,
                'material_profile' => $product->material_profile,
                'attribute_tags' => $product->attribute_tags,
                'sustainability_notes' => $product->sustainability_notes,
                'care_instructions' => $product->care_instructions,
                'images' => $product->images,
                'price' => (float) $product->price,
                'currency' => $product->currency,
                'stock_status' => $product->stock_status,
                'stock_quantity' => $product->stock_quantity,
                'lead_time_days' => $product->lead_time_days,
                'energy_label' => $product->energy_label,
                'metadata' => $product->metadata,
            ])->values(),
        ]);

    return Inertia::render('products', [
        'categories' => $categories,
    ]);
})->name('products');

Route::get('/products/{product:slug}', function (Product $product) {
    $product->load('category');

    $payload = [
        'id' => $product->id,
        'name' => $product->name,
        'slug' => $product->slug,
        'sku' => $product->sku,
        'summary' => $product->summary,
        'description' => $product->description,
        'size_profile' => $product->size_profile,
        'available_sizes' => $product->available_sizes,
        'material_profile' => $product->material_profile,
        'attribute_tags' => $product->attribute_tags,
        'sustainability_notes' => $product->sustainability_notes,
        'care_instructions' => $product->care_instructions,
        'price' => (float) $product->price,
        'currency' => $product->currency,
        'stock_status' => $product->stock_status,
        'stock_quantity' => $product->stock_quantity,
        'lead_time_days' => $product->lead_time_days,
        'energy_label' => $product->energy_label,
        'images' => $product->images ?? [],
        'metadata' => $product->metadata ?? [],
        'category' => [
            'id' => $product->category?->id,
            'name' => $product->category?->name,
            'slug' => $product->category?->slug,
        ],
    ];

    return Inertia::render('products/show', [
        'product' => $payload,
    ]);
})->name('products.show');

Route::middleware(['auth', 'verified'])->prefix('docs')->group(function () {
    Route::get('/', [DocumentationController::class, 'index'])->name('docs.index');
    Route::get('{section}', [DocumentationController::class, 'section'])->name('docs.section');
    Route::get('{section}/{document}', [DocumentationController::class, 'show'])->name('docs.show');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('cart/items', [CartController::class, 'store'])->name('cart.items.store');
    Route::patch('cart/items/{item}', [CartController::class, 'update'])->name('cart.items.update');
    Route::delete('cart/items/{item}', [CartController::class, 'destroy'])->name('cart.items.destroy');

    Route::get('checkout', [CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('checkout/preview', [CheckoutController::class, 'preview'])->name('checkout.preview');
    Route::post('checkout', [CheckoutController::class, 'store'])->name('checkout.store');
    Route::get('checkout/confirmation/{order}', [CheckoutController::class, 'confirmation'])->name('checkout.confirmation');

    Route::post('orders/{order}/prepare', OrderPreparationController::class)->name('orders.prepare');
    Route::post('orders/{order}/ship', OrderShipmentController::class)->name('orders.ship');

    Route::get('dashboard/mail', [MailLogController::class, 'index'])->name('mail.index');
    Route::post('dashboard/mail/{mailLog}/read', [MailLogController::class, 'markRead'])->name('mail.read');
    Route::delete('dashboard/mail/{mailLog}', [MailLogController::class, 'destroy'])->name('mail.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
