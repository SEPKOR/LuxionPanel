import { ok, withErrorHandling } from "@/lib/api";
import { getHomelabSnapshot } from "@/lib/system";

export const GET = withErrorHandling(async () => {
  const snapshot = await getHomelabSnapshot();
  return ok(snapshot);
});
