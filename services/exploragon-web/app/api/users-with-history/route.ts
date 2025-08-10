import { getAllUsersWithHistory } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getAllUsersWithHistory();
    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("/api/users-with-history GET error", error);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}