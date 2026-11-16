import { describe, expect, it, vi } from 'vitest';

vi.mock('@/database/mongoose', () => ({ connectToDatabase: vi.fn() }));

import { isAdmin } from '@/lib/admin';

describe('isAdmin', () => {
    it('lets nobody in when the list is unset or empty', () => {
        expect(isAdmin('a@x.com', undefined)).toBe(false);
        expect(isAdmin('a@x.com', '')).toBe(false);
        expect(isAdmin('', '')).toBe(false);
        expect(isAdmin(undefined, 'a@x.com')).toBe(false);
    });

    it('matches whole addresses, ignoring case and spaces', () => {
        expect(isAdmin('A@x.com', ' a@X.com , b@x.com')).toBe(true);
        expect(isAdmin('b@x.com', 'a@x.com,b@x.com')).toBe(true);
        expect(isAdmin('a@x.co', 'a@x.com')).toBe(false);
        expect(isAdmin('c@x.com', 'a@x.com,b@x.com')).toBe(false);
    });
});
