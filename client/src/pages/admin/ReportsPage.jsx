import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../api/reports.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import PieChart from '../../components/PieChart.jsx';

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmt(n, currency = 'PKR') {
  return `${currency} ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
}
function pct(part, total) {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

const TABS = ['Summary', 'Daily', 'Items', 'Payment', 'Cashier'];

// ─── preset date ranges ───────────────────────────────────────────────────────
function getPreset(key) {
  const now = new Date();
  const today = isoDate(now);
  switch (key) {
    case 'today': {
      return { from: today, to: today };
    }
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { from: isoDate(d), to: today };
    }
    case 'month': {
      return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    }
    case 'year': {
      return { from: isoDate(new Date(now.getFullYear(), 0, 1)), to: today };
    }
    default:
      return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="report-stat-card" style={accent ? { borderTop: `3px solid ${accent}` } : {}}>
      <p className="report-stat-label">{label}</p>
      <p className="report-stat-value">{value}</p>
      {sub && <p className="report-stat-sub">{sub}</p>}
    </div>
  );
}

// ─── Simple bar ──────────────────────────────────────────────────────────────
function Bar({ value, max, color = 'var(--color-primary)' }) {
  const w = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="report-bar-track">
      <div className="report-bar-fill" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ReportsPage() {
  const { showToast } = useToast();
  const { settings } = useSettings();
  const currency = settings?.currency || 'PKR';

  const [tab, setTab] = useState('Summary');
  const [preset, setPreset] = useState('month');
  const [range, setRange] = useState(getPreset('month'));
  const [loading, setLoading] = useState(false);

  // data buckets
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [items, setItems] = useState([]);
  const [payment, setPayment] = useState({ byPaymentMethod: [], byOrderType: [] });
  const [cashier, setCashier] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, it, p, c] = await Promise.all([
        reportsApi.summary(range),
        reportsApi.daily(range),
        reportsApi.items({ ...range, limit: 20 }),
        reportsApi.payment(range),
        reportsApi.cashier(range),
      ]);
      setSummary(s);
      setDaily(d);
      setItems(it);
      setPayment(p);
      setCashier(c);
    } catch (err) {
      showToast('error', err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [range]); // eslint-disable-line

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function applyPreset(key) {
    setPreset(key);
    setRange(getPreset(key));
  }

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports &amp; Analytics</h1>
          <p className="page-subtitle">Revenue, orders, items, and cashier breakdowns</p>
        </div>
        <button className="btn-secondary" onClick={fetchAll} disabled={loading}>
          {loading ? '⏳ Loading…' : '🔄 Refresh'}
        </button>
      </div>

      {/* Date Filters */}
      <div className="report-filters">
        <div className="report-presets">
          {['today', 'week', 'month', 'year'].map((k) => (
            <button
              key={k}
              className={`report-preset-btn ${preset === k ? 'active' : ''}`}
              onClick={() => applyPreset(k)}
            >
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
          <button
            className={`report-preset-btn ${preset === 'custom' ? 'active' : ''}`}
            onClick={() => setPreset('custom')}
          >
            Custom
          </button>
        </div>
        {preset === 'custom' && (
          <div className="report-date-inputs">
            <label>
              From
              <input
                type="date"
                value={range.from}
                onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                className="settings-input"
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={range.to}
                onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                className="settings-input"
              />
            </label>
            <button className="btn-primary" onClick={fetchAll}>Apply</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="report-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`report-tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="page-spinner-overlay">
          <div className="page-spinner" />
          <p className="page-spinner-text">Crunching numbers…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* ── Summary Tab ─────────────────────────────────────── */}
          {tab === 'Summary' && summary && (
            <div className="space-y-6">
              <div className="report-stat-grid">
                <StatCard label="Total Revenue" value={fmt(summary.totalRevenue, currency)} accent="#f59e0b" />
                <StatCard label="Completed Orders" value={summary.completedOrders.toLocaleString()} accent="#10b981" />
                <StatCard label="Avg Order Value" value={fmt(summary.avgOrderValue, currency)} accent="#3b82f6" />
                <StatCard label="Total Discount Given" value={fmt(summary.totalDiscount, currency)} accent="#a855f7" />
                <StatCard label="Total Tax Collected" value={fmt(summary.totalTax, currency)} accent="#f97316" />
                <StatCard
                  label="Cancelled Orders"
                  value={summary.cancelledOrders.toLocaleString()}
                  sub={`of ${summary.totalOrders} total`}
                  accent="#ef4444"
                />
              </div>

              {/* Revenue range info */}
              <div className="report-range-banner">
                📅 Showing data from <strong>{range.from}</strong> to <strong>{range.to}</strong>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Order Type Distribution */}
                {summary.byOrderType && (
                  <div className="admin-card p-4">
                    <h3 className="font-bold text-sm text-slate-300 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-base">donut_large</span>
                      Order Type Split
                    </h3>
                    <PieChart
                      data={[
                        { label: 'Dine-In', value: summary.byOrderType?.['dine-in'] || 0, color: '#f59e0b' },
                        { label: 'Takeaway', value: summary.byOrderType?.['takeaway'] || 0, color: '#3b82f6' },
                        { label: 'Delivery', value: summary.byOrderType?.['delivery'] || 0, color: '#8b5cf6' },
                      ].filter((d) => d.value > 0)}
                      size={140}
                      donut
                    />
                  </div>
                )}

                {/* Order Status Distribution */}
                <div className="admin-card p-4">
                  <h3 className="font-bold text-sm text-slate-300 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-base">assignment_turned_in</span>
                    Order Status Overview
                  </h3>
                  <PieChart
                    data={[
                      { label: 'Completed', value: summary.completedOrders || 0, color: '#10b981' },
                      { label: 'Cancelled', value: summary.cancelledOrders || 0, color: '#ef4444' },
                      { label: 'Active', value: Math.max(0, summary.totalOrders - summary.completedOrders - summary.cancelledOrders), color: '#f59e0b' },
                    ].filter((d) => d.value > 0)}
                    size={140}
                    donut
                  />
                </div>

                {/* Revenue vs Discount vs Tax */}
                <div className="admin-card p-4">
                  <h3 className="font-bold text-sm text-slate-300 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-base">bar_chart</span>
                    Revenue Breakdown
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Net Revenue', value: summary.totalRevenue, color: '#10b981' },
                      { label: 'Tax Collected', value: summary.totalTax, color: '#f97316' },
                      { label: 'Discounts Given', value: summary.totalDiscount, color: '#ef4444' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="font-semibold" style={{ color: item.color }}>{fmt(item.value, currency)}</span>
                        </div>
                        <Bar
                          value={item.value}
                          max={summary.totalRevenue || 1}
                          color={item.color}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Daily Tab ───────────────────────────────────────── */}
          {tab === 'Daily' && (
            <div className="table-card">
              {daily.length === 0 ? (
                <div className="empty-state"><span className="empty-icon">📅</span><h2>No data for this period</h2></div>
              ) : (
                <>
                  {/* mini bar chart */}
                  <div className="report-bar-chart">
                    {daily.map((row) => {
                      const max = Math.max(...daily.map((r) => r.revenue));
                      return (
                        <div key={row.date} className="report-bar-item">
                          <div className="report-bar-label">{row.date.slice(5)}</div>
                          <Bar value={row.revenue} max={max} />
                          <div className="report-bar-val">{fmt(row.revenue, currency)}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* table */}
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Orders</th>
                          <th>Revenue</th>
                          <th>Avg Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {daily.map((row) => (
                          <tr key={row.date}>
                            <td>{row.date}</td>
                            <td>{row.orders}</td>
                            <td className="price-cell">{fmt(row.revenue, currency)}</td>
                            <td>{fmt(row.avgValue, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Items Tab ───────────────────────────────────────── */}
          {tab === 'Items' && (
            <div className="space-y-6">
              {items.length > 0 && (
                <div className="table-card p-4">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">pie_chart</span> Top Selling Items Revenue Share
                  </h3>
                  <PieChart
                    data={items.slice(0, 7).map((item) => ({
                      label: item.name,
                      value: item.totalRevenue,
                    }))}
                    donut={true}
                    size={220}
                  />
                </div>
              )}
              <div className="table-card">
                {items.length === 0 ? (
                  <div className="empty-state"><span className="empty-icon">🍔</span><h2>No item data</h2></div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Item Name</th>
                          <th>Qty Sold</th>
                          <th>Revenue</th>
                          <th>Avg Price</th>
                          <th>% of Sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => {
                          const totalRev = items.reduce((s, x) => s + x.totalRevenue, 0);
                          return (
                            <tr key={item._id || i}>
                              <td>
                                <span className="item-rank">{i + 1}</span>
                              </td>
                              <td className="font-semibold">{item.name}</td>
                              <td>{item.totalQty}</td>
                              <td className="price-cell">{fmt(item.totalRevenue, currency)}</td>
                              <td>{fmt(item.avgPrice, currency)}</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <Bar value={item.totalRevenue} max={items[0]?.totalRevenue} />
                                  <span className="text-sm text-muted">{pct(item.totalRevenue, totalRev)}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Payment Tab ─────────────────────────────────────── */}
          {tab === 'Payment' && (
            <div className="space-y-6">
              {/* Pie Charts Summary Row */}
              <div className="report-two-col">
                <div className="table-card p-4">
                  <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">pie_chart</span> Revenue by Payment Method
                  </h3>
                  <PieChart
                    data={payment.byPaymentMethod.map((row) => ({
                      label: row._id === 'credit' ? 'Credit Tab' : row._id.toUpperCase(),
                      value: row.revenue,
                      color: row._id === 'cash' ? '#10b981' : row._id === 'card' ? '#3b82f6' : '#f59e0b',
                    }))}
                    donut={true}
                    size={200}
                  />
                </div>
                <div className="table-card p-4">
                  <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">pie_chart</span> Revenue by Order Type
                  </h3>
                  <PieChart
                    data={payment.byOrderType.map((row) => ({
                      label: row._id.toUpperCase(),
                      value: row.revenue,
                      color: row._id === 'dine-in' ? '#f59e0b' : row._id === 'takeaway' ? '#a855f7' : '#3b82f6',
                    }))}
                    donut={true}
                    size={200}
                  />
                </div>
              </div>

              {/* Data Tables */}
              <div className="report-two-col">
                {/* By method */}
                <div className="table-card">
                  <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <h3 className="font-semibold">By Payment Method Breakdown</h3>
                  </div>
                  {payment.byPaymentMethod.length === 0 ? (
                    <div className="empty-state"><p>No data</p></div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr><th>Method</th><th>Orders</th><th>Revenue</th><th>Share</th></tr>
                      </thead>
                      <tbody>
                        {payment.byPaymentMethod.map((row) => {
                          const total = payment.byPaymentMethod.reduce((s, x) => s + x.revenue, 0);
                          return (
                            <tr key={row._id}>
                              <td className="capitalize font-semibold">{row._id === 'credit' ? 'Credit Tab' : row._id}</td>
                              <td>{row.count}</td>
                              <td className="price-cell">{fmt(row.revenue, currency)}</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <Bar value={row.revenue} max={total} color={row._id === 'cash' ? '#10b981' : row._id === 'card' ? '#3b82f6' : '#f59e0b'} />
                                  <span className="text-sm">{pct(row.revenue, total)}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* By order type */}
                <div className="table-card">
                  <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <h3 className="font-semibold">By Order Type Breakdown</h3>
                  </div>
                  {payment.byOrderType.length === 0 ? (
                    <div className="empty-state"><p>No data</p></div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr><th>Type</th><th>Orders</th><th>Revenue</th><th>Share</th></tr>
                      </thead>
                      <tbody>
                        {payment.byOrderType.map((row) => {
                          const total = payment.byOrderType.reduce((s, x) => s + x.revenue, 0);
                          const colors = { 'dine-in': '#f59e0b', takeaway: '#a855f7', delivery: '#3b82f6' };
                          return (
                            <tr key={row._id}>
                              <td className="capitalize font-semibold">{row._id}</td>
                              <td>{row.count}</td>
                              <td className="price-cell">{fmt(row.revenue, currency)}</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <Bar value={row.revenue} max={total} color={colors[row._id] || 'var(--color-primary)'} />
                                  <span className="text-sm">{pct(row.revenue, total)}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Cashier Tab ─────────────────────────────────────── */}
          {tab === 'Cashier' && (
            <div className="table-card">
              {cashier.length === 0 ? (
                <div className="empty-state"><span className="empty-icon">👤</span><h2>No cashier data</h2></div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Cashier</th>
                        <th>Role</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                        <th>Avg Order</th>
                        <th>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashier.map((row, i) => {
                        const total = cashier.reduce((s, x) => s + x.revenue, 0);
                        return (
                          <tr key={row._id || i}>
                            <td>{i + 1}</td>
                            <td>
                              <div className="user-name-cell">
                                <div className="user-avatar-sm">{(row.name || '?')[0].toUpperCase()}</div>
                                <span className="font-semibold">{row.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="capitalize">{row.role}</td>
                            <td>{row.orders}</td>
                            <td className="price-cell">{fmt(row.revenue, currency)}</td>
                            <td>{fmt(row.avgValue, currency)}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <Bar value={row.revenue} max={total} color="#f59e0b" />
                                <span className="text-sm">{pct(row.revenue, total)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
