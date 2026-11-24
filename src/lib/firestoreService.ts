import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  DEFAULT_BLOG_POSTS,
  DEFAULT_INVENTORY_SEED,
  DEFAULT_NAV_ITEMS,
  DEFAULT_SITE_CONFIG,
} from '../data/defaults';
import {
  BlogPost,
  InventoryAlert,
  InventorySlot,
  Jurisdiction,
  NavMenuItem,
  ORDER_MILESTONES,
  OrderMilestoneStatus,
  OrderRecord,
  OrderStatusRecord,
  ReportExportLog,
  SiteConfig,
} from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { generateTrackingCode } from './pricing';

function clampStr(val: string | undefined, max: number, fallback = ''): string {
  const s = (val ?? fallback).trim();
  return s.slice(0, max);
}

function clampSlug(val: string, max: number): string {
  const cleaned = val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max);
  return cleaned || `item-${Date.now().toString(36)}`;
}

// --- Public Listeners ---

export function subscribeSiteConfig(onData: (cfg: SiteConfig) => void): Unsubscribe {
  const path = 'siteConfig/main';
  return onSnapshot(
    doc(db, 'siteConfig', 'main'),
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        onData({
          siteName: String(d.siteName || DEFAULT_SITE_CONFIG.siteName),
          headerLogoUrl: String(d.headerLogoUrl || DEFAULT_SITE_CONFIG.headerLogoUrl),
          footerLogoUrl: String(d.footerLogoUrl || DEFAULT_SITE_CONFIG.footerLogoUrl),
          faviconUrl: String(d.faviconUrl || DEFAULT_SITE_CONFIG.faviconUrl),
          heroHeadline: String(d.heroHeadline || DEFAULT_SITE_CONFIG.heroHeadline),
          heroSubheadline: String(d.heroSubheadline || DEFAULT_SITE_CONFIG.heroSubheadline),
          whatsappNumber: String(d.whatsappNumber || DEFAULT_SITE_CONFIG.whatsappNumber),
          contactEmail: String(d.contactEmail || DEFAULT_SITE_CONFIG.contactEmail),
          promoNotice: String(d.promoNotice ?? DEFAULT_SITE_CONFIG.promoNotice),
          zeroVisaPriceAed: Number(d.zeroVisaPriceAed || DEFAULT_SITE_CONFIG.zeroVisaPriceAed),
          oneVisaPriceAed: Number(d.oneVisaPriceAed || DEFAULT_SITE_CONFIG.oneVisaPriceAed),
          mainlandPriceAed: Number(d.mainlandPriceAed || DEFAULT_SITE_CONFIG.mainlandPriceAed),
          socialLinkedin: String(d.socialLinkedin || ''),
          socialInstagram: String(d.socialInstagram || ''),
          socialFacebook: String(d.socialFacebook || ''),
          socialX: String(d.socialX || ''),
          socialYoutube: String(d.socialYoutube || ''),
        });
      } else {
        onData(DEFAULT_SITE_CONFIG);
      }
    },
    (err) => {
      console.warn('siteConfig snapshot fallback:', err.message);
      onData(DEFAULT_SITE_CONFIG);
    }
  );
}

export function subscribeNavItems(
  includeHidden: boolean,
  onData: (items: NavMenuItem[]) => void
): Unsubscribe {
  const colRef = collection(db, 'navMenuItems');
  const q = includeHidden
    ? query(colRef, orderBy('order', 'asc'))
    : query(colRef, where('visible', '==', true), orderBy('order', 'asc'));

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty && !includeHidden) {
        onData(DEFAULT_NAV_ITEMS);
        return;
      }
      const list: NavMenuItem[] = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          title: String(x.title || ''),
          slug: String(x.slug || d.id),
          order: Number(x.order ?? 0),
          pageSubtitle: String(x.pageSubtitle || ''),
          pageContent: String(x.pageContent || ''),
          visible: Boolean(x.visible),
        };
      });
      onData(list.length > 0 ? list : includeHidden ? [] : DEFAULT_NAV_ITEMS);
    },
    (err) => {
      if (includeHidden) {
        handleFirestoreError(err, OperationType.LIST, 'navMenuItems');
      } else {
        onData(DEFAULT_NAV_ITEMS);
      }
    }
  );
}

export function subscribeBlogPosts(
  includeHidden: boolean,
  onData: (posts: BlogPost[]) => void
): Unsubscribe {
  const colRef = collection(db, 'blogPosts');
  const q = includeHidden
    ? query(colRef)
    : query(colRef, where('visible', '==', true));

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty && !includeHidden) {
        onData(DEFAULT_BLOG_POSTS);
        return;
      }
      const list: BlogPost[] = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          title: String(x.title || ''),
          slug: String(x.slug || d.id),
          category: String(x.category || ''),
          readTime: String(x.readTime || '5 min read'),
          excerpt: String(x.excerpt || ''),
          content: String(x.content || ''),
          author: String(x.author || 'simplybiznest.com Desk'),
          publishedAt: String(x.publishedAt || ''),
          visible: Boolean(x.visible),
        };
      });
      onData(list.length > 0 ? list : includeHidden ? [] : DEFAULT_BLOG_POSTS);
    },
    (err) => {
      if (includeHidden) {
        handleFirestoreError(err, OperationType.LIST, 'blogPosts');
      } else {
        onData(DEFAULT_BLOG_POSTS);
      }
    }
  );
}

// --- Public Order Lead Creation (Atomic Batch: orders + orderStatus) ---

export interface LeadSubmissionInput {
  fullName: string;
  countryCode: string;
  whatsapp: string;
  email: string;
  jurisdiction: Jurisdiction;
  activity: string;
  visaCount: number;
  estimatedAed: number;
  estimatedUsd: number;
  source: string;
}

export async function submitFormationLead(input: LeadSubmissionInput): Promise<string> {
  const trackingCode = generateTrackingCode();
  const safeVisas = Math.max(0, Math.min(10, Math.round(input.visaCount)));
  const safeAed = Math.max(5000, Math.min(500000, Math.round(input.estimatedAed)));
  const safeUsd = Math.max(1000, Math.min(200000, Math.round(input.estimatedUsd)));

  const orderDoc: Record<string, unknown> = {
    trackingCode,
    fullName: clampStr(input.fullName, 120, 'Applicant'),
    countryCode: clampStr(input.countryCode, 12, '+971'),
    whatsapp: clampStr(input.whatsapp, 32),
    email: clampStr(input.email, 160, ''),
    jurisdiction: input.jurisdiction === 'Mainland' ? 'Mainland' : 'Free Zone',
    activity: clampStr(input.activity, 140, 'Management & Strategy Consultancy'),
    visaCount: safeVisas,
    estimatedAed: safeAed,
    estimatedUsd: safeUsd,
    status: 'Quote Locked',
    pipedriveStatus: 'pending',
    pipedriveDealId: '',
    source: clampStr(input.source, 40, 'calculator'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const statusDoc: Record<string, unknown> = {
    trackingCode,
    jurisdiction: orderDoc.jurisdiction,
    activity: orderDoc.activity,
    visaCount: safeVisas,
    estimatedAed: safeAed,
    status: 'Quote Locked',
    milestoneIndex: 0,
    note: 'Quote specification locked. Assigned to simplybiznest.com incorporation desk.',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(doc(db, 'orders', trackingCode), orderDoc);
  batch.set(doc(db, 'orderStatus', trackingCode), statusDoc);

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `orders/${trackingCode}`);
  }

  // Trigger server-side Pipedrive CRM sync in background (non-blocking for user confirmation)
  fetch('/api/pipedrive/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackingCode,
      fullName: orderDoc.fullName,
      phone: `${orderDoc.countryCode} ${orderDoc.whatsapp}`,
      email: orderDoc.email,
      jurisdiction: orderDoc.jurisdiction,
      activity: orderDoc.activity,
      visaCount: safeVisas,
      estimatedAed: safeAed,
    }),
  }).catch(() => {});

  return trackingCode;
}

// --- Public Non-PII Tracker Lookup ---

export async function lookupOrderStatus(trackingCode: string): Promise<OrderStatusRecord | null> {
  const cleanCode = trackingCode.trim().toUpperCase();
  if (!/^SBN-[A-Z0-9]{6,10}$/.test(cleanCode)) {
    return null;
  }
  const path = `orderStatus/${cleanCode}`;
  try {
    const snap = await getDoc(doc(db, 'orderStatus', cleanCode));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      trackingCode: String(d.trackingCode),
      jurisdiction: d.jurisdiction === 'Mainland' ? 'Mainland' : 'Free Zone',
      activity: String(d.activity || ''),
      visaCount: Number(d.visaCount ?? 0),
      estimatedAed: Number(d.estimatedAed ?? 0),
      status: (d.status as OrderMilestoneStatus) || 'Quote Locked',
      milestoneIndex: Number(d.milestoneIndex ?? 0),
      note: String(d.note || ''),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

// --- Admin Subscriptions & Mutations ---

export function subscribeOrders(onData: (orders: OrderRecord[]) => void): Unsubscribe {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list: OrderRecord[] = snap.docs.map((d) => {
        const x = d.data();
        return {
          trackingCode: String(x.trackingCode || d.id),
          fullName: String(x.fullName || ''),
          countryCode: String(x.countryCode || '+971'),
          whatsapp: String(x.whatsapp || ''),
          email: String(x.email || ''),
          jurisdiction: x.jurisdiction === 'Mainland' ? 'Mainland' : 'Free Zone',
          activity: String(x.activity || ''),
          visaCount: Number(x.visaCount ?? 0),
          estimatedAed: Number(x.estimatedAed ?? 0),
          estimatedUsd: Number(x.estimatedUsd ?? 0),
          status: (x.status as OrderMilestoneStatus) || 'Quote Locked',
          pipedriveStatus: (x.pipedriveStatus as OrderRecord['pipedriveStatus']) || 'pending',
          pipedriveDealId: String(x.pipedriveDealId || ''),
          source: String(x.source || 'calculator'),
          createdAt: x.createdAt,
          updatedAt: x.updatedAt,
        };
      });
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
  );
}

export async function updateOrderMilestone(
  trackingCode: string,
  status: OrderMilestoneStatus,
  note?: string
): Promise<void> {
  const milestoneIndex = Math.max(0, ORDER_MILESTONES.indexOf(status));
  const batch = writeBatch(db);
  batch.update(doc(db, 'orders', trackingCode), {
    status,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'orderStatus', trackingCode), {
    status,
    milestoneIndex,
    note: clampStr(note, 240, `Milestone updated to ${status}.`),
    updatedAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `orders/${trackingCode}`);
  }
}

export async function updateOrderPipedriveState(
  trackingCode: string,
  pipedriveStatus: OrderRecord['pipedriveStatus'],
  pipedriveDealId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', trackingCode), {
      pipedriveStatus,
      pipedriveDealId: clampStr(pipedriveDealId, 64),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `orders/${trackingCode}`);
  }
}

export async function logReportExport(
  exportedBy: string,
  reportType: string,
  rowCount: number
): Promise<void> {
  const exportId = `EXP-${Date.now().toString(36).toUpperCase()}`;
  try {
    await setDoc(doc(db, 'reportExports', exportId), {
      exportedBy: clampStr(exportedBy, 160),
      reportType: clampStr(reportType, 80),
      rowCount: Math.max(0, Math.round(rowCount)),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `reportExports/${exportId}`);
  }
}

export function subscribeReportExports(onData: (logs: ReportExportLog[]) => void): Unsubscribe {
  const q = query(collection(db, 'reportExports'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            exportedBy: String(x.exportedBy || ''),
            reportType: String(x.reportType || ''),
            rowCount: Number(x.rowCount ?? 0),
            createdAt: x.createdAt,
          };
        })
      );
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'reportExports')
  );
}

export function subscribeInventory(onData: (slots: InventorySlot[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'inventory'),
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            name: String(x.name || ''),
            category: (x.category as InventorySlot['category']) || 'License Pool',
            jurisdiction: String(x.jurisdiction || ''),
            availableSlots: Number(x.availableSlots ?? 0),
            totalSlots: Number(x.totalSlots ?? 1),
            lowThreshold: Number(x.lowThreshold ?? 5),
          };
        })
      );
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'inventory')
  );
}

export function subscribeAlerts(onData: (alerts: InventoryAlert[]) => void): Unsubscribe {
  const q = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            inventoryId: String(x.inventoryId || ''),
            slotName: String(x.slotName || ''),
            currentSlots: Number(x.currentSlots ?? 0),
            threshold: Number(x.threshold ?? 0),
            severity: x.severity === 'critical' ? 'critical' : 'warning',
            resolved: Boolean(x.resolved),
          };
        })
      );
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'alerts')
  );
}

export async function saveInventorySlot(slot: Omit<InventorySlot, 'id'> & { id?: string }): Promise<void> {
  const id = slot.id && /^[a-zA-Z0-9_-]+$/.test(slot.id) ? slot.id : `slot-${Date.now().toString(36)}`;
  const availableSlots = Math.max(0, Math.min(10000, Math.round(slot.availableSlots)));
  const totalSlots = Math.max(1, Math.min(10000, Math.round(slot.totalSlots)));
  const lowThreshold = Math.max(0, Math.min(5000, Math.round(slot.lowThreshold)));

  try {
    await setDoc(doc(db, 'inventory', id), {
      name: clampStr(slot.name, 120),
      category: slot.category,
      jurisdiction: clampStr(slot.jurisdiction, 60),
      availableSlots,
      totalSlots,
      lowThreshold,
      updatedAt: serverTimestamp(),
    });

    if (availableSlots <= lowThreshold) {
      const alertId = `alert-${id}`;
      const severity = availableSlots <= Math.max(2, Math.floor(lowThreshold / 2)) ? 'critical' : 'warning';
      const existingAlert = await getDoc(doc(db, 'alerts', alertId));
      if (existingAlert.exists()) {
        await updateDoc(doc(db, 'alerts', alertId), {
          currentSlots: availableSlots,
          threshold: lowThreshold,
          severity,
          resolved: false,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'alerts', alertId), {
          inventoryId: id,
          slotName: clampStr(slot.name, 120),
          currentSlots: availableSlots,
          threshold: lowThreshold,
          severity,
          resolved: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `inventory/${id}`);
  }
}

export async function resolveAlert(alertId: string, resolved: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'alerts', alertId), {
      resolved,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `alerts/${alertId}`);
  }
}

export async function seedAdminDefaults(): Promise<void> {
  try {
    const cfgSnap = await getDoc(doc(db, 'siteConfig', 'main'));
    if (!cfgSnap.exists()) {
      await setDoc(doc(db, 'siteConfig', 'main'), {
        ...DEFAULT_SITE_CONFIG,
        updatedAt: serverTimestamp(),
      });
    }

    for (const item of DEFAULT_NAV_ITEMS) {
      const ref = doc(db, 'navMenuItems', item.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          title: item.title,
          slug: item.slug,
          order: item.order,
          pageSubtitle: item.pageSubtitle,
          pageContent: item.pageContent,
          visible: item.visible,
          updatedAt: serverTimestamp(),
        });
      }
    }

    for (const post of DEFAULT_BLOG_POSTS) {
      const ref = doc(db, 'blogPosts', post.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          title: post.title,
          slug: post.slug,
          category: post.category,
          readTime: post.readTime,
          excerpt: post.excerpt,
          content: post.content,
          author: post.author,
          publishedAt: post.publishedAt,
          visible: post.visible,
          updatedAt: serverTimestamp(),
        });
      }
    }

    for (let i = 0; i < DEFAULT_INVENTORY_SEED.length; i++) {
      const slot = DEFAULT_INVENTORY_SEED[i];
      const id = `seed-slot-${i + 1}`;
      const snap = await getDoc(doc(db, 'inventory', id));
      if (!snap.exists()) {
        await saveInventorySlot({ ...slot, id });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seedAdminDefaults');
  }
}

export async function saveSiteConfig(cfg: SiteConfig): Promise<void> {
  try {
    await setDoc(doc(db, 'siteConfig', 'main'), {
      siteName: clampStr(cfg.siteName, 100, DEFAULT_SITE_CONFIG.siteName),
      headerLogoUrl: clampStr(cfg.headerLogoUrl, 500, DEFAULT_SITE_CONFIG.headerLogoUrl),
      footerLogoUrl: clampStr(cfg.footerLogoUrl, 500, DEFAULT_SITE_CONFIG.footerLogoUrl),
      faviconUrl: clampStr(cfg.faviconUrl, 500, DEFAULT_SITE_CONFIG.faviconUrl),
      heroHeadline: clampStr(cfg.heroHeadline, 240, DEFAULT_SITE_CONFIG.heroHeadline),
      heroSubheadline: clampStr(cfg.heroSubheadline, 600, DEFAULT_SITE_CONFIG.heroSubheadline),
      whatsappNumber: clampStr(cfg.whatsappNumber, 30, DEFAULT_SITE_CONFIG.whatsappNumber),
      contactEmail: clampStr(cfg.contactEmail, 120, DEFAULT_SITE_CONFIG.contactEmail),
      promoNotice: clampStr(cfg.promoNotice, 240, ''),
      zeroVisaPriceAed: Math.max(1000, Math.min(500000, Number(cfg.zeroVisaPriceAed) || 11500)),
      oneVisaPriceAed: Math.max(1000, Math.min(500000, Number(cfg.oneVisaPriceAed) || 17900)),
      mainlandPriceAed: Math.max(1000, Math.min(500000, Number(cfg.mainlandPriceAed) || 23500)),
      socialLinkedin: clampStr(cfg.socialLinkedin, 250, ''),
      socialInstagram: clampStr(cfg.socialInstagram, 250, ''),
      socialFacebook: clampStr(cfg.socialFacebook, 250, ''),
      socialX: clampStr(cfg.socialX, 250, ''),
      socialYoutube: clampStr(cfg.socialYoutube, 250, ''),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'siteConfig/main');
  }
}

export async function saveNavMenuItem(item: NavMenuItem): Promise<void> {
  const id = item.id && /^[a-zA-Z0-9_-]+$/.test(item.id) ? item.id : clampSlug(item.title, 60);
  const slug = clampSlug(item.slug || item.title, 60);
  try {
    await setDoc(doc(db, 'navMenuItems', id), {
      title: clampStr(item.title, 60, 'Page'),
      slug,
      order: Math.max(0, Math.min(100, Math.round(item.order))),
      pageSubtitle: clampStr(item.pageSubtitle, 240, ''),
      pageContent: clampStr(item.pageContent, 12000, ''),
      visible: Boolean(item.visible),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `navMenuItems/${id}`);
  }
}

export async function deleteNavMenuItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'navMenuItems', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `navMenuItems/${id}`);
  }
}

export async function saveBlogPost(post: BlogPost): Promise<void> {
  const slug = clampSlug(post.slug || post.title, 100);
  const id = post.id && /^[a-zA-Z0-9_-]+$/.test(post.id) ? post.id : slug;
  try {
    await setDoc(doc(db, 'blogPosts', id), {
      title: clampStr(post.title, 180, 'Untitled Guide'),
      slug,
      category: clampStr(post.category, 60, 'Advisory'),
      readTime: clampStr(post.readTime, 30, '5 min read'),
      excerpt: clampStr(post.excerpt, 500, 'Regulatory briefing from simplybiznest.com.'),
      content: clampStr(post.content, 25000, 'Full guidance article.'),
      author: clampStr(post.author, 80, 'simplybiznest.com Advisory Desk'),
      publishedAt: clampStr(post.publishedAt, 40, 'November 2026'),
      visible: Boolean(post.visible),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `blogPosts/${id}`);
  }
}

export async function deleteBlogPost(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'blogPosts', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `blogPosts/${id}`);
  }
}
