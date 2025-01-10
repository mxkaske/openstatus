import type {
  InsertNotification,
  NotificationProvider,
} from "@openstatus/db/src/schema";
import { allPlans } from "@openstatus/db/src/schema/plan/config";
import { workspacePlans } from "@openstatus/db/src/schema/workspaces/constants";
import { sendTestDiscordMessage } from "@openstatus/notification-discord";
import { sendTestSlackMessage } from "@openstatus/notification-slack";
import { nullable } from "zod";
export function getDefaultProviderData(defaultValues?: InsertNotification) {
  if (!defaultValues?.provider) return ""; // FIXME: input can empty - needs to be undefined
  return JSON.parse(defaultValues?.data || "{}")[defaultValues?.provider];
}

export function setProviderData(provider: NotificationProvider, data: string) {
  return { [provider]: data };
}

export function getProviderMetaData(provider: NotificationProvider) {
  switch (provider) {
    case "email":
      return {
        label: "Email",
        dataType: "email",
        placeholder: "dev@documenso.com",
        setupDocLink: null,
        sendTest: null,
        plans: workspacePlans,
      };

    case "slack":
      return {
        label: "Slack",
        dataType: "url",
        placeholder: "https://hooks.slack.com/services/xxx...",
        setupDocLink:
          "https://api.slack.com/messaging/webhooks#getting_started",
        sendTest: sendTestSlackMessage,
        plans: workspacePlans,
      };

    case "discord":
      return {
        label: "Discord",
        dataType: "url",
        placeholder: "https://discord.com/api/webhooks/{channelId}/xxx...",
        setupDocLink: "https://support.discord.com/hc/en-us/articles/228383668",
        sendTest: sendTestDiscordMessage,
        plans: workspacePlans,
      };
    case "sms":
      return {
        label: "SMS",
        dataType: "tel",
        placeholder: "+123456789",
        setupDocLink: null,
        sendTest: null,
        plans: workspacePlans.filter((plan) => allPlans[plan].limits.sms),
      };

    case "pagerduty":
      return {
        label: "PagerDuty",
        dataType: null,
        placeholder: "",
        setupDocLink:
          "https://docs.openstatus.dev/synthetic/features/notification/pagerduty",
        sendTest: null,
        plans: workspacePlans.filter((plan) => allPlans[plan].limits.pagerduty),
      };
    case "opsgenie":
      return {
        label: "OpsGenie",
        dataType: nullable,
        placeholder: "",
        setupDocLink:
          "https://docs.openstatus.dev/synthetic/features/notification/pagerduty",
        sendTest: null,
        plans: workspacePlans.filter((plan) => allPlans[plan].limits.opsgenie),
      };
    default:
      return {
        label: "Webhook",
        dataType: "url",
        placeholder: "xxxx",
        setupDocLink: `https://docs.openstatus.dev/integrations/${provider}`,
        send: null,
        plans: workspacePlans,
      };
  }
}
