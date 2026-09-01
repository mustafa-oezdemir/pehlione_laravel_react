import { useState, type FormEvent } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, PaginatedResponse, SharedData } from '@/types';

type MailLogContext = {
    order_id?: number;
    type?: string;
    status_message?: string;
    package_status?: {
        approved?: boolean;
        approved_at?: string | null;
        dispatched?: boolean;
        dispatched_at?: string | null;
    };
};

interface MailLogOrderSnapshot {
    id: number;
    status: string;
    prepared_at?: string | null;
    shipped_at?: string | null;
    delivery_estimate_at?: string | null;
    tracking_number?: string | null;
}

interface MailLogItem {
    id: number;
    direction: string;
    status: string;
    subject: string;
    to_email: string;
    to_name?: string | null;
    sent_at?: string | null;
    read_at?: string | null;
    deleted_at?: string | null;
    context?: MailLogContext | null;
    order?: MailLogOrderSnapshot | null;
}

interface PageProps extends SharedData {
    logs: PaginatedResponse<MailLogItem>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Mail centre',
        href: '/dashboard/mail',
    },
];

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toLocaleString();
};

const toDateTimeLocalInput = (value?: string | null) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const pad = (num: number) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function MailIndex() {
    const { props } = usePage<PageProps>();
    const { logs } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mail centre" />
            <div className="flex w-full flex-col gap-6 px-4 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Mail centre</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                            Review recent notifications sent by the system. Approve packages, dispatch shipments, or tidy up the inbox as you go.
                        </p>
                    </div>
                    <Badge variant="secondary" className="text-xs uppercase tracking-[0.2em]">
                        Total {logs.total}
                    </Badge>
                </div>

                <div className="space-y-4">
                    {logs.data.map((log) => (
                        <MailLogCard key={log.id} log={log} />
                    ))}
                </div>

                <div className="mt-6 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
                    <span>
                        Showing {logs.from ?? 0}–{logs.to ?? 0} of {logs.total}
                    </span>
                    <div className="flex gap-2">
                        {logs.prev_page_url && (
                            <Link href={logs.prev_page_url} className="rounded border border-neutral-200 px-3 py-1 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
                                Previous
                            </Link>
                        )}
                        {logs.next_page_url && (
                            <Link href={logs.next_page_url} className="rounded border border-neutral-200 px-3 py-1 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
                                Next
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function MailLogCard({ log }: { log: MailLogItem }) {
    const context = log.context ?? {};
    const orderId = context.order_id ?? log.order?.id ?? null;
    const isWarehouseAlert = context.type === 'warehouse_alert' && orderId !== null;
    const sentAtDisplay = formatDateTime(log.sent_at);

    return (
        <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {log.subject}
                    </CardTitle>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        To: {log.to_name ? `${log.to_name} <${log.to_email}>` : log.to_email}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                    <span>{log.direction}</span>
                    <span>&middot;</span>
                    <span className={log.read_at ? '' : 'text-amber-600 dark:text-amber-400'}>
                        {log.read_at ? 'Read' : 'Unread'}
                    </span>
                    {log.deleted_at && (
                        <Badge variant="destructive" className="uppercase">
                            Deleted
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                    <div className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                        <p>Sent: {sentAtDisplay ?? 'Pending'}</p>
                        <p>Status: {log.status}</p>
                        {orderId && (
                            <p>
                                Order ID:{' '}
                                <Link
                                    href={`/checkout/confirmation/${orderId}`}
                                    className="text-amber-600 hover:underline dark:text-amber-400"
                                >
                                    #{orderId}
                                </Link>
                            </p>
                        )}
                        {log.order?.status && (
                            <p className="flex items-center gap-2">
                                Order status:{' '}
                                <Badge variant="outline" className="text-xs font-normal capitalize">
                                    {log.order.status.replaceAll('_', ' ')}
                                </Badge>
                            </p>
                        )}
                        {log.order?.prepared_at && (
                            <p>Prepared at: {formatDateTime(log.order.prepared_at)}</p>
                        )}
                        {log.order?.shipped_at && (
                            <p>Shipped at: {formatDateTime(log.order.shipped_at)}</p>
                        )}
                        {log.order?.delivery_estimate_at && (
                            <p>
                                Delivery estimate: {formatDateTime(log.order.delivery_estimate_at)}
                            </p>
                        )}
                        {context.status_message && (
                            <p className="pt-2 text-sm text-neutral-700 dark:text-neutral-200">
                                {context.status_message}
                            </p>
                        )}
                    </div>
                    {isWarehouseAlert && (
                        <div className="sm:w-72">
                            <WarehouseActions log={log} />
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {!log.read_at && !log.deleted_at && (
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-neutral-300 text-neutral-700 hover:border-amber-500 hover:text-amber-600 dark:border-neutral-700 dark:text-neutral-200"
                        >
                            <Link href={`/dashboard/mail/${log.id}/read`} method="post" as="button" preserveScroll>
                                Mark as read
                            </Link>
                        </Button>
                    )}
                    {!log.deleted_at && (
                        <Button asChild variant="ghost" size="sm" className="text-red-600 hover:text-white hover:bg-red-500">
                            <Link href={`/dashboard/mail/${log.id}`} method="delete" as="button" preserveScroll>
                                Remove
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function WarehouseActions({ log }: { log: MailLogItem }) {
    const context = log.context ?? {};
    const orderId = context.order_id ?? log.order?.id;

    const hasBeenPrepared = Boolean(log.order?.prepared_at);
    const hasShipped = Boolean(log.order?.shipped_at);
    const [shipDialogOpen, setShipDialogOpen] = useState(false);

    const prepareForm = useForm({});
    const shipForm = useForm({
        tracking_number: log.order?.tracking_number ?? '',
        delivery_estimate_at: toDateTimeLocalInput(log.order?.delivery_estimate_at),
    });

    if (!orderId) {
        return null;
    }

    const preparedAtDisplay = formatDateTime(log.order?.prepared_at);
    const shippedAtDisplay = formatDateTime(log.order?.shipped_at);
    const deliveryEstimateDisplay = formatDateTime(log.order?.delivery_estimate_at);

    const handlePrepare = () => {
        prepareForm.post(`/orders/${orderId}/prepare`, {
            preserveScroll: true,
            onSuccess: () => {
                prepareForm.reset();
            },
        });
    };

    const handleShipSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        shipForm.post(`/orders/${orderId}/ship`, {
            preserveScroll: true,
            onSuccess: () => {
                setShipDialogOpen(false);
                shipForm.reset();
            },
        });
    };

    return (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-neutral-200 p-4 text-sm dark:border-neutral-800">
            <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Fulfilment actions
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Confirm preparation first, then dispatch once the parcel is with the carrier.
                </p>
            </div>

            {hasBeenPrepared && (
                <div className="rounded-md border border-emerald-200/60 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                    Package approved {preparedAtDisplay ? `on ${preparedAtDisplay}` : ''}. Customer notification sent through Mailtrap and their dashboard timeline updated.
                </div>
            )}

            {hasShipped && (
                <div className="rounded-md border border-sky-200/60 bg-sky-50 px-3 py-2 text-xs text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200">
                    Shipment marked dispatched{shippedAtDisplay ? ` on ${shippedAtDisplay}` : ''}. Customer received tracking details{deliveryEstimateDisplay ? ` with an ${deliveryEstimateDisplay} delivery window` : ''}.
                </div>
            )}

            <div className="flex flex-col gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="justify-start"
                    disabled={hasBeenPrepared || prepareForm.processing}
                    onClick={handlePrepare}
                >
                    Package already approved
                </Button>
                <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            className="justify-start"
                            disabled={!hasBeenPrepared || hasShipped || shipForm.processing}
                        >
                            Mark as dispatched
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <form onSubmit={handleShipSubmit} className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>Dispatch confirmation</DialogTitle>
                                <DialogDescription>
                                    Provide the courier tracking number and an estimated delivery window. Customers will receive an email once you submit this form.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-2">
                                <Label htmlFor="tracking_number">Tracking number</Label>
                                <Input
                                    id="tracking_number"
                                    name="tracking_number"
                                    value={shipForm.data.tracking_number ?? ''}
                                    onChange={(event) =>
                                        shipForm.setData('tracking_number', event.target.value)
                                    }
                                    placeholder="e.g. TRK123456789"
                                />
                                {shipForm.errors.tracking_number && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {shipForm.errors.tracking_number}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="delivery_estimate_at">Estimated delivery</Label>
                                <Input
                                    id="delivery_estimate_at"
                                    name="delivery_estimate_at"
                                    type="datetime-local"
                                    value={shipForm.data.delivery_estimate_at ?? ''}
                                    onChange={(event) =>
                                        shipForm.setData('delivery_estimate_at', event.target.value)
                                    }
                                />
                                {shipForm.errors.delivery_estimate_at && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {shipForm.errors.delivery_estimate_at}
                                    </p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setShipDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={shipForm.processing}>
                                    Send shipment update
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
