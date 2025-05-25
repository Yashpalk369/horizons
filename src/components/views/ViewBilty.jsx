
import React, { useState, useEffect } from "react"
import { formatIndianNumber } from "@/lib/utils"

export function ViewBilty() {
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    const cartageTransactions = storedTransactions.filter(t => t.type === "Cartage")
    setTransactions(cartageTransactions)
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Bilty Records</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Date</th>
              <th className="text-left py-2">Bilty Number</th>
              <th className="text-left py-2">Details</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="py-2">{transaction.biltyNumber}</td>
                <td className="py-2">{transaction.details}</td>
                <td className="py-2 text-right">
                  {formatIndianNumber(transaction.amount)}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="4" className="py-4 text-center text-gray-500">
                  No bilty records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
