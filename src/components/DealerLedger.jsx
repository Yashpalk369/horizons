import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ArrowUp, ArrowDown, CreditCard, FileDown } from "lucide-react"
import { isToday, isYesterday, isThisWeek, isThisMonth, isThisYear, isWithinRange } from "@/lib/utils"
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { HeaderWithDashboard } from "@/components/ui/HeaderWithDashboard"

export function DealerLedger() {
  try {
    const { id } = useParams()
    const [transactions, setTransactions] = useState([])
    const [dealer, setDealer] = useState(null)
    const [filters, setFilters] = useState({
      date: "allTime",
      type: "all",
      product: "all",
      payments: "all"
    })
    const [customDateRange, setCustomDateRange] = useState({
      start: null,
      end: null
    })
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      const dealerTransactions = storedTransactions.filter(t =>
        (t.dealer && t.dealer.trim().toLowerCase() === id.trim().toLowerCase()) ||
        (t.type === "Transfer" && t.destinationDealer && t.destinationDealer.trim().toLowerCase() === id.trim().toLowerCase())
      )
      setTransactions(dealerTransactions)

      const storedDealers = JSON.parse(localStorage.getItem("dealers") || "[]")
      const dealerData = storedDealers.find(d =>
        d.name && d.name.trim().toLowerCase() === id.trim().toLowerCase()
      )
      setDealer(dealerData)
      setLoading(false)
    }, [id])

    if (loading) return null;
    if (!dealer) {
      console.error('Dealer not found or not loaded');
      return <div className="text-center text-red-600 font-bold mt-10">Dealer not found or data not loaded. Please check the dealer name or try again later.</div>;
    }
    if (!Array.isArray(transactions)) {
      console.error('Transactions data missing or invalid');
      return <div className="text-center text-red-600 font-bold mt-10">Transactions data missing or invalid.</div>;
    }

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

        const matchesType = filters.type === "all" ? true : t.type === filters.type
        const matchesProduct = filters.product === "all" ? true : t.product === filters.product
        const matchesPayments = filters.payments === "all" ? true : 
          (t.type === "Payment" && t.bankAccount === filters.payments) ||
          (t.type === "Cartage" && t.paidBy === "Dealer" && t.bankAccount === filters.payments) ||
          (t.type === "Payment" && ['Cheq', 'Cash', 'Adjustment'].includes(t.paymentMode) && t.receiverName === filters.payments)

        return matchesDate && matchesType && matchesProduct && matchesPayments
      })
    }

    const filteredTransactions = filterTransactions(transactions)

    // Calculate Transfer amounts for this dealer
    const dealerName = dealer?.name?.toLowerCase();
    const transferDebit = filteredTransactions
      .filter(t => t.type === "Transfer" && (t.dealer?.toLowerCase() === dealerName || t.sourceDealer?.toLowerCase() === dealerName) && t.destinationDealer?.toLowerCase() !== dealerName)
      .reduce((sum, t) => sum + (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0), 0);
    const transferCredit = filteredTransactions
      .filter(t => t.type === "Transfer" && t.destinationDealer?.toLowerCase() === dealerName && t.dealer?.toLowerCase() !== dealerName && t.sourceDealer?.toLowerCase() !== dealerName)
      .reduce((sum, t) => sum + (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0), 0);

    const totalSales = filteredTransactions
      .filter(t => t.type === "Sale").reduce((sum, t) => sum + parseFloat(t.totalAmount || 0), 0)
      + transferCredit;

    const totalPayments = filteredTransactions
      .filter(t => t.type === "Payment" || t.type === "Cartage" || t.type === "Return")
      .reduce((sum, t) => sum + (t.type === "Return" ? (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0) : parseFloat(t.amount || 0)), 0)
      + transferDebit;

    const totalReturns = filteredTransactions
      .filter(t => t.type === "Return")
      .reduce((sum, t) => sum + (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0), 0);

    const totalReturnUnits = filteredTransactions
      .filter(t => t.type === "Return")
      .reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)

    // Sort transactions by date ascending (oldest first)
    const sortedTransactions = filteredTransactions.sort((a, b) => new Date(a.date) - new Date(b.date))

    let runningBalance = 0;
    const ledgerEntries = sortedTransactions.map(t => {
      let credit = 0, debit = 0
      if (t.type === "Sale") {
        credit = parseFloat(t.totalAmount || 0)
      } else if (t.type === "Payment" || t.type === "Cartage") {
        debit = parseFloat(t.amount || 0)
      } else if (t.type === "Return") {
        debit = (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0)
      } else if (t.type === "Transfer") {
        // From Dealer: debit; To Dealer: credit
        const dealerName = dealer?.name?.toLowerCase()
        if ((t.dealer?.toLowerCase() === dealerName || t.sourceDealer?.toLowerCase() === dealerName) && t.destinationDealer?.toLowerCase() !== dealerName) {
          debit = (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0)
        } else if (t.destinationDealer?.toLowerCase() === dealerName && t.dealer?.toLowerCase() !== dealerName && t.sourceDealer?.toLowerCase() !== dealerName) {
          credit = (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0)
        }
      }
      runningBalance += credit - debit
      return { ...t, balance: runningBalance, credit, debit }
    })

    // Outstanding card logic: Outstanding = Total Sales - Total Payments
    const outstanding = totalSales - totalPayments;
    const outstandingPercentage = totalSales > 0 ? ((outstanding / totalSales) * 100).toFixed(1) : 0;

    const totalUnitsSold = filteredTransactions
      .filter(t => t.type === "Sale")
      .reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)
      - filteredTransactions
      .filter(t => t.type === "Return")
      .reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)

    const grossUnitsSold = filteredTransactions
      .filter(t => t.type === "Sale")
      .reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)

    const formatNumber = (number) => {
      if (number === undefined || number === null) return "0"
      return new Intl.NumberFormat('en-US').format(number)
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

    const getProductLabel = (productName) => {
      const products = JSON.parse(localStorage.getItem("products") || "[]")
      const prod = products.find(p => p.name === productName)
      if (!prod) return productName
      return prod.size && prod.unit ? `${prod.name} - ${prod.size}${prod.unit}` : prod.name
    }

    const getTransactionDescription = (transaction) => {
      if (transaction.type === 'Return') {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const prod = products.find(p => p.name === transaction.product);
        const prodLabel = prod ? `${prod.name} - ${prod.size}${prod.unit}` : transaction.product || '-';
        const dest = transaction.destinationDealer || transaction.destination || transaction.description || '-';
        return `${prodLabel} - ${dest}`;
      }
      if (transaction.type === 'Sale') {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const prod = products.find(p => p.name === transaction.product);
        if (prod && prod.size && prod.unit) {
          return `${prod.name} - ${prod.size}${prod.unit}`;
        }
        return transaction.product || '-';
      }
      if (transaction.type === 'Transfer') {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const prod = products.find(p => p.name === transaction.product);
        const prodLabel = prod ? `${prod.name} - ${prod.size}${prod.unit}` : transaction.product || '-';
        const from = transaction.dealer || transaction.sourceDealer || '-';
        const to = transaction.destinationDealer || '-';
        return `${prodLabel} | ${from} to ${to}`;
      }
      // For Payment/Cartage: show Account With Bank if mode is Bank Transfer or Net Banking
      if ((transaction.type === "Payment" || transaction.type === "Cartage") && (transaction.paymentMode === "Bank Transfer" || transaction.paymentMode === "Net Banking")) {
        return transaction.bankAccount || "-"
      }
      // For Cheq, Cash, Adjustment: show Description
      if ((transaction.type === "Payment" || transaction.type === "Cartage") && (transaction.paymentMode === "Cheq" || transaction.paymentMode === "Cash" || transaction.paymentMode === "Adjustment")) {
        return transaction.description || "-"
      }
      // Default
      return transaction.description || "-"
    }

    const getTypeColor = (type) => {
      switch (type) {
        case "Sale": return "text-green-600"
        case "Payment": return "text-blue-600"
        case "Return": return "text-red-600"
        case "Cartage": return "text-purple-600"
        case "Transfer": return "text-orange-500"
        default: return ""
      }
    }

    const getCartageDebitCredit = (entry) => {
      if (entry.type === "Cartage") {
        if (entry.paidBy === "Dealer") return { debit: formatNumber(entry.amount), credit: "" }
        if (entry.paidBy === "Company") return { debit: "", credit: formatNumber(entry.amount) }
      }
      if (entry.type === "Return") {
        return { debit: formatNumber(entry.totalAmount), credit: "" }
      }
      return { debit: entry.type === "Payment" ? formatNumber(entry.amount) : "", credit: entry.type === "Sale" ? formatNumber(entry.totalAmount) : "" }
    }

    const downloadLedger = (format) => {
      const ledgerData = sortedTransactions.map(t => ({
        Date: formatDate(t.date),
        Type: t.type,
        Description: getTransactionDescription(t),
        Mode: t.paymentMode === 'Bank Transfer' ? 'Online' : t.paymentMode === 'Net Banking' ? 'Net' : (t.paymentMode || '-'),
        TID: t.cheqNumber || t.slipNumber || t.transactionId || t.receiverName || '-',
        Quantity: t.quantity || "",
        Rate: t.rate ? formatNumber(t.rate) : "",
        Debit: getCartageDebitCredit(t).debit,
        Credit: getCartageDebitCredit(t).credit,
        Balance: formatNumber(t.balance)
      }))

      if (format === 'pdf') {
        const doc = new jsPDF()
        doc.setFontSize(20)
        doc.text(`Dealer Ledger - ${dealer?.name}`, 20, 20)
        doc.setFontSize(12)
        doc.text(`Total Sales: ${formatNumber(totalSales)}`, 20, 35)
        doc.text(`Total Payments: ${formatNumber(totalPayments)}`, 20, 45)
        doc.text(`Total Returns: ${formatNumber(totalReturns)}`, 20, 55)
        doc.text(`Outstanding: ${formatNumber(outstanding)}`, 20, 65)
        
        const headers = ['Date', 'Type', 'Description', 'Mode', 'TID', 'Quantity', 'Rate', 'Debit', 'Credit', 'Balance']
        const data = ledgerData.map(entry => Object.values(entry))
        
        doc.autoTable({
          head: [headers],
          body: data,
          startY: 70,
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 25 },
            2: { cellWidth: 40 },
            3: { cellWidth: 20, halign: 'right' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 20, halign: 'right' },
            6: { cellWidth: 25, halign: 'right' },
            7: { cellWidth: 25, halign: 'right' },
            8: { cellWidth: 25, halign: 'right' },
            9: { cellWidth: 25, halign: 'right' }
          }
        })
        
        doc.save(`${dealer?.name}_ledger.pdf`)
      } else if (format === 'excel') {
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(ledgerData)
        XLSX.utils.book_append_sheet(wb, ws, "Ledger")
        XLSX.writeFile(wb, `${dealer?.name}_ledger.xlsx`)
      }
    }

    return (
      <div className="p-6 space-y-6">
        <HeaderWithDashboard>
          <h2 className="text-2xl font-bold">Dealer Ledger - {dealer?.name}</h2>
        </HeaderWithDashboard>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold">{dealer?.name}</h3>
              <div className="space-y-2 text-gray-600 mt-2">
                <p>Phone: {dealer?.phone || "N/A"}</p>
                <p>Location: {dealer?.location || "N/A"}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
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
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Payments</p>
                <h2 className="text-3xl font-bold mt-2">{formatNumber(totalPayments)}</h2>
                <p className="text-sm text-gray-500 mt-1">{totalPayments > 0 ? ((totalPayments / totalSales) * 100).toFixed(1) + "%" : "0%"}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ArrowDown className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Returns</p>
                <h2 className="text-3xl font-bold mt-2">{formatNumber(totalReturns)}</h2>
                <p className="text-sm text-gray-500 mt-1">{totalReturnUnits} Units Returned</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <ArrowDown className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Outstanding</p>
                <h2 className={`text-3xl font-bold mt-2 ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatNumber(outstanding)}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{outstandingPercentage}% Remaining Payment</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <Select
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
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
              <div className="flex gap-2">
                <DatePicker
                  selected={customDateRange.start}
                  onChange={(date) => setCustomDateRange({ ...customDateRange, start: date })}
                  placeholderText="Start Date"
                  className="w-40"
                />
                <DatePicker
                  selected={customDateRange.end}
                  onChange={(date) => setCustomDateRange({ ...customDateRange, end: date })}
                  placeholderText="End Date"
                  className="w-40"
                />
              </div>
            )}

            <Select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-40"
            >
              <option value="all">All Types</option>
              <option value="Sale">Sale</option>
              <option value="Payment">Payment</option>
              <option value="Return">Return</option>
              <option value="Cartage">Cartage</option>
              <option value="Transfer">Transfer</option>
            </Select>

            <Select
              value={filters.product}
              onChange={(e) => setFilters({ ...filters, product: e.target.value })}
              className="w-40"
            >
              <option value="all">All Products</option>
              {Array.from(new Set(transactions.map(t => t.product))).filter(Boolean).map((product, index) => (
                <option key={index} value={product}>{getProductLabel(product)}</option>
              ))}
            </Select>

            <Select
              value={filters.payments}
              onChange={(e) => setFilters({ ...filters, payments: e.target.value })}
              className="w-40"
            >
              <option value="all">All Payments</option>
              {Array.from(new Set(transactions.filter(t => t.type === 'Payment').map(t => t.bankAccount).concat(
                transactions.filter(t => ['Cheq', 'Cash', 'Adjustment'].includes(t.paymentMode)).map(t => t.receiverName)
              ))).filter(Boolean).map((payment, index) => (
                <option key={index} value={payment}>{payment}</option>
              ))}
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Description</th>
                  <th className="text-left p-4 font-medium">Mode</th>
                  <th className="text-left p-4 font-medium">TID</th>
                  <th className="text-right p-4 font-medium">Quantity</th>
                  <th className="text-right p-4 font-medium">Rate</th>
                  <th className="text-right p-4 font-medium">Debit</th>
                  <th className="text-right p-4 font-medium">Credit</th>
                  <th className="text-right p-4 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {[...ledgerEntries].reverse().map((entry, index) => (
                  <tr
                    key={index}
                    className="border-b transition-colors duration-200 hover:bg-gray-50"
                  >
                    <td className="p-4">{formatDate(entry.date)}</td>
                    <td className={`p-4 font-semibold ${getTypeColor(entry.type)}`}>{entry.type}</td>
                    <td className="p-4">{getTransactionDescription(entry)}</td>
                    <td className="p-4">{
                      entry.type === 'Return' ? '' :
                      entry.paymentMode === 'Bank Transfer' ? 'Online'
                      : entry.paymentMode === 'Net Banking' ? 'Net'
                      : entry.paymentMode || '-'
                    }</td>
                    <td className="p-4">{
                      entry.cheqNumber
                      || entry.slipNumber
                      || (entry.transactionId ? (entry.transactionId.length > 6 ? entry.transactionId.slice(-6) : entry.transactionId) : null)
                      || entry.receiverName
                      || '-'
                    }</td>
                    <td className="p-4 text-right">{entry.quantity || "-"}</td>
                    <td className="p-4 text-right">{entry.rate ? formatNumber(entry.rate) : "-"}</td>
                    <td className="p-4 text-right">
                      {entry.type === 'Return' ? formatNumber((parseInt(entry.quantity) || 0) * (parseFloat(entry.rate) || 0)) : (entry.debit ? formatNumber(entry.debit) : "")}
                    </td>
                    <td className="p-4 text-right">
                      {entry.credit ? formatNumber(entry.credit) : ""}
                    </td>
                    <td className="p-4 text-right font-bold text-black">
                      {formatNumber(entry.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dealer Ledger error:', error);
    return <div className="text-center text-red-600 font-bold mt-10">An error occurred while loading the Dealer Ledger. Please check the console for details.</div>;
  }
}
