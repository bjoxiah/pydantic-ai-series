import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  return withAuth(req);
}

export const config = {
  matcher: [
    // protect all routes except the landing/auth page, static assets, and auth routes
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};