import React, { useState, useEffect } from "react"
import { formatIndianNumber, formatNumber } from "@/lib/utils"
import { HeaderWithDashboard } from "@/components/ui/HeaderWithDashboard"
import { Banknote, User, Users, Repeat, SlidersHorizontal, CircleDollarSign } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

export function ViewPayments() {
  const [transactions, setTransactions] = useState([])
  const [search, setSearch] = useState("")
  const [paymentMode, setPaymentMode] = useState("all")
  const [dateFilter, setDateFilter] = useState("allTime")
  const [customDateRange, setCustomDateRange] = useState({ from: undefined, to: undefined })
  const [accountFilter, setAccountFilter] = useState("all")

  useEffect(() => {
    const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    // Only Payment transactions
    const paymentTransactions = storedTransactions.filter(t => t.type === "Payment")
    setTransactions(paymentTransactions)
  }, [])

  // Prepare unique account/person/third party names for filter
  const accountNames = Array.from(new Set(transactions.map(t => t.bankAccount || t.receiverName || t.accountTitle || "Other").filter(Boolean)))

  // Date filter logic
  const now = new Date()
  let dateFrom = null, dateTo = null
  if (dateFilter === "today") {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  } else if (dateFilter === "yesterday") {
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    dateFrom = new Date(y.getFullYear(), y.getMonth(), y.getDate())
    dateTo = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999)
  } else if (dateFilter === "thisMonth") {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  } else if (dateFilter === "thisYear") {
    dateFrom = new Date(now.getFullYear(), 0, 1)
    dateTo = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
  } else if (dateFilter === "custom") {
    dateFrom = customDateRange.from
    dateTo = customDateRange.to
  }

  // Filter logic
  const filtered = transactions.filter(t => {
    const s = search.toLowerCase()
    const matchesSearch =
      (t.bankAccount || "").toLowerCase().includes(s) ||
      (t.transactionId || "").toLowerCase().includes(s) ||
      (t.slipNumber || t.bankSlipNumber || "").toLowerCase().includes(s) ||
      (t.paymentMode || "").toLowerCase().includes(s) ||
      (t.amount || "").toString().includes(s)
    // Payment Mode filter
    let modeMatch = true
    if (paymentMode !== "all") {
      if (paymentMode === "Third Party") {
        modeMatch = t.paymentMode === "Third Party"
      } else {
        modeMatch = t.paymentMode === paymentMode
      }
    }
    // Account filter
    let accountMatch = true
    if (accountFilter !== "all") {
      accountMatch = (t.bankAccount === accountFilter || t.receiverName === accountFilter || t.accountTitle === accountFilter)
    }
    // Date filter
    let dateMatch = true
    if (dateFilter !== "allTime") {
      if (dateFrom && new Date(t.date) < new Date(dateFrom)) dateMatch = false
      if (dateTo && new Date(t.date) > new Date(dateTo)) dateMatch = false
    }
    return matchesSearch && modeMatch && accountMatch && dateMatch
  })

  // Group payments by Bank Account or Person, and get account number if available (from filtered)
  const paymentSummary = {}
  filtered.forEach(t => {
    let key = t.bankAccount || t.receiverName || t.accountTitle || "Other"
    if (!key) key = "Other"
    if (!paymentSummary[key]) paymentSummary[key] = { amount: 0, accountNumber: t.accountNumber || t.bankAccountNumber || "-" }
    paymentSummary[key].amount += parseFloat(t.amount || 0)
    if (!paymentSummary[key].accountNumber && (t.accountNumber || t.bankAccountNumber)) {
      paymentSummary[key].accountNumber = t.accountNumber || t.bankAccountNumber
    }
  })

  // Cards logic (use filtered transactions)
  const totalPayments = filtered.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  // Company Accounts: Bank Transfer payments with a selected bank account
  const companyAccountsTotal = filtered.filter(t => t.paymentMode === "Bank Transfer" && t.bankAccount).reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  // Person: Cash + Cheq payments
  const personTotal = filtered.filter(t => t.paymentMode === "Cash" || t.paymentMode === "Cheq").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  // Third Party: Third Party payments
  const thirdPartyTotal = filtered.filter(t => t.paymentMode === "Third Party").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  // Adjustments
  const adjustmentsTotal = filtered.filter(t => t.paymentMode === "Adjustment").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

  return (
    <div className="p-4 space-y-4">
      <HeaderWithDashboard>
        <h1 className="text-2xl font-bold mb-2">Payments</h1>
      </HeaderWithDashboard>
      <p className="text-gray-600 mb-2">View all payment transactions in detail</p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <div className="bg-white rounded-xl p-6 shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">Company Accounts</span>
            <Banknote className="text-green-600 w-7 h-7" />
          </div>
          <h2 className="text-3xl font-bold mt-2">{formatNumber(companyAccountsTotal)}</h2>
          <p className="text-xs text-gray-500 mt-2">Total Payments Received in Company Accounts</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">Person</span>
            <User className="text-orange-600 w-7 h-7" />
          </div>
          <h2 className="text-3xl font-bold mt-2">{formatNumber(personTotal)}</h2>
          <p className="text-xs text-gray-500 mt-2">Total Payments Received by Person in form of Cash and Cheqs</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">Third Party</span>
            <Users className="text-purple-600 w-7 h-7" />
          </div>
          <h2 className="text-3xl font-bold mt-2">{formatNumber(thirdPartyTotal)}</h2>
          <p className="text-xs text-gray-500 mt-2">Total Payments Received in Third Party Accounts</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">Adjustments</span>
            <SlidersHorizontal className="text-pink-600 w-7 h-7" />
          </div>
          <h2 className="text-3xl font-bold mt-2">{formatNumber(adjustmentsTotal)}</h2>
          <p className="text-xs text-gray-500 mt-2">Total Payments Received in form of Adjustments</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">Total Payments</span>
            <CircleDollarSign className="text-blue-600 w-7 h-7" />
          </div>
          <h2 className="text-3xl font-bold mt-2">{formatNumber(totalPayments)}</h2>
          <p className="text-xs text-gray-500 mt-2">Sum of all payments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <input
          type="text"
          placeholder="Search payments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-1/4"
        />
        <select
          value={paymentMode}
          onChange={e => setPaymentMode(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-1/6"
        >
          <option value="all">All Payment Modes</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cash">Cash</option>
          <option value="Cheq">Cheq</option>
          <option value="Third Party">Third Party</option>
          <option value="Adjustment">Adjustment</option>
        </select>
        <select
          value={accountFilter}
          onChange={e => setAccountFilter(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-1/4"
        >
          <option value="all">All Accounts</option>
          {accountNames.map((name, idx) => (
            <option key={idx} value={name}>{name}</option>
          ))}
        </select>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date</label>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-32"
          >
            <option value="allTime">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="thisMonth">This Month</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        {dateFilter === "custom" && (
          <div className="flex gap-2 items-end">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="border rounded px-3 py-2 w-64 text-left bg-white flex items-center gap-2"
                >
                  <span className="text-gray-500">
                    {customDateRange.from ? (
                      customDateRange.to ? (
                        `${format(customDateRange.from, "LLL dd, y")} - ${format(customDateRange.to, "LLL dd, y")}`
                      ) : (
                        format(customDateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Select date range</span>
                    )}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={customDateRange}
                  onSelect={setCustomDateRange}
                  numberOfMonths={2}
                  initialFocus
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Section 1: Summary Table */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 w-full">
        <h2 className="text-lg font-semibold mb-4">Total Payment Receiving by Account and Person</h2>
        <div className="overflow-x-auto">
          <table className="w-full border mb-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-4 py-2">Bank Account / Person</th>
                <th className="text-left px-4 py-2">Account Number</th>
                <th className="text-right px-4 py-2">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(paymentSummary).map(([key, value], idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-semibold text-gray-700">{key}</td>
                  <td className="px-4 py-2">{value.accountNumber || '-'}</td>
                  <td className="px-4 py-2 text-right font-bold">{formatNumber(value.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Payment Details Table */}
      <div className="bg-white rounded-xl shadow p-4 w-full">
        <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Payment Mode</th>
                <th className="text-left p-4">Slip Number / TID</th>
                <th className="text-right p-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-4">{new Date(t.date).toLocaleDateString("en-GB")}</td>
                  <td className="p-4">{t.bankAccount || t.receiverName || t.accountTitle || '-'}</td>
                  <td className="p-4">{t.paymentMode || '-'}</td>
                  <td className="p-4">{t.transactionId || t.slipNumber || t.bankSlipNumber || '-'}</td>
                  <td className="p-4 text-right">{formatNumber(t.amount)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">No payments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 