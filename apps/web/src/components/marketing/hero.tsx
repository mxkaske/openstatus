import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge, Button } from "@openstatus/ui";

import { getGitHubStars } from "@/lib/github";
import { numberFormatter } from "@/lib/utils";

export function Hero() {
  return (
    <div className="my-24  flex  w-full flex-col justify-center px-3 py-4 text-center md:p-6">
      <div>
        <Button
          variant="outline"
          className="w-48 rounded-full sm:w-auto"
          asChild
        >
          <Link
            href="https://github.com/openstatusHQ/openstatus/stargazers"
            target="_blank"
            rel="noreferrer"
          >
            Proudly Open Source - Star us on GitHub
            <ChevronRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>{" "}
      </div>
      <div>
        <h1 className="text-foreground font-cal mb-6 mt-2 text-6xl">
          A better way to monitor your services.
        </h1>
        <p className="text-muted-foreground mx-auto mb-6 max-w-lg text-xl">
          Reduce alert fatigue by triggering only relevant alerts when your
          services experience downtime.
        </p>
        {/* much better than using flex without text alignment, text stays center even thought not same length */}
      </div>
      <div className="my-4 grid gap-2 sm:grid-cols-2 md:flex md:items-center md:justify-center">
        <div className="text-center sm:block sm:text-right">
          <Button className="w-48 rounded-full sm:w-auto" asChild>
            <Link href="/app/sign-up">Get Started</Link>
          </Button>
        </div>
        <div className="text-center sm:block sm:text-left">
          <div>
            <Button
              variant="outline"
              className="w-48 rounded-full sm:w-auto"
              asChild
            >
              <Link href="/github" target="_blank">
                Star on GitHub{" "}
                <Suspense fallback={<StarsBadgeFallback />}>
                  <StarsBadge />
                </Suspense>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StarsBadgeFallback() {
  return (
    <Badge variant="secondary" className="ml-1">
      ~
    </Badge>
  );
}

async function StarsBadge() {
  const stars = await getGitHubStars();
  return (
    <>
      <Badge variant="secondary" className="ml-1 hidden sm:block">
        {numberFormatter(stars)}
      </Badge>
      <Badge variant="secondary" className="ml-1 block sm:hidden">
        {stars}
      </Badge>
    </>
  );
}
