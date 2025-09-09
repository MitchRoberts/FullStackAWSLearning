import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { MongoClient, Db, ObjectId } from "mongodb";

type SecretShape = {MONGODB_URI: string};
type Bookmark = {
  _id?: ObjectId;
  ownerId: string;
  url: string;
  title?: string;
  tags?: string[];
  isPublic?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type JwtClaims = {
  sub: string;       //owner id          
  email?: string;
  "cognito:groups"?: string[] | string;
  [k: string]: any;
};

const COLLECTION = process.env.COLLECTION || "bookmarks";

const sm = new SecretsManagerClient({});
let cachedSecret: SecretShape | undefined;
let cachedDb: Db | undefined;
let cachedClient: MongoClient | undefined;
let indexesEnsured = false;

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

function getClaims(event: APIGatewayProxyEventV2): JwtClaims | null {
  return (event.requestContext as any)?.authorizer?.jwt?.claims ?? null;
}

function getUserId(event: APIGatewayProxyEventV2): string {
  const c = getClaims(event);
  if (!c?.sub) {
    throw new Error("Unauthed: missing sub claim");
  }
  return c.sub;
}

function getEmail(event: APIGatewayProxyEventV2): string | undefined {
  return getClaims(event)?.email;
}

function getGroups(event: APIGatewayProxyEventV2): string[] {
  const g = getClaims(event)?.["cognito:groups"];
  return Array.isArray(g) ? g : g ? [g] : [];
}

async function getSecret(): Promise<SecretShape> {
  if (!cachedSecret) {
    const { SecretString } = await sm.send(
      new GetSecretValueCommand({ SecretId: process.env.MONGODB_SECRET_NAME! })
    );
    const raw = SecretString || "";
    try {
      const parsed = JSON.parse(raw);
      cachedSecret = parsed as SecretShape;
    } catch {
      cachedSecret = {MONGODB_URI: raw };
    }
  }
  return cachedSecret!;
}

async function getDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }
  const { MONGODB_URI } = await getSecret();
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {maxPoolSize: 5});
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db(process.env.DB_NAME)
  if (!indexesEnsured) {
    await cachedDb.collection(COLLECTION!).createIndexes([
      { key: { ownerId: 1, updatedAt: -1 }, name: "owner_updatedAt" },
      { key: { tags: 1 }, name: "tags" },
    ]);
    indexesEnsured = true;
  }
  return cachedDb;
}

function getOwnerId(event: APIGatewayProxyEventV2): string {
  return getUserId(event);
}

/* ==========  B) Route table  ========== */
/** Each entry: HTTP method, a path regex (with named groups), and a handler fn */
type Ctx = { event: APIGatewayProxyEventV2; db: Db; params: Record<string, string> };
type Handler = (ctx: Ctx) => Promise<APIGatewayProxyResultV2>;

const routes: Array<{ method: string, pattern: RegExp, handler: Handler }> = [
  //GET health proof of life call
  {
    method: "GET",
    pattern: /^\/health$/,
    handler: async () => json(200, {ok: true, service: process.env.DB_NAME})
  },

  //GET bookmarks (contract: owner, q, tag, page, limit)
  {
    method: "GET",
    pattern: /^\/bookmarks$/,
    handler: async ({ event, db }) => {
      const owner = (event.queryStringParameters?.owner || "me").toLowerCase();
      const q = event.queryStringParameters?.q?.trim();
      const tag = event.queryStringParameters?.tag?.trim();
      const page = Math.max(1, Number(event.queryStringParameters?.page || 1));
      const limit = Math.min(100, Math.max(1, Number(event.queryStringParameters?.limit || 20)));
      const skip = (page - 1) * limit;

      const filter: any = owner === "all" ? {} : { ownerId: getOwnerId(event) };
      if (q) filter.$or = [{ url: { $regex: q, $options: "i" } }, { title: { $regex: q, $options: "i" } }];
      if (tag) filter.tags = tag;

      const col = db.collection(COLLECTION!);
      const cursor = col.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit);
      const [items, total] = await Promise.all([cursor.toArray(), col.countDocuments(filter)]);
      return json(200, {
        items: items.map(({ _id, ...rest }) => ({ _id: String(_id), ...rest })),
        page,
        total,
      });
    },
  },

  // POST /bookmarks  (contract: { url, title?, tags? })
  {
    method: "POST",
    pattern: /^\/bookmarks$/,
    handler: async ({ event, db }) => {
      const body = event.body ? JSON.parse(event.body) : {};
      if (typeof body.url !== "string" || !/^https?:\/\//i.test(body.url)) {
        return json(400, { error: "Field 'url' (http/https) is required" });
      }
      const doc = {
        ownerId: getOwnerId(event),
        url: body.url.trim(),
        title: typeof body.title === "string" ? body.title.trim() : undefined,
        tags: Array.isArray(body.tags) ? body.tags.filter((t: any) => typeof t === "string") : [],
        isPublic: Boolean(body.isPublic),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const col = db.collection(COLLECTION!);
      const res = await col.insertOne(doc);
      return json(201, { _id: String(res.insertedId), ...doc });
    },
  },
]

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const method = event.requestContext?.http?.method || "GET";
    const path = event.rawPath || "/";
    const match = routes.find(r => r.method === method && r.pattern.test(path));

    if (!match) return json(404, { error: "Not found" });

    const params = match.pattern.exec(path)?.groups ?? {};
    const db = await getDb();
    return await match.handler({ event, db, params });
  } catch (err: any) {
    console.error(err);
    return json(500, { error: "Internal error", detail: err?.message });
  }
}