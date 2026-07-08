import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getTasks } from './tasksService'

export function useTasks(page: number, pageSize: number) {
  const query = useQuery({
    queryKey: ['tasks', page, pageSize],
    queryFn: () => getTasks(page, pageSize),
    placeholderData: keepPreviousData,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? 'No pudimos cargar las tareas.' : null,
  }
}