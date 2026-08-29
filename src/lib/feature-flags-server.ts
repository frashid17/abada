import "server-only";

import { getFeatureFlagOverridesMap } from "@/lib/platform-admin/ops-cms";
import {
  getFeatureFlags,
  isFeatureEnabled,
  type FeatureFlag,
} from "@/lib/feature-flags";

/** DB override wins when present; otherwise env default. */
export async function isFeatureEnabledAsync(flag: FeatureFlag): Promise<boolean> {
  const overrides = await getFeatureFlagOverridesMap();
  if (flag in overrides) return overrides[flag]!;
  return isFeatureEnabled(flag);
}

export async function getFeatureFlagsAsync(): Promise<Record<FeatureFlag, boolean>> {
  const overrides = await getFeatureFlagOverridesMap();
  const flags = getFeatureFlags();
  for (const key of Object.keys(overrides) as FeatureFlag[]) {
    if (key in flags) flags[key] = overrides[key]!;
  }
  return flags;
}
