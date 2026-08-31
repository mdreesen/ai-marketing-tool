/**
 * GET /api/storage-mode
 * Lets the UI say plainly which storage driver is active. "Object storage is
 * not configured" as a raw 500 during an upload is a bad way to find out.
 */
export default defineEventHandler(() => ({
  driver: hasR2() ? 'r2' : 'local',
  ready: true
}))
