"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Trash2, Loader2 } from 'lucide-react'

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
  discount: number
  notes: string
  paymentTerms: string
  totalAmount?: number
  createdAt?: any
}

interface InvoiceListProps {
  refreshTrigger: number
  onLoadInvoice: (invoice: InvoiceData) => void
  setActive:(active:string) => void
}

export default function InvoiceList({ refreshTrigger, onLoadInvoice,setActive }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      
      const invoicesData: InvoiceData[] = []
      querySnapshot.forEach((doc) => {
        invoicesData.push({ id: doc.id, ...doc.data() } as InvoiceData)
      })
      
      setInvoices(invoicesData)
    } catch (error) {
      console.error(" Error fetching invoices:", error)
    
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
      console.error(" Error deleting invoice:", error)
    }
  }

  const handleView = (invoice: InvoiceData) => {
    // Remove Firestore-specific fields before loading
    const { id, totalAmount, createdAt, ...invoiceData } = invoice
    onLoadInvoice(invoiceData as InvoiceData)
    setActive('preview')
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
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-blue-700">
                    فاتورة رقم: {invoice.invoiceNumber}
                  </h3>
                  <span className="text-sm text-slate-500">{invoice.date}</span>
                </div>
                <p className="text-sm text-slate-600">العميل: {invoice.clientName}</p>
                {invoice.totalAmount && (
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
