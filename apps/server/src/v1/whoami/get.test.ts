import { expect, test } from "bun:test";

import { api } from "../index";
import { WorkspaceSchema } from "./schema";

test("return the whoami", async () => {
  const res = await api.request("/whoami", {
    headers: {
      "x-openstatus-key": "1",
    },
  });
  const result = WorkspaceSchema.safeParse(await res.json());

  expect(res.status).toBe(200);
  expect(result.success).toBe(true);
});

test("no auth key should return 401", async () => {
  const res = await api.request("/whoami");

  expect(res.status).toBe(401);
});
