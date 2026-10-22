<template>
  <div>
    <v-form ref="lazyForm">
      <v-card max-width="400" class="mx-auto mt-5">
        <v-card-title>
          <h1 class="text-h4">Login</h1>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="email"
            :rules="emailRules"
            label="Email"
            prepend-icon="mdi-account-circle"
            required
          />
          <v-text-field
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            prepend-icon="mdi-lock"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="showPassword = !showPassword"
            @keyup.enter="login"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="flex-wrap justify-space-between">
          <v-btn color="success" variant="elevated" @click="register">Register</v-btn>
          <v-btn color="info" variant="elevated" @click="login">Login</v-btn>
        </v-card-actions>
        <v-divider />
        <v-card-actions>
          <v-btn block variant="outlined" @click="loginWithGoogle">
            <v-icon class="mr-2">mdi-google</v-icon>
            Sign in with Google
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
    <div class="d-flex justify-center mt-4">
      <span class="text-primary" style="cursor: pointer" @click="validate()">Forgot Password?</span>
    </div>
    <v-snackbar v-model="snack" :timeout="4000" :color="snackColor">
      {{ snackText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snack = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { sendPasswordResetEmail, type Auth } from 'firebase/auth'
import { authContinueUrl } from '~/stores/user'

const userStore = useUserStore()

const lazyForm = ref()
const showPassword = ref(false)
const email = ref('')
const password = ref('')
const { snack, snackColor, snackText, showSnack } = useSnackbar()
const emailRules = [
  (v: string) => !!v || 'Please enter an email address', // !! converts to boolean
  (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid'
]

// login/register/loginWithGoogle each explicitly own their own navigation,
// deciding it from authenticateUser/authenticateWithGoogle's own direct
// return value - not from an isAuthenticated watcher reacting to token
// state, and not from checking userStore.errorOccured afterward either.
// Both were tried and found genuinely racy:
// - isAuthenticated flips true the instant Firebase's SDK confirms the
//   credentials (via onIdTokenChanged), independent of and well before
//   whichever follow-up API call (verify, register) actually resolves, so a
//   watcher reacting to it can't know yet whether that call is about to fail.
// - errorOccured looked like a fix, but it's shared, mutable state that the
//   snackbar watcher below also reacts to by immediately calling
//   clearError() - depending on microtask ordering, that reactivity flush
//   can run before this function's own post-await check ever sees it
//   (confirmed locally: userStore.error read back as null immediately after
//   a call that had definitely 403'd).
// A function's own direct return value can't be raced by either.
async function login() {
  const ok = await userStore.authenticateUser({ isLogin: true, id: email.value, pwd: password.value })
  if (!ok) {
    // Most commonly /api/users/verify 403ing a still-pending-verification
    // account. Deliberately not auto-redirecting to /auth/verify-email here -
    // the error snackbar (watched separately) already tells them why, and
    // this stays a plain login failure rather than silently resuming the
    // registration flow for someone who's just trying to log in.
    return
  }
  navigateTo('/')
}

async function register() {
  const ok = await userStore.authenticateUser({ isLogin: false, id: email.value, pwd: password.value })
  if (!ok) {
    // sendEmailVerification or the follow-up /api/users/register call failed
    // (Firebase account creation itself may still have succeeded) - the error
    // snackbar (watched separately) shows why; nothing to navigate to here.
    return
  }
  navigateTo('/auth/verify-email')
}

async function loginWithGoogle() {
  const ok = await userStore.authenticateWithGoogle()
  if (!ok) return
  navigateTo('/')
}

async function passwordReset() {
  try {
    const auth = useNuxtApp().$firebaseAuth as Auth
    await sendPasswordResetEmail(auth, email.value, { url: authContinueUrl() })
    showSnack('Password Reset Email Sent!', 'success')
    reportClientEvent('info', 'auth', 'password reset email requested', { email: email.value })
  } catch (e) {
    // When firebase returns an error looking up email in the database
    reportAuthFailure('password reset email', e, email.value)
    showSnack('Error, Email Not Found!', 'error')
  }
}

async function validate() {
  const { valid } = await lazyForm.value.validate()
  if (valid) {
    passwordReset()
  }
}

watch(
  () => userStore.errorOccured,
  (errorOccured) => {
    if (errorOccured) {
      showSnack(userStore.getErrorMessage, 'error')
      userStore.clearError()
    }
  }
)
</script>
