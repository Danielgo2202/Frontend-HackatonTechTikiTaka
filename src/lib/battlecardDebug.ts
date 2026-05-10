/**
 * Activa logs detallados del pipeline battlecard (normalize → store → UI).
 * - development: encendido por defecto
 * - producción: NEXT_PUBLIC_DEBUG_BATTLECARD=1
 */
export const DEBUG_BATTLECARD =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEBUG_BATTLECARD === "1";

export function logBattlecard(stage: string, payload: unknown): void {
  if (!DEBUG_BATTLECARD) return;
  console.info(`[Close Pilot][Battlecard] ${stage}`, payload);
}
