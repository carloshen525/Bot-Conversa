import { type NextRequest } from "next/server";
import { updateSession } from "@/modules/auth/supabase-middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded media files)
     * - public asset extensions (svg, png, jpg, ogg, mp3, mp4, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ogg|mp3|mp4|wav|pdf)$).*)",
  ],
};
