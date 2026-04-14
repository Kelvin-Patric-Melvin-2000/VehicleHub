import type { SVGProps } from "react";
import { Bike, Car, Gauge, Zap, BatteryCharging } from "lucide-react";

/** Maps API vehicle `type` slugs to icons (keep in sync with seeded `vehicle_types`). */
const slugToIcon = {
  car: Car,
  motorcycle: Gauge,
  scooter: Zap,
  bike: Bike,
  electric_car: BatteryCharging,
} as const;

type KnownSlug = keyof typeof slugToIcon;

function isKnownSlug(slug: string): slug is KnownSlug {
  return slug in slugToIcon;
}

export function vehicleTypeIconForSlug(slug: string) {
  if (isKnownSlug(slug)) return slugToIcon[slug];
  return Bike;
}

export function VehicleTypeIcon({ type, ...props }: { type: string } & SVGProps<SVGSVGElement>) {
  const Icon = vehicleTypeIconForSlug(type);
  return <Icon {...props} />;
}
