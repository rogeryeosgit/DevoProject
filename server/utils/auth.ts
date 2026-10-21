import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'
import { getHeader, createError, type H3Event } from 'h3'
import { UserModel } from '../models/User'
import { logger, timed } from './logger'

function getBearerToken(event: H3Event): string {
  const header = getHeader(event, 'authorization')
  if (!header) {
    logger.warn('AUTH: Missing token')
    // A missing Authorization header must reject, not silently pass - fixes the
    // Nuxt 2 auth service's no-header-⇒-resolves bug (docs/migration-plan.md §10).
    throw createError({ statusCode: 401, statusMessage: 'Not Authorized' })
  }
  const token = header.split(' ')[1]
  if (!token) {
    logger.warn('AUTH: Malformed Authorization header')
    throw createError({ statusCode: 401, statusMessage: 'Not Authorized' })
  }
  return token
}

// checkUser/requireOwner both funnel through this per request - several
// endpoints (plan/entry PUT, DELETE, single-entry GET) call both in the same
// request, so without caching verifyIdToken's CPU-bound crypto already ran
// twice per request there. TTL is well under the token's own ~1hr lifetime;
// only successes are cached (a bad/expired token retries every time, so a
// legitimate retry right after a refresh is never masked).
const TOKEN_CACHE_TTL_MS = 60_000
const tokenCache = new Map<string, { decoded: DecodedIdToken; expiresAt: number }>()

async function verifyRequest(event: H3Event) {
  const token = getBearerToken(event)

  const cached = tokenCache.get(token)
  if (cached) {
    if (cached.expiresAt > Date.now()) return cached.decoded
    tokenCache.delete(token)
  }

  try {
    const decoded = await timed('Firebase token check', () => getAuth().verifyIdToken(token))
    tokenCache.set(token, { decoded, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS })
    // Only on a real verification (cache miss), not every call within the TTL.
    logger.info(`AUTH: User token verified for ${decoded.email ?? decoded.uid}`)
    return decoded
  } catch (err: any) {
    // Firebase's code says why (expired, revoked, malformed, wrong project) -
    // the server-side record of failed sign-in attempts.
    logger.warn(`AUTH: Token Error (${err?.code ?? err?.message ?? 'unknown'})`)
    throw createError({ statusCode: 401, statusMessage: 'Not Authorized' })
  }
}

/**
 * Verifies the request's Bearer idToken. If userEmailID is given, also requires
 * the token's email to match it. Returns the verified email.
 *
 * Also enforces email verification, but only for identities qtapp itself
 * registered (server/api/users/register.post.ts sets pendingVerification:true
 * at that exact moment, and nowhere else) - this app shares one Firebase
 * project with sibling apps, so a pre-existing, possibly-unverified account
 * from one of those logging into qtapp for the first time must NOT be caught
 * by this, and neither must any of qtapp's own pre-existing accounts (none of
 * which have this field at all). That's why this is keyed on an explicit flag
 * rather than "does a User doc exist yet" - the latter can't tell those two
 * populations apart.
 */
export async function checkUser(event: H3Event, userEmailID?: string): Promise<string> {
  const decoded = await verifyRequest(event)
  const rawEmail = decoded.email
  if (!rawEmail) {
    throw createError({ statusCode: 401, statusMessage: 'Not Authorized' })
  }
  // Firebase preserves whatever casing the account was created with (plausible
  // for an account signed up on a sibling app sharing this Firebase project);
  // every schema here stores email lowercased. Normalize once, here, so
  // requireOwner's compare against a Mongo-loaded creatorEmail actually
  // matches instead of 403ing the real owner of a mixed-case account.
  const email = rawEmail.toLowerCase()
  if (userEmailID && email !== userEmailID.toLowerCase()) {
    logger.warn(`AUTH: User Email Mismatch (token ${email}, requested ${userEmailID})`)
    throw createError({ statusCode: 401, statusMessage: 'Not Authorized' })
  }

  // Only ever costs a Mongo lookup for the rare unverified case - verified
  // users (all Google sign-ins, every pre-existing account, anyone who's
  // already clicked their link) skip it entirely.
  if (!decoded.email_verified) {
    const existing = await UserModel.findOne({ email }).select('pendingVerification').lean()
    if (existing?.pendingVerification) {
      logger.info(`AUTH: ${email} blocked - email not verified yet`)
      throw createError({ statusCode: 403, statusMessage: 'Email not verified' })
    }
  }

  return email
}

/**
 * The verified (lowercased) email on a request that may or may not carry a
 * token - undefined instead of a 401, and no failure logging. For endpoints
 * anyone may call (server/api/client-log.post.ts).
 */
export async function tryGetEmail(event: H3Event): Promise<string | undefined> {
  const token = getHeader(event, 'authorization')?.split(' ')[1]
  if (!token) return undefined
  const cached = tokenCache.get(token)
  if (cached && cached.expiresAt > Date.now()) return cached.decoded.email?.toLowerCase()
  try {
    const decoded = await timed('Firebase token check', () => getAuth().verifyIdToken(token))
    tokenCache.set(token, { decoded, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS })
    return decoded.email?.toLowerCase()
  } catch {
    return undefined
  }
}

export async function getEmailFromToken(event: H3Event): Promise<string> {
  return checkUser(event)
}

/**
 * Requires the verified token's email to match resourceCreatorEmail. 403 (not
 * 401) since the requester IS authenticated - they just don't own this resource.
 */
export async function requireOwner(event: H3Event, resourceCreatorEmail: string): Promise<string> {
  const email = await checkUser(event)
  if (email !== resourceCreatorEmail) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return email
}
