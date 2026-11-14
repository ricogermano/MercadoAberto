import { useLocale } from 'next-intl';
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatPercent } from "@/lib/format";

// Direction is carried by colour and arrow, so it never relies on colour alone.
const ChangePill = ({ value }: { value?: number | null }) => {
    const locale = useLocale();
    if (value == null || !Number.isFinite(value)) return <span className="pill">—</span>;
    if (value === 0) return <span className="pill">{formatPercent(0, locale)}</span>;
    const up = value > 0;
    return (
        <span className={up ? 'pill is-up' : 'pill is-down'}>
            {up ? <ArrowUpRight /> : <ArrowDownRight />}
            {formatPercent(Math.abs(value), locale)}
        </span>
    );
};

export default ChangePill;
