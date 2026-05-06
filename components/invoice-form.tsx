"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, X } from 'lucide-react'

interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate: string
  companyName: string
  companyAddress: string
  clientName: string
  clientAddress: string
  items: Array<{
    id: string
    description: string
    quantity: number
    price: number
  }>
  discounts: Array<{
    id: string
    amount: number
    date: string
    description: string
  }>
  notes: string
  paymentTerms: string
}

interface InvoiceFormProps {
  data: InvoiceData
  onChange: (data: InvoiceData) => void
}

export default function InvoiceForm({ data, onChange }: InvoiceFormProps) {
  const handleUpdateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const handleAddItem = () => {
    const newItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      price: 0,
    }
    onChange({ ...data, items: [...data.items, newItem] })
  }

  const handleUpdateItem = (id: string, field: string, value: any) => {
    const updatedItems = data.items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    onChange({ ...data, items: updatedItems })
  }

  const handleRemoveItem = (id: string) => {
    onChange({ ...data, items: data.items.filter((item) => item.id !== id) })
  }

  const handleAddDiscount = () => {
    const newDiscount = {
      id: Date.now().toString(),
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      description: "",
    }
    onChange({ ...data, discounts: [...data.discounts, newDiscount] })
  }

  const handleUpdateDiscount = (id: string, field: string, value: any) => {
    const updatedDiscounts = data.discounts.map((discount) =>
      discount.id === id ? { ...discount, [field]: value } : discount
    )
    onChange({ ...data, discounts: updatedDiscounts })
  }

  const handleRemoveDiscount = (id: string) => {
    onChange({ ...data, discounts: data.discounts.filter((discount) => discount.id !== id) })
  }

  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const totalDiscount = data.discounts.reduce((sum, discount) => sum + discount.amount, 0)
  const total = subtotal - totalDiscount

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      {/* Invoice Info */}
      <Card className="border border-slate-200 shadow-md rounded-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">معلومات الفاتورة</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">رقم الفاتورة</label>
              <Input
                value={data.invoiceNumber}
                onChange={(e) => handleUpdateField("invoiceNumber", e.target.value)}
                placeholder="001"
                className="text-right border-slate-300 focus:border-blue-500 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">التاريخ</label>
              <Input
                type="date"
                value={data.date}
                onChange={(e) => handleUpdateField("date", e.target.value)}
                className="text-right border-slate-300 focus:border-blue-500 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                تاريخ الاستحقاق
              </label>
              <Input
                type="date"
                value={data.dueDate}
                onChange={(e) => handleUpdateField("dueDate", e.target.value)}
                className="text-right border-slate-300 focus:border-blue-500 rounded-lg text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company and Client Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border border-slate-200 shadow-md rounded-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">معلومات الشركة</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6 space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">اسم الشركة</label>
              <Input
                value={data.companyName}
                onChange={(e) => handleUpdateField("companyName", e.target.value)}
                placeholder="شركتي"
                className="text-right border-slate-300 focus:border-blue-500 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">العنوان</label>
              <Textarea
                value={data.companyAddress}
                onChange={(e) => handleUpdateField("companyAddress", e.target.value)}
                placeholder="العنوان"
                className="text-right border-slate-300 focus:border-blue-500 rounded-lg resize-none text-sm"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-md rounded-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">معلومات العميل</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6 space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">اسم العميل</label>
              <Input
                value={data.clientName}
                onChange={(e) => handleUpdateField("clientName", e.target.value)}
                placeholder="اسم العميل"
                className="text-right border-slate-300 focus:border-blue-500 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">العنوان</label>
              <Textarea
                value={data.clientAddress}
                onChange={(e) => handleUpdateField("clientAddress", e.target.value)}
                placeholder="عنوان العميل"
                className="text-right border-slate-300 focus:border-blue-500 rounded-lg resize-none text-sm"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card className="border border-slate-200 shadow-md rounded-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3 sm:p-6 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">البنود</CardTitle>
          <Button
            onClick={handleAddItem}
            size="sm"
            className="bg-white text-purple-700 hover:bg-slate-100 flex items-center gap-1 sm:gap-2 font-semibold rounded-lg text-xs sm:text-sm px-2 sm:px-3"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">إضافة بند</span>
            <span className="sm:hidden">إضافة</span>
          </Button>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {data.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-3 items-end p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200 shadow-sm text-sm"
              >
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">الوصف</label>
                  <Input
                    value={item.description}
                    onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                    placeholder="الخدمة/المنتج"
                    className="text-right border-slate-300 focus:border-blue-500 rounded-lg text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">الكمية</label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                    className="text-center border-slate-300 focus:border-blue-500 rounded-lg text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">السعر</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handleUpdateItem(item.id, "price", Number.parseFloat(e.target.value) || 0)}
                    className="text-center border-slate-300 focus:border-blue-500 rounded-lg text-xs sm:text-sm"
                  />
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">المجموع</p>
                  <p className="text-sm sm:text-base font-bold text-blue-700 bg-white p-1.5 sm:p-2 rounded border border-blue-200">
                    {(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
                <Button
                  onClick={() => handleRemoveItem(item.id)}
                  size="sm"
                  variant="destructive"
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 rounded-lg text-xs sm:text-sm h-8 sm:h-10"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 shadow-md rounded-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-3 sm:p-6 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">الدفعات</CardTitle>
          <Button
            onClick={handleAddDiscount}
            size="sm"
            className="bg-white text-orange-700 hover:bg-slate-100 flex items-center gap-1 sm:gap-2 font-semibold rounded-lg text-xs sm:text-sm px-2 sm:px-3"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">إضافة دفعة</span>
            <span className="sm:hidden">إضافة</span>
          </Button>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
          {data.discounts.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-4">لا توجد خصومات. اضغط "إضافة دفعة" لإضافة دفعة جديد</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {data.discounts.map((discount) => (
                <div
                  key={discount.id}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3 items-end p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-slate-200 shadow-sm text-sm"
                >
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">المبلغ</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount.amount}
                      onChange={(e) => handleUpdateDiscount(discount.id, "amount", Number.parseFloat(e.target.value) || 0)}
                      className="text-center border-slate-300 focus:border-orange-500 rounded-lg text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">التاريخ</label>
                    <Input
                      type="date"
                      value={discount.date}
                      onChange={(e) => handleUpdateDiscount(discount.id, "date", e.target.value)}
                      className="text-center border-slate-300 focus:border-orange-500 rounded-lg text-xs sm:text-sm"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">الوصف</label>
                    <Input
                      value={discount.description}
                      onChange={(e) => handleUpdateDiscount(discount.id, "description", e.target.value)}
                      placeholder="سبب الدفعة"
                      className="text-right border-slate-300 focus:border-orange-500 rounded-lg text-xs sm:text-sm"
                    />
                  </div>
                  <Button
                    onClick={() => handleRemoveDiscount(discount.id)}
                    size="sm"
                    variant="destructive"
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 rounded-lg text-xs sm:text-sm h-8 sm:h-10"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Summary Card */}
      <Card className="border border-slate-200 shadow-md rounded-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">الإجمالي</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center text-sm sm:text-base">
            <span className="font-semibold text-slate-700">المجموع الفرعي:</span>
            <span className="font-bold text-slate-900">{subtotal.toFixed(2)}</span>
          </div>
          
          {totalDiscount > 0 && (
            <div className="flex justify-between items-center text-sm sm:text-base">
              <span className="font-semibold text-slate-700">إجمالي 
الدفعات:</span>
              <span className="font-bold text-red-600">-{totalDiscount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="border-t-2 border-slate-300 pt-3 sm:pt-4 flex justify-between items-center">
            <span className="font-bold text-slate-900 text-base sm:text-lg">الإجمالي النهائي:</span>
            <span className="font-bold text-green-700 text-xl sm:text-2xl bg-green-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 border-green-200">
              {total.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notes and Payment Terms */}
      <Card className="border border-slate-200 shadow-md rounded-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">ملاحظات وشروط الدفع</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">ملاحظات</label>
            <Textarea
              value={data.notes}
              onChange={(e) => handleUpdateField("notes", e.target.value)}
              placeholder="أضف أي ملاحظات..."
              className="text-right border-slate-300 focus:border-blue-500 rounded-lg resize-none text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">شروط الدفع</label>
            <Input
              value={data.paymentTerms}
              onChange={(e) => handleUpdateField("paymentTerms", e.target.value)}
              placeholder="الدفع عند الاستلام"
              className="text-right border-slate-300 focus:border-blue-500 rounded-lg text-sm"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
