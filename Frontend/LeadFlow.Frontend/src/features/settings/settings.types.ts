export type CompanySettings = {
  id: number
  name: string
  legalName: string | null
  email: string | null
  phone: string | null
  identificationNumber: string | null
  address: string | null
  province: string | null
  canton: string | null
  website: string | null
  logoUrl: string | null
  defaultCurrency: string
  defaultTaxRate: number
  quotePrefix: string
  defaultQuoteTerms: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export type CompanySettingsInput = {
  name: string
  legalName?: string | null
  email?: string | null
  phone?: string | null
  identificationNumber?: string | null
  address?: string | null
  province?: string | null
  canton?: string | null
  website?: string | null
  logoUrl?: string | null
  defaultCurrency: string
  defaultTaxRate: number
  quotePrefix: string
  defaultQuoteTerms?: string | null
}
