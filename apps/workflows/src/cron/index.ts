import { monitorPeriodicitySchema } from "@openstatus/db/src/schema/constants";
import { Hono } from "hono";
import { env } from "../env";
import { sendCheckerTasks } from "./checker";
import { sendFollowUpEmails } from "./emails";
import { LaunchMonitorWorkflow, workflowStepSchema } from "./monitor";

const app = new Hono({ strict: false });

app.use("*", async (c, next) => {
  if (c.req.header("authorization") !== env().CRON_SECRET) {
    return c.text("Unauthorized", 401);
  }

  return next();
});

app.get("/checker/:period", async (c) => {
  const period = c.req.param("period");

  const schema = monitorPeriodicitySchema.safeParse(period);

  if (!schema.success) {
    return c.json({ error: schema.error.issues?.[0].message }, 400);
  }

  try {
    await sendCheckerTasks(schema.data);

    return c.json({ success: schema.data }, 200);
  } catch (e) {
    console.error(e);
    return c.text("Internal Server Error", 500);
  }
});

app.get("/emails/follow-up", async (c) => {
  try {
    await sendFollowUpEmails();
    return c.json({ success: true }, 200);
  } catch (e) {
    console.error(e);
    return c.text("Internal Server Error", 500);
  }
});

app.post("/monitors", async (c) => {
  await LaunchMonitorWorkflow();
  return c.json({ success: true }, 200);
});

app.post("/monitors/:step", async (c) => {
  const step = c.req.param("step");
  const schema = workflowStepSchema.safeParse(step);

  if (!schema.success) {
    return c.json({ error: schema.error.issues?.[0].message }, 400);
  }

  switch (schema.data) {
    case "14days":
      console.log("14 days");
      break;
    case "7days":
      console.log("7days");
      break;
    case "1day":
      console.log("1day");
      break;
    case "paused":
      console.log("paused");
      break;
    default:
      throw new Error("Invalid step");
  }
  // Swith on step
  // and do the right action
  //
  return c.json({ success: true }, 200);
});

export { app as cronRouter };
