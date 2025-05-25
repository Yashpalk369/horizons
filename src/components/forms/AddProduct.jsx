import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export function AddProduct() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    unit: "ml",
    category: "Fertilizers"
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.size) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      })
      return
    }

    // Save to localStorage for now
    const products = JSON.parse(localStorage.getItem("products") || "[]")
    products.push(formData)
    localStorage.setItem("products", JSON.stringify(products))

    toast({
      title: "Success",
      description: "Product added successfully"
    })

    setFormData({
      name: "",
      size: "",
      unit: "ml",
      category: "Fertilizers"
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter product name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="size">Size *</Label>
            <Input
              id="size"
              type="number"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              placeholder="Enter size"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Select
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <option value="ml">ml</option>
              <option value="L">L</option>
              <option value="gm">gm</option>
              <option value="kg">kg</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Fertilizers">Fertilizers</option>
              <option value="Seeds">Seeds</option>
              <option value="Pesticides">Pesticides</option>
              <option value="Fungicide">Fungicide</option>
              <option value="Granules">Granules</option>
              <option value="Herbicude">Herbicude</option>
              <option value="Insecticide">Insecticide</option>
              <option value="PGR">PGR</option>
            </Select>
          </div>
        </div>

        <Button type="submit" className="w-full">Add Product</Button>
      </form>
    </>
  )
}
