import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  Layers,
  LogOut,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { DEFAULT_FAVICON } from '../data/defaults';
import { auth, googleProvider } from '../lib/firebase';
import {
  deleteBlogPost,
  deleteNavMenuItem,
  logReportExport,
  resolveAlert,
  saveBlogPost,
  saveInventorySlot,
  saveNavMenuItem,
  saveSiteConfig,
  seedAdminDefaults,
  subscribeAlerts,
  subscribeBlogPosts,
  subscribeInventory,
  subscribeNavItems,
  subscribeOrders,
  subscribeReportExports,
  updateOrderMilestone,
  updateOrderPipedriveState,
} from '../lib/firestoreService';
import {
  BlogPost,
  InventoryAlert,
  InventorySlot,
  NavMenuItem,
  ORDER_MILESTONES,
  OrderMilestoneStatus,
  OrderRecord,
  ReportExportLog,
  SiteConfig,
} from '../types';

type AdminTab = 'overview' | 'orders' | 'inventory' | 'pipedrive' | 'cms';

interface AdminDashboardProps {
  config: SiteConfig;
  onExitAdmin: () => void;
}

export function AdminDashboard({ config, onExitAdmin }: AdminDashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Admin Collections
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [inventory, setInventory] = useState<InventorySlot[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [exportLogs, setExportLogs] = useState<ReportExportLog[]>([]);
  const [navItems, setNavItems] = useState<NavMenuItem[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  // Orders & Exports state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('All');
  const [syncingCode, setSyncingCode] = useState<string | null>(null);
  const [batchSyncing, setBatchSyncing] = useState(false);

  // Pipedrive state
  const [pipedriveStatus, setPipedriveStatus] = useState<{ configured: boolean; domain: string | null }>({
    configured: false,
    domain: null,
  });

  // Inventory create form
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotCategory, setNewSlotCategory] = useState<InventorySlot['category']>('License Pool');
  const [newSlotJurisdiction, setNewSlotJurisdiction] = useState('IFZA Dubai');
  const [newSlotAvailable, setNewSlotAvailable] = useState(20);
  const [newSlotTotal, setNewSlotTotal] = useState(30);
  const [newSlotThreshold, setNewSlotThreshold] = useState(5);

  // CMS & Blog forms
  const [cmsForm, setCmsForm] = useState<SiteConfig>(config);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsNotice, setCmsNotice] = useState('');

  const [editingNav, setEditingNav] = useState<NavMenuItem | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    setCmsForm(config);
  }, [config]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    fetch('/api/pipedrive/status')
      .then((r) => r.json())
      .then((d) => setPipedriveStatus(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    const unsubs = [
      subscribeOrders(setOrders),
      subscribeInventory(setInventory),
      subscribeAlerts(setAlerts),
      subscribeReportExports(setExportLogs),
      subscribeNavItems(true, setNavItems),
      subscribeBlogPosts(true, setBlogPosts),
    ];
    return () => unsubs.forEach((u) => u());
  }, [authReady, user]);

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleSyncOneOrder = async (order: OrderRecord) => {
    setSyncingCode(order.trackingCode);
    try {
      const res = await fetch('/api/pipedrive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingCode: order.trackingCode,
          fullName: order.fullName,
          phone: `${order.countryCode} ${order.whatsapp}`,
          email: order.email,
          jurisdiction: order.jurisdiction,
          activity: order.activity,
          visaCount: order.visaCount,
          estimatedAed: order.estimatedAed,
        }),
      });
      const data = (await res.json()) as {
        status?: OrderRecord['pipedriveStatus'];
        dealId?: string;
      };
      await updateOrderPipedriveState(
        order.trackingCode,
        data.status || 'pending_config',
        data.dealId || ''
      );
    } finally {
      setSyncingCode(null);
    }
  };

  const handleBatchSync = async () => {
    setBatchSyncing(true);
    try {
      const pending = orders.filter((o) => o.pipedriveStatus !== 'synced');
      for (const order of pending) {
        await handleSyncOneOrder(order);
      }
    } finally {
      setBatchSyncing(false);
    }
  };

  const handleExportCsv = async () => {
    const headers = [
      'TrackingCode',
      'FullName',
      'WhatsApp',
      'Email',
      'Jurisdiction',
      'Activity',
      'Visas',
      'EstimatedAED',
      'Status',
      'PipedriveStatus',
    ];
    const rows = filteredOrders.map((o) => [
      o.trackingCode,
      `"${o.fullName.replace(/"/g, '""')}"`,
      `"${o.countryCode} ${o.whatsapp}"`,
      `"${o.email}"`,
      o.jurisdiction,
      `"${o.activity.replace(/"/g, '""')}"`,
      String(o.visaCount),
      String(o.estimatedAed),
      o.status,
      o.pipedriveStatus,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simplybiznest-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    await logReportExport(
      user?.email || 'admin',
      'Orders Pipeline CSV Export',
      filteredOrders.length
    );
  };

  const handleAddSlot = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSlotName.trim()) return;
    await saveInventorySlot({
      name: newSlotName.trim(),
      category: newSlotCategory,
      jurisdiction: newSlotJurisdiction.trim(),
      availableSlots: newSlotAvailable,
      totalSlots: Math.max(newSlotAvailable, newSlotTotal),
      lowThreshold: newSlotThreshold,
    });
    setNewSlotName('');
  };

  const handleSaveCms = async (e: FormEvent) => {
    e.preventDefault();
    setCmsSaving(true);
    setCmsNotice('');
    try {
      await saveSiteConfig(cmsForm);
      setCmsNotice('CMS settings published live.');
    } finally {
      setCmsSaving(false);
    }
  };

  const handleSaveNav = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingNav) return;
    await saveNavMenuItem(editingNav);
    setEditingNav(null);
  };

  const handleSavePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    await saveBlogPost(editingPost);
    setEditingPost(null);
  };

  // Sign-in Gate
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <p className="text-sm font-medium text-[#475569]">Verifying admin session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0C1A38] flex items-center justify-center p-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-md w-full p-8 shadow-2xl">
          <div className="flex items-center gap-3 pb-5 border-b border-[#E2E8F0]">
            <img
              src={config.faviconUrl || DEFAULT_FAVICON}
              alt="simplybiznest.com"
              className="w-10 h-10 object-contain"
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
                Private Operations Console
              </p>
              <h1 className="text-xl font-bold text-[#0C1A38]">simplybiznest.com Admin</h1>
            </div>
          </div>

          <p className="mt-4 text-sm text-[#475569] leading-relaxed">
            Sign in with your authorized Google Workspace administrator account to manage orders,
            license inventory, Pipedrive CRM sync, and live CMS content.
          </p>

          {authError && (
            <p className="mt-4 text-xs font-medium text-[#0C1A38] bg-[#F8FAFC] border border-[#1F65ED] rounded-lg px-3 py-2">
              {authError}
            </p>
          )}

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-lg bg-[#1F65ED] hover:bg-[#1e50c4] text-white text-sm font-bold transition-colors"
            >
              Sign in with Google
            </button>
            <button
              type="button"
              onClick={onExitAdmin}
              className="w-full py-2.5 px-4 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:text-[#0C1A38]"
            >
              Return to Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter === 'All' || o.status === orderFilter;
    const q = orderSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      o.trackingCode.toLowerCase().includes(q) ||
      o.fullName.toLowerCase().includes(q) ||
      o.activity.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalPipelineAed = orders.reduce((acc, o) => acc + o.estimatedAed, 0);
  const activeCompaniesCount = orders.filter((o) => o.status === 'Active Company').length;
  const openAlerts = alerts.filter((a) => !a.resolved);

  const tabs: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Overview & Analytics', icon: BarChart3 },
    { id: 'orders', label: 'Orders & Exports', icon: FileText },
    { id: 'inventory', label: 'Inventory & Alerts', icon: Layers },
    { id: 'pipedrive', label: 'Pipedrive CRM Sync', icon: RefreshCw },
    { id: 'cms', label: 'CMS & Blog', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-[#0C1A38] text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-white/15 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white p-1.5 flex items-center justify-center shrink-0">
              <img
                src={config.faviconUrl || DEFAULT_FAVICON}
                alt="simplybiznest.com icon"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#93C5FD] truncate">Admin Console</p>
              <p className="text-sm font-bold text-white truncate">simplybiznest.com</p>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1F65ED] text-white font-bold'
                      : 'text-[#CBD5E1] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/15 space-y-2">
          <p className="text-xs text-[#93C5FD] truncate">{user.email}</p>
          <button
            type="button"
            onClick={() => seedAdminDefaults()}
            className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white text-left"
          >
            Initialize Default CMS & Inventory
          </button>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onExitAdmin}
              className="flex-1 py-2 px-2.5 rounded-lg border border-white/20 text-xs font-medium text-white hover:bg-white/10 inline-flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Site</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex-1 py-2 px-2.5 rounded-lg border border-white/20 text-xs font-medium text-white hover:bg-white/10 inline-flex items-center justify-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0C1A38]">Overview & Analytics</h1>
              <p className="text-sm text-[#475569]">
                Live formation pipeline metrics, milestone distribution, and license quota health.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                  Total Leads &amp; Orders
                </p>
                <p className="font-mono text-2xl font-bold text-[#0C1A38] mt-2 tabular-nums">
                  {orders.length}
                </p>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                  Pipeline Volume
                </p>
                <p className="font-mono text-2xl font-bold text-[#1F65ED] mt-2 tabular-nums">
                  AED {totalPipelineAed.toLocaleString()}
                </p>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                  Active Companies
                </p>
                <p className="font-mono text-2xl font-bold text-[#0C1A38] mt-2 tabular-nums">
                  {activeCompaniesCount}
                </p>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                  Open Threshold Alerts
                </p>
                <p className="font-mono text-2xl font-bold text-[#0C1A38] mt-2 tabular-nums">
                  {openAlerts.length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Milestone Distribution Chart */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
                <h2 className="text-base font-bold text-[#0C1A38] pb-3 border-b border-[#E2E8F0]">
                  Order Status Distribution
                </h2>
                <ul className="mt-4 space-y-3.5">
                  {ORDER_MILESTONES.map((ms) => {
                    const count = orders.filter((o) => o.status === ms).length;
                    const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                    return (
                      <li key={ms}>
                        <div className="flex justify-between text-xs font-medium text-[#1E293B] mb-1">
                          <span>{ms}</span>
                          <span className="font-mono tabular-nums">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2.5 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E2E8F0]">
                          <div
                            className="h-full bg-[#1F65ED] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Inventory Health Chart */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
                <h2 className="text-base font-bold text-[#0C1A38] pb-3 border-b border-[#E2E8F0]">
                  License & Visa Pool Utilization
                </h2>
                {inventory.length === 0 ? (
                  <p className="mt-4 text-sm text-[#475569]">
                    No inventory pools found yet. Click &ldquo;Initialize Default CMS &amp; Inventory&rdquo; in
                    the sidebar to seed slot pools.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3.5">
                    {inventory.map((slot) => {
                      const pct = Math.min(
                        100,
                        Math.round((slot.availableSlots / Math.max(1, slot.totalSlots)) * 100)
                      );
                      const isLow = slot.availableSlots <= slot.lowThreshold;
                      return (
                        <li key={slot.id}>
                          <div className="flex justify-between text-xs font-medium text-[#1E293B] mb-1">
                            <span>{slot.name}</span>
                            <span className="font-mono tabular-nums">
                              {slot.availableSlots} / {slot.totalSlots} slots
                              {isLow ? ' (Low)' : ''}
                            </span>
                          </div>
                          <div className="h-2.5 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E2E8F0]">
                            <div
                              className={`h-full rounded-full ${
                                isLow ? 'bg-[#0C1A38]' : 'bg-[#1F65ED]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS & EXPORTS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#0C1A38]">Orders & Exports</h1>
                <p className="text-sm text-[#475569]">
                  Advance client milestones atomically and export audited CSV pipeline reports.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F65ED] hover:bg-[#1e50c4] text-white text-sm font-bold"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV & Log Audit</span>
              </button>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap gap-3">
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search SBN code, client name, or activity..."
                className="flex-1 min-w-[220px] h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#0C1A38]"
              />
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#0C1A38] bg-white"
              >
                <option value="All">All Milestones</option>
                {ORDER_MILESTONES.map((ms) => (
                  <option key={ms} value={ms}>
                    {ms}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold uppercase text-[#475569]">
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Client & WhatsApp</th>
                    <th className="py-3 px-4">Scope</th>
                    <th className="py-3 px-4 text-right">Estimate (AED)</th>
                    <th className="py-3 px-4">Milestone</th>
                    <th className="py-3 px-4">CRM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#475569]">
                        No orders match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.trackingCode} className="hover:bg-[#F8FAFC]/60">
                        <td className="py-3 px-4 font-mono font-bold text-[#0C1A38] whitespace-nowrap">
                          {o.trackingCode}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#0C1A38] block">{o.fullName}</span>
                          <span className="font-mono text-xs text-[#475569] block">
                            {o.countryCode} {o.whatsapp} {o.email ? `· ${o.email}` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#475569]">
                          <span className="font-bold text-[#0C1A38] block">
                            {o.jurisdiction} ({o.visaCount} Visas)
                          </span>
                          <span>{o.activity}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#0C1A38] tabular-nums">
                          {o.estimatedAed.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={o.status}
                            onChange={(e) =>
                              updateOrderMilestone(
                                o.trackingCode,
                                e.target.value as OrderMilestoneStatus
                              )
                            }
                            className="h-9 px-2 rounded-md border border-[#E2E8F0] text-xs font-medium text-[#0C1A38] bg-white"
                          >
                            {ORDER_MILESTONES.map((ms) => (
                              <option key={ms} value={ms}>
                                {ms}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            disabled={syncingCode === o.trackingCode}
                            onClick={() => handleSyncOneOrder(o)}
                            className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] text-xs font-bold text-[#1F65ED] hover:bg-[#F8FAFC]"
                          >
                            {syncingCode === o.trackingCode
                              ? 'Syncing...'
                              : o.pipedriveStatus === 'synced'
                                ? `Synced #${o.pipedriveDealId}`
                                : 'Sync CRM'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Export Audit Log */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
              <h2 className="text-base font-bold text-[#0C1A38] pb-3 border-b border-[#E2E8F0]">
                Audit Trail: Report Exports
              </h2>
              {exportLogs.length === 0 ? (
                <p className="mt-3 text-xs text-[#475569]">No CSV exports recorded yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-[#E2E8F0] text-xs">
                  {exportLogs.slice(0, 10).map((log) => (
                    <li key={log.id} className="py-2.5 flex justify-between text-[#475569]">
                      <span>
                        <strong className="text-[#0C1A38]">{log.reportType}</strong> · by{' '}
                        {log.exportedBy}
                      </span>
                      <span className="font-mono tabular-nums">{log.rowCount} rows</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY & ALERTS */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0C1A38]">Inventory & Alerts</h1>
              <p className="text-sm text-[#475569]">
                Monitor Free Zone license allocations, visa medical slots, and banking desk quotas.
              </p>
            </div>

            {/* Active Alerts */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
              <h2 className="text-base font-bold text-[#0C1A38] flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
                <AlertTriangle className="w-4 h-4 text-[#1F65ED]" />
                <span>Low-Threshold Alerts ({openAlerts.length} Active)</span>
              </h2>
              {alerts.length === 0 ? (
                <p className="mt-3 text-sm text-[#475569]">All inventory pools are above threshold.</p>
              ) : (
                <ul className="mt-2 divide-y divide-[#E2E8F0]">
                  {alerts.map((al) => (
                    <li key={al.id} className="py-3 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm">
                        <span className="font-bold text-[#0C1A38]">{al.slotName}</span>
                        <span className="block text-xs text-[#475569]">
                          Current: <strong className="font-mono">{al.currentSlots}</strong> · Threshold:{' '}
                          <strong className="font-mono">{al.threshold}</strong> · Severity: {al.severity}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => resolveAlert(al.id, !al.resolved)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          al.resolved
                            ? 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]'
                            : 'bg-[#0C1A38] text-white'
                        }`}
                      >
                        {al.resolved ? 'Resolved (Reopen)' : 'Mark Resolved'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Inventory Slots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-xs font-bold text-[#1F65ED]">
                      {slot.category} · {slot.jurisdiction}
                    </p>
                    <h3 className="text-base font-bold text-[#0C1A38] mt-0.5">{slot.name}</h3>
                    <p className="font-mono text-xs text-[#475569] mt-1 tabular-nums">
                      Available: {slot.availableSlots} / {slot.totalSlots} · Alert &le;{' '}
                      {slot.lowThreshold}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        saveInventorySlot({
                          ...slot,
                          availableSlots: Math.max(0, slot.availableSlots - 1),
                        })
                      }
                      className="w-8 h-8 rounded-lg border border-[#E2E8F0] font-bold text-[#0C1A38] hover:bg-[#F8FAFC]"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        saveInventorySlot({
                          ...slot,
                          availableSlots: Math.min(slot.totalSlots, slot.availableSlots + 1),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-[#1F65ED] text-white font-bold hover:bg-[#1e50c4]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Slot Pool Form */}
            <form
              onSubmit={handleAddSlot}
              className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4"
            >
              <h2 className="text-base font-bold text-[#0C1A38]">Add New Slot Pool</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  placeholder="Slot pool title"
                  className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm"
                />
                <select
                  value={newSlotCategory}
                  onChange={(e) => setNewSlotCategory(e.target.value as InventorySlot['category'])}
                  className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm bg-white"
                >
                  <option value="License Pool">License Pool</option>
                  <option value="Visa Quota">Visa Quota</option>
                  <option value="Banking Desk">Banking Desk</option>
                </select>
                <input
                  type="text"
                  required
                  value={newSlotJurisdiction}
                  onChange={(e) => setNewSlotJurisdiction(e.target.value)}
                  placeholder="Jurisdiction"
                  className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm"
                />
                <input
                  type="number"
                  min={0}
                  value={newSlotAvailable}
                  onChange={(e) => setNewSlotAvailable(Number(e.target.value))}
                  placeholder="Available"
                  className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-mono"
                />
                <input
                  type="number"
                  min={1}
                  value={newSlotTotal}
                  onChange={(e) => setNewSlotTotal(Number(e.target.value))}
                  placeholder="Total capacity"
                  className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-mono"
                />
                <input
                  type="number"
                  min={0}
                  value={newSlotThreshold}
                  onChange={(e) => setNewSlotThreshold(Number(e.target.value))}
                  placeholder="Low threshold"
                  className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-mono"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#0C1A38] hover:bg-[#1F65ED] text-white text-sm font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Create Slot Pool</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: PIPEDRIVE CRM SYNC */}
        {activeTab === 'pipedrive' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#0C1A38]">Pipedrive CRM Sync</h1>
                <p className="text-sm text-[#475569]">
                  Server-side lead synchronization via PIPEDRIVE_API_TOKEN &amp;
                  PIPEDRIVE_COMPANY_DOMAIN.
                </p>
              </div>
              <button
                type="button"
                disabled={batchSyncing}
                onClick={handleBatchSync}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F65ED] hover:bg-[#1e50c4] disabled:opacity-60 text-white text-sm font-bold"
              >
                <RefreshCw className={`w-4 h-4 ${batchSyncing ? 'animate-spin' : ''}`} />
                <span>{batchSyncing ? 'Syncing Pending Leads...' : 'Batch Sync Pending Leads'}</span>
              </button>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#1F65ED]" />
                <div>
                  <p className="text-sm font-bold text-[#0C1A38]">
                    {pipedriveStatus.configured
                      ? `Connected to ${pipedriveStatus.domain}.pipedrive.com`
                      : 'Pipedrive Environment Credentials Not Yet Set (Staging as pending_config)'}
                  </p>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Configure PIPEDRIVE_API_TOKEN and PIPEDRIVE_COMPANY_DOMAIN in server secrets to
                    enable live deal creation.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold uppercase text-[#475569]">
                    <th className="py-3 px-4">Tracking ID</th>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Sync State</th>
                    <th className="py-3 px-4">Deal ID</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {orders.map((o) => (
                    <tr key={o.trackingCode}>
                      <td className="py-3 px-4 font-mono font-bold text-[#0C1A38]">{o.trackingCode}</td>
                      <td className="py-3 px-4 text-[#1E293B]">{o.fullName}</td>
                      <td className="py-3 px-4 font-mono text-xs text-[#1F65ED]">{o.pipedriveStatus}</td>
                      <td className="py-3 px-4 font-mono text-xs text-[#475569]">
                        {o.pipedriveDealId || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSyncOneOrder(o)}
                          className="px-3 py-1.5 rounded-md border border-[#E2E8F0] text-xs font-bold text-[#0C1A38] hover:bg-[#F8FAFC]"
                        >
                          Sync Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: CMS & BLOG */}
        {activeTab === 'cms' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-[#0C1A38]">CMS & Regulatory Blog</h1>
              <p className="text-sm text-[#475569]">
                Update live site branding, pricing tiers, navigation pages, and regulatory guides.
              </p>
            </div>

            {/* Site Config Form */}
            <form
              onSubmit={handleSaveCms}
              className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h2 className="text-base font-bold text-[#0C1A38]">
                  Brand Assets, Pricing & Hero Configuration
                </h2>
                {cmsNotice && <span className="text-xs font-bold text-[#1F65ED]">{cmsNotice}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0C1A38] mb-1">Site Name</label>
                  <input
                    type="text"
                    value={cmsForm.siteName}
                    onChange={(e) => setCmsForm({ ...cmsForm, siteName: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0C1A38] mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={cmsForm.contactEmail}
                    onChange={(e) => setCmsForm({ ...cmsForm, contactEmail: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0C1A38] mb-1">Header Logo URL</label>
                  <input
                    type="text"
                    value={cmsForm.headerLogoUrl}
                    onChange={(e) => setCmsForm({ ...cmsForm, headerLogoUrl: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0C1A38] mb-1">
                    Footer Logo URL (Optional Light/White)
                  </label>
                  <input
                    type="text"
                    value={cmsForm.footerLogoUrl}
                    onChange={(e) => setCmsForm({ ...cmsForm, footerLogoUrl: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0C1A38] mb-1">Favicon URL</label>
                  <input
                    type="text"
                    value={cmsForm.faviconUrl}
                    onChange={(e) => setCmsForm({ ...cmsForm, faviconUrl: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0C1A38] mb-1">
                    WhatsApp Number (Digits Only)
                  </label>
                  <input
                    type="text"
                    value={cmsForm.whatsappNumber}
                    onChange={(e) => setCmsForm({ ...cmsForm, whatsappNumber: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0C1A38] mb-1">Hero Headline</label>
                <input
                  type="text"
                  value={cmsForm.heroHeadline}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroHeadline: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0C1A38] mb-1">Hero Subheadline</label>
                <textarea
                  rows={2}
                  value={cmsForm.heroSubheadline}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroSubheadline: e.target.value })}
                  className="w-full p-3 rounded-lg border border-[#E2E8F0] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0C1A38] mb-1">Promo Notice</label>
                <input
                  type="text"
                  value={cmsForm.promoNotice}
                  onChange={(e) => setCmsForm({ ...cmsForm, promoNotice: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0C1A38] mb-1">
                    Zero-Visa Free Zone (AED)
                  </label>
                  <input
                    type="number"
                    value={cmsForm.zeroVisaPriceAed}
                    onChange={(e) =>
                      setCmsForm({ ...cmsForm, zeroVisaPriceAed: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0C1A38] mb-1">
                    1-Visa All-Inclusive (AED)
                  </label>
                  <input
                    type="number"
                    value={cmsForm.oneVisaPriceAed}
                    onChange={(e) =>
                      setCmsForm({ ...cmsForm, oneVisaPriceAed: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0C1A38] mb-1">
                    Dubai Mainland DET LLC (AED)
                  </label>
                  <input
                    type="number"
                    value={cmsForm.mainlandPriceAed}
                    onChange={(e) =>
                      setCmsForm({ ...cmsForm, mainlandPriceAed: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-mono"
                  />
                </div>
              </div>

              {/* Footer Social Channels */}
              <div className="pt-3 border-t border-[#E2E8F0]">
                <p className="text-xs font-bold text-[#475569] mb-2">
                  Footer Social Channels (Displayed as Icons in Public Footer)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="LinkedIn URL"
                    value={cmsForm.socialLinkedin || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, socialLinkedin: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Instagram URL"
                    value={cmsForm.socialInstagram || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, socialInstagram: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Facebook URL"
                    value={cmsForm.socialFacebook || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, socialFacebook: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs"
                  />
                  <input
                    type="text"
                    placeholder="X (Twitter) URL"
                    value={cmsForm.socialX || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, socialX: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs"
                  />
                  <input
                    type="text"
                    placeholder="YouTube URL"
                    value={cmsForm.socialYoutube || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, socialYoutube: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cmsSaving}
                className="px-5 py-2.5 rounded-lg bg-[#1F65ED] hover:bg-[#1e50c4] text-white text-sm font-bold"
              >
                {cmsSaving ? 'Saving...' : 'Save Site Configuration'}
              </button>
            </form>

            {/* Navigation Menu Items CRUD */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h2 className="text-base font-bold text-[#0C1A38]">Header Navbar Menu & Pages</h2>
                <button
                  type="button"
                  onClick={() =>
                    setEditingNav({
                      id: '',
                      title: '',
                      slug: '',
                      order: navItems.length,
                      pageSubtitle: '',
                      pageContent: '',
                      visible: true,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C1A38] text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Menu Page</span>
                </button>
              </div>

              <ul className="divide-y divide-[#E2E8F0]">
                {navItems.map((item) => (
                  <li key={item.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                    <div>
                      <span className="font-bold text-[#0C1A38]">{item.title}</span>
                      <span className="ml-2 font-mono text-xs text-[#475569]">/{item.slug}</span>
                      {!item.visible && (
                        <span className="ml-2 text-xs text-[#475569]">(Hidden)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingNav(item)}
                        className="px-2.5 py-1 rounded border border-[#E2E8F0] text-xs font-bold text-[#1F65ED]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNavMenuItem(item.id)}
                        className="p-1.5 rounded border border-[#E2E8F0] text-[#475569] hover:text-[#0C1A38]"
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {editingNav && (
                <form
                  onSubmit={handleSaveNav}
                  className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Menu Title"
                      value={editingNav.title}
                      onChange={(e) => setEditingNav({ ...editingNav, title: e.target.value })}
                      className="h-9 px-3 rounded border border-[#E2E8F0] bg-white text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="slug-name"
                      value={editingNav.slug}
                      onChange={(e) => setEditingNav({ ...editingNav, slug: e.target.value })}
                      className="h-9 px-3 rounded border border-[#E2E8F0] bg-white text-sm font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Order"
                      value={editingNav.order}
                      onChange={(e) =>
                        setEditingNav({ ...editingNav, order: Number(e.target.value) })
                      }
                      className="h-9 px-3 rounded border border-[#E2E8F0] bg-white text-sm font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Page Subtitle"
                    value={editingNav.pageSubtitle}
                    onChange={(e) =>
                      setEditingNav({ ...editingNav, pageSubtitle: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded border border-[#E2E8F0] bg-white text-sm"
                  />
                  <textarea
                    rows={3}
                    placeholder="Page Content"
                    value={editingNav.pageContent}
                    onChange={(e) =>
                      setEditingNav({ ...editingNav, pageContent: e.target.value })
                    }
                    className="w-full p-3 rounded border border-[#E2E8F0] bg-white text-sm"
                  />
                  <label className="flex items-center gap-2 text-xs font-bold text-[#0C1A38]">
                    <input
                      type="checkbox"
                      checked={editingNav.visible}
                      onChange={(e) =>
                        setEditingNav({ ...editingNav, visible: e.target.checked })
                      }
                    />
                    <span>Visible in Public Header Navbar</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-[#1F65ED] text-white text-xs font-bold"
                    >
                      Save Menu Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNav(null)}
                      className="px-4 py-2 rounded border border-[#E2E8F0] bg-white text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Regulatory Guides / Blog CRUD */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h2 className="text-base font-bold text-[#0C1A38]">Regulatory Guides & Blog Posts</h2>
                <button
                  type="button"
                  onClick={() =>
                    setEditingPost({
                      id: '',
                      title: '',
                      slug: '',
                      category: 'Jurisdiction Strategy',
                      readTime: '5 min read',
                      excerpt: '',
                      content: '',
                      author: 'simplybiznest.com Advisory Desk',
                      publishedAt: 'November 2026',
                      visible: true,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C1A38] text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Guide</span>
                </button>
              </div>

              <ul className="divide-y divide-[#E2E8F0]">
                {blogPosts.map((post) => (
                  <li key={post.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                    <div>
                      <span className="font-bold text-[#0C1A38]">{post.title}</span>
                      <span className="block text-xs text-[#475569]">
                        {post.category} · {post.readTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPost(post)}
                        className="px-2.5 py-1 rounded border border-[#E2E8F0] text-xs font-bold text-[#1F65ED]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBlogPost(post.id)}
                        className="p-1.5 rounded border border-[#E2E8F0] text-[#475569] hover:text-[#0C1A38]"
                        aria-label={`Delete ${post.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {editingPost && (
                <form
                  onSubmit={handleSavePost}
                  className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Article Title"
                      value={editingPost.title}
                      onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                      className="h-9 px-3 rounded border border-[#E2E8F0] bg-white text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="url-slug"
                      value={editingPost.slug}
                      onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                      className="h-9 px-3 rounded border border-[#E2E8F0] bg-white text-sm font-mono"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Category"
                      value={editingPost.category}
                      onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                      className="h-9 px-3 rounded border border-[#E2E8F0] bg-white text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="5 min read"
                      value={editingPost.readTime}
                      onChange={(e) => setEditingPost({ ...editingPost, readTime: e.target.value })}
                      className="h-9 px-3 rounded border border-[#E2E8F0] bg-white text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Short excerpt"
                    value={editingPost.excerpt}
                    onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                    className="w-full h-9 px-3 rounded border border-[#E2E8F0] bg-white text-sm"
                  />
                  <textarea
                    rows={5}
                    required
                    placeholder="Full regulatory guide text"
                    value={editingPost.content}
                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                    className="w-full p-3 rounded border border-[#E2E8F0] bg-white text-sm"
                  />
                  <label className="flex items-center gap-2 text-xs font-bold text-[#0C1A38]">
                    <input
                      type="checkbox"
                      checked={editingPost.visible}
                      onChange={(e) =>
                        setEditingPost({ ...editingPost, visible: e.target.checked })
                      }
                    />
                    <span>Published on Public Guides Page</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-[#1F65ED] text-white text-xs font-bold"
                    >
                      Save Guide
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPost(null)}
                      className="px-4 py-2 rounded border border-[#E2E8F0] bg-white text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
