import React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ViewProducts } from "@/components/views/ViewProducts"
import { ViewTransactions } from "@/components/views/ViewTransactions"
import { ViewBilty } from "@/components/views/ViewBilty"
import { Dashboard } from "@/components/Dashboard"
import { DealerLedger } from "@/components/DealerLedger"
import { DealersList } from "@/components/DealersList"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddProduct } from "@/components/forms/AddProduct"
import { AddDealer } from "@/components/forms/AddDealer"
import { AddTransaction } from "@/components/forms/AddTransaction"
import { AddPaymentMode } from "@/components/forms/AddBankAccount"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ViewPayments } from "@/components/views/ViewPayments"
import { HeaderWithDashboard } from "@/components/ui/HeaderWithDashboard"

function Forms() {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultTab = searchParams.get("tab") || "transaction"
  const currentTab = searchParams.get("tab") || "transaction"
  const navigate = useNavigate()

  const handleTabChange = (value) => {
    setSearchParams({ tab: value })
  }

  return (
    <div className="p-6 space-y-6">
      <HeaderWithDashboard tab={currentTab}>
        <h1 className="text-2xl font-bold">Agri Accounting System</h1>
        <p className="text-gray-600">Add and manage your agricultural business data</p>
      </HeaderWithDashboard>
      <Tabs defaultValue={defaultTab} className="space-y-6" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-4 p-1 bg-white rounded-lg shadow">
          <TabsTrigger value="transaction" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">Add Transaction</TabsTrigger>
          <TabsTrigger value="product" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">Add Product</TabsTrigger>
          <TabsTrigger value="dealer" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">Add Dealer</TabsTrigger>
          <TabsTrigger value="bank" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">Add Payment Mode</TabsTrigger>
        </TabsList>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <TabsContent value="transaction" className="mt-0 transition-all duration-200">
            <AddTransaction />
          </TabsContent>
          <TabsContent value="product" className="mt-0 transition-all duration-200">
            <AddProduct />
          </TabsContent>
          <TabsContent value="dealer" className="mt-0 transition-all duration-200">
            <AddDealer />
          </TabsContent>
          <TabsContent value="bank" className="mt-0 transition-all duration-200">
            <AddPaymentMode />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="mx-auto max-w-7xl">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dealers" element={<DealersList />} />
            <Route path="/dealer/:id" element={<DealerLedger />} />
            <Route path="/forms" element={<Forms />} />
            <Route path="/transactions" element={<ViewTransactions />} />
            <Route path="/products" element={<ViewProducts />} />
            <Route path="/payments" element={<ViewPayments />} />
            <Route path="/bilties" element={<ViewBilty />} />
          </Routes>
        </div>
        <Toaster />
      </div>
    </Router>
  )
}
