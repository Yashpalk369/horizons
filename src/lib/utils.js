import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatIndianNumber(number) {
  if (number === undefined || number === null) return "0"
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return formatter.format(number)
}

export function getDateRangeFilter(filter) {
  const now = new Date()
  
  switch (filter) {
    case "today":
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      }
    case "yesterday": {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday)
      }
    }
    case "thisWeek":
      return {
        start: startOfWeek(now),
        end: endOfWeek(now)
      }
    case "thisMonth":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      }
    case "thisYear":
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      }
    default:
      return null
  }
}

export function isToday(date) {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

export function isYesterday(date) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
}

export function isThisWeek(date) {
  const now = new Date()
  const weekStart = startOfWeek(now)
  const weekEnd = endOfWeek(now)
  return date >= weekStart && date <= weekEnd
}

export function isThisMonth(date) {
  const now = new Date()
  return date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
}

export function isThisYear(date) {
  const now = new Date()
  return date.getFullYear() === now.getFullYear()
}

export function isWithinRange(date, start, end) {
  return date >= start && date <= end
}

export function calculateDealerBalance(transactions, dealerName) {
  return transactions
    .filter(t => t.dealer === dealerName)
    .reduce((balance, t) => {
      if (t.type === "Sale") {
        return balance + parseFloat(t.totalAmount || 0)
      } else if (t.type === "Payment") {
        return balance - parseFloat(t.amount || 0)
      }
      return balance
    }, 0)
}

export function calculateDealerLedgerBalance(transactions, dealerName) {
  // Sort by date ascending
  const sorted = [...transactions].filter(t => t.dealer === dealerName || t.sourceDealer === dealerName || t.destinationDealer === dealerName)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  let balance = 0
  for (const t of sorted) {
    if (t.type === "Sale") {
      balance += parseFloat(t.totalAmount || 0)
    } else if (t.type === "Payment" || t.type === "Cartage") {
      balance -= parseFloat(t.amount || 0)
    } else if (t.type === "Return") {
      balance -= (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0)
    } else if (t.type === "Transfer") {
      // Debit if dealer is the source (dealer or sourceDealer), credit if destinationDealer
      if ((t.dealer === dealerName || t.sourceDealer === dealerName) && t.destinationDealer !== dealerName) {
        balance -= (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0)
      } else if (t.destinationDealer === dealerName && t.dealer !== dealerName && t.sourceDealer !== dealerName) {
        balance += (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0)
      }
    }
  }
  return balance
}

export function formatNumber(number) {
  if (number === undefined || number === null || isNaN(number)) return "0"
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(number))
}
