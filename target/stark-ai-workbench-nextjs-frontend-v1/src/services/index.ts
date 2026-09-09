/**
 * Service layer barrel — sole swap point between mock (Phase 1) and real backend (Phase 2 of overall lifecycle).
 *
 * UI components import from `@/services` only.
 * Auth is handled by the kit's existing infrastructure (`useAuthStore`, Supabase client,
 * `/api/auth/*` routes, `protectPage`) — there is NO authService in this layer.
 *
 * @see _project/DATA_CONTRACT.md §2
 */

export { chatService } from './chatService';
export { profileService } from './profileService';
export { instructionsService } from './instructionsService';
export { sessionIndexService, titleFromMessage } from './sessionIndexService';
