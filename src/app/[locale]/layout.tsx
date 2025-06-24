
import type { ReactNode } from 'react';

// This layout is a pass-through to resolve a conflict with the main root layout
// at /app/layout.tsx. The [locale] directory is a remnant of a previous i18n
// setup and this change prevents a fatal error during server startup.
export default function LocaleLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
