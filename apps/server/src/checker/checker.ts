import { nanoid } from "nanoid";

import { publishPingResponse } from "@openstatus/tinybird";

import { env } from "../env";
import { updateMonitorStatus } from "./alerting";
import type { Payload } from "./schema";

const region = env.FLY_REGION;

export const monitor = async ({
  monitorInfo,
  latency,
  statusCode,
}: {
  monitorInfo: Payload;
  latency: number;
  statusCode: number;
}) => {
  const { monitorId, cronTimestamp, url, workspaceId } = monitorInfo;

  await publishPingResponse({
    id: nanoid(), // TBD: we don't need it
    timestamp: Date.now(),
    statusCode,
    latency,
    region,
    url,
    monitorId,
    cronTimestamp,
    workspaceId,
  });
};

export const checker = async (data: Payload) => {
  const startTime = Date.now();
  const res = await ping(data);
  const endTime = Date.now();
  const latency = endTime - startTime;
  await monitor({ monitorInfo: data, latency, statusCode: res.status });
  if (res.ok && !res.redirected) {
    if (data?.status === "error") {
      await updateMonitorStatus({
        monitorId: data.monitorId,
        status: "active",
      });
    }

    if (!res.ok || (res.ok && !res.redirected)) {
      if (data?.status === "active") {
        await updateMonitorStatus({
          monitorId: data.monitorId,
          status: "error",
        });
      }
    }
  }
};

export const ping = async (
  data: Pick<Payload, "headers" | "body" | "method" | "url">,
) => {
  const headers =
    data?.headers?.reduce((o, v) => {
      if (v.key.trim() === "") return o; // removes empty keys from the header
      return { ...o, [v.key]: v.value };
    }, {}) || {};

  const res = await fetch(data?.url, {
    method: data?.method,
    cache: "no-store",
    headers: {
      "OpenStatus-Ping": "true",
      ...headers,
    },
    // Avoid having "TypeError: Request with a GET or HEAD method cannot have a body." error
    ...(data.method !== "GET" && { body: data?.body }),
  });

  return res;
};
