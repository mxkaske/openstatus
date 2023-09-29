import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { analytics, trackAnalytics } from "@openstatus/analytics";
import { and, eq, inArray, sql } from "@openstatus/db";
import {
  allMonitorsExtendedSchema,
  insertMonitorSchema,
  METHODS,
  monitor,
  monitorsToPages,
  notification,
  notificationsToMonitors,
  periodicityEnum,
  selectMonitorExtendedSchema,
  selectNotificationSchema,
} from "@openstatus/db/src/schema";
import { allPlans } from "@openstatus/plans";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { hasUserAccessToMonitor, hasUserAccessToWorkspace } from "./utils";

export const monitorRouter = createTRPCRouter({
  createMonitor: protectedProcedure
    .input(z.object({ data: insertMonitorSchema, workspaceSlug: z.string() }))
    .mutation(async (opts) => {
      const result = await hasUserAccessToWorkspace({
        workspaceSlug: opts.input.workspaceSlug,
        ctx: opts.ctx,
      });

      if (!result) return;

      const monitorLimit = result.plan.limits.monitors;
      const periodicityLimit = result.plan.limits.periodicity;

      const monitorNumbers = (
        await opts.ctx.db.query.monitor.findMany({
          where: eq(monitor.workspaceId, result.workspace.id),
        })
      ).length;

      // the user has reached the limits
      if (monitorNumbers >= monitorLimit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You reached your monitor limits.",
        });
      }

      // the user is not allowed to use the cron job
      if (
        opts.input.data?.periodicity &&
        !periodicityLimit.includes(opts.input.data?.periodicity)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You reached your cron job limits.",
        });
      }
      // FIXME: this is a hotfix
      const { regions, headers, notifications, ...data } = opts.input.data;

      const newMonitor = await opts.ctx.db
        .insert(monitor)
        .values({
          ...data,
          workspaceId: result.workspace.id,
          regions: regions?.join(","),
        })
        .returning()
        .get();

      if (notifications && notifications.length > 0) {
        const allNotifications = await opts.ctx.db.query.notification.findMany({
          where: inArray(notification.id, notifications),
        });
        const values = allNotifications.map((notification) => ({
          monitorId: newMonitor.id,
          notificationId: notification.id,
        }));
        await opts.ctx.db.insert(notificationsToMonitors).values(values).run();
      }

      // TODO: check, do we have to await for the two calls? Will slow down user response for our analytics
      await analytics.identify(result.user.id, {
        userId: result.user.id,
        email: result.user.email,
      });
      await trackAnalytics({
        event: "Monitor Created",
        url: newMonitor.url,
        periodicity: newMonitor.periodicity,
      });
      return newMonitor;
    }),

  getMonitorByID: protectedProcedure
    .input(z.object({ id: z.number() }))
    // .output(selectMonitorSchema)
    .query(async (opts) => {
      if (!opts.input.id) return;
      const result = await hasUserAccessToMonitor({
        monitorId: opts.input.id,
        ctx: opts.ctx,
      });
      if (!result) return;

      const _monitor = selectMonitorExtendedSchema.parse(result.monitor);
      return _monitor;
    }),

  updateMonitor: protectedProcedure
    .input(insertMonitorSchema)
    .mutation(async (opts) => {
      if (!opts.input.id) return;
      const result = await hasUserAccessToMonitor({
        monitorId: opts.input.id,
        ctx: opts.ctx,
      });
      if (!result) return;

      const plan = (result.workspace?.plan || "free") as "free" | "pro";

      const periodicityLimit = allPlans[plan].limits.periodicity;

      // the user is not allowed to use the cron job
      if (
        opts.input?.periodicity &&
        !periodicityLimit.includes(opts.input?.periodicity)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You reached your cron job limits.",
        });
      }
      const { regions, headers, notifications, ...data } = opts.input;
      const currentMonitor = await opts.ctx.db
        .update(monitor)
        .set({ ...data, regions: regions?.join(","), updatedAt: new Date() })
        .where(eq(monitor.id, opts.input.id))
        .returning()
        .get();

      // TODO: optimize!
      const currentMonitorNotifications = await opts.ctx.db
        .select()
        .from(notificationsToMonitors)
        .where(eq(notificationsToMonitors.monitorId, currentMonitor.id))
        .all();

      const currentMonitorNotificationsIds = currentMonitorNotifications.map(
        ({ notificationId }) => notificationId,
      );

      const removedNotifications = currentMonitorNotificationsIds.filter(
        (x) => !notifications?.includes(x),
      );

      const addedNotifications = notifications?.filter(
        (x) => !currentMonitorNotificationsIds?.includes(x),
      );

      if (addedNotifications && addedNotifications.length > 0) {
        const values = addedNotifications.map((notificationId) => ({
          monitorId: currentMonitor.id,
          notificationId,
        }));

        await opts.ctx.db.insert(notificationsToMonitors).values(values).run();
      }

      if (removedNotifications && removedNotifications.length > 0) {
        await opts.ctx.db
          .delete(notificationsToMonitors)
          .where(
            and(
              eq(notificationsToMonitors.monitorId, currentMonitor.id),
              inArray(
                notificationsToMonitors.notificationId,
                removedNotifications,
              ),
            ),
          )
          .run();
      }
    }),

  deleteMonitor: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async (opts) => {
      const result = await hasUserAccessToMonitor({
        monitorId: opts.input.id,
        ctx: opts.ctx,
      });
      if (!result) return;
      await opts.ctx.db
        .delete(monitor)
        .where(eq(monitor.id, result.monitor.id))
        .run();
    }),

  getMonitorsByWorkspace: protectedProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(async (opts) => {
      // Check if user has access to workspace
      const data = await hasUserAccessToWorkspace({
        workspaceSlug: opts.input.workspaceSlug,
        ctx: opts.ctx,
      });

      if (!data) return;

      const monitors = await opts.ctx.db
        .select()
        .from(monitor)
        .where(eq(monitor.workspaceId, data.workspace.id))
        .all();
      // const selectMonitorsArray = selectMonitorSchema.array();

      try {
        return allMonitorsExtendedSchema.parse(monitors);
      } catch (e) {
        console.log(e);
      }
      return;
    }),

  updateMonitorAdvanced: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        method: z.enum(METHODS).default("GET"),
        body: z.string().default("").optional(),
        headers: z
          .array(z.object({ key: z.string(), value: z.string() }))
          .transform((val) => JSON.stringify(val))
          .default([])
          .optional(),
      }),
    )
    .mutation(async (opts) => {
      const result = await hasUserAccessToMonitor({
        monitorId: opts.input.id,
        ctx: opts.ctx,
      });
      if (!result) return;
      await opts.ctx.db
        .update(monitor)
        .set({
          method: opts.input.method,
          body: opts.input.body,
          headers: opts.input.headers,
        })
        .where(eq(monitor.id, opts.input.id))
        .run();
    }),

  getMonitorsForPeriodicity: protectedProcedure
    .input(z.object({ periodicity: periodicityEnum }))
    .query(async (opts) => {
      const result = await opts.ctx.db
        .select()
        .from(monitor)
        .where(
          and(
            eq(monitor.periodicity, opts.input.periodicity),
            eq(monitor.active, true),
          ),
        )
        .all();
      return allMonitorsExtendedSchema.parse(result);
    }),

  getAllPagesForMonitor: protectedProcedure
    .input(z.object({ monitorId: z.number() }))
    .query(async (opts) => {
      const allPages = await opts.ctx.db
        .select()
        .from(monitorsToPages)
        .where(eq(monitorsToPages.monitorId, opts.input.monitorId))
        .all();
      return allPages;
    }),

  getTotalActiveMonitors: publicProcedure
    .input(z.object({}))
    .query(async (opts) => {
      const monitors = await opts.ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(monitor)
        .where(eq(monitor.active, true))
        .all();
      if (monitors.length === 0) return 0;
      return monitors[0].count;
    }),

  // TODO: return the notifications inside of the `getMonitorByID` like we do for the monitors on a status page
  getAllNotificationsForMonitor: protectedProcedure
    .input(z.object({ id: z.number() }))
    // .output(selectMonitorSchema)
    .query(async (opts) => {
      if (!opts.input.id) return;
      const result = await hasUserAccessToMonitor({
        monitorId: opts.input.id,
        ctx: opts.ctx,
      });
      if (!result) return null;

      const data = await opts.ctx.db
        .select()
        .from(notificationsToMonitors)
        .innerJoin(
          notification,
          eq(notificationsToMonitors.notificationId, notification.id),
        )
        .where(eq(notificationsToMonitors.monitorId, opts.input.id))
        .all();
      return data.map((d) => selectNotificationSchema.parse(d.notification));
    }),
});
