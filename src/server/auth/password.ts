import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/*
 * Wachtwoordhashing met scrypt (ingebouwd in Node, aanbevolen door OWASP).
 * Parameters staan in de hash zelf, zodat ze later verhoogd kunnen worden
 * zonder bestaande wachtwoorden ongeldig te maken.
 */
const params = { logN: 17, r: 8, p: 1, keyLength: 64 } as const;

function derive(
  password: string,
  salt: Buffer,
  logN: number,
  r: number,
  p: number,
  keyLength: number,
): Promise<Buffer> {
  const N = 2 ** logN;
  return new Promise((resolve, reject) =>
    scrypt(password, salt, keyLength, { N, r, p, maxmem: 256 * N * r }, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, params.logN, params.r, params.p, params.keyLength);
  return ["scrypt", params.logN, params.r, params.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, logN, r, p, salt, hash] = stored.split("$");
  if (algorithm !== "scrypt" || !logN || !r || !p || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await derive(
    password,
    Buffer.from(salt, "base64url"),
    Number(logN),
    Number(r),
    Number(p),
    expected.length,
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Hash van een willekeurig wachtwoord. Wordt gecontroleerd als een e-mailadres
 * niet bestaat, zodat de responstijd niet verraadt of een account bestaat.
 */
let dummyHash: Promise<string> | undefined;
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(32).toString("base64url"));
  return dummyHash;
}

/** Minimale eisen aan een nieuw wachtwoord. */
export const passwordRules = { minLength: 12, maxLength: 200 } as const;
