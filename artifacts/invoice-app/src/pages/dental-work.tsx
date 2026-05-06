import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
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

const emptyForm: DentalWork = {
  doctorName: "",
  workType: "",
  teethCount: 1,
  color: "",
  patientName: "",
  generalCost: 0,
  materialCost: 0,
  date: new Date().toISOString().split("T")[0],
}

export default function DentalWorkPage() {
  const [works, setWorks] = useState<DentalWork[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<DentalWork>(emptyForm)

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
  const totalGeneral = works.reduce((s, w) => s + (w.generalCost || 0), 0)
  const totalMaterial = works.reduce((s, w) => s + (w.materialCost || 0), 0)
  const totalRemaining = totalGeneral - totalMaterial

  const handleAddWork = async () => {
    if (!form.doctorName.trim() || !form.patientName.trim()) {
      alert("الرجاء إدخال اسم الدكتور واسم المريض")
      return
    }
    setSaving(true)
    try {
      await addDoc(collection(db, "dentalWorks"), {
        ...form,
        createdAt: Timestamp.now(),
      })
      setForm(emptyForm)
      fetchData()
    } catch (e) {
      console.error(e)
      alert("خطأ في إضافة العمل")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return
    try {
      await deleteDoc(doc(db, "dentalWorks", id))
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 max-w-6xl" dir="rtl">
      {/* Add Work Form */}
      <Card className="border border-slate-200 shadow-md rounded-lg overflow-hidden mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">إضافة عمل جديد</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">اسم الدكتور</label>
              <Input
                value={form.doctorName}
                onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                placeholder="د. أحمد"
                className="text-right border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">اسم المريض</label>
              <Input
                value={form.patientName}
                onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                placeholder="اسم المريض"
                className="text-right border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">نوع العمل</label>
              <Input
                value={form.workType}
                onChange={(e) => setForm({ ...form, workType: e.target.value })}
                placeholder="تركيبة، تاج، جسر..."
                className="text-right border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">عدد الأسنان</label>
              <Input
                type="number"
                min="1"
                value={form.teethCount}
                onChange={(e) => setForm({ ...form, teethCount: parseInt(e.target.value) || 0 })}
                className="text-center border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">اللون</label>
              <Input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="A1, A2, B1..."
                className="text-right border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">التاريخ</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="text-right border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                التكلفة العامة للمواد (دينار)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.generalCost}
                onChange={(e) => setForm({ ...form, generalCost: parseFloat(e.target.value) || 0 })}
                className="text-center border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                تكلفة المادة (دينار)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.materialCost}
                onChange={(e) => setForm({ ...form, materialCost: parseFloat(e.target.value) || 0 })}
                className="text-center border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">المتبقي</label>
              <div
                className={`flex items-center justify-center h-10 rounded-lg border-2 font-bold text-sm ${
                  formRemaining < 0
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-green-50 border-green-200 text-green-700"
                }`}
              >
                {formRemaining.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleAddWork}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-lg px-6"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>إضافة العمل</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Works list */}
      <Card className="border border-slate-200 shadow-md rounded-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">سجل الأعمال ({works.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : works.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">لا توجد أعمال مسجلة</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 sm:p-3 text-right font-bold text-slate-700">التاريخ</th>
                    <th className="p-2 sm:p-3 text-right font-bold text-slate-700">الدكتور</th>
                    <th className="p-2 sm:p-3 text-right font-bold text-slate-700">المريض</th>
                    <th className="p-2 sm:p-3 text-right font-bold text-slate-700">نوع العمل</th>
                    <th className="p-2 sm:p-3 text-center font-bold text-slate-700">الأسنان</th>
                    <th className="p-2 sm:p-3 text-center font-bold text-slate-700">اللون</th>
                    <th className="p-2 sm:p-3 text-center font-bold text-slate-700">التكلفة العامة</th>
                    <th className="p-2 sm:p-3 text-center font-bold text-slate-700">تكلفة المادة</th>
                    <th className="p-2 sm:p-3 text-center font-bold text-slate-700">المتبقي</th>
                    <th className="p-2 sm:p-3 text-center font-bold text-slate-700"></th>
                  </tr>
                </thead>
                <tbody>
                  {works.map((w) => {
                    const rem = (w.generalCost || 0) - (w.materialCost || 0)
                    return (
                      <tr key={w.id} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="p-2 sm:p-3 text-slate-700">{w.date}</td>
                        <td className="p-2 sm:p-3 text-slate-800 font-medium">{w.doctorName}</td>
                        <td className="p-2 sm:p-3 text-slate-700">{w.patientName}</td>
                        <td className="p-2 sm:p-3 text-slate-700">{w.workType}</td>
                        <td className="p-2 sm:p-3 text-center text-slate-700">{w.teethCount}</td>
                        <td className="p-2 sm:p-3 text-center text-slate-700">{w.color}</td>
                        <td className="p-2 sm:p-3 text-center font-bold text-blue-700">
                          {(w.generalCost || 0).toFixed(2)}
                        </td>
                        <td className="p-2 sm:p-3 text-center font-bold text-orange-700">
                          {(w.materialCost || 0).toFixed(2)}
                        </td>
                        <td
                          className={`p-2 sm:p-3 text-center font-bold ${
                            rem < 0 ? "text-red-700" : "text-green-700"
                          }`}
                        >
                          {rem.toFixed(2)}
                        </td>
                        <td className="p-2 sm:p-3 text-center">
                          <Button
                            onClick={() => handleDelete(w.id!)}
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 h-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-bold">
                  <tr>
                    <td colSpan={6} className="p-2 sm:p-3 text-right text-slate-800">
                      المجموع
                    </td>
                    <td className="p-2 sm:p-3 text-center text-blue-700">{totalGeneral.toFixed(2)}</td>
                    <td className="p-2 sm:p-3 text-center text-orange-700">{totalMaterial.toFixed(2)}</td>
                    <td
                      className={`p-2 sm:p-3 text-center ${
                        totalRemaining < 0 ? "text-red-700" : "text-green-700"
                      }`}
                    >
                      {totalRemaining.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
