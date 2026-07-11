import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

async function proxy(req: Request, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const { search } = new URL(req.url);
  const url = `${BACKEND}/${path.join("/")}${search}`;

  const token = await getKindeServerSession().getAccessTokenRaw();

  const headers = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  if (token) headers.set("authorization", `Bearer ${token}`);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    ...(hasBody ? { duplex: "half" } : {}),
  } as RequestInit);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}

export const GET = (req: Request, { params }: { params: Promise<{ path: string[] }> }) =>
  proxy(req, params);
export const POST = (req: Request, { params }: { params: Promise<{ path: string[] }> }) =>
  proxy(req, params);
export const DELETE = (req: Request, { params }: { params: Promise<{ path: string[] }> }) =>
  proxy(req, params);
