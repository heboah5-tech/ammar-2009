import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Eye, Download, Printer, Save, List, X, Loader2, Pencil, Receipt, Sparkles } from 'lucide-react'
import InvoiceForm from "@/components/invoice-form"
import InvoicePreview from "@/components/invoice-preview"
import InvoiceList from "@/components/invoice-list"
import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore"

interface PersistedInvoice extends Partial<InvoiceData> {
  id?: string
  subtotal?: number
  totalAmount?: number
  discountAmount?: number
  discount?: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

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

  const normalizeInvoice = (raw: PersistedInvoice): InvoiceData => {
    const {
      id: _id,
      totalAmount: _totalAmount,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      subtotal: _subtotal,
      discountAmount: _discountAmount,
      discount,
      discounts,
      items,
      ...rest
    } = raw
    let normalizedDiscounts: InvoiceData["discounts"]
    if (Array.isArray(discounts)) {
      normalizedDiscounts = discounts
    } else if (typeof discount === "number" && discount > 0) {
      normalizedDiscounts = [
        {
          id: "1",
          amount: discount,
          date: rest.date || new Date().toISOString().split("T")[0],
          description: "خصم",
        },
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

  const handleLoadInvoice = (data: PersistedInvoice) => {
    setEditingId(null)
    setInvoiceData(normalizeInvoice(data))
  }

  const handleEditInvoice = (invoice: PersistedInvoice) => {
    setInvoiceData(normalizeInvoice(invoice))
    setEditingId(invoice.id ?? null)
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

  const tabMeta: Record<string, { label: string; sub: string; icon: any; from: string; to: string }> = {
    form: { label: "إنشاء فاتورة", sub: "أدخل بيانات الفاتورة وأصنافها", icon: FileText, from: "from-blue-600", to: "to-indigo-600" },
    preview: { label: "معاينة الفاتورة", sub: "راجع الفاتورة قبل الحفظ والطباعة", icon: Eye, from: "from-purple-600", to: "to-fuchsia-600" },
    list: { label: "قائمة الفواتير", sub: "تصفح وحرّر الفواتير المحفوظة", icon: List, from: "from-emerald-600", to: "to-teal-600" },
  }
  const current = tabMeta[active] || tabMeta.form
  const HeroIcon = current.icon

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="container mx-auto py-6 sm:py-8 px-4">
        <div className="w-full max-w-6xl mx-auto">
          {/* Hero header */}
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${current.from} ${current.to} p-5 sm:p-7 mb-5 sm:mb-7 shadow-xl shadow-slate-300/40 transition-all`}>
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="relative flex items-center gap-4 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <HeroIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm font-medium mb-1">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>نظام الفواتير</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">{current.label}</h1>
                <p className="text-white/85 text-xs sm:text-sm mt-0.5">{current.sub}</p>
              </div>
            </div>
          </div>

          <Tabs value={active} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-5 sm:mb-7 bg-white p-1.5 rounded-2xl shadow-md shadow-slate-200/60 border border-slate-100 h-auto">
              <TabsTrigger
                onClick={() => setActive('form')}
                value="form"
                className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-300/40"
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">النموذج</span>
                <span className="sm:hidden">الإدخال</span>
              </TabsTrigger>
              <TabsTrigger
                onClick={() => setActive('preview')}
                value="preview"
                className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-300/40"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">معاينة</span>
                <span className="sm:hidden">العرض</span>
              </TabsTrigger>
              <TabsTrigger
                onClick={() => setActive('list')}
                value="list"
                className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-300/40"
              >
                <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">القائمة</span>
                <span className="sm:hidden">القوائم</span>
              </TabsTrigger>
            </TabsList>

            {editingId && (
              <div className="mb-5 sm:mb-6 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-l from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 shadow-sm shadow-amber-100/60">
                <div className="flex items-center gap-2.5 text-amber-900">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <Pencil className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs text-amber-700 font-medium">وضع التعديل</p>
                    <p className="text-sm font-bold">تعديل الفاتورة رقم {invoiceData.invoiceNumber}</p>
                  </div>
                </div>
                <Button
                  onClick={handleCancelEdit}
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900 rounded-xl flex items-center gap-1.5 h-9"
                >
                  <X className="w-4 h-4" />
                  <span>إلغاء التعديل</span>
                </Button>
              </div>
            )}

            <TabsContent value="form" className="space-y-4 sm:space-y-6 mt-0">
              <InvoiceForm data={invoiceData} onChange={setInvoiceData} />
            </TabsContent>

            <TabsContent value="preview" className="space-y-4 sm:space-y-6 mt-0">
              <div className="bg-white rounded-2xl shadow-md shadow-slate-200/60 border border-slate-100 p-3 sm:p-4 mb-4 sm:mb-5">
                <div className="flex items-center justify-between gap-3 mb-3 px-1">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-xs sm:text-sm font-semibold">إجراءات الفاتورة</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-500 hidden sm:inline">احفظ ثم حمّل أو اطبع</span>
                </div>
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  <Button
                    onClick={handleSaveToFirestore}
                    disabled={saving}
                    className={`flex-1 sm:flex-none text-white flex items-center justify-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 h-11 font-semibold text-sm sm:text-base shadow-lg transition-all disabled:opacity-60 ${
                      editingId
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200/60'
                        : 'bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-purple-200/60'
                    }`}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'حفظ الفاتورة'}</span>
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    className="flex-1 sm:flex-none bg-gradient-to-br from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white flex items-center justify-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 h-11 font-semibold text-sm sm:text-base shadow-lg shadow-emerald-200/60"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل PDF</span>
                  </Button>
                  <Button
                    onClick={handleGeneratePDF}
                    className="flex-1 sm:flex-none bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 h-11 font-semibold text-sm sm:text-base shadow-lg shadow-blue-200/60"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة</span>
                  </Button>
                </div>
              </div>
              <InvoicePreview data={invoiceData} />
            </TabsContent>

            <TabsContent value="list" className="space-y-4 sm:space-y-6 mt-0">
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
      </div>
    </div>
  )
}
