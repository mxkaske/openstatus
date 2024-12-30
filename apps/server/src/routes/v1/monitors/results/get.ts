import { createRoute, z } from "@hono/zod-openapi";

import { and, db, eq } from "@openstatus/db";
import { monitor, monitorRun } from "@openstatus/db/src/schema";
import { OSTinybird } from "@openstatus/tinybird";

import { env } from "@/env";
import { OpenStatusApiError, openApiErrorResponses } from "@/libs/errors";
import type { monitorsApi } from "../index";
import { ParamsSchema, ResultRun } from "../schema";

const tb = new OSTinybird(env.TINY_BIRD_API_KEY);

const getMonitorStats = createRoute({
  method: "get",
  tags: ["monitor"],
  description: "Get a monitor result",
  path: "/:id/result/:resultId",
  request: {
    params: ParamsSchema.extend({
      resultId: z.string().openapi({
        description: "The id of the result",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResultRun.array(),
        },
      },
      description: "All the metrics for the monitor",
    },
    ...openApiErrorResponses,
  },
});

export function registerGetMonitorResult(api: typeof monitorsApi) {
  return api.openapi(getMonitorStats, async (c) => {
    const workspaceId = c.get("workspace").id;
    const { id, resultId } = c.req.valid("param");

    const _monitorRun = await db
      .select()
      .from(monitorRun)
      .where(
        and(
          eq(monitorRun.id, Number(resultId)),
          eq(monitorRun.monitorId, Number(id)),
          eq(monitorRun.workspaceId, workspaceId),
        ),
      )
      .get();

    if (!_monitorRun || !_monitorRun?.runnedAt) {
      throw new OpenStatusApiError({
        code: "NOT_FOUND",
        message: `Monitor run ${resultId} not found`,
      });
    }

    const _monitor = await db
      .select()
      .from(monitor)
      .where(eq(monitor.id, Number(id)))
      .get();

    if (!_monitor) {
      throw new OpenStatusApiError({
        code: "NOT_FOUND",
        message: `Monitor ${id} not found`,
      });
    }
    // Fetch result from tb pipe
    const data = await tb.getResultForOnDemandCheckHttp({
      monitorId: _monitor.id,
      timestamp: _monitorRun.runnedAt?.getTime(),
      url: _monitor.url,
    });
    // return array of results
    if (!data || data.data.length === 0) {
      throw new OpenStatusApiError({
        code: "NOT_FOUND",
        message: `No data found for monitor run ${resultId}`,
      });
    }
    return c.json(data.data, 200);
  });
}