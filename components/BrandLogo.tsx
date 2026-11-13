import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

// The fork's own wordmark, in text: the upstream logo image carries the OpenStock name
const BrandLogo = ({ className }: { className?: string }) => (
    <span aria-label={APP_NAME} className={cn('inline-block text-[22px] font-semibold leading-none tracking-tight text-foreground', className)}>
        Mercado<span className="text-brand-ink">Aberto</span>
    </span>
);

export default BrandLogo;
