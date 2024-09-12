import { notFound } from "next/navigation";
import * as React from "react";

import { flyRegions } from "@openstatus/db/src/schema/constants";
import type { Region } from "@openstatus/tinybird";
import { OSTinybird } from "@openstatus/tinybird";
import { Separator } from "@openstatus/ui";

import { Shell } from "@/components/dashboard/shell";
import { CombinedChartWrapper } from "@/components/monitor-charts/combined-chart-wrapper";
import { ButtonReset } from "@/components/monitor-dashboard/button-reset";
import { DatePickerPreset } from "@/components/monitor-dashboard/date-picker-preset";
import { Metrics } from "@/components/monitor-dashboard/metrics";
import { env } from "@/env";
import { getMinutesByInterval } from "@/lib/monitor/utils";
import { getPreferredSettings } from "@/lib/preferred-settings/server";
import { api } from "@/trpc/server";
import {
  DEFAULT_INTERVAL,
  DEFAULT_PERIOD,
  DEFAULT_QUANTILE,
  periods,
  searchParamsCache,
} from "./search-params";

const tb = new OSTinybird({ token: env.TINY_BIRD_API_KEY });

export default async function Page({
  params,
  searchParams,
}: {
  params: { workspaceSlug: string; id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const id = params.id;
  const search = searchParamsCache.parse(searchParams);
  const preferredSettings = getPreferredSettings();

  const monitor = await api.monitor.getPublicMonitorById.query({
    id: Number(id),
  });

  if (!monitor) return notFound();

  const { period, quantile, interval, regions } = search;

  // TODO: work it out easier
  const intervalMinutes = getMinutesByInterval(interval);
  const periodicityMinutes = getMinutesByInterval(monitor.periodicity);

  const isQuantileDisabled = intervalMinutes <= periodicityMinutes;
  const minutes = isQuantileDisabled ? periodicityMinutes : intervalMinutes;

  const [metrics, data, metricsByRegion] = await Promise.all([
    tb.endpointMetrics(period)({ monitorId: id }),
    await tb.endpointChart(period)({
      monitorId: id,
      interval: minutes,
    }),
    tb.endpointMetricsByRegion(period)({
      monitorId: id,
    }),
  ]);

  if (!data || !metrics || !metricsByRegion) return null;

  const isDirty =
    period !== DEFAULT_PERIOD ||
    quantile !== DEFAULT_QUANTILE ||
    interval !== DEFAULT_INTERVAL ||
    flyRegions.length !== regions.length;

  return (
    <div className="relative flex w-full flex-col gap-6">
      <Shell className="sticky top-2 z-10 flex items-center justify-between gap-2 bg-background/80 backdrop-blur-sm">
        <div className="min-w-0">
          <p className="font-semibold text-sm">{monitor.name}</p>
          <a
            href={monitor.url}
            target="_blank"
            rel="noreferrer"
            className="truncate text-base text-muted-foreground"
          >
            {monitor.url}
          </a>
        </div>
        <div className="flex items-center gap-2">
          {isDirty ? <ButtonReset /> : null}
          <DatePickerPreset defaultValue={period} values={periods} />
        </div>
      </Shell>
      <Shell className="grid gap-4">
        <Metrics metrics={metrics} period={period} />
        <Separator className="my-8" />
        <CombinedChartWrapper
          data={data}
          period={period}
          quantile={quantile}
          interval={interval}
          regions={regions.length ? (regions as Region[]) : monitor.regions} // FIXME: not properly reseted after filtered
          monitor={monitor}
          isQuantileDisabled={isQuantileDisabled}
          metricsByRegion={metricsByRegion}
          preferredSettings={preferredSettings}
        />
      </Shell>
    </div>
  );
}
