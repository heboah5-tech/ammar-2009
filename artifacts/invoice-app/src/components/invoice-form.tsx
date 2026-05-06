"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Plus,
  X,
  FileText,
  Building2,
  UserCircle2,
  Package,
  Wallet,
  Calculator,
  StickyNote,
  Hash,
  CalendarDays,
  MapPin,
  Tag,
  Receipt,
  Inbox,
} from "lucide-react"

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

const inputCls =
  "text-right border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 rounded-xl text-sm h-11 transition-colors"

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  from,
  to,
  action,
}: {
  icon: any
  title: string
  subtitle?: string
  from: string
  to: string
  action?: React.ReactNode
}) {
  return (
    <CardHeader
      className={`bg-gradient-to-l ${from} ${to} text-white p-4 sm:p-5 flex flex-row items-center justify-between gap-3`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-base sm:text-lg font-bold truncate">{title}</CardTitle>
          {subtitle && <p className="text-[11px] sm:text-xs text-white/80 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action}
    </CardHeader>
  )
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon?: any
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
        <span>{label}</span>
      </label>
      {children}
    </div>
  )
}

const cardCls = "border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white"

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
    <div className="space-y-5 sm:space-y-6" dir="rtl">
      {/* Invoice meta */}
      <Card className={cardCls}>
        <SectionHeader
          icon={FileText}
          title="معلومات الفاتورة"
          subtitle="رقم الفاتورة وتواريخها"
          from="from-blue-600"
          to="to-indigo-600"
        />
        <CardContent className="pt-5 sm:pt-6 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Field label="رقم الفاتورة" icon={Hash}>
              <Input
                value={data.invoiceNumber}
                onChange={(e) => handleUpdateField("invoiceNumber", e.target.value)}
                placeholder="001"
                className={inputCls}
              />
            </Field>
            <Field label="التاريخ" icon={CalendarDays}>
              <Input
                type="date"
                value={data.date}
                onChange={(e) => handleUpdateField("date", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="تاريخ الاستحقاق" icon={CalendarDays}>
              <Input
                type="date"
                value={data.dueDate}
                onChange={(e) => handleUpdateField("dueDate", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Company + Client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        <Card className={cardCls}>
          <SectionHeader
            icon={Building2}
            title="معلومات الشركة"
            subtitle="بيانات المُرسِل"
            from="from-sky-600"
            to="to-blue-600"
          />
          <CardContent className="pt-5 sm:pt-6 p-4 sm:p-6 space-y-3 sm:space-y-4">
            <Field label="اسم الشركة" icon={Building2}>
              <Input
                value={data.companyName}
                onChange={(e) => handleUpdateField("companyName", e.target.value)}
                placeholder="شركتي"
                className={inputCls}
              />
            </Field>
            <Field label="العنوان" icon={MapPin}>
              <Textarea
                value={data.companyAddress}
                onChange={(e) => handleUpdateField("companyAddress", e.target.value)}
                placeholder="العنوان"
                className="text-right border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 rounded-xl resize-none text-sm transition-colors"
                rows={3}
              />
            </Field>
          </CardContent>
        </Card>

        <Card className={cardCls}>
          <SectionHeader
            icon={UserCircle2}
            title="معلومات العميل"
            subtitle="المُرسَل إليه"
            from="from-emerald-600"
            to="to-teal-600"
          />
          <CardContent className="pt-5 sm:pt-6 p-4 sm:p-6 space-y-3 sm:space-y-4">
            <Field label="اسم العميل" icon={UserCircle2}>
              <Input
                value={data.clientName}
                onChange={(e) => handleUpdateField("clientName", e.target.value)}
                placeholder="اسم العميل"
                className={inputCls}
              />
            </Field>
            <Field label="العنوان" icon={MapPin}>
              <Textarea
                value={data.clientAddress}
                onChange={(e) => handleUpdateField("clientAddress", e.target.value)}
                placeholder="عنوان العميل"
                className="text-right border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-400 rounded-xl resize-none text-sm transition-colors"
                rows={3}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card className={cardCls}>
        <SectionHeader
          icon={Package}
          title="البنود"
          subtitle={`${data.items.length} ${data.items.length === 1 ? "بند" : "بنود"}`}
          from="from-purple-600"
          to="to-fuchsia-600"
          action={
            <Button
              onClick={handleAddItem}
              size="sm"
              className="bg-white/95 text-purple-700 hover:bg-white hover:text-purple-800 flex items-center gap-1.5 font-bold rounded-xl text-xs sm:text-sm h-9 px-3 shadow-md shadow-purple-900/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">إضافة بند</span>
              <span className="sm:hidden">إضافة</span>
            </Button>
          }
        />
        <CardContent className="pt-5 sm:pt-6 p-4 sm:p-6">
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Inbox className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-700 font-semibold mb-1">لا توجد بنود</p>
              <p className="text-sm text-slate-500">اضغط "إضافة بند" لبدء إضافة الأصناف</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {data.items.map((item, idx) => {
                const lineTotal = item.quantity * item.price
                return (
                  <div
                    key={item.id}
                    className="relative grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-end p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-md hover:shadow-purple-100/50 transition-all"
                  >
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                      {idx + 1}
                    </div>
                    <div className="sm:col-span-5">
                      <Field label="الوصف" icon={Tag}>
                        <Input
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                          placeholder="الخدمة/المنتج"
                          className={inputCls}
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="الكمية">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                          className={`${inputCls} text-center`}
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="السعر">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(item.id, "price", Number.parseFloat(e.target.value) || 0)}
                          className={`${inputCls} text-center`}
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="المجموع">
                        <div className="h-11 flex items-center justify-center bg-white rounded-xl border border-purple-200 px-3 font-extrabold text-purple-700 text-sm sm:text-base shadow-sm">
                          {lineTotal.toFixed(2)}
                        </div>
                      </Field>
                    </div>
                    <div className="sm:col-span-1 flex sm:justify-end">
                      <Button
                        onClick={() => handleRemoveItem(item.id)}
                        size="icon"
                        variant="ghost"
                        className="w-full sm:w-11 h-11 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-rose-200"
                        title="حذف البند"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discounts / Payments */}
      <Card className={cardCls}>
        <SectionHeader
          icon={Wallet}
          title="الدفعات"
          subtitle={`${data.discounts.length} ${data.discounts.length === 1 ? "دفعة" : "دفعات"}`}
          from="from-orange-600"
          to="to-rose-600"
          action={
            <Button
              onClick={handleAddDiscount}
              size="sm"
              className="bg-white/95 text-orange-700 hover:bg-white hover:text-orange-800 flex items-center gap-1.5 font-bold rounded-xl text-xs sm:text-sm h-9 px-3 shadow-md shadow-orange-900/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">إضافة دفعة</span>
              <span className="sm:hidden">إضافة</span>
            </Button>
          }
        />
        <CardContent className="pt-5 sm:pt-6 p-4 sm:p-6">
          {data.discounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Wallet className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-700 font-semibold mb-1">لا توجد دفعات</p>
              <p className="text-sm text-slate-500">اضغط "إضافة دفعة" لتسجيل دفعة جديدة</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {data.discounts.map((discount, idx) => (
                <div
                  key={discount.id}
                  className="relative grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-end p-3 sm:p-4 bg-gradient-to-br from-orange-50/60 to-rose-50/40 rounded-2xl border border-orange-200 hover:border-orange-300 hover:shadow-md hover:shadow-orange-100/50 transition-all"
                >
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {idx + 1}
                  </div>
                  <div className="sm:col-span-3">
                    <Field label="المبلغ" icon={Wallet}>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount.amount}
                        onChange={(e) =>
                          handleUpdateDiscount(discount.id, "amount", Number.parseFloat(e.target.value) || 0)
                        }
                        className={`${inputCls} text-center`}
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-3">
                    <Field label="التاريخ" icon={CalendarDays}>
                      <Input
                        type="date"
                        value={discount.date}
                        onChange={(e) => handleUpdateDiscount(discount.id, "date", e.target.value)}
                        className={`${inputCls} text-center`}
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-5">
                    <Field label="الوصف" icon={Tag}>
                      <Input
                        value={discount.description}
                        onChange={(e) => handleUpdateDiscount(discount.id, "description", e.target.value)}
                        placeholder="سبب الدفعة"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-1 flex sm:justify-end">
                    <Button
                      onClick={() => handleRemoveDiscount(discount.id)}
                      size="icon"
                      variant="ghost"
                      className="w-full sm:w-11 h-11 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-rose-200"
                      title="حذف الدفعة"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card className={cardCls}>
        <SectionHeader
          icon={Calculator}
          title="الإجمالي"
          subtitle="ملخص الفاتورة"
          from="from-emerald-600"
          to="to-green-600"
        />
        <CardContent className="pt-5 sm:pt-6 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 rounded-xl px-4 py-3">
                <span className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  المجموع الفرعي
                </span>
                <span className="font-extrabold text-slate-900 tracking-tight">{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between items-center bg-rose-50 rounded-xl px-4 py-3">
                  <span className="flex items-center gap-2 font-semibold text-rose-700 text-sm">
                    <Wallet className="w-4 h-4" />
                    إجمالي الدفعات
                  </span>
                  <span className="font-extrabold text-rose-600 tracking-tight">-{totalDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 shadow-lg shadow-emerald-200/60 relative overflow-hidden">
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <p className="text-emerald-50 text-xs sm:text-sm font-medium opacity-95">الإجمالي النهائي</p>
                  <p className="text-white text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
                    {total.toFixed(2)}
                  </p>
                  <p className="text-emerald-100/90 text-[11px] sm:text-xs mt-0.5">دينار</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className={cardCls}>
        <SectionHeader
          icon={StickyNote}
          title="ملاحظات وشروط الدفع"
          subtitle="معلومات إضافية تظهر على الفاتورة"
          from="from-amber-600"
          to="to-yellow-600"
        />
        <CardContent className="pt-5 sm:pt-6 p-4 sm:p-6 space-y-3 sm:space-y-4">
          <Field label="ملاحظات" icon={StickyNote}>
            <Textarea
              value={data.notes}
              onChange={(e) => handleUpdateField("notes", e.target.value)}
              placeholder="أضف أي ملاحظات..."
              className="text-right border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 rounded-xl resize-none text-sm transition-colors"
              rows={3}
            />
          </Field>
          <Field label="شروط الدفع" icon={Wallet}>
            <Input
              value={data.paymentTerms}
              onChange={(e) => handleUpdateField("paymentTerms", e.target.value)}
              placeholder="الدفع عند الاستلام"
              className={inputCls}
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  )
}
