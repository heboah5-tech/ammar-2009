import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Eye, Download, Printer, Save, List, X, Loader2, Pencil } from 'lucide-react'
import InvoiceForm from "@/components/invoice-form"
import InvoicePreview from "@/components/invoice-preview"
import InvoiceList from "@/components/invoice-list"
import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore"

interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate: string
  companyName: string
  companyAddress: string
  clientName: string
  clientAddress: string
  items: Array<{ id: string; description: string; quantity: number; price: number }>
  discounts: Array<{ id: string; amount: number; date: string; description: string }>
  notes: string
  paymentTerms: string
}

const initialInvoiceData: InvoiceData = {
  invoiceNumber: "001",
  date: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  companyName: "شركتي",
  companyAddress: "العنوان",
  clientName: "اسم العميل",
  clientAddress: "عنوان العميل",
  items: [{ id: "1", description: "الخدمة/المنتج", quantity: 1, price: 100 }],
  discounts: [],
  notes: "شكرا على تعاملكم معنا",
  paymentTerms: "الدفع عند الاستلام",
}

export default function InvoicesPage() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(initialInvoiceData)
  const [refreshList, setRefreshList] = useState(0)
  const [active, setActive] = useState('form')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const normalizeInvoice = (raw: any): InvoiceData => {
    const { id, totalAmount, createdAt, updatedAt, subtotal, discountAmount, discount, discounts, items, ...rest } = raw || {}
    let normalizedDiscounts: InvoiceData["discounts"]
    if (Array.isArray(discounts)) {
      normalizedDiscounts = discounts
    } else if (typeof discount === "number" && discount > 0) {
      normalizedDiscounts = [
        { id: "1", amount: discount, date: rest.date || new Date().toISOString().split("T")[0], description: "خصم" },
      ]
    } else {
      normalizedDiscounts = []
    }
    return {
      ...initialInvoiceData,
      ...rest,
      items: Array.isArray(items) && items.length > 0 ? items : initialInvoiceData.items,
      discounts: normalizedDiscounts,
    }
  }

  const handleLoadInvoice = (data: InvoiceData) => {
    setEditingId(null)
    setInvoiceData(normalizeInvoice(data))
  }

  const handleEditInvoice = (invoice: InvoiceData & { id?: string; totalAmount?: number; createdAt?: any }) => {
    const id = (invoice as any).id
    setInvoiceData(normalizeInvoice(invoice))
    setEditingId(id || null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setInvoiceData(initialInvoiceData)
  }

  const handleSaveToFirestore = async () => {
    setSaving(true)
    try {
      const subtotal = invoiceData.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
      const discountAmount = invoiceData.discounts.reduce((sum, d) => sum + d.amount, 0)
      const totalAmount = subtotal - discountAmount

      if (editingId) {
        await updateDoc(doc(db, "invoices", editingId), {
          ...invoiceData,
          subtotal,
          discountAmount,
          totalAmount,
          updatedAt: Timestamp.now(),
        })
        alert("تم تحديث الفاتورة بنجاح")
      } else {
        await addDoc(collection(db, "invoices"), {
          ...invoiceData,
          subtotal,
          discountAmount,
          totalAmount,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        alert("تم حفظ الفاتورة بنجاح")
      }
      setEditingId(null)
      setRefreshList(prev => prev + 1)
    } catch (error) {
      console.error("Error saving invoice:", error)
      alert("خطأ في حفظ الفاتورة")
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePDF = () => {
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
    const discountAmount = invoiceData.discounts.reduce((sum, d) => sum + d.amount, 0)
    const totalAmount = subtotal - discountAmount
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>فاتورة - ${invoiceData.invoiceNumber}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Arial',sans-serif;background:white;padding:0;}
        .invoice{background:white;max-width:800px;margin:0 auto;padding:48px;}
        .header{border-bottom:4px solid #1e3a8a;padding-bottom:24px;margin-bottom:32px;}
        .header-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
        .company-info h2{font-size:20px;color:#1e3a8a;font-weight:bold;}
        .company-info p{font-size:12px;color:#4b5563;margin:4px 0;}
        .invoice-title-section{text-align:left;}
        .invoice-title{font-size:14px;font-weight:bold;color:#1e3a8a;}
        .client-info{margin-bottom:24px;}
        .client-info p{font-size:13px;color:#1e3a8a;font-weight:bold;margin-bottom:12px;}
        table{width:100%;margin:24px 0;border-collapse:collapse;}
        th{background:#f3f4f6;color:#1e3a8a;padding:12px;text-align:right;font-weight:bold;font-size:13px;border:2px solid #9ca3af;}
        td{padding:12px;border:2px solid #9ca3af;font-size:12px;}
        td:first-child{text-align:right;}
        td:not(:first-child){text-align:center;}
        .total-section{display:flex;font-weight:bold;border:2px solid #9ca3af;font-size:12px;margin-bottom:12px;}
        .total-amount{width:25%;padding:12px;text-align:center;background:#f3f4f6;border-right:2px solid #9ca3af;}
        .total-label{flex:1;padding:12px;text-align:right;}
        @media print{body{background:white;padding:0;margin:0;}.invoice{padding:0;}}
      </style></head><body>
      <div class="invoice">
        <div class="header"><div class="header-top">
          <div class="company-info"><h2>مختبر نورمار</h2><p>NORMAR DIGITAL DENTAL INDUSTRY LAB</p><p>الرمثا - قرب المدرسة الثانوية - هاتف: 0798719058</p></div>
          <div class="invoice-title-section"><p class="invoice-title">فاتورة</p><p style="font-size:11px;color:#666;margin-top:8px;">رقم: <strong>${invoiceData.invoiceNumber}</strong></p><p style="font-size:11px;color:#666;">التاريخ: <strong>${invoiceData.date}</strong></p></div>
        </div></div>
        <div class="client-info"><p>المطلوب من السيد / السادة: <span style="color:#333;">${invoiceData.clientName}</span></p></div>
        <table><thead><tr><th>السعر الإجمالي (دينار)</th><th>السعر</th><th>العدد</th><th>البيان</th></tr></thead><tbody>
        ${invoiceData.items.map(item => `<tr><td style="text-align:center;font-weight:bold;">${(item.quantity*item.price).toFixed(2)}</td><td>${item.price.toFixed(2)}</td><td>${item.quantity}</td><td>${item.description}</td></tr>`).join('')}
        </tbody></table>
        <div class="total-section"><div class="total-amount">${subtotal.toFixed(2)}</div><div class="total-label">المجموع الفرعي</div></div>
        ${invoiceData.discounts.map(d => `<div class="total-section"><div class="total-amount" style="color:#dc2626;">-${d.amount.toFixed(2)}</div><div class="total-label">دفعة: ${d.description} (${d.date})</div></div>`).join('')}
        <div class="total-section" style="background:#f9fafb;"><div class="total-amount" style="font-size:14px;font-weight:bold;color:#1e3a8a;">${totalAmount.toFixed(2)}</div><div class="total-label" style="font-size:14px;font-weight:bold;">المجموع الكلي</div></div>
      </div><script>setTimeout(()=>window.print(),500)</script></body></html>
    `)
    printWindow.document.close()
  }

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf")
      const html2canvas = (await import("html2canvas")).default
      const element = document.getElementById("invoice-preview")
      if (!element) return
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`فاتورة-${invoiceData.invoiceNumber}.pdf`)
    } catch (error) {
      console.error("خطأ في إنشاء PDF:", error)
    }
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4">
      <Tabs value={active} className="w-full max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger onClick={() => setActive('form')} value="form" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded text-xs sm:text-sm">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">النموذج</span><span className="sm:hidden">الإدخال</span>
          </TabsTrigger>
          <TabsTrigger onClick={() => setActive('preview')} value="preview" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded text-xs sm:text-sm">
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">معاينة</span><span className="sm:hidden">العرض</span>
          </TabsTrigger>
          <TabsTrigger onClick={() => setActive('list')} value="list" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded text-xs sm:text-sm">
            <List className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">القائمة</span><span className="sm:hidden">القوائم</span>
          </TabsTrigger>
        </TabsList>

        {editingId && (
          <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-amber-800">
              <Pencil className="w-4 h-4" />
              <span className="text-sm font-semibold">
                وضع التعديل — تقوم حالياً بتعديل الفاتورة رقم {invoiceData.invoiceNumber}
              </span>
            </div>
            <Button
              onClick={handleCancelEdit}
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-900 rounded-lg flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>إلغاء التعديل</span>
            </Button>
          </div>
        )}

        <TabsContent value="form" className="space-y-4 sm:space-y-6">
          <InvoiceForm data={invoiceData} onChange={setInvoiceData} />
        </TabsContent>

        <TabsContent value="preview" className="space-y-4 sm:space-y-6">
          <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
            <Button
              onClick={handleSaveToFirestore}
              disabled={saving}
              className={`flex-1 sm:flex-none ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'} text-white flex items-center justify-center gap-2 rounded-lg px-3 sm:px-6 py-2 font-medium text-sm sm:text-base`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{editingId ? 'حفظ التعديلات' : 'حفظ'}</span>
            </Button>
            <Button onClick={handleDownloadPDF} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 rounded-lg px-3 sm:px-6 py-2 font-medium text-sm sm:text-base">
              <Download className="w-4 h-4" /><span>تحميل PDF</span>
            </Button>
            <Button onClick={handleGeneratePDF} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 rounded-lg px-3 sm:px-6 py-2 font-medium text-sm sm:text-base">
              <Printer className="w-4 h-4" /><span>طباعة</span>
            </Button>
          </div>
          <InvoicePreview data={invoiceData} />
        </TabsContent>

        <TabsContent value="list" className="space-y-4 sm:space-y-6">
          <InvoiceList
            refreshTrigger={refreshList}
            onLoadInvoice={handleLoadInvoice}
            onEditInvoice={handleEditInvoice}
            setActive={setActive}
            editingId={editingId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
