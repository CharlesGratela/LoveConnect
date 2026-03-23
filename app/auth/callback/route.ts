import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/verify-email?success=true';

  if (!code) {
    return NextResponse.redirect(
      new URL('/verify-email?error=missing-token', requestUrl.origin)
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL('/verify-email?error=invalid-token', requestUrl.origin)
      );
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error) {
    return NextResponse.redirect(
      new URL('/verify-email?error=invalid-token', requestUrl.origin)
    );
  }
}
