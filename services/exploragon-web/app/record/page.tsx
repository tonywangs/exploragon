import { Suspense } from "react";
import RecordClient from "./client";

export const dynamic = "force-dynamic";

export default function RecordPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <RecordClient />
    </Suspense>
  );
}
