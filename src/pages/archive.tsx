import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Archive,
  Loader2,
  Inbox,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Wallet,
  TrendingDown,
  PiggyBank,
  CalendarDays,
} from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"

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
  archived?: boolean
  archivedAt?: any
  archivePeriod?: string
}

interface ArchiveGroup {
  period: string
  works: DentalWork[]
  count: number
  totalGeneral: number
  totalMaterial: number
  remaining: number
}

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(n)

const formatPeriodLabel = (period: string) => {
  // period is YYYY-MM
  const [y, m] = period.split("-")
  if (!y || !m) return period
  try {
    const d = new Date(Number(y), Number(m) - 1, 1)
    return new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(d)
  } catch {
    return period
  }
}

export default function ArchivePage() {
  const [groups, setGroups] = useState<ArchiveGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const fetchArchive = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, "dentalWorks"), orderBy("createdAt", "desc"))
      const snap = await getDocs(q)
      const archived: DentalWork[] = []
      snap.forEach((d) => {
        const data = { id: d.id, ...d.data() } as DentalWork
        if (data.archived) archived.push(data)
      })
      const map = new Map<string, ArchiveGroup>()
      for (const w of archived) {
        const period = w.archivePeriod || "بدون فترة"
        const cur =
          map.get(period) ||
          ({
            period,
            works: [],
            count: 0,
            totalGeneral: 0,
            totalMaterial: 0,
            remaining: 0,
          } as ArchiveGroup)
        cur.works.push(w)
        cur.count += 1
        cur.totalGeneral += w.generalCost || 0
        cur.totalMaterial += w.materialCost || 0
        cur.remaining = cur.totalGeneral - cur.totalMaterial
        map.set(period, cur)
      }
      const arr = Array.from(map.values())
      arr.sort((a, b) => (a.period < b.period ? 1 : a.period > b.period ? -1 : 0))
      // Auto-expand the most recent group
      if (arr.length > 0) {
        setExpanded((prev) => ({ ...prev, [arr[0].period]: true }))
      }
      setGroups(arr)
    } catch (e) {
      console.error("Error fetching archive:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArchive()
  }, [])

  const toggle = (period: string) =>
    setExpanded((prev) => ({ ...prev, [period]: !prev[period] }))

  const totalCount = groups.reduce((s, g) => s + g.count, 0)
  const totalRemaining = groups.reduce((s, g) => s + g.remaining, 0)

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 max-w-6xl" dir="rtl">
      {/* Hero */}
      <Card className="border-0 shadow-xl shadow-slate-200/60 rounded-2xl overflow-hidden mb-6 sm:mb-8 bg-white">
        <CardHeader className="bg-gradient-to-l from-purple-600 via-fuchsia-600 to-pink-600 text-white p-5 sm:p-7">
          <CardTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <Archive className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="block text-lg sm:text-xl font-extrabold">أرشيف الأعمال</span>
                <span className="block text-xs sm:text-sm font-normal text-white/80 mt-0.5">
                  جميع الأعمال التي تمت أرشفتها مرتبة حسب الشهر
                </span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end shrink-0">
              <span className="text-2xl font-extrabold">{totalCount}</span>
              <span className="text-xs text-white/80">إجمالي الأعمال المؤرشفة</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">عدد الفترات</p>
              <p className="text-xl font-extrabold text-slate-800">{groups.length}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-xs text-blue-600 mb-1">إجمالي الأعمال</p>
              <p className="text-xl font-extrabold text-blue-700">{totalCount}</p>
            </div>
            <div
              className={`rounded-xl p-3 text-center col-span-2 sm:col-span-1 ${
                totalRemaining < 0 ? "bg-rose-50" : "bg-emerald-50"
              }`}
            >
              <p
                className={`text-xs mb-1 ${
                  totalRemaining < 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                إجمالي المتبقي عبر الأرشيف
              </p>
              <p
                className={`text-xl font-extrabold tabular-nums ${
                  totalRemaining < 0 ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                {fmtMoney(totalRemaining)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="border-0 shadow-xl shadow-slate-200/60 rounded-2xl bg-white">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card className="border-0 shadow-xl shadow-slate-200/60 rounded-2xl bg-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-700 font-semibold mb-1">لا توجد أعمال مؤرشفة بعد</p>
            <p className="text-sm text-slate-500">
              يمكنك أرشفة الأعمال الحالية من صفحة الأعمال السنية بالضغط على زر "أرشفة الشهر"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {groups.map((g) => {
            const open = !!expanded[g.period]
            return (
              <Card
                key={g.period}
                className="border-0 shadow-xl shadow-slate-200/60 rounded-2xl overflow-hidden bg-white"
              >
                <CardHeader className="bg-gradient-to-l from-slate-800 via-slate-900 to-slate-800 text-white p-4 sm:p-5">
                  <CardTitle className="text-base sm:text-lg flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(g.period)}
                      className="flex items-center gap-3 min-w-0 text-right hover:opacity-90 transition-opacity"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate">{formatPeriodLabel(g.period)}</span>
                        <span className="block text-[11px] sm:text-xs font-normal text-white/70">
                          {g.period} — {g.count} عمل
                        </span>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-flex items-center text-xs sm:text-sm font-medium bg-white/20 backdrop-blur px-3 py-1 rounded-full tabular-nums">
                        المتبقي: {fmtMoney(g.remaining)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggle(g.period)}
                        className="text-white hover:bg-white/10 rounded-lg h-9 w-9 p-0"
                        aria-label={open ? "طي" : "توسيع"}
                      >
                        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Group totals */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-4 sm:p-5 bg-slate-50/60 border-b border-slate-100">
                    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        <p className="text-[11px] text-slate-500">عدد الأعمال</p>
                      </div>
                      <p className="text-base sm:text-lg font-extrabold text-slate-800 tabular-nums">
                        {g.count}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Wallet className="w-3.5 h-3.5 text-blue-600" />
                        <p className="text-[11px] text-slate-500">التكلفة العامة</p>
                      </div>
                      <p className="text-base sm:text-lg font-extrabold text-blue-700 tabular-nums">
                        {fmtMoney(g.totalGeneral)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingDown className="w-3.5 h-3.5 text-orange-600" />
                        <p className="text-[11px] text-slate-500">تكلفة المواد</p>
                      </div>
                      <p className="text-base sm:text-lg font-extrabold text-orange-600 tabular-nums">
                        {fmtMoney(g.totalMaterial)}
                      </p>
                    </div>
                    <div
                      className={`rounded-xl p-3 text-center shadow-sm ${
                        g.remaining < 0 ? "bg-rose-50" : "bg-emerald-50"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <PiggyBank
                          className={`w-3.5 h-3.5 ${
                            g.remaining < 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        />
                        <p
                          className={`text-[11px] ${
                            g.remaining < 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          المتبقي
                        </p>
                      </div>
                      <p
                        className={`text-base sm:text-lg font-extrabold tabular-nums ${
                          g.remaining < 0 ? "text-rose-700" : "text-emerald-700"
                        }`}
                      >
                        {fmtMoney(g.remaining)}
                      </p>
                    </div>
                  </div>

                  {/* Entries table */}
                  {open && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                            <th className="text-right py-2 px-3 font-bold">التاريخ</th>
                            <th className="text-right py-2 px-3 font-bold">الدكتور</th>
                            <th className="text-right py-2 px-3 font-bold">المريض</th>
                            <th className="text-right py-2 px-3 font-bold hidden sm:table-cell">
                              نوع العمل
                            </th>
                            <th className="text-center py-2 px-3 font-bold hidden sm:table-cell">
                              الأسنان
                            </th>
                            <th className="text-center py-2 px-3 font-bold hidden md:table-cell">
                              اللون
                            </th>
                            <th className="text-left py-2 px-3 font-bold">العامة</th>
                            <th className="text-left py-2 px-3 font-bold">المواد</th>
                            <th className="text-left py-2 px-3 font-bold">المتبقي</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.works.map((w) => {
                            const remaining = (w.generalCost || 0) - (w.materialCost || 0)
                            return (
                              <tr
                                key={w.id}
                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                              >
                                <td className="py-2 px-3 tabular-nums text-slate-600 whitespace-nowrap">
                                  {w.date || "-"}
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-800">
                                  {w.doctorName || "-"}
                                </td>
                                <td className="py-2 px-3 text-slate-700">
                                  {w.patientName || "-"}
                                </td>
                                <td className="py-2 px-3 text-slate-700 hidden sm:table-cell">
                                  {w.workType || "-"}
                                </td>
                                <td className="py-2 px-3 text-center text-slate-700 hidden sm:table-cell tabular-nums">
                                  {w.teethCount || 0}
                                </td>
                                <td className="py-2 px-3 text-center text-slate-700 hidden md:table-cell">
                                  {w.color || "-"}
                                </td>
                                <td className="py-2 px-3 text-left tabular-nums text-slate-700">
                                  {fmtMoney(w.generalCost || 0)}
                                </td>
                                <td className="py-2 px-3 text-left tabular-nums text-orange-600">
                                  {fmtMoney(w.materialCost || 0)}
                                </td>
                                <td
                                  className={`py-2 px-3 text-left tabular-nums font-extrabold ${
                                    remaining < 0 ? "text-rose-600" : "text-emerald-600"
                                  }`}
                                >
                                  {fmtMoney(remaining)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
