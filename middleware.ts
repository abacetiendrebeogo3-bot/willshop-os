import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_SUPABASE_URL = 'https://stbzctncpvgqdpybcrmg.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YnpjdG5jcHZncWRweWJjcm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MDAzMjYsImV4cCI6MjEwNDE3NjMyNn0.G7QlTqyz4_D6nxbn72tIX1K-nbAKBzSX7CuMB2jixvs';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // API routes manage their own authentication and response statuses
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Public paths accessible without authentication
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/health');

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.trim().length > 0
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim().length > 0
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : PUBLIC_SUPABASE_ANON_KEY;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          );
        },
      },
    });

    // Refresh auth session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isApiRoute = pathname.startsWith('/api/');

    // 1. If not logged in and accessing protected page -> redirect to /login
    if (!user && !isPublicPath && !isApiRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // 2. If logged in, fetch user role and enforce RBAC route restrictions
    if (user && !isApiRoute) {
      let userRole = 'COMMERCIAL';
      try {
        const { data: roleRows } = await supabase
          .from('user_organization_roles')
          .select('role')
          .eq('user_id', user.id)
          .is('deleted_at', null);

        if (roleRows && roleRows.length > 0) {
          userRole = roleRows[0].role || 'COMMERCIAL';
        }
      } catch (_roleErr) {
        // Fallback default
      }

      // If accessing login/signup/root -> redirect to appropriate home route
      if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
        const url = request.nextUrl.clone();
        url.pathname =
          userRole === 'LIVREUR'
            ? '/delivery/my-deliveries'
            : userRole === 'COMMERCIAL'
            ? '/sales/my-day'
            : '/ceo';
        return NextResponse.redirect(url);
      }

      // Restricted routes for LIVREUR role
      if (userRole === 'LIVREUR') {
        const allowedForLivreur = ['/delivery', '/profile', '/login', '/signup'];
        const isAllowed = allowedForLivreur.some(
          (path) => pathname === path || pathname.startsWith(path + '/')
        );

        if (!isAllowed) {
          const url = request.nextUrl.clone();
          url.pathname = '/delivery/my-deliveries';
          return NextResponse.redirect(url);
        }
      }

      // Restricted routes for COMMERCIAL role
      if (userRole === 'COMMERCIAL') {
        const restrictedForCommercial = [
          '/ceo',
          '/finance',
          '/strategy',
          '/team',
          '/marketing',
          '/intelligence',
          '/whatsapp',
          '/ai-agents',
          '/automation',
          '/wilty',
          '/settings',
        ];

        const isRestricted = restrictedForCommercial.some((r) => pathname === r || pathname.startsWith(r + '/'));
        if (isRestricted) {
          const url = request.nextUrl.clone();
          url.pathname = '/sales/my-day';
          return NextResponse.redirect(url);
        }
      }
    }
  } catch (err: any) {
    console.error('[Middleware Error]', err?.message);
    if (!isPublicPath && !pathname.startsWith('/api/')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files & assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
