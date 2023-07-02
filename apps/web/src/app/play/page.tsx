import { Tracker } from "@/components/monitor/tracker";
import { getData } from "@/lib/tb";

export default async function PlayPage() {
  const data = await getData({ siteId: "openstatus" });
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="mb-2 text-2xl font-semibold">Status</p>
      <Tracker data={data} />
    </div>
  );
}
