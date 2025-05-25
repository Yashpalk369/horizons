import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { formatIndianNumber, cn, calculateDealerLedgerBalance } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Search as SearchIcon, MoreVertical, FileDown, ArrowUp, ArrowDown, CreditCard, RefreshCw } from "lucide-react"
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { HeaderWithDashboard } from "@/components/ui/HeaderWithDashboard"

export function DealersList() {
  const navigate = useNavigate()
  const [dealers, setDealers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [balanceFilter, setBalanceFilter] = useState("all")
  const [date, setDate] = useState({
    from: undefined,
    to: undefined,
  })

  useEffect(() => {
    const storedDealers = JSON.parse(localStorage.getItem("dealers") || "[]")
    const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    setDealers(storedDealers)
    setTransactions(storedTransactions)
    setDate({ from: undefined, to: undefined })
  }, [])

  const getDealerTransactions = (dealerName) => {
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date)
        const matchesDealer = t.dealer === dealerName
        const matchesDateRange = !date?.from || !date?.to || 
          (transactionDate >= date.from && transactionDate <= date.to)
        return matchesDealer && matchesDateRange
      })
  }

  const calculateDealerOutstanding = (transactions, dealerName) => {
    const name = dealerName.toLowerCase();
    // Transfer debit (from dealer)
    const transferDebit = transactions
      .filter(t => t.type === "Transfer" && (t.dealer?.toLowerCase() === name || t.sourceDealer?.toLowerCase() === name) && t.destinationDealer?.toLowerCase() !== name)
      .reduce((sum, t) => sum + (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0), 0);
    // Transfer credit (to dealer)
    const transferCredit = transactions
      .filter(t => t.type === "Transfer" && t.destinationDealer?.toLowerCase() === name && t.dealer?.toLowerCase() !== name && t.sourceDealer?.toLowerCase() !== name)
      .reduce((sum, t) => sum + (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0), 0);
    const sales = transactions.filter(t => t.dealer === dealerName && t.type === "Sale").reduce((sum, t) => sum + parseFloat(t.totalAmount || 0), 0) + transferCredit;
    const payments = transactions.filter(t => t.dealer === dealerName && (t.type === "Payment" || t.type === "Cartage" || t.type === "Return"))
      .reduce((sum, t) => sum + (t.type === "Return" ? (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0) : parseFloat(t.amount || 0)), 0) + transferDebit;
    return sales - payments;
  }

  const calculateDealerTotals = (dealerName) => {
    const dealerTransactions = getDealerTransactions(dealerName)
    const sales = dealerTransactions
      .filter(t => t.type === "Sale" || (t.type === "Cartage" && t.paidBy === "Company"))
      .reduce((sum, t) => sum + parseFloat(t.totalAmount || t.amount || 0), 0)
    const payments = dealerTransactions
      .filter(t => t.type === "Payment" || (t.type === "Cartage" && t.paidBy === "Dealer"))
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
    const returns = dealerTransactions
      .filter(t => t.type === "Return")
      .reduce((sum, t) => sum + parseFloat(t.totalAmount || 0), 0)
    const outstanding = sales - payments
    return { sales, payments, returns, outstanding }
  }

  const totalSales = dealers.reduce((sum, dealer) => {
    const { sales } = calculateDealerTotals(dealer.name)
    return sum + sales
  }, 0)

  const totalPayments = dealers.reduce((sum, dealer) => {
    const { payments } = calculateDealerTotals(dealer.name)
    return sum + payments
  }, 0)

  const totalReturns = dealers.reduce((sum, dealer) => {
    const { returns } = calculateDealerTotals(dealer.name)
    return sum + returns
  }, 0)

  const totalOutstanding = totalSales - totalPayments - totalReturns

  const totalUnitsSold = transactions
    .filter(t => t.type === "Sale")
    .reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)

  const totalUnitsReturned = transactions
    .filter(t => t.type === "Return")
    .reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)

  const paymentPercentage = totalSales > 0 ? ((totalPayments / totalSales) * 100).toFixed(1) : 0
  const outstandingPercentage = totalSales > 0 ? ((totalOutstanding / totalSales) * 100).toFixed(1) : 0

  const downloadLedger = (dealer, format) => {
    const dealerTransactions = getDealerTransactions(dealer.name)
    
    if (format === 'pdf') {
      const doc = new jsPDF()
      doc.text(`Ledger for ${dealer.name}`, 20, 10)
      doc.save(`${dealer.name}_ledger.pdf`)
    } else if (format === 'excel') {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(dealerTransactions)
      XLSX.utils.book_append_sheet(wb, ws, "Ledger")
      XLSX.writeFile(wb, `${dealer.name}_ledger.xlsx`)
    }
  }

  const filteredDealers = dealers
    .filter(dealer => {
      const matchesSearch = dealer.name.toLowerCase().includes(searchTerm.toLowerCase())
      const { outstanding } = calculateDealerTotals(dealer.name)
      const matchesBalance = balanceFilter === "all" ||
        (balanceFilter === "positive" && outstanding > 0) ||
        (balanceFilter === "negative" && outstanding < 0) ||
        (balanceFilter === "zero" && outstanding === 0)
      const dealerTx = transactions.filter(t => t.dealer === dealer.name)
      const matchesDate = !date?.from || !date?.to || dealerTx.some(t => {
        const transactionDate = new Date(t.date)
        return transactionDate >= date.from && transactionDate <= date.to
      })
      return matchesSearch && matchesBalance && matchesDate
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === "outstanding") {
        const { outstanding: aOutstanding } = calculateDealerTotals(a.name)
        const { outstanding: bOutstanding } = calculateDealerTotals(b.name)
        comparison = aOutstanding - bOutstanding
      } else if (sortBy === "sales") {
        const { sales: aSales } = calculateDealerTotals(a.name)
        const { sales: bSales } = calculateDealerTotals(b.name)
        comparison = aSales - bSales
      } else if (sortBy === "payments") {
        const { payments: aPayments } = calculateDealerTotals(a.name)
        const { payments: bPayments } = calculateDealerTotals(b.name)
        comparison = aPayments - bPayments
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

  const formatNumber = (number) => {
    if (number === undefined || number === null) return "0"
    return new Intl.NumberFormat('en-US').format(number)
  }

  return (
    <div className="p-6 space-y-6">
      <HeaderWithDashboard>
        <h1 className="text-2xl font-bold">Dealer Ledgers</h1>
        <p className="text-gray-500">View and manage all dealer accounts</p>
      </HeaderWithDashboard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <h2 className="text-3xl font-bold mt-2">{formatNumber(totalSales)}</h2>
              <p className="text-sm text-gray-500 mt-1">{totalUnitsSold} Units Sold</p>
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
              <h2 className={`text-3xl font-bold mt-2 ${totalOutstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                {formatNumber(totalOutstanding)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{outstandingPercentage}% Remaining Payment</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <CreditCard className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search dealers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              className="rounded-md border"
            />
          </PopoverContent>
        </Popover>

        <Select
          value={balanceFilter}
          onChange={(e) => setBalanceFilter(e.target.value)}
          className="w-40"
        >
          <option value="all">All Balances</option>
          <option value="positive">Positive Balance</option>
          <option value="negative">Negative Balance</option>
          <option value="zero">Zero Balance</option>
        </Select>

        <Select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [newSortBy, newSortOrder] = e.target.value.split("-")
            setSortBy(newSortBy)
            setSortOrder(newSortOrder)
          }}
          className="w-40"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="outstanding-asc">Outstanding (Low to High)</option>
          <option value="outstanding-desc">Outstanding (High to Low)</option>
          <option value="sales-asc">Sales (Low to High)</option>
          <option value="sales-desc">Sales (High to Low)</option>
          <option value="payments-asc">Payments (Low to High)</option>
          <option value="payments-desc">Payments (High to Low)</option>
        </Select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-4 font-medium">SN</th>
                <th className="text-left p-4 font-medium">Dealer Name</th>
                <th className="text-right p-4 font-medium">Sales</th>
                <th className="text-right p-4 font-medium">Payments</th>
                <th className="text-right p-4 font-medium">Outstanding</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDealers.map((dealer, index) => {
                const { sales, payments, outstanding } = calculateDealerTotals(dealer.name)
                return (
                  <tr key={index} className="border-b">
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 font-bold text-lg bg-gray-50 rounded text-blue-700">
                      <Link to={`/dealer/${dealer.name}`}>{dealer.name}</Link>
                    </td>
                    <td className="p-4 text-right font-bold">
                      {formatNumber(
                        transactions.filter(t => t.dealer === dealer.name && t.type === "Sale").reduce((sum, t) => sum + parseFloat(t.totalAmount || 0), 0) +
                        transactions.filter(t => t.type === "Transfer" && t.destinationDealer?.toLowerCase() === dealer.name.toLowerCase() && t.dealer?.toLowerCase() !== dealer.name.toLowerCase() && t.sourceDealer?.toLowerCase() !== dealer.name.toLowerCase())
                          .reduce((sum, t) => sum + (parseInt(t.quantity) || 0) * (parseFloat(t.rate) || 0), 0)
                      )}
                    </td>
                    <td className="p-4 text-right font-bold">
                      {formatNumber(payments)}
                    </td>
                    <td className={`p-4 text-right font-bold ${outstanding < 0 ? "text-green-600" : outstanding > 0 ? "text-red-600" : ""}`}> 
                      {formatNumber(calculateDealerOutstanding(transactions, dealer.name))}
                    </td>
                    <td className="p-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => downloadLedger(dealer, 'pdf')}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadLedger(dealer, 'excel')}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Download Excel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
              {filteredDealers.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">
                    No dealers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
