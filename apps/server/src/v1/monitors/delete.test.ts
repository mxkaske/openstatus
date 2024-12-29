import { expect, test } from "bun:test";

import { api } from "../index";

test("delete the monitor", async () => {
  const res = await api.request("/monitor/3", {
    method: "DELETE",
    headers: {
      "x-openstatus-key": "1",
    },
  });

  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({});
});

test("no auth key should return 401", async () => {
  const res = await api.request("/monitor/2", { method: "DELETE" });

  expect(res.status).toBe(401);
});

test("invalid monitor id should return 404", async () => {
  const res = await api.request("/monitor/404", {
    method: "DELETE",
    headers: {
      "x-openstatus-key": "2",
    },
  });

  expect(res.status).toBe(404);
});
