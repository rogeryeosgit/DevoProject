<template>
  <v-card class="mx-auto mb-4" max-width="460">
    <v-card-title>{{ planName }}</v-card-title>
    <v-card-subtitle>{{ planDescription }}</v-card-subtitle>
    <!-- Two flex children only, `flex-nowrap`: the chevron is structurally pinned
         right at every width, independent of how the left group reflows. A
         `v-spacer` used to sit between the chip and the chevron, but `v-spacer`
         (flex-grow:1) inside a `flex-wrap` container absorbs the free space on
         whichever line it lands on, orphaning the chevron onto its own line the
         moment the chip's text got long enough (the reported "arrow wraps" bug). -->
    <v-card-actions class="flex-nowrap align-center">
      <div class="d-flex flex-wrap align-center ga-2 flex-grow-1">
        <v-btn :disabled="notOwner" variant="text" @click="$emit('update-plan', planID)">Update</v-btn>

        <v-dialog v-model="deleteDialog" persistent max-width="290">
          <template v-slot:activator="{ props: activatorProps }">
            <v-btn :disabled="notOwner" color="red" variant="text" v-bind="activatorProps">Delete</v-btn>
          </template>
          <v-card>
            <v-card-title class="text-h5">Just to be sure...</v-card-title>
            <v-card-text>Are you sure you would like to delete this plan?</v-card-text>
            <v-card-actions class="flex-wrap justify-end">
              <v-btn color="warning" variant="text" @click="deleteDialog = false">Cancel</v-btn>
              <v-btn
                color="success"
                variant="text"
                @click="$emit('delete-plan', planID); deleteDialog = false"
              >Yes</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-chip
          class="flex-shrink-0"
          size="small"
          density="default"
          color="primary"
          :variant="outlined ? 'outlined' : 'flat'"
          @click="$emit('selected', planID)"
        >{{ chipText }}</v-chip>
      </div>
      <v-btn
        icon
        class="flex-shrink-0"
        :aria-label="show ? 'Collapse passages' : 'Expand passages'"
        @click="show = !show"
      >
        <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-btn>
    </v-card-actions>
    <v-expand-transition>
      <div v-if="show">
        <v-divider />
        <v-list density="compact" disabled>
          <v-list-item v-if="fetchingPassages">
            <v-progress-circular indeterminate size="20" color="primary" />
          </v-list-item>
          <v-list-item v-for="(passage, i) in loadedPassages" :key="i.toString()">
            <v-list-item-title v-for="(dayPassage, j) in passage" :key="j.toString()">
              {{ j }} {{ i }} : {{ dayPassage }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup lang="ts">
const props = defineProps<{
  planID: string
  planName: string
  planDescription: string
  // Omitted by the list endpoint (the largest part of each plan doc) - loaded
  // lazily below when first expanded, unless a caller passes it directly.
  passages?: Record<string, Record<string, string>>
  notOwner: boolean
  isSelected: boolean
}>()

defineEmits<{
  'update-plan': [id: string]
  'delete-plan': [id: string]
  selected: [id: string]
}>()

const show = ref(false)
const deleteDialog = ref(false)
const loadedPassages = ref(props.passages ?? {})
const fetchingPassages = ref(false)
// Tracks whether a fetch has completed, independent of whether the result
// happened to be empty (an empty-but-fetched passages map must not look
// "not yet fetched" and trigger a refetch on every re-expand).
let passagesFetched = props.passages != null

watch(show, async (isOpen) => {
  if (!isOpen || passagesFetched || fetchingPassages.value) return
  fetchingPassages.value = true
  try {
    const plan: any = await authFetch(`/api/plans/${props.planID}`)
    loadedPassages.value = plan.passages
    passagesFetched = true
  } catch (e) {
    reportClientError('plan card: loading the plan\'s passages failed', e)
  } finally {
    fetchingPassages.value = false
  }
})

const outlined = computed(() => props.isSelected !== true)
const chipText = computed(() => (props.isSelected === true ? 'Selected' : 'Select'))
</script>
