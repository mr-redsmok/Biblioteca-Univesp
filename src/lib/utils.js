/* ================= UTILS ================= */
import { getActivePinia } from 'pinia'
import { useToastStore } from '@/stores/toast.js'

export function newId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch { /* fallback abaixo */ }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
export function normIsbn(v) {
  return (v || '').replace(/[^0-9Xx]/g, '').toUpperCase()
}
export function esc(s) {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
export function formatDesc(v) {
  const s = (v || '').replace(/<[^>]*>/g, '')
  return s.length > 140 ? s.slice(0, 137) + '…' : s
}

// Toast: delega para store Pinia quando disponível, fallback DOM/console
export function toast(msg, tipo) {
  try {
    if (getActivePinia()) {
      useToastStore().show(msg, tipo)
      return
    }
  } catch {
    // sem pinia ativa — cai para fallback DOM abaixo
  }
  const el = document.getElementById('toast')
  if (el) {
    el.textContent = msg
    el.className = tipo === 'ok' || tipo === 'err' ? tipo : ''
    el.classList.add('show')
    clearTimeout(toast._t)
    toast._t = setTimeout(() => el.classList.remove('show'), 2600)
  } else {
    console.log(`[toast ${tipo}] ${msg}`)
  }
}

// Normaliza string para comparação (usado em api/autofill)
export function normTexto(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}
