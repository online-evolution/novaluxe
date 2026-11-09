import "server-only";
import { decryptSecret as decrypt, encryptSecret as encrypt } from "@/server/secret";

/*
 * Het app-specifieke wachtwoord van iCloud, versleuteld met een eigen sleutel
 * (zie src/server/secret.ts). Het Apple ID gaat mee als "associated data".
 */

const purpose = "icloud-wachtwoord-v1";

export const encryptSecret = (plain: string, appleId: string) => encrypt(plain, { purpose, account: appleId });

export const decryptSecret = (stored: string, appleId: string) => decrypt(stored, { purpose, account: appleId });
