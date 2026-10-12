import { createMockAdapter } from './mockAdapter';
import type { PurchasesAdapter } from './types';

/** Web: gerçek satın alma yok (yalnızca dev'de sahte akış). Native: `adapter.native.ts` (RevenueCat). */
export const adapter: PurchasesAdapter = createMockAdapter();
