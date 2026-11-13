'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InputField from "@/components/forms/InputField";
import { deleteAccount } from "@/lib/actions/profile.actions";

type ConfirmInput = { deletePassword: string; deleteEmail: string };

// Password accounts confirm with the password; accounts that only use Google/GitHub type their email instead.
export default function DeleteAccount({ email, hasPassword }: { email: string; hasPassword: boolean }) {
    const t = useTranslations('DeleteAccount');
    const [open, setOpen] = useState(false);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ConfirmInput>({
        defaultValues: { deletePassword: '', deleteEmail: '' },
    });

    const onSubmit = async (values: ConfirmInput) => {
        const result = await deleteAccount(hasPassword ? { password: values.deletePassword } : { email: values.deleteEmail });
        if (!result.success) {
            toast.error(t('notDeleted'), { description: result.error });
            return;
        }
        toast.success(t('deleted'), { description: t('deletedSub') });
        // Full reload: the session is gone, so nothing cached from the signed-in app may survive
        window.location.assign('/');
    };

    return (
        <div className="flex flex-col items-start gap-3 p-4">
            <p className="text-[14px] leading-relaxed text-foreground/85">{t('intro')}</p>
            <Dialog open={open} onOpenChange={(next) => { if (!isSubmitting) { setOpen(next); if (!next) reset(); } }}>
                <DialogTrigger asChild>
                    <button type="button" className="btn btn-danger"><Trash2 />{t('open')}</button>
                </DialogTrigger>
                <DialogContent className="gap-4 sm:max-w-[440px]">
                    <div>
                        <DialogTitle className="text-xl font-bold tracking-tight">{t('title')}</DialogTitle>
                        <DialogDescription className="mt-2 text-[14px] leading-relaxed text-foreground/90">
                            {t('body', { email })}
                        </DialogDescription>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        {hasPassword ? (
                            <InputField
                                name="deletePassword"
                                label={t('passwordLabel')}
                                placeholder={t('passwordPlaceholder')}
                                type="password"
                                register={register}
                                error={errors.deletePassword}
                                validation={{ required: t('passwordRequired') }}
                            />
                        ) : (
                            <InputField
                                name="deleteEmail"
                                label={t('emailLabel')}
                                placeholder={email}
                                type="email"
                                register={register}
                                error={errors.deleteEmail}
                                validation={{
                                    required: t('emailRequired'),
                                    validate: (value: string) => value.trim().toLowerCase() === email.toLowerCase() || t('emailRequired'),
                                }}
                            />
                        )}
                        <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" className="btn btn-ghost" disabled={isSubmitting} onClick={() => { setOpen(false); reset(); }}>
                                {t('cancel')}
                            </button>
                            <button type="submit" className="btn btn-danger is-solid" disabled={isSubmitting}>
                                {isSubmitting ? t('confirming') : t('confirm')}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
