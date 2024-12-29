import { createRoute } from "@hono/zod-openapi";

import { db, eq } from "@openstatus/db";
import { page } from "@openstatus/db/src/schema";
import { openApiErrorResponses } from "../../libs/errors/openapi-error-responses";
import type { pagesApi } from "./index";
import { PageSchema } from "./schema";

const getAllRoute = createRoute({
  method: "get",
  tags: ["page"],
  description: "Get all your status pages",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PageSchema.array(),
        },
      },
      description: "A list of your status pages",
    },
    ...openApiErrorResponses,
  },
});

export function registerGetAllPages(api: typeof pagesApi) {
  return api.openapi(getAllRoute, async (c) => {
    const workspaceId = c.get("workspace").id;

    const _pages = await db
      .select()
      .from(page)
      .where(eq(page.workspaceId, workspaceId));

    const data = PageSchema.array().parse(_pages);

    return c.json(data, 200);
  });
}
