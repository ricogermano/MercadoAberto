'use client';

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PIX_PAYLOAD, PIX_RECIPIENT, type DonateLabels } from "@/lib/donate";

// Opens from whatever is passed as children (footer link, sidebar item). Never opens on its own.
const DonateDialog = ({ labels, children }: { labels: DonateLabels; children: React.ReactNode }) => {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(PIX_PAYLOAD);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Clipboard blocked (insecure origin, old browser): the code stays selectable below
        }
    };

    return (
        <Dialog onOpenChange={(open) => !open && setCopied(false)}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[400px] gap-4">
                <div>
                    <DialogTitle className="text-xl font-bold tracking-tight">{labels.title}</DialogTitle>
                    <DialogDescription className="mt-2 text-[14px] leading-relaxed text-foreground/90">
                        {labels.body}
                    </DialogDescription>
                </div>

                <div className="flex flex-col items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/pix-qr.svg" alt="QR Code Pix" width={208} height={208} className="rounded-xl bg-white p-1" />
                    <p className="text-center text-[13px] text-foreground/85">{labels.scan}</p>
                </div>

                <button type="button" onClick={copy} className="btn btn-primary h-10 w-full justify-center gap-2">
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? labels.copied : labels.copy}
                </button>
                <p className="mono select-all break-all rounded-lg border border-line p-2 text-[12px] leading-snug text-foreground/80">{PIX_PAYLOAD}</p>

                <p className="text-center text-[13px] text-foreground/85">
                    {labels.recipient}: <span className="font-semibold text-foreground">{PIX_RECIPIENT}</span>
                </p>
            </DialogContent>
        </Dialog>
    );
};

export default DonateDialog;
