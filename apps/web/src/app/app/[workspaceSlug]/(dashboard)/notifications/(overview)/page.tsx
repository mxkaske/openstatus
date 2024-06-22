import Link from "next/link";
import * as React from "react";

import { Button } from "@openstatus/ui";

import { EmptyState } from "@/components/dashboard/empty-state";
import { Limit } from "@/components/dashboard/limit";
import { columns } from "@/components/data-table/notification/columns";
import { DataTable } from "@/components/data-table/notification/data-table";
import { api } from "@/trpc/server";
import ChannelTable from "./_components/channelTable";

export default async function NotificationPage() {
  const notifications =
    await api.notification.getNotificationsByWorkspace.query();
  const isLimitReached =
    await api.notification.isNotificationLimitReached.query();

  if (notifications.length === 0) {
    return (
      <>
        <EmptyState
          icon="bell"
          title="No notifications"
          description="Create your first notification channel"
        />
        <ChannelTable />
      </>
    );
  }

  return (
    <>
      <DataTable columns={columns} data={notifications} />
      {isLimitReached ? <Limit /> : null}
      <ChannelTable />
    </>
  );
}
