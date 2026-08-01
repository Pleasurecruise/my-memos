const encoder = new TextEncoder();

async function sha256(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

export async function verifyMcpApiKey(request: Request, expected: string | undefined) {
  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const [actualHash, expectedHash] = await Promise.all([sha256(supplied), sha256(expected ?? "")]);
  let difference = 0;
  for (let index = 0; index < actualHash.length; index += 1) {
    difference |= actualHash[index] ^ expectedHash[index];
  }
  return Boolean(expected) && Boolean(supplied) && difference === 0;
}
