import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export function AddPaymentMode() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    accountTitle: "",
    accountNumber: "",
    bank: "",
    accountWithBank: ""
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.accountTitle || !formData.accountNumber || !formData.bank || !formData.accountWithBank) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      })
      return
    }

    // Save to localStorage for now
    const accounts = JSON.parse(localStorage.getItem("bankAccounts") || "[]")
    accounts.push(formData)
    localStorage.setItem("bankAccounts", JSON.stringify(accounts))

    toast({
      title: "Success",
      description: "Payment mode added successfully"
    })

    setFormData({
      accountTitle: "",
      accountNumber: "",
      bank: "",
      accountWithBank: ""
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accountTitle">Account Title *</Label>
          <Input
            id="accountTitle"
            value={formData.accountTitle}
            onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
            placeholder="Enter account title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number *</Label>
          <Input
            id="accountNumber"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            placeholder="Enter account number"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank">Bank *</Label>
          <Input
            id="bank"
            value={formData.bank}
            onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
            placeholder="Enter bank name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountWithBank">Account with Bank *</Label>
          <Input
            id="accountWithBank"
            value={formData.accountWithBank}
            onChange={(e) => setFormData({ ...formData, accountWithBank: e.target.value })}
            placeholder="Enter account with bank (e.g. NCS MCB)"
            required
          />
        </div>

        <Button type="submit" className="w-full">Add Payment Mode</Button>
      </form>
    </>
  )
}
