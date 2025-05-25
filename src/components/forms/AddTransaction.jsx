import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useNavigate } from "react-router-dom"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"

export function AddTransaction() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "Sale",
    dealer: "",
    product: "",
    quantity: "",
    rate: "",
    totalAmount: "",
    bankAccount: "",
    bankSlipNumber: "",
    description: "",
    destinationDealer: "",
    paidBy: "",
    paidByDealer: "",
    paymentMode: "",
    adjustIn: ""
  })
  const [dealers, setDealers] = useState([])
  const [products, setProducts] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [dealerProducts, setDealerProducts] = useState({})
  const [search, setSearch] = useState("")
  const [carryForwardYear, setCarryForwardYear] = useState("")
  const [transactionsChanged, setTransactionsChanged] = useState(false)

  useEffect(() => {
    const storedDealers = JSON.parse(localStorage.getItem("dealers") || "[]")
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]")
    const storedBankAccounts = JSON.parse(localStorage.getItem("bankAccounts") || "[]")
    const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    
    // Calculate total units for each dealer and product, including Transfer logic
    const dealerProductUnits = {}
    storedTransactions.forEach(t => {
      if (t.type === "Sale") {
        if (!dealerProductUnits[t.dealer]) dealerProductUnits[t.dealer] = {}
        if (!dealerProductUnits[t.dealer][t.product]) dealerProductUnits[t.dealer][t.product] = 0
        dealerProductUnits[t.dealer][t.product] += parseInt(t.quantity) || 0
      }
      if (t.type === "Return") {
        if (!dealerProductUnits[t.dealer]) dealerProductUnits[t.dealer] = {}
        if (!dealerProductUnits[t.dealer][t.product]) dealerProductUnits[t.dealer][t.product] = 0
        dealerProductUnits[t.dealer][t.product] -= parseInt(t.quantity) || 0
      }
      if (t.type === "Transfer") {
        // From Dealer: subtract
        if (t.dealer) {
          if (!dealerProductUnits[t.dealer]) dealerProductUnits[t.dealer] = {}
          if (!dealerProductUnits[t.dealer][t.product]) dealerProductUnits[t.dealer][t.product] = 0
          dealerProductUnits[t.dealer][t.product] -= parseInt(t.quantity) || 0
        }
        // To Dealer: add
        if (t.destinationDealer) {
          if (!dealerProductUnits[t.destinationDealer]) dealerProductUnits[t.destinationDealer] = {}
          if (!dealerProductUnits[t.destinationDealer][t.product]) dealerProductUnits[t.destinationDealer][t.product] = 0
          dealerProductUnits[t.destinationDealer][t.product] += parseInt(t.quantity) || 0
        }
      }
    })
    
    setDealerProducts(dealerProductUnits)
    setDealers(storedDealers)
    setProducts(storedProducts)
    setBankAccounts(storedBankAccounts)
  }, [transactionsChanged])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = { ...prev, [name]: value }
      
      if (name === "quantity" || name === "rate") {
        const quantity = name === "quantity" ? value : prev.quantity
        const rate = name === "rate" ? value : prev.rate
        if (quantity && rate) {
          newData.totalAmount = (parseFloat(quantity) * parseFloat(rate)).toString()
        }
      }
      
      if (name === "product" && prev.type === "Return") {
        const availableUnits = dealerProducts[prev.dealer]?.[value] || 0
        if (parseInt(prev.quantity) > availableUnits) {
          toast({
            title: "Warning",
            description: `Only ${availableUnits} units available for return`,
            variant: "destructive"
          })
          newData.quantity = availableUnits.toString()
        }
      }
      
      if (name === "quantity" && prev.type === "Return") {
        const availableUnits = dealerProducts[prev.dealer]?.[prev.product] || 0
        if (parseInt(value) > availableUnits) {
          toast({
            title: "Warning",
            description: `Only ${availableUnits} units available for return`,
            variant: "destructive"
          })
          newData.quantity = availableUnits.toString()
        }
      }
      
      // Validation for Return and Transfer: prevent quantity > available units
      if ((prev.type === "Return" || prev.type === "Transfer") && name === "quantity") {
        const availableUnits = dealerProducts[prev.dealer]?.[prev.product] || 0
        if (parseInt(value) > availableUnits) {
          toast({
            title: "Error",
            description: `You cannot transfer/return more than ${availableUnits} units!`,
            variant: "destructive"
          })
          newData.quantity = availableUnits.toString()
        }
      }
      
      return newData
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Prevent submission if quantity > available units for Return/Transfer
    if ((formData.type === "Return" || formData.type === "Transfer") && parseInt(formData.quantity) > (dealerProducts[formData.dealer]?.[formData.product] || 0)) {
      toast({
        title: "Error",
        description: `You cannot transfer/return more than available units!`,
        variant: "destructive"
      })
      return
    }
    
    try {
      const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      transactions.push(formData)
      localStorage.setItem("transactions", JSON.stringify(transactions))
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: "Sale",
        dealer: "",
        product: "",
        quantity: "",
        rate: "",
        totalAmount: "",
        bankAccount: "",
        bankSlipNumber: "",
        description: "",
        destinationDealer: "",
        paidBy: "",
        paidByDealer: "",
        paymentMode: "",
        adjustIn: ""
      })
      setTransactionsChanged(tc => !tc)
      
      toast({
        title: "Success",
        description: "Transaction added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      })
    }
  }

  const getProductLabel = (productName) => {
    const prod = products.find(p => p.name === productName)
    if (!prod) return productName
    return prod.size && prod.unit ? `${prod.name} - ${prod.size}${prod.unit}` : prod.name
  }

  // Sort dealers A-Z
  const sortedDealers = [...dealers].sort((a, b) => a.name.localeCompare(b.name))
  // Custom bank account order
  const bankOrder = [
    'NCS MBL', 'NCS MCB', 'NCS HMB', 'NCS BAFL', 'NCS AKBL', 'NCS BIPL',
    'Y10 HMB', 'NY GROUP BAHL', 'NY GROUP FBL', 'NY GROUP SNBL'
  ]
  const sortedBankAccounts = [...bankAccounts].sort((a, b) => {
    const aIndex = bankOrder.findIndex(prefix => (a.accountWithBank || a.accountTitle || '').startsWith(prefix))
    const bIndex = bankOrder.findIndex(prefix => (b.accountWithBank || b.accountTitle || '').startsWith(prefix))
    if (aIndex === -1 && bIndex === -1) return (a.accountWithBank || a.accountTitle || '').localeCompare(b.accountWithBank || b.accountTitle || '')
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <DatePicker
              selected={formData.date ? new Date(formData.date) : undefined}
              onSelect={date => {
                if (date) {
                  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                  setFormData(prev => ({ ...prev, date: localDate.toISOString().split('T')[0] }))
                }
              }}
            />
          </div>
          
          <div>
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="Sale">Sale</option>
              <option value="Payment">Payment</option>
              <option value="Return">Return</option>
              <option value="Cartage">Cartage</option>
              <option value="Transfer">Transfer</option>
              <option value="Carry Forward">Carry Forward</option>
            </Select>
          </div>

          {/* Only show Dealer field if not Transfer */}
          {formData.type !== "Transfer" && (
            <div>
              <Label htmlFor="dealer">Dealer</Label>
              <Select
                id="dealer"
                name="dealer"
                value={formData.dealer}
                onChange={handleChange}
                required
              >
                <option value="">Select Dealer</option>
                {sortedDealers.map((dealer, index) => (
                  <option key={index} value={dealer.name}>{dealer.name}{dealer.location ? ` - ${dealer.location}` : ''}</option>
                ))}
              </Select>
            </div>
          )}

          {formData.type === "Payment" && formData.type !== "Carry Forward" && (
            <>
              <div>
                <Label htmlFor="paymentMode">Payment Mode</Label>
                <Select
                  id="paymentMode"
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={e => setFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
                  required
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Third Party">Third Party</option>
                  <option value="Cheq">Cheq</option>
                  <option value="Cash">Cash</option>
                  <option value="Adjustment">Adjustment</option>
                </Select>
              </div>
              {formData.paymentMode === "Bank Transfer" && (
                <>
                  <div>
                    <Label htmlFor="bankAccount">Bank Account</Label>
                    <Select
                      id="bankAccount"
                      name="bankAccount"
                      value={formData.bankAccount}
                      onChange={handleChange}
                      required
                      className="text-black bg-white"
                    >
                      <option value="">Select Bank Account</option>
                      {sortedBankAccounts.map((account, index) => (
                        <option key={index} value={account.accountWithBank || account.accountTitle}>
                          {(account.accountWithBank || account.accountTitle) + (account.accountNumber ? ` - ${account.accountNumber}` : '')}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="transactionId">Slip Number / TID</Label>
                    <Input
                      type="text"
                      id="transactionId"
                      name="transactionId"
                      value={formData.transactionId || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}
              {formData.paymentMode === "Third Party" && (
                <>
                  <div>
                    <Label htmlFor="accountTitle">Account Title</Label>
                    <Input
                      type="text"
                      id="accountTitle"
                      name="accountTitle"
                      value={formData.accountTitle || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="transactionId">Slip Number / TID</Label>
                    <Input
                      type="text"
                      id="transactionId"
                      name="transactionId"
                      value={formData.transactionId || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}
              {formData.paymentMode === "Cheq" && (
                <>
                  <div>
                    <Label htmlFor="cheqNumber">Cheq Number</Label>
                    <Input
                      type="text"
                      id="cheqNumber"
                      name="cheqNumber"
                      value={formData.cheqNumber || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="receiverName">Receiver Name</Label>
                    <Input
                      type="text"
                      id="receiverName"
                      name="receiverName"
                      value={formData.receiverName || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}
              {formData.paymentMode === "Cash" && (
                <div>
                  <Label htmlFor="receiverName">Receiver Name</Label>
                  <Input
                    type="text"
                    id="receiverName"
                    name="receiverName"
                    value={formData.receiverName || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
              {formData.paymentMode === "Adjustment" && (
                <div>
                  <Label htmlFor="adjustIn">Adjust in</Label>
                  <Select
                    id="adjustIn"
                    name="adjustIn"
                    value={formData.adjustIn}
                    onChange={e => setFormData(prev => ({ ...prev, adjustIn: e.target.value }))}
                    required
                  >
                    <option value="">Select Adjustment Type</option>
                    <option value="Salary">Salary</option>
                    <option value="Expense">Expense</option>
                    <option value="Incentive">Incentive</option>
                    <option value="Misc">Misc</option>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter Description"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          {formData.type === "Sale" && formData.type !== "Carry Forward" && (
            <>
              <div>
                <Label htmlFor="product">Product</Label>
                <Select
                  id="product"
                  name="product"
                  value={formData.product}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product, index) => (
                    <option key={index} value={product.name}>{product.name} - {product.sizeUnit}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="rate">Rate</Label>
                <Input
                  type="number"
                  id="rate"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="warehouse">Warehouse</Label>
                <Select
                  id="warehouse"
                  name="warehouse"
                  value={formData.warehouse}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Warehouse</option>
                  <option value="Hyderabad WH">Hyderabad WH</option>
                  <option value="Quetta WH">Quetta WH</option>
                  <option value="Karachi WH">Karachi WH</option>
                  <option value="Direct Supply">Direct Supply</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input
                  type="number"
                  id="totalAmount"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="biltyNumber">Bilty Number</Label>
                <Input
                  type="text"
                  id="biltyNumber"
                  name="biltyNumber"
                  value={formData.biltyNumber}
                  onChange={handleChange}
                  placeholder="Enter Bilty Number"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter Description"
                />
              </div>
            </>
          )}

          {formData.type === "Return" && formData.type !== "Carry Forward" && (
            <>
              <div>
                <Label htmlFor="product">Product</Label>
                <Select
                  id="product"
                  name="product"
                  value={formData.product}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product, index) => (
                    <option key={index} value={product.name}>
                      {product.name} 
                      {formData.dealer && ` (Available: ${dealerProducts[formData.dealer]?.[product.name] || 0} units)`}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="rate">Rate</Label>
                <Input
                  type="number"
                  id="rate"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="destinationDealer">Destination</Label>
                <Select
                  id="destinationDealer"
                  name="destinationDealer"
                  value={formData.destinationDealer}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Destination</option>
                  <option value="Hyderabad WH">Hyderabad WH</option>
                  <option value="Karachi Warehouse">Karachi Warehouse</option>
                  <option value="Quetta Warehouse">Quetta Warehouse</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter Description"
                  required
                />
              </div>

              <div>
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input
                  type="number"
                  id="totalAmount"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          {formData.type === "Cartage" && formData.type !== "Carry Forward" && (
            <>
              <div>
                <Label htmlFor="paidBy">Paid By</Label>
                <Select
                  id="paidBy"
                  name="paidBy"
                  value={formData.paidBy}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Paid By</option>
                  <option value="Company">Company</option>
                  <option value="Dealer">Dealer</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter Description"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          {formData.type === "Transfer" && (
            <>
              <div>
                <Label htmlFor="dealer">From Dealer</Label>
                <Select
                  id="dealer"
                  name="dealer"
                  value={formData.dealer}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select From Dealer</option>
                  {sortedDealers.map((dealer, index) => (
                    <option key={index} value={dealer.name}>{dealer.name}{dealer.location ? ` - ${dealer.location}` : ''}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="product">Product</Label>
                <Select
                  id="product"
                  name="product"
                  value={formData.product}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product, index) => (
                    <option key={index} value={product.name}>
                      {product.name} 
                      {formData.dealer && ` (Available: ${dealerProducts[formData.dealer]?.[product.name] || 0} units)`}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="rate">Rate</Label>
                <Input
                  type="number"
                  id="rate"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="destinationDealer">To Dealer</Label>
                <Select
                  id="destinationDealer"
                  name="destinationDealer"
                  value={formData.destinationDealer}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select To Dealer</option>
                  {dealers.map((dealer, index) => (
                    <option key={index} value={dealer.name}>{dealer.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter Description"
                  required
                />
              </div>

              <div>
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input
                  type="number"
                  id="totalAmount"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          {formData.type === "Carry Forward" && (
            <>
              <div>
                <Label htmlFor="dealer">Dealer</Label>
                <Select
                  id="dealer"
                  name="dealer"
                  value={formData.dealer}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Dealer</option>
                  {dealers.map((dealer, index) => (
                    <option key={index} value={dealer.name}>{dealer.name}{dealer.location ? ` - ${dealer.location}` : ''}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="carryForwardYear">Year</Label>
                <Input
                  id="carryForwardYear"
                  name="carryForwardYear"
                  value={carryForwardYear}
                  onChange={e => setCarryForwardYear(e.target.value)}
                  placeholder="Enter Year"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter Description"
                />
              </div>
            </>
          )}
        </div>

        <Button type="submit" className="w-full">
          Add Transaction
        </Button>
      </form>
    </>
  )
}
