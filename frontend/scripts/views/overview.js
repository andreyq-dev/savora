/**
 * Dashboard Overview
 * Replaces placeholder stats with live counts from the API (Envelope v1).
 */

import api from '../services/api.js';
import { protectPage } from '../core/auth-guard.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!await protectPage()) return;

  const elClients = document.getElementById('stat-total-clients');
  const elMenus = document.getElementById('stat-active-menus');
  const elPending = document.getElementById('stat-pending-quotations');

  function setText(el, value) {
    if (!el) return;
    el.textContent = value;
  }

  function unwrapArray(response) {
    const data = response?.data?.data;
    return Array.isArray(data) ? data : [];
  }

  // Defaults while loading
  setText(elClients, '…');
  setText(elMenus, '…');
  setText(elPending, '…');

  const [clientsRes, menusRes, quotationsRes] = await Promise.allSettled([
    api.get('/clients'),
    api.get('/menus'),
    api.get('/quotations'),
  ]);

  if (clientsRes.status === 'fulfilled') {
    const clients = unwrapArray(clientsRes.value);
    setText(elClients, String(clients.length));
  } else {
    setText(elClients, '—');
  }

  if (menusRes.status === 'fulfilled') {
    const menus = unwrapArray(menusRes.value);
    // Backend menus have 'status' field: draft|published|archived|seasonal
    const activeMenus = menus.filter((m) => m?.status === 'published');
    setText(elMenus, String(activeMenus.length));
  } else {
    setText(elMenus, '—');
  }

  if (quotationsRes.status === 'fulfilled') {
    const quotations = unwrapArray(quotationsRes.value);
    // Backend quotations have 'status' field: draft|sent|accepted|rejected|expired
    const pendingQuotations = quotations.filter((q) =>
      q?.status === 'draft' || q?.status === 'sent'
    );
    setText(elPending, String(pendingQuotations.length));
  } else {
    setText(elPending, '—');
  }
});
