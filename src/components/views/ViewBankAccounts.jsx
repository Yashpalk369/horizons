import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { MoreVertical, BadgeInfo } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { HeaderWithDashboard } from "@/components/ui/HeaderWithDashboard"

export function ViewBankAccounts() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [bankAccounts, setBankAccounts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editAccount, setEditAccount] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      const storedAccounts = JSON.parse(localStorage.getItem("bankAccounts") || "[]")
      setBankAccounts(storedAccounts)
    } catch (e) {
      setError("Failed to load bank accounts: " + e.message)
    }
  }, [])

  const handleEdit = (account) => {
    setEditAccount(account)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (accountNumber) => {
    const updatedAccounts = bankAccounts.filter((a) => a.accountNumber !== accountNumber)
    localStorage.setItem("bankAccounts", JSON.stringify(updatedAccounts))
    setBankAccounts(updatedAccounts)
    setDeleteConfirm(null)
    toast({
      title: "Success",
      description: "Bank account deleted successfully"
    })
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editAccount?.name || !editAccount?.accountNumber) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      })
      return
    }
    const updatedAccounts = bankAccounts.map(a =>
      a.accountNumber === editAccount.accountNumber ? editAccount : a
    )
    localStorage.setItem("bankAccounts", JSON.stringify(updatedAccounts))
    setBankAccounts(updatedAccounts)
    setIsEditDialogOpen(false)
    setEditAccount(null)
    toast({
      title: "Success",
      description: "Bank account updated successfully"
    })
  }

  const filteredAccounts = bankAccounts.filter(account =>
    account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountNumber?.includes(searchTerm)
  )

  // DEBUG fallback
  if (error) return <div style={{color:'red',padding:'2rem'}}>Error: {error}</div>
  if (!Array.isArray(bankAccounts)) return <div style={{color:'red',padding:'2rem'}}>bankAccounts is not an array</div>

  return (
    <div className="p-6 space-y-6">
      <HeaderWithDashboard>
        <h1 className="text-2xl font-bold">Bank Accounts</h1>
        <p className="text-gray-500">View and manage all bank accounts</p>
      </HeaderWithDashboard>

      <div className="relative">
        <BadgeInfo className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search bank accounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-4 font-medium">SN</th>
                <th className="text-left p-4 font-medium">Bank Name</th>
                <th className="text-left p-4 font-medium">Account Number</th>
                <th className="text-left p-4 font-medium">Branch</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account, index) => (
                <tr
                  key={account.accountNumber || index}
                  className="border-b transition-colors duration-200 hover:bg-gray-50"
                >
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4">{account.name}</td>
                  <td className="p-4">{account.accountNumber}</td>
                  <td className="p-4">{account.branch}</td>
                  <td className="p-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(account)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteConfirm(account.accountNumber)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
                    No bank accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Bank Account</AlertDialogTitle>
          </AlertDialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bank Name *</Label>
              <Input
                id="name"
                value={editAccount?.name || ""}
                onChange={(e) => setEditAccount({ ...editAccount, name: e.target.value })}
                placeholder="Enter bank name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                value={editAccount?.accountNumber || ""}
                onChange={(e) => setEditAccount({ ...editAccount, accountNumber: e.target.value })}
                placeholder="Enter account number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                value={editAccount?.branch || ""}
                onChange={(e) => setEditAccount({ ...editAccount, branch: e.target.value })}
                placeholder="Enter branch name"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction type="submit">Save Changes</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bank account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
