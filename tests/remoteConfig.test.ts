import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({ default: {} }));
vi.mock('@/lib/supabase', () => ({ supabase: null }));

import { DEFAULT_REMOTE, sanitizeRemote } from '../src/lib/remoteConfig';

describe('remote config: online_matching anahtarı', () => {
  it('satır yoksa / alan yoksa açık kalır', () => {
    expect(sanitizeRemote(null).features.online_matching).toBe(true);
    expect(sanitizeRemote([{ key: 'features', value: { league_enabled: true } }]).features.online_matching).toBe(true);
    expect(DEFAULT_REMOTE.features.online_matching).toBe(true);
  });
  it('yalnızca açıkça false ise kapanır', () => {
    expect(sanitizeRemote([{ key: 'features', value: { online_matching: false } }]).features.online_matching).toBe(false);
    expect(sanitizeRemote([{ key: 'features', value: { online_matching: 'no' } }]).features.online_matching).toBe(true);
  });
});
