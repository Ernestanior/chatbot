'use client';

import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const locales = [
  { code: 'zh-Hant', label: '繁體中文' },
  { code: 'en', label: 'English' },
] as const;

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: 'zh-Hant' | 'en') => {
    startTransition(() => {
      setLocale(newLocale);
    });
  };

  const currentLocale = locales.find((l) => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending} className="gap-1.5">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLocale?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => handleLocaleChange(loc.code)}
            className={locale === loc.code ? 'bg-accent' : ''}
          >
            {loc.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}