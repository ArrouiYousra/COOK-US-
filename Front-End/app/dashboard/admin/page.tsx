"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSummaryCards } from "@/components/admin/AdminSummaryCards";
import { AdminTimeseriesChart } from "@/components/admin/AdminTimeseriesChart";
import { AdminDistributionCharts } from "@/components/admin/AdminDistributionCharts";
import { AdminActivityFeed } from "@/components/admin/AdminActivityFeed";
import { useAdminStatsStore } from "@/stores/adminStatsStore";

const TIMESERIES_OPTIONS = ["14", "30", "60"];

export default function AdminDashboardPage() {
  const {
    summary,
    timeseries,
    distributions,
    isLoadingSummary,
    isLoadingTimeseries,
    isLoadingDistributions,
    fetchSummary,
    fetchTimeseries,
    fetchDistributions,
  } = useAdminStatsStore();

  const [range, setRange] = useState("30");
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      fetchTimeseries(Number(range));
      return;
    }
    // Initial load
    initializedRef.current = true;
    void fetchSummary();
    void fetchTimeseries(Number(range));
    void fetchDistributions(90);
  }, [fetchSummary, fetchTimeseries, fetchDistributions, range]);

  const handleRefresh = () => {
    void fetchSummary();
    void fetchTimeseries(Number(range));
    void fetchDistributions(90);
  };

  const isRefreshing = isLoadingSummary || isLoadingTimeseries || isLoadingDistributions;

  return (
    <>
      <AdminHeader summary={summary} isRefreshing={isRefreshing} onRefresh={handleRefresh} />
      <section className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <AdminSummaryCards summary={summary} isLoading={isLoadingSummary} />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Tendances clés</h2>
            <Tabs
              value={range}
              onValueChange={(value) => setRange(value)}
              className="w-auto rounded-full border border-border/60 bg-card/70 p-1"
            >
              <TabsList className="grid grid-cols-3 bg-transparent">
                {TIMESERIES_OPTIONS.map((option) => (
                  <TabsTrigger
                    key={option}
                    value={option}
                    className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    {option} j
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <AdminTimeseriesChart
            data={timeseries}
            isLoading={isLoadingTimeseries}
            range={Number(range)}
          />
        </div>

        <AdminDistributionCharts
          distributions={distributions}
          isLoading={isLoadingDistributions}
        />

        <AdminActivityFeed summary={summary} timeseries={timeseries} />
      </section>
    </>
  );
}

