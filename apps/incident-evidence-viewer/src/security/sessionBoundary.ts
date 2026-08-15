export interface MutableGeneration {
  current: number;
}

interface SessionBoundaryInput {
  generations: readonly MutableGeneration[];
  clearIdentity: () => void;
  clearAuthorizedView: () => void;
  scheduleAuthoritativeRecheck: () => void;
}

/**
 * Invalidates every in-flight request and rendered authorization snapshot before
 * an Auth callback is allowed to schedule getUser(). The ordering is the boundary.
 */
export function invalidateSessionBeforeRecheck({
  generations,
  clearIdentity,
  clearAuthorizedView,
  scheduleAuthoritativeRecheck,
}: SessionBoundaryInput): void {
  for (const generation of generations) generation.current += 1;
  clearIdentity();
  clearAuthorizedView();
  scheduleAuthoritativeRecheck();
}
