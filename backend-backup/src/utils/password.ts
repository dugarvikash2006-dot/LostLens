import bcrypt from 'bcrypt'

// Cost factor for bcrypt hashing. Higher is slower but more resistant to
// brute-force/offline attacks. 12 is a reasonable default for current
// hardware; kept as a named constant so it's easy to tune later.
const BCRYPT_SALT_ROUNDS = 12

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, BCRYPT_SALT_ROUNDS)
}

export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash)
}
