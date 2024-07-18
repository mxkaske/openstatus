import type { WorkspacePlan } from "../workspaces/validation";
import type { Limits, LimitsV1, LimitsV2 } from "./schema";

// TODO: rename to `planConfig`
export const allPlans: Record<
  WorkspacePlan,
  {
    title: "Hobby" | "Starter" | "Growth" | "Pro";
    description: string;
    price: number;
    limits: Limits & { "private-locations": boolean };
  }
> = {
  free: {
    title: "Hobby",
    description: "For personal projects",
    price: 0,
    limits: {
      monitors: 1,
      "synthetic-checks": 1000,
      periodicity: ["10m", "30m", "1h"],
      "multi-region": true,
      "max-regions": 6,
      "data-retention": "14 days",
      "status-pages": 1,
      maintenance: true,
      "status-subscribers": false,
      "custom-domain": false,
      "password-protection": false,
      "white-label": false,
      notifications: true,
      sms: false,
      pagerduty: false,
      "notification-channels": 1,
      members: 1,
      "audit-log": false,
      regions: ["ams", "gru", "iad", "jnb", "hkg", "syd"],
      "private-locations": false,
    },
  },
  starter: {
    title: "Starter",
    description: "For small projects",
    price: 30,
    limits: {
      monitors: 5,
      "synthetic-checks": 10000,
      periodicity: ["1m", "5m", "10m", "30m", "1h"],
      "multi-region": true,
      "max-regions": 35,
      "data-retention": "3 months",
      "status-pages": 1,
      maintenance: true,
      "status-subscribers": true,
      "custom-domain": true,
      "password-protection": true,
      "white-label": false,
      notifications: true,
      pagerduty: true,
      sms: true,
      "notification-channels": 10,
      members: "Unlimited",
      "audit-log": false,
      regions: [
        "ams",
        "arn",
        "atl",
        "bog",
        "bom",
        "bos",
        "cdg",
        "den",
        "dfw",
        "ewr",
        "eze",
        "fra",
        "gdl",
        "gig",
        "gru",
        "hkg",
        "iad",
        "jnb",
        "lax",
        "lhr",
        "mad",
        "mia",
        "nrt",
        "ord",
        "otp",
        "phx",
        "qro",
        "scl",
        "sea",
        "sin",
        "sjc",
        "syd",
        "waw",
        "yul",
        "yyz",
      ],
      "private-locations": true,
    },
  },
  team: {
    title: "Growth",
    description: "For small teams",
    price: 100,
    limits: {
      monitors: 15,
      "synthetic-checks": 50000,
      periodicity: ["30s", "1m", "5m", "10m", "30m", "1h"],
      "multi-region": true,
      "max-regions": 35,
      "data-retention": "12 months",
      "status-pages": 5,
      maintenance: true,
      "status-subscribers": true,
      "custom-domain": true,
      "password-protection": true,
      "white-label": false,
      notifications: true,
      sms: true,
      pagerduty: true,
      "notification-channels": 20,
      members: "Unlimited",
      "audit-log": true,
      regions: [
        "ams",
        "arn",
        "atl",
        "bog",
        "bom",
        "bos",
        "cdg",
        "den",
        "dfw",
        "ewr",
        "eze",
        "fra",
        "gdl",
        "gig",
        "gru",
        "hkg",
        "iad",
        "jnb",
        "lax",
        "lhr",
        "mad",
        "mia",
        "nrt",
        "ord",
        "otp",
        "phx",
        "qro",
        "scl",
        "sea",
        "sin",
        "sjc",
        "syd",
        "waw",
        "yul",
        "yyz",
      ],
      "private-locations": true,
    },
  },
  pro: {
    title: "Pro",
    description: "For bigger teams",
    price: 300,
    limits: {
      monitors: 50,
      "synthetic-checks": 150000,
      periodicity: ["30s", "1m", "5m", "10m", "30m", "1h"],
      "multi-region": true,
      "max-regions": 35,
      "data-retention": "24 months",
      "status-pages": 20,
      maintenance: true,
      "status-subscribers": true,
      "custom-domain": true,
      "password-protection": true,
      "white-label": true,
      notifications: true,
      sms: true,
      pagerduty: true,
      "notification-channels": 50,
      members: "Unlimited",
      "audit-log": true,
      regions: [
        "ams",
        "arn",
        "atl",
        "bog",
        "bom",
        "bos",
        "cdg",
        "den",
        "dfw",
        "ewr",
        "eze",
        "fra",
        "gdl",
        "gig",
        "gru",
        "hkg",
        "iad",
        "jnb",
        "lax",
        "lhr",
        "mad",
        "mia",
        "nrt",
        "ord",
        "otp",
        "phx",
        "qro",
        "scl",
        "sea",
        "sin",
        "sjc",
        "syd",
        "waw",
        "yul",
        "yyz",
      ],
      "private-locations": true,
    },
  },
};
