import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2, Loader2 } from 'lucide-react'

interface InvoiceData {
  id?: string
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
  totalAmount?: number
  createdAt?: any
}

interface InvoiceListProps {
  refreshTrigger: number
  onLoadInvoice: (invoice: InvoiceData) => void
  onEditInvoice: (invoice: InvoiceData) => void
  setActive: (active: string) => void
  editingId: string | null
}

export default function InvoiceList({
  refreshTrigger,
  onLoadInvoice,
  onEditInvoice,
  setActive,
  editingId,
}: InvoiceListProps) {
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const invoicesData: InvoiceData[] = []
      querySnapshot.forEach((d) => {
        invoicesData.push({ id: d.id, ...d.data() } as InvoiceData)
      })
      setInvoices(invoicesData)
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [refreshTrigger])

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`هل أنت متأكد من حذف الفاتورة رقم ${invoiceNumber}؟`)) {
      return
    }
    try {
      await deleteDoc(doc(db, "invoices", id))
      fetchInvoices()
    } catch (error) {
      console.error("Error deleting invoice:", error)
    }
  }

  const handleView = (invoice: InvoiceData) => {
    const { id, totalAmount, createdAt, ...invoiceData } = invoice
    onLoadInvoice(invoiceData as InvoiceData)
    setActive('preview')
  }

  const handleEdit = (invoice: InvoiceData) => {
    onEditInvoice(invoice)
    setActive('form')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>قائمة الفواتير</CardTitle>
          <CardDescription>لا توجد فواتير محفوظة</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-slate-500">
          قم بإنشاء فاتورة جديدة وحفظها لرؤيتها هنا
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>قائمة الفواتير</CardTitle>
        <CardDescription>جميع الفواتير المحفوظة ({invoices.length})</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const isEditing = editingId === invoice.id
            return (
              <div
                key={invoice.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  isEditing
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-bold text-blue-700">فاتورة رقم: {invoice.invoiceNumber}</h3>
                    <span className="text-sm text-slate-500">{invoice.date}</span>
                    {isEditing && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        قيد التعديل
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">العميل: {invoice.clientName}</p>
                  {invoice.totalAmount !== undefined && (
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      المجموع: {invoice.totalAmount.toFixed(2)} دينار
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleView(invoice)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">عرض</span>
                  </Button>
                  <Button
                    onClick={() => handleEdit(invoice)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="hidden sm:inline">تعديل</span>
                  </Button>
                  <Button
                    onClick={() => handleDelete(invoice.id!, invoice.invoiceNumber)}
                    size="sm"
                    variant="destructive"
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">حذف</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
