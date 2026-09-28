/**
 * Reads the server's honest error message from a failed response so pages never
 * replace a specific governance or validation failure with a generic one.
 */
export async function responseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json() as { error?: unknown; blockers?: unknown }
    if (typeof data.error === 'string' && data.error) {
      const blockers = Array.isArray(data.blockers)
        ? data.blockers.filter((blocker): blocker is string => typeof blocker === 'string')
        : []
      return blockers.length ? `${data.error}: ${blockers.join('; ')}` : data.error
    }
  } catch {
    // Fall through to the caller-provided fallback when the body is not JSON.
  }
  return fallback
}
