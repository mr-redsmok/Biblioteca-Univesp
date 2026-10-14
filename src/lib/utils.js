/* ================= UTILS ================= */
import { getActivePinia } from 'pinia'
import { useToastStore } from '@/stores/toast.js'

export function newId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch { /* fallback abaixo */ }
  // Fallback em UUID v4 (o banco exige UUID na coluna id).
  // crypto.getRandomValues funciona mesmo sem crypto.randomUUID (ex.: http via IP).
  try {
    const b = new Uint8Array(16)
    crypto.getRandomValues(b)
    b[6] = (b[6] & 0x0f) | 0x40
    b[8] = (b[8] & 0x3f) | 0x80
    const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('')
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20)
  } catch { /* último recurso abaixo */ }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
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
