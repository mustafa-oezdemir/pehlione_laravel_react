import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import SiteLayout from '@/layouts/site-layout';
import { home as homeRoute, products as productsRoute } from '@/routes';
import { show as productShow } from '@/routes/products';
import cartRoutes from '@/routes/cart';

interface ProductDetail {
    id?: number;
    name: string;
    slug?: string;
    sku?: string;
    summary?: string | null;
    description?: string | null;
    size_profile?: string | null;
    available_sizes?: string[] | null;
    material_profile?: string | null;
    attribute_tags?: string[] | null;
    sustainability_notes?: string[] | null;
    care_instructions?: string[] | null;
    price?: number | null;
    currency?: string | null;
    stock_status?: string | null;
    stock_quantity?: number | null;
    lead_time_days?: number | null;
    energy_label?: string | null;
    images?: string[] | null;
    metadata?: Record<string, unknown> | null;
    category?: {
        id?: number;
        name?: string;
        slug?: string;
    } | null;
}

interface ProductShowProps {
    product: ProductDetail;
}

const formatCurrency = (value?: number | null, currency?: string | null) => {
    if (value === undefined || value === null) {
        return null;
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency ?? 'EUR',
        minimumFractionDigits: 2,
    }).format(value);
};

export default function ProductShow({ product }: ProductShowProps) {
    const defaultSize = product.available_sizes?.[0] ?? null;
    const images = useMemo(() => {
        const references = product.images ?? [];

        if (references.length === 0) {
            return ['/products/placeholders/placeholder-1.png'];
        }

        return references;
    }, [product.images]);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(
        defaultSize,
    );

    const addForm = useForm({
        product_slug: product.slug ?? '',
        size: defaultSize,
        quantity: 1,
    });
    const { setData } = addForm;

    useEffect(() => {
        setData({
            product_slug: product.slug ?? '',
            size: defaultSize,
            quantity: 1,
        });
        setSelectedSize(defaultSize);
    }, [defaultSize, product.slug, setData]);

    const handleSizeSelect = (size: string | null) => {
        setSelectedSize(size);
        addForm.setData('size', size);
    };

    const priceLabel = useMemo(
        () => formatCurrency(product.price, product.currency),
        [product.price, product.currency],
    );

    const moveToImage = (index: number) => {
        const total = images.length;
        if (total === 0) {
            return;
        }

        const clamped = (index + total) % total;
        setActiveImageIndex(clamped);
    };

    const sizeOptions = product.available_sizes ?? [];

    const stockDescriptor = useMemo(() => {
        const status = product.stock_status ?? 'pending';
        const quantity = typeof product.stock_quantity === 'number' ? product.stock_quantity : null;

        return {
            label: status.replace('_', ' '),
            quantity,
        };
    }, [product.stock_status, product.stock_quantity]);

    const breadcrumbs = [
        { label: 'Home', href: homeRoute().url },
        { label: 'Products', href: productsRoute().url },
        product.category
            ? {
                  label: product.category.name ?? 'Category',
                  href: productsRoute({ query: { category: product.category.slug } }).url,
              }
            : null,
        { label: product.name, href: productShow({ product: product.slug ?? '' }).url },
    ].filter(Boolean) as Array<{ label: string; href: string }>;

    return (
        <SiteLayout>
            <Head title={product.name ?? 'Product'} />
            <section className="space-y-8">
                <nav className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {breadcrumbs.map((breadcrumb, index) => (
                        <span key={breadcrumb.href} className="flex items-center gap-2">
                            <Link
                                href={breadcrumb.href}
                                className="rounded-full px-2 py-1 transition hover:bg-neutral-200/70 hover:text-neutral-800 dark:hover:bg-neutral-800"
                            >
                                {breadcrumb.label}
                            </Link>
                            {index < breadcrumbs.length - 1 && <span>/</span>}
                        </span>
                    ))}
                </nav>

                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <img
                                src={images[activeImageIndex]}
                                alt={`${product.name} image ${activeImageIndex + 1}`}
                                className="aspect-[4/3] w-full object-cover"
                            />
                            {images.length > 1 && (
                                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-16 text-white">
                                    <button
                                        type="button"
                                        className="rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-wide transition hover:bg-black/80"
                                        onClick={() => moveToImage(activeImageIndex - 1)}
                                    >
                                        Prev
                                    </button>
                                    <span className="text-xs font-semibold">
                                        {activeImageIndex + 1} / {images.length}
                                    </span>
                                    <button
                                        type="button"
                                        className="rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-wide transition hover:bg-black/80"
                                        onClick={() => moveToImage(activeImageIndex + 1)}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="flex flex-wrap gap-2">
                                {images.map((image, index) => (
                                    <button
                                        key={image}
                                        type="button"
                                        onClick={() => moveToImage(index)}
                                        className={`overflow-hidden rounded-2xl border ${
                                            activeImageIndex === index
                                                ? 'border-amber-500 shadow'
                                                : 'border-transparent opacity-70'
                                        }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`${product.name} thumbnail ${index + 1}`}
                                            className="h-20 w-20 object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="space-y-2">
                            <span className="text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                                {product.sku ?? 'SKU TBD'}
                            </span>
                            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                {product.name}
                            </h1>
                            {product.summary && (
                                <p className="text-sm text-neutral-600 dark:text-neutral-300">{product.summary}</p>
                            )}
                        </div>

                        <div className="space-y-3">
                            {priceLabel && (
                                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{priceLabel}</p>
                            )}
                            <div className="text-sm text-neutral-600 dark:text-neutral-300">
                                <span className="font-medium text-neutral-800 dark:text-neutral-100">Stock:</span>{' '}
                                <span className="capitalize">{stockDescriptor.label}</span>
                                {typeof stockDescriptor.quantity === 'number' && (
                                    <span className="text-neutral-500 dark:text-neutral-400"> ({stockDescriptor.quantity} units)</span>
                                )}
                            </div>
                            {product.lead_time_days && (
                                <div className="text-sm text-neutral-600 dark:text-neutral-300">
                                    <span className="font-medium text-neutral-800 dark:text-neutral-100">Lead time:</span> {product.lead_time_days} days
                                </div>
                            )}
                            {product.energy_label && (
                                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                                    Energy {product.energy_label}
                                </div>
                            )}
                        </div>

                        {sizeOptions.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Choose size</h2>
                                <div className="flex flex-wrap gap-2">
                                    {sizeOptions.map((size) => {
                                        const isSelected = selectedSize === size;
                                        return (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => handleSizeSelect(size)}
                                                className={`rounded-full border px-4 py-2 text-sm transition ${
                                                    isSelected
                                                        ? 'border-amber-500 bg-amber-500 text-white shadow'
                                                        : 'border-neutral-300 text-neutral-700 hover:border-amber-400 hover:text-amber-600 dark:border-neutral-700 dark:text-neutral-200'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                                {addForm.errors.size && (
                                    <p className="text-xs text-red-500">{addForm.errors.size}</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                addForm.setData('quantity', Math.max(1, addForm.data.quantity - 1))
                            }
                            className="flex size-9 items-center justify-center rounded-full border border-neutral-300 text-lg transition hover:bg-neutral-200 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        >
                            –
                        </button>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={addForm.data.quantity}
                                onChange={(event) => addForm.setData('quantity', Math.max(1, Number(event.target.value)))}
                                className="h-9 w-16 rounded-full border border-neutral-300 text-center text-sm focus:border-amber-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                            />
                        <button
                            type="button"
                            onClick={() =>
                                addForm.setData('quantity', Math.min(50, addForm.data.quantity + 1))
                            }
                            className="flex size-9 items-center justify-center rounded-full border border-neutral-300 text-lg transition hover:bg-neutral-200 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        >
                            +
                        </button>
                        </div>
                        {addForm.errors.quantity && (
                            <p className="text-xs text-red-500">{addForm.errors.quantity}</p>
                        )}
                    <button
                        type="button"
                        className="flex-1 rounded-full bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:hover:bg-amber-400"
                        disabled={addForm.processing || !product.slug || (sizeOptions.length > 0 && !selectedSize)}
                        onClick={() =>
                            addForm.post(cartRoutes.items.store().url, {
                                preserveScroll: true,
                                onSuccess: () => {
                                    addForm.setData('quantity', 1);
                                },
                            })
                        }
                    >
                        Add to cart
                    </button>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Size and availability selections will feed the order workflow once fulfilment screens land. For now, use this page to brief stakeholders and plan stock.
                </p>
            </div>

                        {product.attribute_tags && product.attribute_tags.length > 0 && (
                            <div className="space-y-2">
                                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Attributes</h2>
                                <div className="flex flex-wrap gap-2">
                                    {product.attribute_tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {product.sustainability_notes && product.sustainability_notes.length > 0 && (
                            <div className="space-y-2">
                                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Sustainability notes</h2>
                                <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
                                    {product.sustainability_notes.map((note) => (
                                        <li key={note}>{note}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {product.care_instructions && product.care_instructions.length > 0 && (
                            <div className="space-y-2">
                                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Care instructions</h2>
                                <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
                                    {product.care_instructions.map((instruction) => (
                                        <li key={instruction}>{instruction}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {product.description && (
                            <div className="space-y-2">
                                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Description</h2>
                                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {product.metadata && Object.keys(product.metadata).length > 0 && (
                            <div className="space-y-2">
                                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Metadata</h2>
                                <dl className="grid gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                                    {Object.entries(product.metadata).map(([key, value]) => (
                                        <div key={key} className="flex justify-between gap-4">
                                            <dt className="font-medium text-neutral-700 capitalize dark:text-neutral-200">
                                                {key.replace(/_/g, ' ')}
                                            </dt>
                                            <dd className="text-right text-neutral-600 dark:text-neutral-300">
                                                {Array.isArray(value) ? value.join(', ') : String(value)}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
