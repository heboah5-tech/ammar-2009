"use client"

import { Card } from "@/components/ui/card"

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

interface InvoicePreviewProps {
  data: InvoiceData
}

export default function InvoicePreview({ data }: InvoicePreviewProps) {
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const totalDiscount = data.discounts.reduce((sum, discount) => sum + discount.amount, 0)
  const finalTotal = subtotal - totalDiscount

  return (
    <div id="invoice-preview" className="w-full max-w-4xl mx-auto">
      <Card className="border-0 shadow-2xl rounded-xl overflow-hidden">
        <div className="p-4 sm:p-8 md:p-12 bg-white text-right" dir="rtl">
          {/* Header Section */}
          <div className="border-b-4 border-gradient-to-r from-blue-600 to-blue-800 pb-4 sm:pb-6 md:pb-8 mb-4 sm:mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6 md:mb-8">
              {/* Company Info */}
              <div className="flex-1 w-full">
                <h1 className="text-xl sm:text-2xl font-bold text-blue-800 mb-1">
                  <img src="normar.png" alt="logo" width={100} />
                  مختبر نورمار</h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">NORMAR DIGITAL DENTAL INDUSTRY LAB</p>
                <p className="text-xs text-slate-500 mt-1 sm:mt-2 line-clamp-2 sm:line-clamp-none">
                  الرمثا - قرب المدرسة الثانوية - هاتف: 0798719058
                </p>

              </div>

              {/* Invoice Title Section */}
              <div className="text-left border-l-2 border-slate-300 pl-3 sm:pl-4 md:pl-6 w-full sm:w-auto">
                <p className="text-base sm:text-lg font-bold text-blue-800 mb-2 sm:mb-3">فاتورة</p>
                <p className="text-xs sm:text-sm text-slate-600">
                  رقم: <span className="font-bold text-slate-800">{data.invoiceNumber}</span>
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2">
                  التاريخ: <span className="font-bold text-slate-800">{data.date}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-blue-50 to-slate-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm font-bold text-blue-800 mb-2">
              المطلوب من السيد / السادة:{" "}
              <span className="font-normal text-slate-800 text-sm sm:text-base">{data.clientName}</span>
            </p>
          </div>


          {/* Table - Fixed layout */}
          <div className="overflow-x-auto mb-4 sm:mb-6 md:mb-8">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300">
                  <th className="p-2 sm:p-3 md:p-4 text-right font-bold text-blue-900 border-r-2 border-blue-300 whitespace-nowrap">
                    السعر الإجمالي
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-center font-bold text-blue-900 border-r-2 border-blue-300 whitespace-nowrap">
                    السعر
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-center font-bold text-blue-900 border-r-2 border-blue-300 whitespace-nowrap">
                    العدد
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-right font-bold text-blue-900 border-r-2 border-blue-300 whitespace-nowrap">
                    البيان
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-right font-bold text-blue-900 whitespace-nowrap">
                    ملاحظات
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-2 border-slate-300 hover:bg-slate-50 transition-colors">
                    <td className="p-2 sm:p-3 md:p-4 text-center text-slate-800 font-semibold border-r-2 border-slate-300 whitespace-nowrap">
                      {(item.quantity * item.price).toFixed(2)}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-center text-slate-700 border-r-2 border-slate-300">
                      {item.price.toFixed(2)}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-center text-slate-700 border-r-2 border-slate-300">
                      {item.quantity}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-right text-slate-800 border-r-2 border-slate-300">
                      {item.description}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-right text-slate-500">—</td>
                  </tr>
                ))}

                {/* Fill remaining rows for consistent height */}
                {[...Array(Math.max(0, 6 - data.items.length))].map((_, i) => (
                  <tr key={`empty-${i}`} className="border-2 border-slate-300 h-8 sm:h-10 md:h-12">
                    <td className="border-r-2 border-slate-300"></td>
                    <td className="border-r-2 border-slate-300"></td>
                    <td className="border-r-2 border-slate-300"></td>
                    <td className="border-r-2 border-slate-300"></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Section */}
          <div className="border-2 border-blue-300 mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-slate-50">
            {/* Subtotal Row */}
            <div className="flex text-xs sm:text-sm md:text-base border-b-2 border-blue-200">
              <div className="w-1/4 p-2 sm:p-3 md:p-4 text-center font-semibold text-slate-800 border-r-2 border-blue-200 whitespace-nowrap">
                {subtotal.toFixed(2)}
              </div>
              <div className="flex-1 p-2 sm:p-3 md:p-4 text-right font-semibold text-slate-800">المجموع الفرعي</div>
            </div>

            {data.discounts.map((discount) => (
              <div key={discount.id} className="flex text-xs sm:text-sm md:text-base border-b-2 border-blue-200">
                <div className="w-1/4 p-2 sm:p-3 md:p-4 text-center font-semibold text-red-600 border-r-2 border-blue-200 whitespace-nowrap">
                  -{discount.amount.toFixed(2)}
                </div>
                <div className="flex-1 p-2 sm:p-3 md:p-4 text-right font-semibold text-slate-800 flex justify-between items-center gap-2">
                  <span>دفعة: {discount.description || "دفعة"}</span>
                  <span className="text-xs text-slate-500">{discount.date}</span>
                </div>
              </div>
            ))}

            {/* Final Total Row */}
            <div className="flex text-xs sm:text-sm md:text-base">
              <div className="w-1/4 p-2 sm:p-3 md:p-4 text-center font-bold text-blue-900 border-r-2 border-blue-300 bg-blue-100 whitespace-nowrap">
                {finalTotal.toFixed(2)}
              </div>
              <div className="flex-1 p-2 sm:p-3 md:p-4 text-right font-bold text-blue-900">الإجمالي النهائي</div>
            </div>
          </div>


          {/* Signature */}
          <div className="flex justify-start mt-12 sm:mt-16 md:mt-16 pt-6 sm:pt-8 border-t-2 border-slate-200">
            <div className="text-center">
              <div className="border-b-2 border-slate-400 w-32 sm:w-40 mb-2 sm:mb-3"></div>
              <p className="text-xs sm:text-sm font-bold text-slate-700">توقيع المستقبل</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
