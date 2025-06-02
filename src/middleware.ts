// This file is intentionally modified to remove active middleware functionality.
// An empty default export is provided to satisfy Next.js's requirement
// when a middleware.ts file is present, without performing any operations.
import type { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest): NextResponse | undefined {
  // Intentionally does nothing, allowing the request to proceed as if no middleware was present.
  return undefined;
}

// To explicitly make this middleware apply to no paths (or as few as possible),
// you could use the config object, but simply returning undefined from the middleware
// function for all paths effectively achieves the same for a "do-nothing" middleware.
// export const config = {
//   matcher: [], // Or a non-matching path like '/_never_match_this_path',
// };
