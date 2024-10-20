import './globals.css'
import { Inter } from 'next/font/google'
import "@fortawesome/fontawesome-svg-core/styles.css"; 
import { config } from "@fortawesome/fontawesome-svg-core";

config.autoAddCss = false; 

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Friend Bridge',
  description: 'Written by Ozgun Munar',
}

export default function RootLayout({ children }) {

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
