'use server';

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth, getSession } from "@/lib/better-auth/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { getTranslations } from "next-intl/server";
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants";

export type ProfileInput = {
    name: string;
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
};

const isOption = (options: readonly { value: string }[], value: string) => options.some((o) => o.value === value);

// Every call acts on the signed-in user's own session; nothing here takes a user id from the client.
export async function updateProfile(input: ProfileInput) {
    const t = await getTranslations('Errors');
    const name = input.name.trim();
    if (name.length < 2 || name.length > 80) return { success: false, error: t('nameLength') };
    if (!/^[A-Z]{2}$/.test(input.country)) return { success: false, error: t('pickCountry') };
    if (!isOption(INVESTMENT_GOALS, input.investmentGoals)
        || !isOption(RISK_TOLERANCE_OPTIONS, input.riskTolerance)
        || !isOption(PREFERRED_INDUSTRIES, input.preferredIndustry)) {
        return { success: false, error: t('pickEachOption') };
    }

    try {
        await auth.api.updateUser({
            headers: await headers(),
            body: {
                name,
                country: input.country,
                investmentGoals: input.investmentGoals,
                riskTolerance: input.riskTolerance,
                preferredIndustry: input.preferredIndustry,
            },
        });
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (e) {
        console.error('Profile update failed', e);
        return { success: false, error: t('profileSaveFailed') };
    }
}

export async function changePassword({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) {
    try {
        await auth.api.changePassword({
            headers: await headers(),
            body: { currentPassword, newPassword, revokeOtherSessions: true },
        });
        return { success: true };
    } catch (e) {
        console.error('Password change failed', e);
        const t = await getTranslations('Errors');
        return { success: false, error: t('passwordChangeFailed') };
    }
}

// Irreversible: removes the user, their sessions and sign-in methods, and (through `beforeDelete`) lists and alerts.
// Password accounts must type the password again; others type their email and need a recent sign-in.
export async function deleteAccount({ password, email }: { password?: string; email?: string }) {
    const t = await getTranslations('Errors');
    const session = await getSession();
    if (!session?.user) return { success: false, error: t('accountDeleteFailed') };
    const { user } = session;

    // Each try checks a password: cap the guesses a stolen session could make
    if (await isRateLimited(`delete-account:user:${user.id}`, 5, 10 * 60)) {
        return { success: false, error: t('tooManyAttempts') };
    }

    try {
        const requestHeaders = await headers();
        const accounts = await auth.api.listUserAccounts({ headers: requestHeaders });
        const hasPassword = accounts.some((a: { providerId: string }) => a.providerId === 'credential');

        if (hasPassword) {
            if (typeof password !== 'string' || !password) return { success: false, error: t('accountDeleteWrongPassword') };
        } else if (typeof email !== 'string' || email.trim().toLowerCase() !== user.email.toLowerCase()) {
            return { success: false, error: t('accountDeleteWrongEmail') };
        }

        await auth.api.deleteUser({ headers: requestHeaders, body: hasPassword ? { password } : {} });
        return { success: true };
    } catch (e) {
        console.error('Account deletion failed', e);
        const code = (e as { body?: { code?: string } })?.body?.code;
        if (code === 'INVALID_PASSWORD') return { success: false, error: t('accountDeleteWrongPassword') };
        if (code === 'SESSION_EXPIRED') return { success: false, error: t('accountDeleteSignInAgain') };
        return { success: false, error: t('accountDeleteFailed') };
    }
}
