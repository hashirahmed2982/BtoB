"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Dashboard from "@/components/Dashboard";
import { api } from "@/src/app/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  orderDetailId:  number;
  productName:    string;
  quantity:       number;
  deliveredQty:   number;
  pendingQty:     number;
  unitPrice:      number;
  deliveryStatus: string;
}

interface Order {
  id:             string;
  orderNumber:    string;
  status:         "pending" | "processing" | "completed" | "failed" | "cancelled";
  deliveryStatus: string;
  total:          number;
  currency:       string;
  createdAt:      string;
  completedAt:    string | null;
  products:       string;
  totalQty:       number;
  deliveredQty:   number;
  items?:         OrderItem[];
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapOrderItem(i: any): OrderItem {
  const qty       = parseInt(i.quantity ?? 0);
  const delivered = parseInt(i.deliveredQty ?? i.delivered_qty ?? 0);
  return {
    orderDetailId:  i.orderDetailId  ?? i.order_detail_id ?? 0,
    productName:    i.productName    ?? i.product_name    ?? "",
    quantity:       qty,
    deliveredQty:   delivered,
    pendingQty:     parseInt(i.pendingQty ?? i.pending_qty ?? (qty - delivered)),
    unitPrice:      parseFloat(i.unitPrice ?? i.unit_price ?? 0),
    deliveryStatus: i.deliveryStatus ?? i.item_delivery_status ?? "pending",
  };
}

function mapOrder(o: any): Order {
  return {
    id:             String(o.id ?? o.order_id),
    orderNumber:    o.orderNumber    ?? o.order_number    ?? "",
    status:         o.status         ?? o.order_status    ?? "pending",
    deliveryStatus: o.deliveryStatus ?? o.delivery_status ?? "pending",
    total:          parseFloat(o.total ?? o.total_amount  ?? 0),
    currency:       o.currency       ?? "USD",
    createdAt:      o.createdAt      ?? o.created_at      ?? "",
    completedAt:    o.completedAt    ?? o.completed_at    ?? null,
    products:       o.products       ?? "",
    totalQty:       parseInt(o.totalQty     ?? o.total_qty     ?? 0),
    deliveredQty:   parseInt(o.deliveredQty ?? o.delivered_qty ?? 0),
    items: Array.isArray(o.items) ? o.items.map(mapOrderItem) : undefined,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function statusPillCls(status: string): string {
  const map: Record<string, string> = {
    completed:  "inline-block px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    processing: "inline-block px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    pending:    "inline-block px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    partial:    "inline-block px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    failed:     "inline-block px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    cancelled:  "inline-block px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  };
  return map[status] ?? map.pending;
}

// ─── Order detail modal ───────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {order.orderNumber}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Placed {formatDateTime(order.createdAt)}
              </p>
            </div>
            <button onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Order Status</p>
            <span className={statusPillCls(order.status)}>{order.status}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Delivery</p>
            <span className={statusPillCls(order.deliveryStatus)}>{order.deliveryStatus}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {order.currency} {order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {!order.items?.length ? (
            <div className="flex items-center justify-center py-10">
              <svg className="animate-spin w-6 h-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading items…</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {["Product", "Qty", "Delivered", "Pending", "Unit Price", "Status"].map(h => (
                    <th key={h} className="py-2 pr-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700/60">
                    <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                      {item.productName}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{item.quantity}</td>
                    <td className="py-3 pr-4">
                      <span className="text-green-600 dark:text-green-400 font-medium">{item.deliveredQty}</span>
                    </td>
                    <td className="py-3 pr-4">
                      {item.pendingQty > 0
                        ? <span className="text-orange-600 dark:text-orange-400 font-medium">{item.pendingQty}</span>
                        : <span className="text-gray-400 dark:text-gray-600">—</span>
                      }
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span className={statusPillCls(item.deliveryStatus)}>{item.deliveryStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {/* <span className="text-green-600 dark:text-green-400 font-medium">{order.deliveredQty}</span>
              {" / "}
              <span className="font-medium">{order.totalQty}</span>
              {" items delivered"} */}
              {order.completedAt && (
                <span className="ml-2">Completed {formatDateTime(order.completedAt)}</span>
              )}
            </p>
            {(order.status === "pending" || order.status === "processing") && (
              <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Remaining codes will be emailed once inventory is restocked
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientOrdersPage() {
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");

  const [orders,      setOrders]      = useState<Order[]>([]);
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ─── Loaders ────────────────────────────────────────────────────────────────

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMyOrders({ page, limit: 20 });
      setOrders((res.data ?? []).map(mapOrder));
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (e: any) {
      setError(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { setPage(1); }, [activeTab]);

  const handleView = async (order: Order) => {
    setSelectedOrder(order);
    try {
      const res = await api.getMyOrderById(order.id);
      if (res.data) setSelectedOrder(mapOrder(res.data));
    } catch { /* keep summary */ }
  };

  // ─── Derived ────────────────────────────────────────────────────────────────

  const pendingOrders = useMemo(
    () => orders.filter(o => o.status === "pending" || o.status === "processing"),
    [orders]
  );
  const displayOrders = activeTab === "pending" ? pendingOrders : orders;

  const stats = useMemo(() => ({
    total,
    pending:   orders.filter(o => o.status === "pending").length,
    processing:orders.filter(o => o.status === "processing").length,
    completed: orders.filter(o => o.status === "completed").length,
  }), [orders, total]);

  const currency = orders[0]?.currency ?? "USD";

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dashboard>
      <div className="app-page">

        {/* Hero */}
        <section className="app-card app-hero">
          <h1 className="app-title">My Orders</h1>
          <p className="app-subtitle">Track your order history and delivery status.</p>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex justify-between items-center">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={() => { setError(null); loadOrders(); }}
              className="text-sm text-red-600 dark:text-red-400 underline ml-4">Retry</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{total}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">All time</p>
              </>
            )}
          </div>

          {/* Pending / processing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending / Processing</p>
                <p className="text-3xl font-bold text-orange-500 dark:text-orange-400 mt-1">
                  {stats.pending + stats.processing}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Awaiting fulfillment</p>
              </>
            )}
          </div>

          {/* Completed */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats.completed}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Fully delivered</p>
              </>
            )}
          </div>
        </div>

        {/* Tabs + table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6">
            <nav className="flex -mb-px">
              {(["all", "pending"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}>
                  {tab === "all" ? "All Orders" : "Pending / Processing"}
                  {tab === "pending" && (stats.pending + stats.processing) > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                      {stats.pending + stats.processing}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded" />
                ))}
              </div>
            ) : displayOrders.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeTab === "pending" ? "No pending orders." : "No orders yet."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {activeTab === "all" ? "All Orders" : "Pending / Processing"}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {activeTab === "all" ? `${total} total` : `${displayOrders.length} orders`}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {["Order", "Products", "Qty", "Total", "Status", "Delivery", "Placed", ""].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {displayOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white text-xs">
                            {order.orderNumber}
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate block" title={order.products}>
                              {order.products || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            <span className="text-green-600 dark:text-green-400 font-medium">{order.deliveredQty}</span>
                            <span className="text-gray-400 mx-0.5">/</span>
                            <span className="text-gray-600 dark:text-gray-400">{order.totalQty}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            {order.currency} {order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={statusPillCls(order.status)}>{order.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={statusPillCls(order.deliveryStatus)}>{order.deliveryStatus}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {formatDateTime(order.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleView(order)}
                              className="px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-300 dark:border-blue-700 whitespace-nowrap"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination — all tab only */}
                {activeTab === "all" && totalPages > 1 && (
                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </Dashboard>
  );
}
