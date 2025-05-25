import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { MoreVertical, Package2 } from "lucide-react"
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

export function ViewProducts() {
  const { toast } = useToast()
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editProduct, setEditProduct] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]")
    setProducts(storedProducts)
  }, [])

  const handleEdit = (product) => {
    setEditProduct(product)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index)
    localStorage.setItem("products", JSON.stringify(updatedProducts))
    setProducts(updatedProducts)
    setDeleteConfirm(null)
    toast({
      title: "Success",
      description: "Product deleted successfully"
    })
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editProduct.name || !editProduct.size) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      })
      return
    }

    const updatedProducts = products.map(p => 
      p === editProduct ? editProduct : p
    )
    localStorage.setItem("products", JSON.stringify(updatedProducts))
    setProducts(updatedProducts)
    setIsEditDialogOpen(false)
    setEditProduct(null)
    toast({
      title: "Success",
      description: "Product updated successfully"
    })
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <HeaderWithDashboard>
        <h1 className="text-2xl font-bold">Products</h1>
      </HeaderWithDashboard>

      <div className="relative">
        <Package2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search products..."
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
                <th className="text-left p-4 font-medium">Product Name</th>
                <th className="text-left p-4 font-medium">Size</th>
                <th className="text-left p-4 font-medium">Unit</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr
                  key={index}
                  className="border-b transition-colors duration-200 hover:bg-gray-50"
                >
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4">{product.name}</td>
                  <td className="p-4">{product.size}</td>
                  <td className="p-4">{product.unit}</td>
                  <td className="p-4">{product.category}</td>
                  <td className="p-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteConfirm(index)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Product</AlertDialogTitle>
          </AlertDialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={editProduct?.name || ""}
                onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Size *</Label>
                <Input
                  id="size"
                  type="number"
                  value={editProduct?.size || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, size: e.target.value })}
                  placeholder="Enter size"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  id="unit"
                  value={editProduct?.unit || "ml"}
                  onChange={(e) => setEditProduct({ ...editProduct, unit: e.target.value })}
                >
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                  <option value="gm">gm</option>
                  <option value="kg">kg</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                value={editProduct?.category || "Fertilizers"}
                onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
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
              This action cannot be undone. This will permanently delete the product.
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
