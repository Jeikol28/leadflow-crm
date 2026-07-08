import { useState } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useBlocker } from '@tanstack/react-router'
import { useAuth } from '../../app/providers/AuthProvider'
import { ROLES } from '../../shared/auth/roles'
import { useConfirm } from '../../shared/confirm/useConfirm'
import { Loader } from '../../shared/components/Loader'
import { useCompanySettings, useUpdateCompanySettings } from './useCompanySettings'
import type { CompanySettings, CompanySettingsInput } from './settings.types'

type SettingsFormValues = {
  name: string
  legalName: string
  identificationNumber: string
  email: string
  phone: string
  website: string
  logoUrl: string
  address: string
  province: string
  canton: string
  defaultCurrency: string
  defaultTaxRate: string
  quotePrefix: string
  defaultQuoteTerms: string
}

const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-500'
const textareaClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-500'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
      <h2 className="text-base font-black text-teal-950">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function nullable(value: string): string | null {
  return value.trim() === '' ? null : value.trim()
}

function toFormValues(settings: CompanySettings): SettingsFormValues {
  return {
    name: settings.name,
    legalName: settings.legalName ?? '',
    identificationNumber: settings.identificationNumber ?? '',
    email: settings.email ?? '',
    phone: settings.phone ?? '',
    website: settings.website ?? '',
    logoUrl: settings.logoUrl ?? '',
    address: settings.address ?? '',
    province: settings.province ?? '',
    canton: settings.canton ?? '',
    defaultCurrency: settings.defaultCurrency || 'CRC',
    defaultTaxRate: String(settings.defaultTaxRate),
    quotePrefix: settings.quotePrefix || 'LF',
    defaultQuoteTerms: settings.defaultQuoteTerms ?? '',
  }
}

function toInput(values: SettingsFormValues): CompanySettingsInput {
  return {
    name: values.name.trim(),
    legalName: nullable(values.legalName),
    identificationNumber: nullable(values.identificationNumber),
    email: nullable(values.email),
    phone: nullable(values.phone),
    website: nullable(values.website),
    logoUrl: nullable(values.logoUrl),
    address: nullable(values.address),
    province: nullable(values.province),
    canton: nullable(values.canton),
    defaultCurrency: values.defaultCurrency,
    defaultTaxRate: Number(values.defaultTaxRate) || 0,
    quotePrefix: values.quotePrefix.trim() || 'LF',
    defaultQuoteTerms: nullable(values.defaultQuoteTerms),
  }
}

function SettingsForm({ settings, canEdit }: { settings: CompanySettings; canEdit: boolean }) {
  const updateSettings = useUpdateCompanySettings()
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<SettingsFormValues>({ defaultValues: toFormValues(settings) })
  const confirm = useConfirm()

  // Avisa si el usuario intenta salir (navegar a otro apartado, recargar o cerrar) con cambios sin guardar.
  useBlocker({
    shouldBlockFn: async () => {
      if (!isDirty) {
        return false
      }

      const leave = await confirm({
        title: 'Cambios sin guardar',
        message:
          'Hiciste cambios en la configuración que aún no se han guardado. ¿Seguro que quieres salir sin guardar?',
        confirmText: 'Salir sin guardar',
        cancelText: 'Seguir editando',
        danger: true,
      })

      // Si elige salir, no bloqueamos; si elige seguir editando, bloqueamos la navegación.
      return !leave
    },
    enableBeforeUnload: () => isDirty,
  })

  function onSubmit(values: SettingsFormValues) {
    setSaved(false)
    updateSettings.mutate(toInput(values), {
      onSuccess: () => {
        setSaved(true)
        // Deja el formulario "limpio" tras guardar para no volver a avisar.
        reset(values)
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!canEdit && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-3 text-sm font-semibold text-amber-800">
          Solo el administrador de la empresa puede editar esta configuración.
        </div>
      )}

      <SectionCard title="Perfil de la empresa">
        <Field label="Nombre comercial">
          <input {...register('name')} disabled={!canEdit} className={inputClass} />
        </Field>
        <Field label="Razón social">
          <input {...register('legalName')} disabled={!canEdit} className={inputClass} />
        </Field>
        <Field label="Cédula jurídica">
          <input {...register('identificationNumber')} disabled={!canEdit} className={inputClass} />
        </Field>
        <Field label="Correo">
          <input type="email" {...register('email')} disabled={!canEdit} className={inputClass} />
        </Field>
        <Field label="Teléfono">
          <input {...register('phone')} disabled={!canEdit} className={inputClass} />
        </Field>
        <Field label="Sitio web">
          <input {...register('website')} disabled={!canEdit} className={inputClass} />
        </Field>
        <Field label="Logo (URL)">
          <input {...register('logoUrl')} disabled={!canEdit} className={inputClass} />
        </Field>
      </SectionCard>

      <SectionCard title="Ubicación">
        <Field label="Dirección">
          <input {...register('address')} disabled={!canEdit} className={inputClass} />
        </Field>
        <Field label="Provincia">
          <input {...register('province')} disabled={!canEdit} className={inputClass} />
        </Field>
        <Field label="Cantón">
          <input {...register('canton')} disabled={!canEdit} className={inputClass} />
        </Field>
      </SectionCard>

      <SectionCard title="Configuración comercial">
        <Field label="Moneda por defecto">
          <select {...register('defaultCurrency')} disabled={!canEdit} className={inputClass}>
            <option value="CRC">CRC</option>
            <option value="USD">USD</option>
          </select>
        </Field>
        <Field label="IVA por defecto (%)">
          <input type="number" step="any" min={0} {...register('defaultTaxRate')} disabled={!canEdit} className={inputClass} />
        </Field>
        <Field label="Prefijo de cotizaciones">
          <input {...register('quotePrefix')} disabled={!canEdit} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Términos por defecto de cotización">
            <textarea rows={3} {...register('defaultQuoteTerms')} disabled={!canEdit} className={textareaClass} />
          </Field>
        </div>
      </SectionCard>

      {canEdit && (
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm font-semibold text-emerald-600">Cambios guardados.</span>}
          {updateSettings.isError && (
            <span className="text-sm font-semibold text-rose-600">No pudimos guardar. Intenta de nuevo.</span>
          )}
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="h-10 rounded-xl bg-teal-950 px-5 text-sm font-black text-white shadow-[0_4px_14px_rgba(4,47,46,0.2)] transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {updateSettings.isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </form>
  )
}

export function SettingsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === ROLES.AdminEmpresa
  const { data, isLoading, error } = useCompanySettings()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-600">Sistema</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">Configuración de empresa</h1>
        <p className="mt-1 text-sm text-slate-500">Perfil, datos fiscales y valores por defecto.</p>
      </div>

      {isLoading && <Loader label="Cargando configuración…" className="py-16" />}
      {error && <p className="py-16 text-center text-sm font-semibold text-rose-600">{error}</p>}
      {data && <SettingsForm settings={data} canEdit={isAdmin} />}
    </div>
  )
}