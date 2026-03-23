import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedSupabaseUser } from '@/lib/supabase/dating';
import { isSupabaseAuthEnabled } from '@/lib/auth-provider';
import { isAdminEmail } from '@/lib/admin-access';
import { createAdminClient } from '@/lib/supabase/admin';

interface ReportRow {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  details: string | null;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
}

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
}

export async function GET() {
  try {
    if (!isSupabaseAuthEnabled()) {
      return NextResponse.json(
        { message: 'Admin moderation is only available in Supabase mode' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const authUser = await getAuthenticatedSupabaseUser(supabase);

    if (!authUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminEmail(authUser.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();

    if (!admin) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    }

    const { data: reports, error } = await admin
      .from('reports')
      .select('id, reporter_id, reported_user_id, reason, details, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const typedReports = (reports || []) as ReportRow[];
    const userIds = [
      ...new Set(
        typedReports.flatMap((report) => [report.reporter_id, report.reported_user_id])
      ),
    ];

    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('id, email, name, avatar_url')
      .in('id', userIds);

    if (profileError) {
      throw profileError;
    }

    const profileMap = new Map(
      ((profiles || []) as ProfileRow[]).map((profile) => [profile.id, profile])
    );

    return NextResponse.json({
      reports: typedReports.map((report) => ({
        id: report.id,
        reason: report.reason,
        details: report.details,
        status: report.status,
        createdAt: report.created_at,
        reporter: profileMap.get(report.reporter_id) || {
          id: report.reporter_id,
          name: 'Unknown',
          email: '',
          avatar_url: '/favicon.svg',
        },
        reportedUser: profileMap.get(report.reported_user_id) || {
          id: report.reported_user_id,
          name: 'Unknown',
          email: '',
          avatar_url: '/favicon.svg',
        },
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to load reports', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isSupabaseAuthEnabled()) {
      return NextResponse.json(
        { message: 'Admin moderation is only available in Supabase mode' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const authUser = await getAuthenticatedSupabaseUser(supabase);

    if (!authUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminEmail(authUser.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { reportId, status } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { message: 'reportId and status are required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    if (!admin) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    }

    const { error } = await admin
      .from('reports')
      .update({ status } as never)
      .eq('id', reportId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to update report', error: error.message },
      { status: 500 }
    );
  }
}
