import React from "react";
import { cn } from "@/lib/utils";

type PanelProps = {
    /** Anchor target for the page's section index */
    id?: string;
    title?: string;
    sub?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    children: React.ReactNode;
};

// Concentric hatch shell: a recessed hatched frame holding one raised card.
const Panel = ({ id, title, sub, action, className, bodyClassName, children }: PanelProps) => (
    <section id={id} className={cn('hatch', className)}>
        {title && (
            <div className="section-head">
                <div className="min-w-0">
                    <h2 className="section-title">{title}</h2>
                    {sub && <p className="section-sub">{sub}</p>}
                </div>
                {action}
            </div>
        )}
        <div className={cn('card', bodyClassName)}>{children}</div>
    </section>
);

export default Panel;
