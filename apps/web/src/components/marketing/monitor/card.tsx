import Link from "next/link";

import { Button } from "@openstatus/ui/src/components/button";

import { cardConfig } from "@/config/features";
import { nanoid } from "nanoid";
import {
  CardContainer,
  CardContent,
  CardFeature,
  CardFeatureContainer,
  CardHeader,
  CardIcon,
  CardTitle,
} from "../card";
import { Globe } from "./globe";

export function MonitoringCard() {
  const { icon, title, features } = cardConfig.monitors;
  return (
    <CardContainer>
      <CardHeader>
        <CardIcon icon={icon} />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Globe />
        <CardFeatureContainer>
          {features?.map((feature) => (
            <CardFeature key={`monitoring-card-${nanoid(6)}`} {...feature} />
          ))}
          <div className="order-first flex items-center justify-center gap-2 text-center md:order-none">
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/play/checker">Playground</Link>
            </Button>
            <Button className="rounded-full" asChild>
              <Link href="/features/monitoring">Learn more</Link>
            </Button>
          </div>
        </CardFeatureContainer>
      </CardContent>
    </CardContainer>
  );
}
