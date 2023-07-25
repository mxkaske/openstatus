import { customAlphabet, urlAlphabet } from "nanoid";
import { z } from "zod";

import { eq } from "@openstatus/db";
import {
  incident,
  incidentUpdate,
  insertIncidentSchema,
  insertIncidentUpdateSchema,
  page,
  workspace,
} from "@openstatus/db/src/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const incidentRouter = createTRPCRouter({
  createIncident: protectedProcedure
    .input(insertIncidentSchema)
    .mutation(async (opts) => {
      const nanoid = customAlphabet(urlAlphabet, 10);
      const { uuid, ...data } = opts.input;

      // return opts.ctx.db
      //   .insert(incident)
      //   .values({ uuid: nanoid(), data })
      //   .returning()
      //   .get();
    }),

  createIncidentUpdate: protectedProcedure
    .input(insertIncidentUpdateSchema)
    .mutation(async (opts) => {
      const nanoid = customAlphabet(urlAlphabet, 10);
      const { uuid, ...data } = opts.input;

      // return opts.ctx.db
      //   .insert(incidentUpdate)
      //   .values({ uuid: nanoid(), data })
      //   .returning()
      //   .get();
    }),

  updateIncident: protectedProcedure
    .input(
      z.object({
        incidentUUID: z.string(),
        status: insertIncidentSchema.pick({ status: true }),
      }),
    )
    .mutation(async (opts) => {
      return opts.ctx.db
        .update(incident)
        .set(opts.input.status)
        .where(eq(incident.uuid, opts.input.incidentUUID))
        .returning()
        .get();
    }),
  // FIXME: SECURE THIS
  getIncidentByWorkspace: protectedProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .query(async (opts) => {
      const currentWorkspace = await opts.ctx.db
        .select()
        .from(workspace)
        .where(eq(workspace.slug, opts.input.workspaceSlug))
        .get();
      const pageQuery = opts.ctx.db
        .select()
        .from(page)
        .where(eq(page.workspaceId, currentWorkspace.id))
        .as("pageQuery");
      return opts.ctx.db
        .select()
        .from(incident)
        .innerJoin(pageQuery, eq(incident.pageId, pageQuery.id))
        .all();
    }),
});
