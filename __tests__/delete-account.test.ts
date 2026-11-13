import { beforeEach, describe, expect, it, vi } from 'vitest';

// Deleting an account is irreversible: these tests pin who may do it and that the app's own data goes too.

const getSession = vi.fn();
const listUserAccounts = vi.fn();
const deleteUser = vi.fn();
vi.mock('@/lib/better-auth/auth', () => ({
    getSession: () => getSession(),
    auth: { api: {
        listUserAccounts: (...a: unknown[]) => listUserAccounts(...a),
        deleteUser: (...a: unknown[]) => deleteUser(...a),
    } },
}));
vi.mock('next/headers', () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }));
const isRateLimited = vi.fn();
vi.mock('@/lib/rate-limit', () => ({ isRateLimited: (...a: unknown[]) => isRateLimited(...a) }));

vi.mock('@/database/mongoose', () => ({ connectToDatabase: vi.fn().mockResolvedValue({}) }));
const deleteMany = vi.fn();
const model = (name: string) => ({ deleteMany: (filter: unknown) => deleteMany(name, filter) });
vi.mock('@/database/models/watchlist.model', () => ({ watchlistModel: () => model('watchlist') }));
vi.mock('@/database/models/watchlist-list.model', () => ({ watchlistListModel: () => model('lists') }));
vi.mock('@/database/models/alert.model', () => ({ alertModel: () => model('alerts') }));

import { deleteAccount } from '@/lib/actions/profile.actions';
import { deleteUserData } from '@/lib/account-data';

describe('deleteAccount', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getSession.mockResolvedValue({ user: { id: 'user-123', email: 'Ana@Example.com' } });
        listUserAccounts.mockResolvedValue([{ providerId: 'credential' }]);
        isRateLimited.mockResolvedValue(false);
        deleteUser.mockResolvedValue({ success: true });
    });

    it('refuses without a session', async () => {
        getSession.mockResolvedValue(null);
        expect(await deleteAccount({ password: 'x' })).toEqual({ success: false, error: 'accountDeleteFailed' });
        expect(deleteUser).not.toHaveBeenCalled();
    });

    it('needs the password on a password account, even if an email is sent', async () => {
        expect(await deleteAccount({ email: 'ana@example.com' })).toEqual({ success: false, error: 'accountDeleteWrongPassword' });
        expect(deleteUser).not.toHaveBeenCalled();
    });

    it('hands the password to better-auth, which checks it', async () => {
        expect(await deleteAccount({ password: 'secret-1' })).toEqual({ success: true });
        expect(deleteUser).toHaveBeenCalledWith(expect.objectContaining({ body: { password: 'secret-1' } }));
    });

    it('reports a wrong password', async () => {
        deleteUser.mockRejectedValue({ body: { code: 'INVALID_PASSWORD' } });
        expect(await deleteAccount({ password: 'nope' })).toEqual({ success: false, error: 'accountDeleteWrongPassword' });
    });

    it('limits guesses per user', async () => {
        isRateLimited.mockResolvedValue(true);
        expect(await deleteAccount({ password: 'x' })).toEqual({ success: false, error: 'tooManyAttempts' });
        expect(isRateLimited).toHaveBeenCalledWith('delete-account:user:user-123', 5, 600);
        expect(deleteUser).not.toHaveBeenCalled();
    });

    it('social-only accounts confirm with their own email', async () => {
        listUserAccounts.mockResolvedValue([{ providerId: 'google' }]);
        expect(await deleteAccount({ email: 'other@example.com' })).toEqual({ success: false, error: 'accountDeleteWrongEmail' });
        expect(deleteUser).not.toHaveBeenCalled();
        expect(await deleteAccount({ email: ' ana@example.com ' })).toEqual({ success: true });
        expect(deleteUser).toHaveBeenCalledWith(expect.objectContaining({ body: {} }));
    });

    it('asks for a new sign-in when the session is too old', async () => {
        listUserAccounts.mockResolvedValue([{ providerId: 'google' }]);
        deleteUser.mockRejectedValue({ body: { code: 'SESSION_EXPIRED' } });
        expect(await deleteAccount({ email: 'ana@example.com' })).toEqual({ success: false, error: 'accountDeleteSignInAgain' });
    });
});

describe('deleteUserData', () => {
    it('removes the watchlist, the named lists and the alerts of that user only', async () => {
        await deleteUserData('user-123');
        expect(deleteMany.mock.calls.sort()).toEqual([['alerts', { userId: 'user-123' }], ['lists', { userId: 'user-123' }], ['watchlist', { userId: 'user-123' }]]);
    });

    it('never runs without a user id (an empty filter would wipe everyone)', async () => {
        await expect(deleteUserData('')).rejects.toThrow();
    });
});
