import { httpClient } from '../../shared/api/httpClient'
import type { CompanySettings, CompanySettingsInput } from './settings.types'

export async function getCompanySettings() {
  const response = await httpClient.get<CompanySettings>('/company-settings')
  return response.data
}

export async function updateCompanySettings(input: CompanySettingsInput) {
  const response = await httpClient.put<CompanySettings>('/company-settings', input)
  return response.data
}
