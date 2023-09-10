import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth, ClerkProvider, useAuth } from "@clerk/nextjs";

import { SubmitButton } from "../components/submit-button";
import type { ProjectResponse } from "../libs/client";
import {
  createLogDrain,
  deleteLogDrain,
  getLogDrains,
  getProject,
} from "../libs/client";
import { decrypt } from "../libs/crypto";

export async function Configure() {
  const iv = cookies().get("iv")?.value;
  const encryptedToken = cookies().get("token")?.value;
  const teamId = cookies().get("teamId")?.value;

  if (!iv || !encryptedToken) {
    /** Redirect to access new token */
    return redirect("/app");
  }

  const token = decrypt(
    Buffer.from(iv || "", "base64url"),
    Buffer.from(encryptedToken || "", "base64url"),
  ).toString();

  let logDrains = await getLogDrains(token, teamId);

  const projects = await getProject(token, teamId);
  const p = projects.projects as ProjectResponse[];
  console.log(p[0].serverlessFunctionRegion);

  if (logDrains.length === 0) {
    logDrains = [
      await createLogDrain(
        token,
        // @ts-expect-error We need more data - but this is a demo
        {
          deliveryFormat: "json",
          name: "OpenStatus Log Drain",
          // TODO: update with correct url
          url: "https://f97b-2003-ec-e716-2900-cab-5249-1843-c87b.ngrok-free.app/api/integrations/vercel",
          sources: ["static", "lambda", "build", "edge", "external"],
          // headers: { "key": "value"}
        },
        teamId,
      ),
    ];

    console.log({ logDrains });
  }

  // TODO: automatically create log drain on installation
  async function create(formData: FormData) {
    "use server";
    await createLogDrain(
      token,
      // @ts-expect-error We need more data - but this is a demo
      {
        deliveryFormat: "json",
        name: "OpenStatus Log Drain",
        // TODO: update with correct url
        url: "https://f97b-2003-ec-e716-2900-cab-5249-1843-c87b.ngrok-free.app/api/integrations/vercel",
        sources: ["static", "lambda", "build", "edge", "external"],
        // headers: { "key": "value"}
      },
      teamId,
    );
    revalidatePath("/");
  }

  async function _delete(formData: FormData) {
    "use server";
    const id = formData.get("id")?.toString();
    console.log({ id });
    if (id) {
      await deleteLogDrain(token, id, String(teamId));
      revalidatePath("/");
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center">
      <div className="border-border m-3 grid w-full max-w-xl gap-3 rounded-lg border p-6 backdrop-blur-[2px]">
        <h1 className="font-cal text-2xl">Configure</h1>
        <ul>
          {logDrains.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2"
            >
              <p>{item.name}</p>
              <form action={_delete}>
                <input name="id" value={item.id} className="hidden" />
                <SubmitButton>Remove integration</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
