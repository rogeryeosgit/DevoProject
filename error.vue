<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="10">
            <v-card border>
              <v-list-item class="pa-4">
                <v-list-item-title class="text-h5 mb-1 text-wrap">
                  Your Personal QT and Journaling App
                </v-list-item-title>
                <v-list-item-subtitle v-if="error?.statusCode === 404" class="text-high-emphasis text-wrap" style="opacity: 1">
                  {{ pageNotFound }}
                  <br />You will have to log in to view this page
                </v-list-item-subtitle>
                <v-list-item-subtitle v-else class="text-high-emphasis text-wrap" style="opacity: 1">
                  {{ otherError }}
                  <br />You will have to log in to view this page
                  <template v-if="errorReference">
                    <br />Error ref: <strong>{{ errorReference }}</strong> (please quote this if you report the problem)
                  </template>
                </v-list-item-subtitle>
              </v-list-item>
            </v-card>
            <!-- Buttons live inside the v-col (not a sibling of v-container) so they
                 inherit the container's gutter instead of running edge-to-edge, and
                 stack full-width below 600px since `.v-btn` can neither shrink nor
                 wrap its label (Vuetify VBtn.css: flex-shrink:0, white-space:nowrap). -->
            <div class="d-flex flex-column flex-sm-row justify-center ga-2 mt-4">
              <v-btn color="primary" variant="elevated" @click="proceedToLogin">Proceed to log in</v-btn>
              <v-btn color="primary" variant="outlined" @click="goHome">Go to homepage</v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

// The failed request's reference code, put there by the page that threw (see
// errorRef in composables/useAuthFetch.ts). When this page is rendered on the
// server, `data` arrives as a JSON string rather than an object.
const errorReference = computed(() => {
  let data: any = props.error?.data
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      data = undefined
    }
  }
  return typeof data?.ref === 'string' ? data.ref : undefined
})

const pageNotFound = '404 Not Found'
const otherError = 'An error occurred'

useHead(() => ({
  title: props.error?.statusCode === 404 ? pageNotFound : otherError
}))

function proceedToLogin() {
  clearError({ redirect: '/auth' })
}

function goHome() {
  clearError({ redirect: '/' })
}
</script>
