'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { toast } from 'sonner';

interface ReportItem {
  id: string;
  reason: string;
  details?: string | null;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  reportedUser: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

const STATUSES: ReportItem['status'][] = ['open', 'reviewing', 'resolved', 'dismissed'];

export default function AdminReportsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/reports');

      if (response.status === 403) {
        router.push('/discover');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      toast.error('Failed to load moderation reports');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    void fetchReports();
  }, [authLoading, isAuthenticated, router, fetchReports]);

  const updateReportStatus = async (reportId: string, status: ReportItem['status']) => {
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      setReports((current) =>
        current.map((report) =>
          report.id === reportId ? { ...report, status } : report
        )
      );
      toast.success(`Report marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update report status');
    }
  };

  return (
    <>
      <Header />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Moderation Reports</h1>
          <p className="text-muted-foreground">
            Review user-submitted safety reports and track their status.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No reports submitted yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{report.reason}</span>
                    <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {report.status}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Submitted {new Date(report.createdAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                        Reporter
                      </p>
                      <div className="flex items-center gap-3">
                        <Image
                          src={report.reporter.avatar_url || '/favicon.svg'}
                          alt={report.reporter.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">{report.reporter.name}</p>
                          <p className="text-sm text-muted-foreground">{report.reporter.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                        Reported User
                      </p>
                      <div className="flex items-center gap-3">
                        <Image
                          src={report.reportedUser.avatar_url || '/favicon.svg'}
                          alt={report.reportedUser.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">{report.reportedUser.name}</p>
                          <p className="text-sm text-muted-foreground">{report.reportedUser.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {report.details ? (
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                        Details
                      </p>
                      <p className="text-sm">{report.details}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((status) => (
                      <Button
                        key={status}
                        type="button"
                        variant={report.status === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => void updateReportStatus(report.id, status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
