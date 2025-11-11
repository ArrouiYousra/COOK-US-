"use client";

import { useEffect, useRef, useState } from "react";
import { MonitorDot } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminActivityFeed } from "@/components/admin/AdminActivityFeed";
import { AdminTimeseriesChart } from "@/components/admin/AdminTimeseriesChart";
import { useAdminStatsStore } from "@/stores/adminStatsStore";
import { Button } from "@/components/ui/button";

export default function AdminActivityPage() {
  const {
    summary,
    timeseries,
    isLoadingSummary,
    isLoadingTimeseries,
    fetchSummary,
    fetchTimeseries,
  } = useAdminStatsStore();
  const [range, setRange] = useState(60);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      void fetchSummary();
      void fetchTimeseries(range);
      return;
    }
    void fetchTimeseries(range);
  }, [fetchSummary, fetchTimeseries, range]);

  const handleRefresh = () => {
    void fetchSummary();
    void fetchTimeseries(range);
  };

  return (
    <>
      <AdminHeader
        summary={summary}
        isRefreshing={isLoadingSummary || isLoadingTimeseries}
        onRefresh={handleRefresh}
      />
      <section className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-500">
                <MonitorDot className="h-4 w-4" />
                Monitoring temps réel
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Flux d’activité & signaux opérationnels
              </h2>
              <p className="text-sm text-muted-foreground">
                Analysez les pics d’activité, identifiez les anomalies et priorisez les actions
                d’assistance ou de modération.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[30, 60, 90].map((value) => (
                <Button
                  key={value}
                  variant={range === value ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setRange(value)}
                >
                  {value} j
                </Button>
              ))}
            </div>
          </div>
        </div>

        <AdminTimeseriesChart data={timeseries} isLoading={isLoadingTimeseries} range={range} />

        <AdminActivityFeed summary={summary} timeseries={timeseries} />
      </section>
    </>
  );
}

