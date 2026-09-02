#!/usr/bin/env node
/**
 * Creates the value for the ADMIN_PASSWORD_HASH environment variable.
 *
 *   node scripts/hash-password.mjs "the-password"
 */
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your-password"');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = await derive(password, salt, 64);
console.log(`scrypt:${salt.toString("hex")}:${hash.toString("hex")}`);
