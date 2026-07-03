import { Leaf, Droplets, ShieldCheck } from "lucide-react";
import { TRUST_BADGES } from "@/lib/constants";

const icons = {
  leaf: Leaf,
  droplet: Droplets,
  shield: ShieldCheck,
} as const;

export function TrustBadges() {
  return (
    <section className="border-y border-brand-200 bg-white py-10">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-4 sm:grid-cols-3 sm:px-6">
        {TRUST_BADGES.map((badge) => {
          const Icon = icons[badge.icon];
          return (
            <div
              key={badge.label}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Icon className="h-7 w-7" />
              </div>
              <span className="font-medium text-brand-900">{badge.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
