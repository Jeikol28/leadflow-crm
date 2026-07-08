import { useState } from 'react'
import type { ReactNode } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import type { Quote, QuoteInput } from './quotes.types'
import { useCreateQuote, useUpdateQuote } from './quoteMutations'
import { useCustomerOptions, useLeadOptions, useServiceOptions } from './useQuoteFormOptions'
import { Modal } from '../../shared/components/Modal'
type ItemValues = {
  serviceId: string
  description: string
  quantity: string
  unitPrice: string
}

type QuoteFormValues = {
  customerId: string
  leadId: string
  status: string
  currency: string
  discountAmount: string
  taxRate: string
  expirationDate: string
  notes: string
  terms: string
  items: ItemValues[]
}

const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-teal-500'
const textareaClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-teal-500'

function money(amount: number, currency: string): string {
  return `${currency} ${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 2 }).format(amount)}`
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-semibold text-rose-600">{error}</span>}
    </label>
  )
}

function toFormValues(quote: Quote | null): QuoteFormValues {
  return {
    customerId: quote ? String(quote.customerId) : '',
    leadId: quote?.leadId != null ? String(quote.leadId) : '',
    status: quote?.status ?? 'Borrador',
    currency: quote?.currency ?? 'CRC',
    discountAmount: quote ? String(quote.discountAmount) : '0',
    taxRate: quote ? String(quote.taxRate) : '13',
    expirationDate: quote?.expirationDate ? quote.expirationDate.slice(0, 10) : '',
    notes: quote?.notes ?? '',
    terms: quote?.terms ?? '',
    items:
      quote && quote.items.length > 0
        ? quote.items.map((item) => ({
            serviceId: item.serviceId != null ? String(item.serviceId) : '',
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          }))
        : [{ serviceId: '', description: '', quantity: '1', unitPrice: '' }],
  }
}

function toInput(values: QuoteFormValues): QuoteInput {
  return {
    customerId: Number(values.customerId),
    leadId: values.leadId === '' ? null : Number(values.leadId),
    status: values.status,
    currency: values.currency,
    discountAmount: Number(values.discountAmount) || 0,
    taxRate: Number(values.taxRate) || 0,
    expirationDate: values.expirationDate ? new Date(values.expirationDate).toISOString() : null,
    notes: values.notes.trim() === '' ? null : values.notes.trim(),
    terms: values.terms.trim() === '' ? null : values.terms.trim(),
    items: values.items
      .filter((item) => item.description.trim() !== '' || item.serviceId !== '')
      .map((item) => ({
        serviceId: item.serviceId === '' ? null : Number(item.serviceId),
        description: item.description.trim() === '' ? null : item.description.trim(),
        quantity: Number(item.quantity) || 1,
        unitPrice: item.unitPrice === '' ? null : Number(item.unitPrice),
      })),
  }
}

export function QuoteFormModal({ quote, onClose }: { quote: Quote | null; onClose: () => void }) {
  const isEdit = quote !== null
  const createQuote = useCreateQuote()
  const updateQuote = useUpdateQuote()
  const { options: customers } = useCustomerOptions()
  const { options: leads } = useLeadOptions()
  const { options: services } = useServiceOptions()
  const [localError, setLocalError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuoteFormValues>({ defaultValues: toFormValues(quote) })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const isPending = createQuote.isPending || updateQuote.isPending
  const hasServerError = createQuote.isError || updateQuote.isError

  // Cálculo en vivo de los totales (el backend recalcula al guardar).
  const watchedItems = watch('items')
  const currency = watch('currency')
  const subtotal = (watchedItems ?? []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  )
  const discount = Number(watch('discountAmount')) || 0
  const taxRate = Number(watch('taxRate')) || 0
  const taxable = Math.max(0, subtotal - discount)
  const tax = (taxable * taxRate) / 100
  const total = taxable + tax

  // Al elegir un servicio, autocompleta descripción y precio (editables).
  function onServiceChange(index: number, value: string) {
    setValue(`items.${index}.serviceId`, value)
    if (value === '') return
    const service = services.find((item) => String(item.id) === value)
    if (service) {
      setValue(`items.${index}.description`, service.name)
      setValue(`items.${index}.unitPrice`, String(service.price))
    }
  }

  function onSubmit(values: QuoteFormValues) {
    const input = toInput(values)
    if (input.items.length === 0) {
      setLocalError('Agrega al menos un ítem con descripción.')
      return
    }
    setLocalError(null)
    if (isEdit && quote) {
      updateQuote.mutate({ id: quote.id, input }, { onSuccess: onClose })
    } else {
      createQuote.mutate(input, { onSuccess: onClose })
    }
  }

  return (
    <Modal
      title={isEdit ? `Editar cotización ${quote?.quoteNumber}` : 'Nueva cotización'}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cliente" required error={errors.customerId?.message}>
              <select {...register('customerId', { required: 'Selecciona un cliente.' })} className={inputClass}>
                <option value="">Selecciona un cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Lead">
              <select {...register('leadId')} className={inputClass}>
                <option value="">Sin lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Ítems */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">Ítems</span>
              <button
                type="button"
                onClick={() => append({ serviceId: '', description: '', quantity: '1', unitPrice: '' })}
                className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black text-teal-700 transition-colors hover:bg-teal-100"
              >
                + Agregar ítem
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const lineTotal =
                  (Number(watchedItems?.[index]?.quantity) || 0) * (Number(watchedItems?.[index]?.unitPrice) || 0)
                return (
                  <div key={field.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Servicio</span>
                        <select
                          {...register(`items.${index}.serviceId`)}
                          onChange={(event) => onServiceChange(index, event.target.value)}
                          className={inputClass}
                        >
                          <option value="">Personalizado</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Descripción</span>
                        <input {...register(`items.${index}.description`)} className={inputClass} />
                      </label>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <label className="block w-24">
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Cantidad</span>
                        <input type="number" step="any" min={0} {...register(`items.${index}.quantity`)} className={inputClass} />
                      </label>
                      <label className="block w-32">
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Precio unit.</span>
                        <input type="number" step="any" min={0} {...register(`items.${index}.unitPrice`)} className={inputClass} />
                      </label>
                      <div className="flex-1 text-right">
                        <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">Subtotal</span>
                        <span className="text-sm font-black text-slate-800">{money(lineTotal, currency)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="h-10 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                        aria-label="Quitar ítem"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Parámetros */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Moneda">
              <select {...register('currency')} className={inputClass}>
                <option value="CRC">CRC</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <Field label="Descuento">
              <input type="number" step="any" min={0} {...register('discountAmount')} className={inputClass} />
            </Field>
            <Field label="IVA (%)">
              <input type="number" step="any" min={0} {...register('taxRate')} className={inputClass} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estado">
              <select {...register('status')} className={inputClass}>
                <option value="Borrador">Borrador</option>
                <option value="Enviada">Enviada</option>
                <option value="Aceptada">Aceptada</option>
                <option value="Rechazada">Rechazada</option>
              </select>
            </Field>
            <Field label="Vence">
              <input type="date" {...register('expirationDate')} className={inputClass} />
            </Field>
          </div>

          <Field label="Notas">
            <textarea rows={2} {...register('notes')} className={textareaClass} />
          </Field>
          <Field label="Términos">
            <textarea rows={2} {...register('terms')} className={textareaClass} />
          </Field>

          {/* Totales */}
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold">{money(subtotal, currency)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-slate-600">
              <span>Descuento</span>
              <span className="font-semibold">- {money(discount, currency)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-slate-600">
              <span>IVA ({taxRate}%)</span>
              <span className="font-semibold">{money(tax, currency)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-black text-teal-950">
              <span>Total</span>
              <span>{money(total, currency)}</span>
            </div>
          </div>

          {(localError || hasServerError) && (
            <p className="text-sm font-semibold text-rose-600">
              {localError ?? 'No pudimos guardar la cotización. Revisa los datos e intenta de nuevo.'}
            </p>
          )}

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-10 rounded-xl bg-teal-950 px-4 text-sm font-black text-white shadow-[0_4px_14px_rgba(4,47,46,0.2)] transition-colors hover:bg-teal-800 disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cotización'}
            </button>
          </div>
       </form>
    </Modal>
  )
}
