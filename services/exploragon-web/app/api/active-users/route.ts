import { getActiveUsers } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getActiveUsers();
    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("/api/active-users GET error", error);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}


