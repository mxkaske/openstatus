import * as z from "zod";

import { availableRegions } from "@openstatus/tinybird";

import { columns } from "@/components/monitor/columns";
import { DataTable } from "@/components/monitor/data-table";
import { getResponseListData } from "@/lib/tb";

//

/**
 * allowed URL search params
 */
const searchParamsSchema = z.object({
  statusCode: z.coerce.number().optional(),
  region: z.enum(availableRegions).optional(),
  cronTimestamp: z.coerce.number().optional(),
  fromDate: z.coerce.number().optional(),
  toDate: z.coerce.number().optional(),
});

export default async function Monitor({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const search = searchParamsSchema.safeParse(searchParams);
  const data = search.success
    ? await getResponseListData({ monitorId: params.id, ...search.data })
    : await getResponseListData({ monitorId: params.id });

  return <DataTable columns={columns} data={data} />;
}
