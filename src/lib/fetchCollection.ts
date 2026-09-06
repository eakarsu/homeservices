/** Read all pages for local-filter lists and selectors, preserving API filters. */
export async function fetchCollection<T>(path: string, fetcher: typeof fetch = fetch): Promise<T[]> {
  const url = new URL(path, 'http://collection.local')
  url.searchParams.set('limit', '100')
  const rows: T[] = []
  for (let page = 1; page <= 100; page++) {
    url.searchParams.set('page', String(page))
    const response = await fetcher(url.pathname + url.search, { cache: 'no-store' })
    if (!response.ok) throw new Error(`Could not load records (HTTP ${response.status})`)
    const result = await response.json()
    if (Array.isArray(result)) return result as T[]
    if (!result || !Array.isArray(result.data)) throw new Error('The server returned an invalid list response')
    rows.push(...result.data)
    if (!result.pagination?.hasNext) return rows
    if (!result.data.length || result.pagination.page !== page) throw new Error('The server returned inconsistent pagination')
  }
  throw new Error('This list exceeds 10,000 records; narrow the search')
}
