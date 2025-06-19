
import type { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest): NextResponse | undefined {
  // Intentionally does nothing, allowing the request to proceed as if no middleware was present.
  // This file is kept to ensure Next.js doesn't complain if it expects one due to previous setup.
  return undefined;
}

export const config = {
  matcher: [], // Explicitly apply to no paths.
};
