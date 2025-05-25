import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export function AddDealer() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: ""
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Dealer name is required"
      })
      return
    }

    // Save to localStorage for now
    const dealers = JSON.parse(localStorage.getItem("dealers") || "[]")
    dealers.push(formData)
    localStorage.setItem("dealers", JSON.stringify(dealers))

    toast({
      title: "Success",
      description: "Dealer added successfully"
    })

    setFormData({
      name: "",
      phone: "",
      location: ""
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Dealer Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter dealer name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Enter location"
          />
        </div>

        <Button type="submit" className="w-full">Add Dealer</Button>
      </form>
    </>
  )
}
