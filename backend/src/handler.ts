import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export async function handler(_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  // minimal proof of life
  return json(200, { ok: true, service: "bookmark-vault", stage: "health" });
}
