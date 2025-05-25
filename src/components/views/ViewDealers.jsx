import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { formatIndianNumber, calculateDealerLedgerBalance } from "@/lib/utils"
import { HeaderWithDashboard } from "@/components/ui/HeaderWithDashboard"

export function ViewDealers() {
  const [dealers, setDealers] = useState([])
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    const storedDealers = JSON.parse(localStorage.getItem("dealers") || "[]")
    const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    setDealers(storedDealers)
    setTransactions(storedTransactions)
  }, [])

  return (
    <div className="p-6 space-y-6">
      <HeaderWithDashboard>
        <h1 className="text-2xl font-bold">Dealer Ledgers</h1>
      </HeaderWithDashboard>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Dealer List</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4">Dealer Name</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Location</th>
                  <th className="text-right p-4">Balance</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dealers.map((dealer, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-4">{dealer.name}</td>
                    <td className="p-4">{dealer.phone || "-"}</td>
                    <td className="p-4">{dealer.location || "-"}</td>
                    <td className="p-4 text-right">
                      {formatIndianNumber(calculateDealerLedgerBalance(transactions, dealer.name))}
                    </td>
                    <td className="p-4 text-center">
                      <Link 
                        to={`/dealer/${dealer.name}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Ledger
                      </Link>
                    </td>
                  </tr>
                ))}
                {dealers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500">
                      No dealers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <p className="text-gray-500 mb-6">View and manage all dealer accounts</p>
    </div>
  )
}
