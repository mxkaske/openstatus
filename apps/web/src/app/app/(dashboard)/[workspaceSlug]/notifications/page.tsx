import * as React from "react";
import Link from "next/link";

import { Button } from "@openstatus/ui";

import { Header } from "@/components/dashboard/header";
import { HelpCallout } from "@/components/dashboard/help-callout";
import { columns } from "@/components/data-table/notification/columns";
import { DataTable } from "@/components/data-table/notification/data-table";
import { api } from "@/trpc/server";
import { EmptyState } from "./_components/empty-state";

export default async function MonitorPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const notifications =
    await api.notification.getNotificationsByWorkspace.query();

  return (
    <div className="grid min-h-full grid-cols-1 grid-rows-[auto,1fr,auto] gap-6 md:grid-cols-2 md:gap-8">
      <Header
        title="Notifications"
        description="Overview of all your notification channels."
        actions={
          <Button asChild>
            <Link href="./notifications/edit">Create</Link>
          </Button>
        }
      />
      {notifications && notifications.length > 0 ? (
        <div className="col-span-full">
          <DataTable columns={columns} data={notifications} />
        </div>
      ) : (
        <div className="col-span-full">
          <EmptyState />
        </div>
      )}
      <div className="mt-8 md:mt-12">
        <HelpCallout />
      </div>
    </div>
  );
}
