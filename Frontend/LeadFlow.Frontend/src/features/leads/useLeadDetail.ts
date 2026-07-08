import { useQuery } from '@tanstack/react-query'
import { getLead } from './leadsService'
import { getLeadInteractions } from './leadDetailService'
import { getTasks } from '../tasks/tasksService'
import { getQuotes } from '../quotes/quotesService'

export function useLeadDetail(id: number) {
  const query = useQuery({
    queryKey: ['lead', id],
    queryFn: () => getLead(id),
    enabled: Number.isFinite(id) && id > 0,
  })
  return {
    lead: query.data ?? null,
    isLoading: query.isLoading,
    error: query.isError ? 'No pudimos cargar el lead.' : null,
  }
}

export function useLeadInteractions(id: number) {
  const query = useQuery({
    queryKey: ['lead-interactions', id],
    queryFn: () => getLeadInteractions(id),
    enabled: id > 0,
  })
  return { items: query.data?.items ?? [] }
}

// El backend no tiene "tareas por lead", así que traemos las tareas y filtramos por leadId.
export function useLeadTasks(id: number) {
  const query = useQuery({ queryKey: ['tasks', 1, 100], queryFn: () => getTasks(1, 100) })
  return { items: (query.data?.items ?? []).filter((task) => task.leadId === id) }
}

export function useLeadQuotes(id: number) {
  const query = useQuery({ queryKey: ['quotes', 1, 100], queryFn: () => getQuotes(1, 100) })
  return { items: (query.data?.items ?? []).filter((quote) => quote.leadId === id) }
}
