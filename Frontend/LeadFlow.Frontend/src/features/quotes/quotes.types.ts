// Tipos del módulo Cotizaciones, alineados con QuoteResponse / Create / Update.

export type QuoteItem = {
  id: number
  quoteId: number
  serviceId: number | null
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
  createdAt: string
}

export type Quote = {
  id: number
  companyId: number
  customerId: number
  customerName: string
  leadId: number | null
  leadTitle: string | null
  createdByUserId: number
  createdByUserName: string
  quoteNumber: string
  status: string
  currency: string
  subtotal: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  total: number
  issueDate: string
  expirationDate: string | null
  notes: string | null
  terms: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
  sentAt: string | null
  acceptedAt: string | null
  rejectedAt: string | null
  items: QuoteItem[]
}

export type QuoteItemInput = {
  serviceId?: number | null
  description?: string | null
  quantity: number
  unitPrice?: number | null
}

export type QuoteInput = {
  customerId: number
  leadId?: number | null
  status: string
  currency: string
  discountAmount: number
  taxRate: number
  expirationDate?: string | null
  notes?: string | null
  terms?: string | null
  items: QuoteItemInput[]
}

export type SendQuoteEmailResult = {
  message: string
  quoteId: number
  quoteNumber: string
  status: string
  customerEmail: string | null
  sentAt: string | null
  pdfGenerated: boolean
  isDevelopmentMode: boolean
}
