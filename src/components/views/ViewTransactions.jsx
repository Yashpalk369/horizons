import React, { useState, useEffect } from "react"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { MoreVertical, ArrowUp, ArrowDown, CreditCard, Package2, RefreshCcw } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  formatIndianNumber, 
  isToday, 
  isYesterday, 
  isThisWeek, 
  isThisMonth, 
  isThisYear, 
  isWithinRange 
} from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { v4 as uuidv4 } from 'uuid'
import { HeaderWithDashboard } from "@/components/ui/HeaderWithDashboard"

export function ViewTransactions() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [dealers, setDealers] = useState([])
  const [products, setProducts] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [filters, setFilters] = useState({
    date: "allTime",
    dealer: "all",
    product: "all",
    bankAccount: "all",
    type: "all",
    payments: "all"
  })
  const [customDateRange, setCustomDateRange] = useState({
    start: null,
    end: null
  })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [editTransaction, setEditTransaction] = useState(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    const transactionsWithId = storedTransactions.map(t => ({ ...t, id: t.id || uuidv4() }))
    if (transactionsWithId.some((t, i) => t.id !== storedTransactions[i]?.id)) {
      localStorage.setItem("transactions", JSON.stringify(transactionsWithId))
    }
    const storedDealers = JSON.parse(localStorage.getItem("dealers") || "[]")
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]")
    const storedBankAccounts = JSON.parse(localStorage.getItem("bankAccounts") || "[]")
    setTransactions(transactionsWithId.sort((a, b) => new Date(b.date) - new Date(a.date)))
    setDealers(storedDealers)
    setProducts(storedProducts)
    setBankAccounts(storedBankAccounts)
  }, [])

  const filterTransactions = (transactions) => {
    return transactions.filter(t => {
      const matchesDate = filters.date === "allTime" ? true : 
        filters.date === "today" ? isToday(new Date(t.date)) :
        filters.date === "yesterday" ? isYesterday(new Date(t.date)) :
        filters.date === "thisWeek" ? isThisWeek(new Date(t.date)) :
        filters.date === "thisMonth" ? isThisMonth(new Date(t.date)) :
        filters.date === "thisYear" ? isThisYear(new Date(t.date)) :
        filters.date === "custom" && customDateRange.start && customDateRange.end ? 
          isWithinRange(new Date(t.date), customDateRange.start, customDateRange.end) : true

      const matchesDealer = filters.dealer === "all" ? true : t.dealer === filters.dealer
      const matchesProduct = filters.product === "all" ? true : t.product === filters.product
      const matchesType = filters.type === "all" ? true : t.type === filters.type
      // Payments filter logic
      const matchesPayments = filters.payments === "all" ? true :
        (t.type === "Payment" && (t.bankAccount === filters.payments || t.receiverName === filters.payments)) ||
        (t.type === "Cartage" && t.paidBy === "Dealer" && t.bankAccount === filters.payments) ||
        (t.type === "Payment" && ["Cheq", "Cash", "Adjustment"].includes(t.paymentMode) && t.receiverName === filters.payments)

      return matchesDate && matchesDealer && matchesProduct && matchesType && matchesPayments
    })
  }

  const filteredTransactions = filterTransactions(transactions)

  const totalSales = filteredTransactions
    .filter(t => t.type === "Sale" || (t.type === "Cartage" && t.paidBy === "Company"))
    .reduce((sum, t) => sum + (parseFloat(t.totalAmount || t.amount || 0)), 0)

  const totalPayments = filteredTransactions
    .filter(t => t.type === "Payment" || (t.type === "Cartage" && t.paidBy === "Dealer"))
    .reduce((sum, t) => sum + (parseFloat(t.amount || 0)), 0)

  const totalReturns = filteredTransactions
    .filter(t => t.type === "Return")
    .reduce((sum, t) => sum + (parseFloat(t.totalAmount) || 0), 0)

  const totalOutstanding = totalSales - totalPayments - totalReturns

  const paymentPercentage = totalSales > 0 ? ((totalPayments / totalSales) * 100).toFixed(1) : 0
  const outstandingPercentage = totalSales > 0 ? ((totalOutstanding / totalSales) * 100).toFixed(1) : 0

  const grossUnitsSold = filteredTransactions
    .filter(t => t.type === "Sale")
    .reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)

  const totalReturnUnits = filteredTransactions
    .filter(t => t.type === "Return")
    .reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)

  const handleDelete = (index) => {
    const updatedTransactions = transactions.filter((_, i) => i !== index)
    localStorage.setItem("transactions", JSON.stringify(updatedTransactions))
    setTransactions(updatedTransactions)
    setDeleteConfirm(null)
  }

  const handleEdit = (transaction) => {
    const index = transactions.findIndex(t => t.id === transaction.id)
    if (index !== -1) {
      const updatedTransactions = [...transactions]
      updatedTransactions[index] = { ...transaction }
      localStorage.setItem("transactions", JSON.stringify(updatedTransactions))
      setTransactions(updatedTransactions)
      setEditTransaction(null)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      timeZone: 'Asia/Karachi'
    })
  }

  const formatNumber = (number) => {
    if (number === undefined || number === null) return "0"
    return new Intl.NumberFormat('en-US').format(number)
  }

  const getTransactionDescription = (transaction) => {
    if (transaction.type === 'Return') {
      const prod = products.find(p => p.name === transaction.product)
      const prodLabel = prod ? `${prod.name} - ${prod.size}${prod.unit}` : transaction.product || '-';
      const dest = transaction.destinationDealer || transaction.destination || transaction.description || '-';
      return `${prodLabel} - ${dest}`;
    }
    if (transaction.type === 'Sale') {
      const prod = products.find(p => p.name === transaction.product)
      if (prod && prod.size && prod.unit) {
        return `${prod.name} - ${prod.size}${prod.unit}`
      }
      return transaction.product || '-'
    }
    if ((transaction.type === "Payment" || transaction.type === "Cartage") && (transaction.paymentMode === "Bank Transfer" || transaction.paymentMode === "Net Banking")) {
      return transaction.bankAccount || "-"
    }
    if ((transaction.type === "Payment" || transaction.type === "Cartage") && (transaction.paymentMode === "Cheq" || transaction.paymentMode === "Cash" || transaction.paymentMode === "Adjustment")) {
      return transaction.receiverName || "-"
    }
    return transaction.description || "-"
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "Sale": return "text-green-600"
      case "Payment": return "text-blue-600"
      case "Return": return "text-red-600"
      case "Cartage": return "text-purple-600"
      default: return ""
    }
  }

  const getProductLabel = (productName) => {
    const prod = products.find(p => p.name === productName)
    if (!prod) return productName
    return prod.size && prod.unit ? `${prod.name} - ${prod.size}${prod.unit}` : prod.name
  }

  const searchedTransactions = filteredTransactions.filter(t => {
    const searchText = search.toLowerCase()
    return (
      t.dealer?.toLowerCase().includes(searchText) ||
      t.product?.toLowerCase().includes(searchText) ||
      t.description?.toLowerCase().includes(searchText) ||
      t.paymentMode?.toLowerCase().includes(searchText) ||
      t.bankAccount?.toLowerCase().includes(searchText) ||
      t.cheqNumber?.toLowerCase().includes(searchText) ||
      t.slipNumber?.toLowerCase().includes(searchText) ||
      t.transactionId?.toLowerCase().includes(searchText) ||
      t.receiverName?.toLowerCase().includes(searchText)
    )
  })

  return (
    <div className="p-6 space-y-6">
      <HeaderWithDashboard>
        <h1 className="text-2xl font-bold">All Transactions</h1>
      </HeaderWithDashboard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <h2 className="text-3xl font-bold mt-2">{formatNumber(totalSales)}</h2>
              <p className="text-sm text-gray-500 mt-1">{grossUnitsSold} Units Sold</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ArrowUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Payments</p>
              <h2 className="text-3xl font-bold mt-2">{formatNumber(totalPayments)}</h2>
              <p className="text-sm text-gray-500 mt-1">{paymentPercentage}% Payment Received</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ArrowDown className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Returns</p>
              <h2 className="text-3xl font-bold mt-2">{formatNumber(totalReturns)}</h2>
              <p className="text-sm text-gray-500 mt-1">{totalReturnUnits} Units Returned</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <RefreshCcw className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Outstanding</p>
              <h2 className={`text-3xl font-bold mt-2 ${totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatNumber(totalOutstanding)}</h2>
              <p className="text-sm text-gray-500 mt-1">{outstandingPercentage}% Outstanding</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <CreditCard className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow">
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <Select
            value={filters.date}
            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
            className="w-40"
          >
            <option value="allTime">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </Select>

          {filters.date === "custom" && (
            <div className="flex gap-4">
              <DatePicker
                selected={customDateRange.start}
                onSelect={(date) => setCustomDateRange(prev => ({ ...prev, start: date }))}
                placeholder="Start Date"
              />
              <DatePicker
                selected={customDateRange.end}
                onSelect={(date) => setCustomDateRange(prev => ({ ...prev, end: date }))}
                placeholder="End Date"
              />
            </div>
          )}

          <Select
            value={filters.dealer}
            onChange={(e) => setFilters(prev => ({ ...prev, dealer: e.target.value }))}
            className="w-40"
          >
            <option value="all">All Dealers</option>
            {dealers.map((dealer, index) => (
              <option key={index} value={dealer.name}>{dealer.name}</option>
            ))}
          </Select>

          <Select
            value={filters.product}
            onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
            className="w-40"
          >
            <option value="all">All Products</option>
            {products.map((product, index) => (
              <option key={index} value={product.name}>{getProductLabel(product.name)}</option>
            ))}
          </Select>

          <Select
            value={filters.payments}
            onChange={(e) => setFilters(prev => ({ ...prev, payments: e.target.value }))}
            className="w-40"
          >
            <option value="all">All Payments</option>
            {Array.from(new Set(transactions.filter(t => t.type === 'Payment').map(t => t.bankAccount).concat(
              transactions.filter(t => ['Cheq', 'Cash', 'Adjustment'].includes(t.paymentMode)).map(t => t.receiverName)
            ))).filter(Boolean).map((payment, index) => (
              <option key={index} value={payment}>{payment}</option>
            ))}
          </Select>

          <Select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="w-40"
          >
            <option value="all">All Types</option>
            <option value="Sale">Sales</option>
            <option value="Payment">Payments</option>
            <option value="Return">Returns</option>
            <option value="Cartage">Cartage</option>
          </Select>

          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-1/2 max-w-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Dealer Name</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Mode</th>
                <th className="text-left p-4">TID</th>
                <th className="text-right p-4">Quantity</th>
                <th className="text-right p-4">Rate</th>
                <th className="text-right p-4">Amount</th>
                <th className="text-center p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {searchedTransactions.map((transaction, index) => (
                <tr
                  key={index}
                  className="border-b transition-colors duration-200 hover:bg-gray-200 hover:shadow focus-within:bg-gray-300"
                >
                  <td className="py-3 px-4">{formatDate(transaction.date)}</td>
                  <td className={`py-3 px-4 font-semibold ${getTypeColor(transaction.type)}`}>{transaction.type}</td>
                  <td className="py-3 px-4">{transaction.dealer}</td>
                  <td className="py-3 px-4">{getTransactionDescription(transaction)}</td>
                  <td className="py-3 px-4">{
                    transaction.type === 'Return' ? '' :
                    transaction.paymentMode === 'Bank Transfer' ? 'Online'
                    : transaction.paymentMode === 'Net Banking' ? 'Net'
                    : transaction.paymentMode || '-'
                  }</td>
                  <td className="py-3 px-4">{
                    transaction.cheqNumber
                    || transaction.slipNumber
                    || (transaction.transactionId ? (transaction.transactionId.length > 6 ? transaction.transactionId.slice(-6) : transaction.transactionId) : null)
                    || transaction.receiverName
                    || '-'
                  }</td>
                  <td className="py-3 px-4 text-right">{transaction.quantity || "-"}</td>
                  <td className="py-3 px-4 text-right">{transaction.rate ? formatNumber(transaction.rate) : "-"}</td>
                  <td className="py-3 px-4 text-right">{transaction.type === 'Return' ? formatNumber((parseInt(transaction.quantity) || 0) * (parseFloat(transaction.rate) || 0)) : formatNumber(transaction.type === "Payment" || transaction.type === "Cartage" ? transaction.amount : transaction.totalAmount || 0)}</td>
                  <td className="py-3 px-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditTransaction(transaction)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteConfirm(index)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {searchedTransactions.length === 0 && (
                <tr>
                  <td colSpan="9" className="py-3 px-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editTransaction && (
        <AlertDialog open={!!editTransaction} onOpenChange={() => setEditTransaction(null)}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Transaction</AlertDialogTitle>
              <AlertDialogDescription>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date</label>
                      <input
                        type="date"
                        className="border rounded px-2 py-1 w-full"
                        value={editTransaction.date || ''}
                        onChange={e => setEditTransaction({ ...editTransaction, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        className="border rounded px-2 py-1 w-full"
                        value={editTransaction.type || ''}
                        onChange={e => setEditTransaction({ ...editTransaction, type: e.target.value })}
                      >
                        <option value="Sale">Sale</option>
                        <option value="Payment">Payment</option>
                        <option value="Return">Return</option>
                        <option value="Cartage">Cartage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Dealer</label>
                      <input
                        className="border rounded px-2 py-1 w-full"
                        value={editTransaction.dealer || ''}
                        onChange={e => setEditTransaction({ ...editTransaction, dealer: e.target.value })}
                      />
                    </div>
                    {editTransaction.type === "Payment" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Amount</label>
                          <input
                            type="number"
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.amount || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, amount: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Bank Account</label>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.bankAccount || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, bankAccount: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Bank Slip Number</label>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.slipNumber || editTransaction.bankSlipNumber || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, slipNumber: e.target.value, bankSlipNumber: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Description</label>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.description || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, description: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    {editTransaction.type === "Sale" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Product</label>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.product || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, product: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Quantity</label>
                          <input
                            type="number"
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.quantity || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, quantity: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Rate</label>
                          <input
                            type="number"
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.rate || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, rate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Total Amount</label>
                          <input
                            type="number"
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.totalAmount || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, totalAmount: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Description</label>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.description || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, description: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    {editTransaction.type === "Return" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Product</label>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.product || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, product: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Quantity</label>
                          <input
                            type="number"
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.quantity || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, quantity: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Rate</label>
                          <input
                            type="number"
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.rate || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, rate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Total Amount</label>
                          <input
                            type="number"
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.totalAmount || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, totalAmount: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Destination Dealer</label>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.destinationDealer || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, destinationDealer: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Description</label>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.description || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, description: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    {editTransaction.type === "Cartage" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Amount</label>
                          <input
                            type="number"
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.amount || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, amount: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Paid By</label>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.paidBy || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, paidBy: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Paid By Dealer</label>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.paidByDealer || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, paidByDealer: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Description</label>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editTransaction.description || ''}
                            onChange={e => setEditTransaction({ ...editTransaction, description: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </form>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEditTransaction(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleEdit(editTransaction)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
