import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { formatIndianNumber, cn } from "@/lib/utils"
import { format, startOfToday, startOfYesterday, startOfMonth, startOfYear, endOfToday, endOfYesterday, endOfMonth, endOfYear } from "date-fns"
import { 
  Calendar as CalendarIcon, 
  ArrowUp, 
  ArrowDown, 
  CreditCard, 
  Package2, 
  UserCircle, 
  FileText, 
  BadgeInfo, 
  BarChart3,
  Receipt,
  Truck,
  RefreshCw
} from "lucide-react"

const DATE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "thisMonth", label: "This Month" },
  { value: "thisYear", label: "This Year" },
  { value: "custom", label: "Custom Range" },
]

export function Dashboard() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [dateOption, setDateOption] = useState("all")
  const [customDate, setCustomDate] = useState({ from: undefined, to: undefined })

  useEffect(() => {
    const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    setTransactions(storedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)))
  }, [])

  // Calculate date range based on option
  let dateRange = { from: undefined, to: undefined }
  const now = new Date()
  if (dateOption === "today") {
    dateRange = { from: startOfToday(), to: endOfToday(now) }
  } else if (dateOption === "yesterday") {
    dateRange = { from: startOfYesterday(), to: endOfYesterday(now) }
  } else if (dateOption === "thisMonth") {
    dateRange = { from: startOfMonth(now), to: endOfMonth(now) }
  } else if (dateOption === "thisYear") {
    dateRange = { from: startOfYear(now), to: endOfYear(now) }
  } else if (dateOption === "custom" && customDate.from && customDate.to) {
    dateRange = { from: customDate.from, to: customDate.to }
  } else {
    dateRange = { from: undefined, to: undefined }
  }

  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date)
      if (dateOption === "all") return true
      if (dateRange.from && dateRange.to) {
        return transactionDate >= dateRange.from && transactionDate <= dateRange.to
      }
      return true
    })
  }

  const filteredTransactions = getFilteredTransactions()

  const totalSales = filteredTransactions
    .filter(t => t.type === "Sale" || (t.type === "Cartage" && t.paidBy === "Company"))
    .reduce((sum, t) => sum + parseFloat(t.totalAmount || t.amount || 0), 0)

  const totalPayments = filteredTransactions
    .filter(t => t.type === "Payment" || (t.type === "Cartage" && t.paidBy === "Dealer"))
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

  const totalReturns = filteredTransactions
    .filter(t => t.type === "Return")
    .reduce((sum, t) => sum + parseFloat(t.totalAmount || 0), 0)

  const outstanding = totalSales - totalPayments - totalReturns
  const outstandingPercentage = totalSales > 0 ? ((outstanding / totalSales) * 100).toFixed(1) : 0

  const grossUnitsSold = filteredTransactions
    .filter(t => t.type === "Sale")
    .reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)

  const totalUnitsReturned = filteredTransactions
    .filter(t => t.type === "Return")
    .reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)

  const paymentPercentage = totalSales > 0 ? ((totalPayments / totalSales) * 100).toFixed(1) : 0

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

  const getTransactionDescription = (transaction) => {
    switch (transaction.type) {
      case "Sale":
        return `${transaction.product || ""}${transaction.size ? ` - ${transaction.size}${transaction.unit ? transaction.unit : ''}` : ''}`
      case "Payment":
        return `${transaction.bankAccount} - #${transaction.bankSlipNumber || "N/A"}`
      case "Return": {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const prod = products.find(p => p.name === transaction.product);
        const prodLabel = prod ? `${prod.name} - ${prod.size}${prod.unit}` : transaction.product || '-';
        const dest = transaction.destinationDealer || transaction.destination || transaction.description || '-';
        return `${prodLabel} - ${dest}`;
      }
      case "Cartage":
        return `${transaction.description || ""} - Paid By: ${transaction.paidBy === "Dealer" ? transaction.paidByDealer : "Company"}`
      default:
        return transaction.description || "-"
    }
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

  const quickActions = [
    { 
      title: "Record Transaction", 
      icon: <FileText className="h-5 w-5 text-green-500" />, 
      link: "/forms?tab=transaction",
      bgColor: "bg-green-50"
    },
    { 
      title: "Add Product", 
      icon: <Package2 className="h-5 w-5 text-purple-500" />, 
      link: "/forms?tab=product",
      bgColor: "bg-purple-50" 
    },
    { 
      title: "Add Dealer", 
      icon: <UserCircle className="h-5 w-5 text-blue-500" />, 
      link: "/forms?tab=dealer",
      bgColor: "bg-blue-50"
    },
    { 
      title: "Add Payment Mode",
      icon: <BadgeInfo className="h-5 w-5 text-orange-500" />, 
      link: "/forms?tab=bank",
      bgColor: "bg-orange-50"
    }
  ]

  const accounts = [
    { 
      title: "All Transactions", 
      icon: <BarChart3 className="h-5 w-5 text-cyan-500" />, 
      link: "/transactions",
      bgColor: "bg-cyan-50"
    },
    { 
      title: "View Payments", 
      icon: <Receipt className="h-5 w-5 text-emerald-500" />, 
      link: "/payments",
      bgColor: "bg-emerald-50"
    },
    { 
      title: "Dealer Ledgers", 
      icon: <FileText className="h-5 w-5 text-indigo-500" />, 
      link: "/dealers",
      bgColor: "bg-indigo-50"
    },
    { 
      title: "View Products", 
      icon: <Package2 className="h-5 w-5 text-yellow-500" />, 
      link: "/products",
      bgColor: "bg-yellow-50"
    },
    { 
      title: "View Bilties", 
      icon: <Truck className="h-5 w-5 text-rose-500" />, 
      link: "/bilties",
      bgColor: "bg-rose-50"
    }
  ]

  // Helper to get product label with size/unit
  const getProductLabel = (productName) => {
    const products = JSON.parse(localStorage.getItem("products") || "[]")
    const prod = products.find(p => p.name === productName)
    if (!prod) return productName
    return prod.size && prod.unit ? `${prod.name} ${prod.size}${prod.unit}` : prod.name
  }

  // Calculate running balance for all dealers (or per dealer if filtered)
  // Use this for Outstanding card

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              timeZone: 'Asia/Karachi'
            })}
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:justify-end md:items-center gap-2">
          <select
            className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={dateOption}
            onChange={e => setDateOption(e.target.value)}
          >
            {DATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {dateOption === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !customDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDate?.from ? (
                    customDate.to ? (
                      <>
                        {format(customDate.from, "LLL dd, y")} - {format(customDate.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(customDate.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={customDate?.from}
                  selected={customDate}
                  onSelect={setCustomDate}
                  numberOfMonths={2}
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

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
              <p className="text-sm font-medium text-gray-500">Total Returns</p>
              <h2 className="text-3xl font-bold mt-2">{formatNumber(totalReturns)}</h2>
              <p className="text-sm text-gray-500 mt-1">{totalUnitsReturned} Units Returned</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <RefreshCw className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              action.link ? (
                <Link
                  key={index}
                  to={action.link}
                  className={`flex items-center p-4 rounded-lg border hover:bg-gray-50 transition-all duration-200 ${action.bgColor}`}
                >
                  <div className="mr-3">{action.icon}</div>
                  <span className="font-medium">{action.title}</span>
                </Link>
              ) : (
                <button
                  key={index}
                  className={`flex items-center p-4 rounded-lg border hover:bg-gray-50 transition-all duration-200 ${action.bgColor} w-full text-left`}
                >
                  <div className="mr-3">{action.icon}</div>
                  <span className="font-medium">{action.title}</span>
                </button>
              )
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Accounts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accounts.map((account, index) => (
              <Link
                key={index}
                to={account.link}
                className={`flex items-center p-4 rounded-lg border hover:bg-gray-50 transition-all duration-200 ${account.bgColor}`}
              >
                <div className="mr-3">{account.icon}</div>
                <span className="font-medium">{account.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Dealer Name</th>
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-left py-3 px-4">Mode</th>
                <th className="text-left py-3 px-4">TID</th>
                <th className="text-right py-3 px-4">Quantity</th>
                <th className="text-right py-3 px-4">Rate</th>
                <th className="text-right py-3 px-4">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.slice(0, 5).map((transaction, index) => (
                <tr
                  key={index}
                  className="border-b transition-colors duration-200 hover:bg-gray-50"
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
                  <td className="py-3 px-4 text-right">
                    {transaction.rate ? formatNumber(transaction.rate) : "-"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {formatNumber(
                      transaction.type === "Payment" || transaction.type === "Cartage"
                        ? transaction.amount
                        : transaction.totalAmount || 0
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
