import "../globals.css"

import {
  LayoutWrapper
} from "@/components/layoutWrapper"
import { ReactNode } from "react"

export default function ClienteRoot({
  children,
}: {
  children: ReactNode
}) {
  return (
        <LayoutWrapper>

          {children}

        </LayoutWrapper>
  )
}