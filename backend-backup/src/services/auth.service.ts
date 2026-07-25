import { prisma } from '../config/prisma'
import { hashPassword, verifyPassword } from '../utils/password'
import { signAuthToken } from '../utils/jwt'
import { AppError } from '../utils/app-error'
import type { SignupInput, LoginInput } from '../validators/auth.validator'
import type { Role } from '../generated/prisma/client'

interface UserRecord {
  id: string
  fullName: string
  email: string
  role: Role
  createdAt: Date
  passwordHash: string
}

export interface SafeUser {
  id: string
  fullName: string
  email: string
  role: Role
  createdAt: Date
}

// A syntactically valid but unusable bcrypt hash. Used to run a dummy
// comparison when no user is found, so that "unknown email" and "wrong
// password" take roughly the same amount of time — this avoids letting an
// attacker distinguish the two cases purely by response latency.
const DUMMY_PASSWORD_HASH = '$2b$12$CwTycUXWue0Thq9StjUM0uJ8p8IF4G8U5.a02x8gnLW.Vn8x8IyJm2'

function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }
}

export async function signup(input: SignupInput): Promise<{ user: SafeUser; token: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })

  if (existing) {
    throw new AppError(409, 'An account with this email already exists.')
  }

  const passwordHash = await hashPassword(input.password)

  // role is not accepted from the request — every signup is a plain USER.
  // The schema's @default(USER) handles this, so it's simply omitted here.
  const user: UserRecord = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash,
    },
  })

  const token = signAuthToken({ sub: user.id, role: user.role })

  return { user: toSafeUser(user), token }
}

export async function login(input: LoginInput): Promise<{ user: SafeUser; token: string }> {
  const user: UserRecord | null = await prisma.user.findUnique({ where: { email: input.email } })

  const passwordMatches = await verifyPassword(
    input.password,
    user ? user.passwordHash : DUMMY_PASSWORD_HASH,
  )

  if (!user || !passwordMatches) {
    // Deliberately identical for "unknown email" and "wrong password" —
    // never reveal which one it was.
    throw new AppError(401, 'Invalid email or password.')
  }

  const token = signAuthToken({ sub: user.id, role: user.role })

  return { user: toSafeUser(user), token }
}

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user: UserRecord | null = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw new AppError(401, 'Authenticated user no longer exists.')
  }

  return toSafeUser(user)
}
