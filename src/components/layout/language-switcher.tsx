
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, defaultLocale } from '@/i18n-config'; // Make sure locales and defaultLocale are exported from i18n-config.ts
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from 'react';

export function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (newLocale: string) => {
    // Pathname might already be prefixed if not on default locale
    // or might not be if on default locale and localePrefix is 'as-needed'
    let newPath = pathname;
    const currentLocaleIsDefault = locale === defaultLocale;
    const currentPathIsPrefixed = locales.some(loc => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`);

    if (currentPathIsPrefixed) {
      // Remove current locale prefix
      newPath = pathname.substring(pathname.indexOf('/', 1)); // Get path after /<locale>
    } else if (!currentLocaleIsDefault) {
      // This case might occur if navigating from a non-prefixed default locale path
      // to another non-prefixed default locale path, then switching.
      // However, with 'as-needed', pathname for non-default should always be prefixed.
      // If not prefixed and not default, it might be an issue, but we proceed.
    }


    // For 'as-needed', don't add prefix if newLocale is the defaultLocale
    if (newLocale === defaultLocale) {
      router.replace(newPath || '/');
    } else {
      router.replace(`/${newLocale}${newPath || ''}`);
    }
  };
  
  if (!isMounted) {
    // Render a placeholder or null on the server/initial client render
    // to avoid hydration mismatch if locale-dependent content is rendered
    return (
        <Button variant="ghost" size="icon" aria-label={t('changeLanguage')} disabled>
            <Globe className="h-5 w-5" />
        </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('changeLanguage')}>
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleChange(loc)}
            disabled={locale === loc} // Disable current locale
            className={locale === loc ? "bg-accent text-accent-foreground" : ""}
          >
            {loc.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

