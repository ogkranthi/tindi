import { NextResponse, type NextRequest } from "next/server";

// Optional shared-password gate via HTTP Basic Auth.
// Disabled entirely unless TINDI_PASSWORD is set, so it costs nothing today.
// To turn it on later:  fly secrets set TINDI_PASSWORD=some-family-password
export function middleware(req: NextRequest) {
  const password = process.env.TINDI_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6)); // "user:pass"
    const pass = decoded.slice(decoded.indexOf(":") + 1);
    if (pass === password) return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Tindi"' },
  });
}

export const config = {
  // Gate every page/route except Next internals, static assets, and the health probe.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
