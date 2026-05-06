import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Pencil,
  X,
  Stethoscope,
  Wallet,
  TrendingDown,
  PiggyBank,
  User,
  UserCircle2,
  Briefcase,
  Hash,
  Palette,
  CalendarDays,
  Inbox,
  Search,
  FilterX,
  FileDown,
  FileSpreadsheet,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore"

interface DentalWork {
  id?: string
  doctorName: string
  workType: string
  teethCount: number
  color: string
  patientName: string
  generalCost: number
  materialCost: number
  date: string
  createdAt?: any
}

const emptyForm = (): DentalWork => ({
  doctorName: "",
  workType: "",
  teethCount: 1,
  color: "",
  patientName: "",
  generalCost: 0,
  materialCost: 0,
  date: new Date().toISOString().split("T")[0],
})

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any
  label: string
  value: string
  tone: "blue" | "orange" | "green" | "red"
}) {
  const tones = {
    blue: "from-blue-500 to-blue-600 text-blue-100",
    orange: "from-amber-500 to-orange-600 text-orange-100",
    green: "from-emerald-500 to-emerald-600 text-emerald-100",
    red: "from-rose-500 to-red-600 text-rose-100",
  } as const
  return (
    <div
      className={`bg-gradient-to-br ${tones[tone]} rounded-2xl p-4 sm:p-5 shadow-lg shadow-slate-200/60 relative overflow-hidden`}
    >
      <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium opacity-90">{label}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">{value}</p>
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
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

const inputCls =
  "text-right border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 rounded-xl text-sm h-11 transition-colors"

export default function DentalWorkPage() {
  const [works, setWorks] = useState<DentalWork[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState<DentalWork>(emptyForm())

  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [exportingPdf, setExportingPdf] = useState(false)
  const exportRef = useRef<HTMLDivElement | null>(null)
  const [doctorSortKey, setDoctorSortKey] = useState<"name" | "remaining" | "count">("remaining")
  const [doctorSortDir, setDoctorSortDir] = useState<"asc" | "desc">("desc")

  const fetchData = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, "dentalWorks"), orderBy("createdAt", "desc"))
      const snap = await getDocs(q)
      const data: DentalWork[] = []
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as DentalWork))
      setWorks(data)
    } catch (e) {
      console.error("Error fetching dental works:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formRemaining = (form.generalCost || 0) - (form.materialCost || 0)

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredWorks = works.filter((w) => {
    if (normalizedSearch) {
      const haystack = [w.doctorName, w.patientName, w.workType]
        .map((v) => (v || "").toLowerCase())
        .join(" ")
      if (!haystack.includes(normalizedSearch)) return false
    }
    if (dateFrom && (!w.date || w.date < dateFrom)) return false
    if (dateTo && (!w.date || w.date > dateTo)) return false
    return true
  })

  const totalGeneral = filteredWorks.reduce((s, w) => s + (w.generalCost || 0), 0)
  const totalMaterial = filteredWorks.reduce((s, w) => s + (w.materialCost || 0), 0)
  const totalRemaining = totalGeneral - totalMaterial

  // Per-doctor summary respects ONLY the date filter so the user can always
  // see every doctor in the active period, regardless of the search term.
  const dateFilteredWorks = works.filter((w) => {
    if (dateFrom && (!w.date || w.date < dateFrom)) return false
    if (dateTo && (!w.date || w.date > dateTo)) return false
    return true
  })

  type DoctorSummary = {
    name: string
    count: number
    totalGeneral: number
    totalMaterial: number
    remaining: number
  }
  const doctorSummary: DoctorSummary[] = (() => {
    const map = new Map<string, DoctorSummary>()
    for (const w of dateFilteredWorks) {
      const name = (w.doctorName || "غير محدد").trim() || "غير محدد"
      const cur = map.get(name) || { name, count: 0, totalGeneral: 0, totalMaterial: 0, remaining: 0 }
      cur.count += 1
      cur.totalGeneral += w.generalCost || 0
      cur.totalMaterial += w.materialCost || 0
      cur.remaining = cur.totalGeneral - cur.totalMaterial
      map.set(name, cur)
    }
    const arr = Array.from(map.values())
    arr.sort((a, b) => {
      const dir = doctorSortDir === "asc" ? 1 : -1
      if (doctorSortKey === "name") return a.name.localeCompare(b.name, "ar") * dir
      if (doctorSortKey === "count") return (a.count - b.count) * dir
      return (a.remaining - b.remaining) * dir
    })
    return arr
  })()

  const toggleDoctorSort = (key: "name" | "remaining" | "count") => {
    if (doctorSortKey === key) {
      setDoctorSortDir(doctorSortDir === "asc" ? "desc" : "asc")
    } else {
      setDoctorSortKey(key)
      setDoctorSortDir(key === "name" ? "asc" : "desc")
    }
  }

  const handleDoctorClick = (name: string) => {
    setSearchTerm(name)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
    }
  }

  const filtersActive = Boolean(normalizedSearch || dateFrom || dateTo)
  const clearFilters = () => {
    setSearchTerm("")
    setDateFrom("")
    setDateTo("")
  }

  const buildExportFilename = (ext: "pdf" | "csv") => {
    const parts: string[] = ["dental-works"]
    if (normalizedSearch) parts.push(searchTerm.trim().replace(/\s+/g, "-"))
    if (dateFrom || dateTo) parts.push(`${dateFrom || "..."}_to_${dateTo || "..."}`)
    if (parts.length === 1) parts.push(new Date().toISOString().split("T")[0])
    return `${parts.join("_")}.${ext}`
  }

  const filterSummary = () => {
    const bits: string[] = []
    if (normalizedSearch) bits.push(`بحث: ${searchTerm.trim()}`)
    if (dateFrom) bits.push(`من: ${dateFrom}`)
    if (dateTo) bits.push(`إلى: ${dateTo}`)
    return bits.length > 0 ? bits.join(" — ") : "كل الأعمال"
  }

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(n)

  const handleExportCsv = () => {
    if (filteredWorks.length === 0) return
    const headers = [
      "التاريخ",
      "اسم الدكتور",
      "اسم المريض",
      "نوع العمل",
      "عدد الأسنان",
      "اللون",
      "التكلفة العامة",
      "تكلفة المواد",
      "المتبقي",
    ]
    const escape = (v: string | number) => {
      const s = String(v ?? "")
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = filteredWorks.map((w) => [
      w.date || "",
      w.doctorName || "",
      w.patientName || "",
      w.workType || "",
      w.teethCount || 0,
      w.color || "",
      w.generalCost || 0,
      w.materialCost || 0,
      (w.generalCost || 0) - (w.materialCost || 0),
    ])
    const totals = ["", "", "", "الإجمالي", "", "", totalGeneral, totalMaterial, totalRemaining]
    const csv = [headers, ...rows, totals].map((r) => r.map(escape).join(",")).join("\n")
    // BOM so Excel detects UTF-8 + Arabic correctly
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = buildExportFilename("csv")
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = async () => {
    if (filteredWorks.length === 0 || !exportRef.current) return
    setExportingPdf(true)
    try {
      const { jsPDF } = await import("jspdf")
      const html2canvas = (await import("html2canvas")).default
      const element = exportRef.current
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      pdf.save(buildExportFilename("pdf"))
    } catch (e) {
      console.error("Error exporting PDF:", e)
      alert("حدث خطأ أثناء تصدير PDF")
    } finally {
      setExportingPdf(false)
    }
  }

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId(null)
  }

  const handleEdit = (w: DentalWork) => {
    if (!w.id) return
    setEditingId(w.id)
    setForm({
      doctorName: w.doctorName || "",
      workType: w.workType || "",
      teethCount: w.teethCount || 1,
      color: w.color || "",
      patientName: w.patientName || "",
      generalCost: w.generalCost || 0,
      materialCost: w.materialCost || 0,
      date: w.date || new Date().toISOString().split("T")[0],
    })
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSubmit = async () => {
    if (!form.doctorName.trim() || !form.patientName.trim()) {
      alert("الرجاء إدخال اسم الدكتور واسم المريض")
      return
    }
    setSubmitting(true)
    try {
      if (editingId) {
        const { id: _id, createdAt: _createdAt, ...payload } = form
        await updateDoc(doc(db, "dentalWorks", editingId), {
          ...payload,
          updatedAt: Timestamp.now(),
        })
      } else {
        await addDoc(collection(db, "dentalWorks"), {
          ...form,
          createdAt: Timestamp.now(),
        })
      }
      resetForm()
      fetchData()
    } catch (e) {
      console.error(e)
      alert(editingId ? "خطأ في تحديث العمل" : "خطأ في إضافة العمل")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return
    try {
      await deleteDoc(doc(db, "dentalWorks", id))
      if (editingId === id) resetForm()
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const isEditing = editingId !== null

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 max-w-6xl" dir="rtl">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          icon={Stethoscope}
          label={filtersActive ? "الأعمال المعروضة" : "عدد الأعمال"}
          value={String(filteredWorks.length)}
          tone="blue"
        />
        <StatCard
          icon={Wallet}
          label="إجمالي التكلفة العامة"
          value={totalGeneral.toFixed(2)}
          tone="blue"
        />
        <StatCard
          icon={TrendingDown}
          label="إجمالي تكلفة المواد"
          value={totalMaterial.toFixed(2)}
          tone="orange"
        />
        <StatCard
          icon={PiggyBank}
          label="إجمالي المتبقي"
          value={totalRemaining.toFixed(2)}
          tone={totalRemaining < 0 ? "red" : "green"}
        />
      </div>

      {/* Add / Edit Work Form */}
      <Card className="border-0 shadow-xl shadow-slate-200/60 rounded-2xl overflow-hidden mb-6 sm:mb-8 bg-white">
        <CardHeader
          className={`${
            isEditing
              ? "bg-gradient-to-l from-amber-600 via-amber-700 to-orange-700"
              : "bg-gradient-to-l from-blue-600 via-blue-700 to-indigo-700"
          } text-white p-4 sm:p-6`}
        >
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              {isEditing ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <span>{isEditing ? "تعديل العمل" : "إضافة عمل جديد"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 sm:pt-7 p-4 sm:p-6">
          {/* People */}
          <div className="mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              معلومات المريض والطبيب
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Field label="اسم الدكتور" icon={UserCircle2}>
                <Input
                  value={form.doctorName}
                  onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                  placeholder="د. أحمد"
                  className={inputCls}
                />
              </Field>
              <Field label="اسم المريض" icon={User}>
                <Input
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="اسم المريض"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Work details */}
          <div className="mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              تفاصيل العمل
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Field label="نوع العمل" icon={Briefcase}>
                <Input
                  value={form.workType}
                  onChange={(e) => setForm({ ...form, workType: e.target.value })}
                  placeholder="تركيبة، تاج..."
                  className={inputCls}
                />
              </Field>
              <Field label="عدد الأسنان" icon={Hash}>
                <Input
                  type="number"
                  min="1"
                  value={form.teethCount}
                  onChange={(e) =>
                    setForm({ ...form, teethCount: parseInt(e.target.value) || 0 })
                  }
                  className={`${inputCls} text-center`}
                />
              </Field>
              <Field label="اللون" icon={Palette}>
                <Input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="A1, A2, B1..."
                  className={inputCls}
                />
              </Field>
              <Field label="التاريخ" icon={CalendarDays}>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Costs */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              التكلفة والربح
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Field label="التكلفة العامة للمواد (دينار)" icon={Wallet}>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.generalCost}
                  onChange={(e) =>
                    setForm({ ...form, generalCost: parseFloat(e.target.value) || 0 })
                  }
                  className={`${inputCls} text-center`}
                />
              </Field>
              <Field label="تكلفة المادة (دينار)" icon={TrendingDown}>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.materialCost}
                  onChange={(e) =>
                    setForm({ ...form, materialCost: parseFloat(e.target.value) || 0 })
                  }
                  className={`${inputCls} text-center`}
                />
              </Field>
              <Field label="المتبقي (دينار)" icon={PiggyBank}>
                <div
                  className={`flex items-center justify-center h-11 rounded-xl border-2 font-bold text-base ${
                    formRemaining < 0
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}
                >
                  {formRemaining.toFixed(2)}
                </div>
              </Field>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            {isEditing && (
              <Button
                onClick={resetForm}
                disabled={submitting}
                variant="outline"
                className="flex items-center gap-2 rounded-xl px-6 h-11"
              >
                <X className="w-4 h-4" />
                <span>إلغاء</span>
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className={`${
                isEditing
                  ? "bg-gradient-to-l from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/30"
                  : "bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30"
              } text-white flex items-center gap-2 rounded-xl px-6 sm:px-8 h-11 shadow-lg font-semibold`}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isEditing ? "حفظ التعديلات" : "إضافة العمل"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-doctor summary */}
      <Card className="border-0 shadow-xl shadow-slate-200/60 rounded-2xl overflow-hidden bg-white mb-6 sm:mb-8">
        <CardHeader className="bg-gradient-to-l from-indigo-600 via-purple-600 to-fuchsia-600 text-white p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block truncate">ملخص الأطباء</span>
                <span className="block text-[11px] sm:text-xs font-normal text-white/80">
                  {dateFrom || dateTo
                    ? `حسب نطاق التاريخ${dateFrom ? ` من ${dateFrom}` : ""}${dateTo ? ` إلى ${dateTo}` : ""}`
                    : "كل الفترات"}
                </span>
              </div>
            </div>
            <span className="text-xs sm:text-sm font-medium bg-white/20 backdrop-blur px-3 py-1 rounded-full shrink-0">
              {doctorSummary.length} {doctorSummary.length === 1 ? "طبيب" : "أطباء"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {doctorSummary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Users className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-700 font-semibold mb-1">لا يوجد أطباء في هذه الفترة</p>
              <p className="text-sm text-slate-500">جرّب تغيير نطاق التاريخ أو أضف عملاً جديداً</p>
            </div>
          ) : (
            <>
              {/* Desktop / tablet table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <th className="text-right py-3 px-4 font-bold">
                        <button
                          type="button"
                          onClick={() => toggleDoctorSort("name")}
                          className="flex items-center gap-1.5 hover:text-indigo-700 transition-colors"
                        >
                          <span>اسم الدكتور</span>
                          {doctorSortKey === "name" ? (
                            doctorSortDir === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-center py-3 px-4 font-bold">
                        <button
                          type="button"
                          onClick={() => toggleDoctorSort("count")}
                          className="inline-flex items-center gap-1.5 hover:text-indigo-700 transition-colors"
                        >
                          <span>عدد الأعمال</span>
                          {doctorSortKey === "count" ? (
                            doctorSortDir === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-bold">التكلفة العامة</th>
                      <th className="text-left py-3 px-4 font-bold">تكلفة المواد</th>
                      <th className="text-left py-3 px-4 font-bold">
                        <button
                          type="button"
                          onClick={() => toggleDoctorSort("remaining")}
                          className="inline-flex items-center gap-1.5 hover:text-indigo-700 transition-colors"
                        >
                          <span>المتبقي</span>
                          {doctorSortKey === "remaining" ? (
                            doctorSortDir === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorSummary.map((d) => {
                      const isSelected = normalizedSearch === d.name.toLowerCase()
                      return (
                        <tr
                          key={d.name}
                          onClick={() => handleDoctorClick(d.name)}
                          className={`cursor-pointer border-b border-slate-100 transition-colors ${
                            isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                          }`}
                          title="اضغط لعرض أعمال هذا الطبيب فقط"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {d.name.trim().charAt(0) || "?"}
                              </div>
                              <span className="truncate">{d.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                              {d.count}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-left font-semibold text-slate-700 tabular-nums">
                            {fmtMoney(d.totalGeneral)}
                          </td>
                          <td className="py-3 px-4 text-left font-semibold text-orange-600 tabular-nums">
                            {fmtMoney(d.totalMaterial)}
                          </td>
                          <td
                            className={`py-3 px-4 text-left font-extrabold tabular-nums ${
                              d.remaining < 0 ? "text-rose-600" : "text-emerald-600"
                            }`}
                          >
                            {fmtMoney(d.remaining)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-bold">
                      <td className="py-3 px-4">الإجمالي</td>
                      <td className="py-3 px-4 text-center">
                        {doctorSummary.reduce((s, d) => s + d.count, 0)}
                      </td>
                      <td className="py-3 px-4 text-left tabular-nums">
                        {fmtMoney(doctorSummary.reduce((s, d) => s + d.totalGeneral, 0))}
                      </td>
                      <td className="py-3 px-4 text-left tabular-nums">
                        {fmtMoney(doctorSummary.reduce((s, d) => s + d.totalMaterial, 0))}
                      </td>
                      <td className="py-3 px-4 text-left tabular-nums">
                        {fmtMoney(doctorSummary.reduce((s, d) => s + d.remaining, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-slate-100">
                <div className="flex items-center justify-end gap-2 px-3 py-2 bg-slate-50 text-xs text-slate-600">
                  <span>ترتيب:</span>
                  <button
                    type="button"
                    onClick={() => toggleDoctorSort("name")}
                    className={`px-2 py-1 rounded-lg ${doctorSortKey === "name" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200"}`}
                  >
                    الاسم
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDoctorSort("count")}
                    className={`px-2 py-1 rounded-lg ${doctorSortKey === "count" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200"}`}
                  >
                    العدد
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDoctorSort("remaining")}
                    className={`px-2 py-1 rounded-lg ${doctorSortKey === "remaining" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200"}`}
                  >
                    المتبقي
                  </button>
                </div>
                {doctorSummary.map((d) => {
                  const isSelected = normalizedSearch === d.name.toLowerCase()
                  return (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => handleDoctorClick(d.name)}
                      className={`w-full text-right p-4 transition-colors ${isSelected ? "bg-indigo-50" : "active:bg-slate-50"}`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                            {d.name.trim().charAt(0) || "?"}
                          </div>
                          <span className="font-bold text-slate-800 truncate">{d.name}</span>
                        </div>
                        <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold shrink-0">
                          {d.count} عمل
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <p className="text-slate-500 mb-0.5">عامة</p>
                          <p className="font-bold text-slate-800 tabular-nums">{fmtMoney(d.totalGeneral)}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2 text-center">
                          <p className="text-orange-600 mb-0.5">مواد</p>
                          <p className="font-bold text-orange-700 tabular-nums">{fmtMoney(d.totalMaterial)}</p>
                        </div>
                        <div
                          className={`rounded-lg p-2 text-center ${d.remaining < 0 ? "bg-rose-50" : "bg-emerald-50"}`}
                        >
                          <p className={`mb-0.5 ${d.remaining < 0 ? "text-rose-600" : "text-emerald-600"}`}>متبقي</p>
                          <p
                            className={`font-extrabold tabular-nums ${d.remaining < 0 ? "text-rose-700" : "text-emerald-700"}`}
                          >
                            {fmtMoney(d.remaining)}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Works list */}
      <Card className="border-0 shadow-xl shadow-slate-200/60 rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-gradient-to-l from-slate-800 via-slate-900 to-slate-800 text-white p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span>سجل الأعمال</span>
            </div>
            <span className="text-xs sm:text-sm font-medium bg-white/20 backdrop-blur px-3 py-1 rounded-full">
              {filtersActive ? `${filteredWorks.length} من ${works.length}` : `${works.length} عمل`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filters */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <Field label="بحث (دكتور، مريض، نوع العمل)" icon={Search}>
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث بالاسم أو نوع العمل..."
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="sm:col-span-3">
                <Field label="من تاريخ" icon={CalendarDays}>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="sm:col-span-3">
                <Field label="إلى تاريخ" icon={CalendarDays}>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-600">
                {filtersActive
                  ? `عرض ${filteredWorks.length} من أصل ${works.length} عمل`
                  : `إجمالي ${works.length} عمل`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleExportCsv}
                  disabled={filteredWorks.length === 0}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 rounded-xl h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                  title="تصدير إلى Excel/CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير Excel</span>
                </Button>
                <Button
                  onClick={handleExportPdf}
                  disabled={filteredWorks.length === 0 || exportingPdf}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 rounded-xl h-9 border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  title="تصدير إلى PDF"
                >
                  {exportingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  <span>تصدير PDF</span>
                </Button>
                {filtersActive && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 rounded-xl h-9"
                  >
                    <FilterX className="w-4 h-4" />
                    <span>مسح الفلاتر</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-slate-500">جاري تحميل البيانات...</p>
            </div>
          ) : works.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Inbox className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-700 font-semibold mb-1">لا توجد أعمال مسجلة</p>
              <p className="text-sm text-slate-500">ابدأ بإضافة عمل جديد من النموذج أعلاه</p>
            </div>
          ) : filteredWorks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-700 font-semibold mb-1">لا توجد نتائج مطابقة</p>
              <p className="text-sm text-slate-500 mb-3">جرّب تعديل البحث أو نطاق التاريخ</p>
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 rounded-xl h-9"
              >
                <FilterX className="w-4 h-4" />
                <span>مسح الفلاتر</span>
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-right font-bold text-slate-600 text-xs uppercase tracking-wider">التاريخ</th>
                      <th className="p-3 text-right font-bold text-slate-600 text-xs uppercase tracking-wider">الدكتور</th>
                      <th className="p-3 text-right font-bold text-slate-600 text-xs uppercase tracking-wider">المريض</th>
                      <th className="p-3 text-right font-bold text-slate-600 text-xs uppercase tracking-wider">نوع العمل</th>
                      <th className="p-3 text-center font-bold text-slate-600 text-xs uppercase tracking-wider">الأسنان</th>
                      <th className="p-3 text-center font-bold text-slate-600 text-xs uppercase tracking-wider">اللون</th>
                      <th className="p-3 text-center font-bold text-slate-600 text-xs uppercase tracking-wider">التكلفة العامة</th>
                      <th className="p-3 text-center font-bold text-slate-600 text-xs uppercase tracking-wider">تكلفة المادة</th>
                      <th className="p-3 text-center font-bold text-slate-600 text-xs uppercase tracking-wider">المتبقي</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorks.map((w) => {
                      const rem = (w.generalCost || 0) - (w.materialCost || 0)
                      return (
                        <tr
                          key={w.id}
                          className={`border-b border-slate-100 transition-colors ${
                            editingId === w.id ? "bg-amber-50" : "hover:bg-blue-50/40"
                          }`}
                        >
                          <td className="p-3 text-slate-600 whitespace-nowrap">{w.date}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                {w.doctorName?.charAt(0) || "?"}
                              </div>
                              <span className="font-semibold text-slate-800">{w.doctorName}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-700">{w.patientName}</td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                              {w.workType || "-"}
                            </span>
                          </td>
                          <td className="p-3 text-center text-slate-700 font-medium">{w.teethCount}</td>
                          <td className="p-3 text-center">
                            {w.color ? (
                              <span className="inline-block px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 text-xs font-mono">
                                {w.color}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold text-blue-700">{(w.generalCost || 0).toFixed(2)}</td>
                          <td className="p-3 text-center font-bold text-orange-600">{(w.materialCost || 0).toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-md font-bold ${
                                rem < 0
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {rem.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                onClick={() => handleEdit(w)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                                title="تعديل"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(w.id!)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan={6} className="p-3 text-right font-bold text-slate-800 uppercase text-xs tracking-wider">
                        المجموع
                      </td>
                      <td className="p-3 text-center font-extrabold text-blue-700 text-base">{totalGeneral.toFixed(2)}</td>
                      <td className="p-3 text-center font-extrabold text-orange-600 text-base">{totalMaterial.toFixed(2)}</td>
                      <td className="p-3 text-center font-extrabold text-base">
                        <span
                          className={`inline-block px-3 py-1 rounded-md ${
                            totalRemaining < 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {totalRemaining.toFixed(2)}
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredWorks.map((w) => {
                  const rem = (w.generalCost || 0) - (w.materialCost || 0)
                  return (
                    <div
                      key={w.id}
                      className={`p-4 ${editingId === w.id ? "bg-amber-50" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                            {w.doctorName?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{w.doctorName}</p>
                            <p className="text-xs text-slate-500">{w.patientName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => handleEdit(w)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="تعديل"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(w.id!)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3 text-xs">
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {w.workType || "—"}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                          {w.teethCount} سن
                        </span>
                        {w.color && (
                          <span className="px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 font-mono">
                            {w.color}
                          </span>
                        )}
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                          {w.date}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-slate-600 mb-0.5">عامة</p>
                          <p className="font-bold text-blue-700 text-sm">{(w.generalCost || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-slate-600 mb-0.5">المواد</p>
                          <p className="font-bold text-orange-600 text-sm">{(w.materialCost || 0).toFixed(2)}</p>
                        </div>
                        <div
                          className={`rounded-lg p-2 text-center ${
                            rem < 0 ? "bg-rose-50" : "bg-emerald-50"
                          }`}
                        >
                          <p className="text-[10px] text-slate-600 mb-0.5">المتبقي</p>
                          <p
                            className={`font-bold text-sm ${
                              rem < 0 ? "text-rose-700" : "text-emerald-700"
                            }`}
                          >
                            {rem.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Hidden printable export view */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: "-10000px",
          width: "794px",
          background: "#ffffff",
        }}
      >
        <div ref={exportRef} dir="rtl" style={{ padding: "24px", fontFamily: "Almarai, sans-serif", color: "#0f172a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #1e3a8a", paddingBottom: "12px", marginBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "#1e3a8a" }}>سجل الأعمال السنية</h1>
              <p style={{ fontSize: "12px", color: "#475569", margin: "4px 0 0" }}>مختبر نورمار للأسنان</p>
            </div>
            <div style={{ textAlign: "left", fontSize: "12px", color: "#475569" }}>
              <p style={{ margin: 0 }}>تاريخ التصدير: {new Date().toISOString().split("T")[0]}</p>
              <p style={{ margin: "4px 0 0" }}>عدد السجلات: {filteredWorks.length}</p>
            </div>
          </div>
          <div style={{ background: "#f1f5f9", padding: "10px 12px", borderRadius: "8px", marginBottom: "16px", fontSize: "12px", color: "#334155" }}>
            <strong>الفلاتر: </strong>
            {filterSummary()}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#1e3a8a", color: "#ffffff" }}>
                <th style={{ padding: "8px", border: "1px solid #1e3a8a", textAlign: "right" }}>التاريخ</th>
                <th style={{ padding: "8px", border: "1px solid #1e3a8a", textAlign: "right" }}>الدكتور</th>
                <th style={{ padding: "8px", border: "1px solid #1e3a8a", textAlign: "right" }}>المريض</th>
                <th style={{ padding: "8px", border: "1px solid #1e3a8a", textAlign: "right" }}>نوع العمل</th>
                <th style={{ padding: "8px", border: "1px solid #1e3a8a", textAlign: "center" }}>الأسنان</th>
                <th style={{ padding: "8px", border: "1px solid #1e3a8a", textAlign: "center" }}>اللون</th>
                <th style={{ padding: "8px", border: "1px solid #1e3a8a", textAlign: "left" }}>التكلفة</th>
                <th style={{ padding: "8px", border: "1px solid #1e3a8a", textAlign: "left" }}>المواد</th>
                <th style={{ padding: "8px", border: "1px solid #1e3a8a", textAlign: "left" }}>المتبقي</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorks.map((w, i) => {
                const rem = (w.generalCost || 0) - (w.materialCost || 0)
                return (
                  <tr key={w.id || i} style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                    <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{w.date || "-"}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{w.doctorName || "-"}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{w.patientName || "-"}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{w.workType || "-"}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "center" }}>{w.teethCount || 0}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "center" }}>{w.color || "-"}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "left" }}>{fmtMoney(w.generalCost || 0)}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "left" }}>{fmtMoney(w.materialCost || 0)}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "left", color: rem >= 0 ? "#047857" : "#b91c1c", fontWeight: 600 }}>{fmtMoney(rem)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#0f172a", color: "#ffffff", fontWeight: 700 }}>
                <td colSpan={6} style={{ padding: "8px", border: "1px solid #0f172a", textAlign: "right" }}>الإجمالي</td>
                <td style={{ padding: "8px", border: "1px solid #0f172a", textAlign: "left" }}>{fmtMoney(totalGeneral)}</td>
                <td style={{ padding: "8px", border: "1px solid #0f172a", textAlign: "left" }}>{fmtMoney(totalMaterial)}</td>
                <td style={{ padding: "8px", border: "1px solid #0f172a", textAlign: "left" }}>{fmtMoney(totalRemaining)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
