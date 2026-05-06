import type React from "react"
import type { Metadata } from "next"
import "./globals.css"


export const metadata: Metadata = {
  title: "نظام الفواتير - Invoice System",
  description: "نظام متقدم لإدخال وإصدار الفواتير بصيغة PDF",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar">
      <body className={`font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
