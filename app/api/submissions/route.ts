import { forwardToBackend } from "@/lib/server-api";
export async function POST(request: Request) { return forwardToBackend(request, "submission"); }
