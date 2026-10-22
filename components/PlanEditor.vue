<template>
  <v-form ref="PlanEditorForm">
    <v-row>
      <v-col cols="12" md="4">
        <v-text-field v-model="planName" :rules="nameRules" label="Plan Name" required />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="4">
        <v-textarea
          v-model="description"
          :rules="descriptionRules"
          auto-grow
          label="Description"
          :placeholder="initialTADescription"
          :rows="initialTARows"
          required
        />
      </v-col>
    </v-row>
    <!-- `cols="6" sm="2"` used to get *narrower* at the sm breakpoint (from 50%
         down to 2/12 ~= 100px) - exactly backwards for a field that has to fit
         a `prepend-icon` plus "September". Full-width on the smallest phones,
         settling to a compact 2-up once there's room at sm/md. -->
    <v-row>
      <v-col cols="12" sm="4" md="2">
        <v-select
          v-model="selectedMonthNum"
          :items="monthOptions"
          label="Month"
          density="compact"
        />
      </v-col>
      <v-col cols="12" sm="4" md="2">
        <v-select v-model="selectedYear" :items="yearOptions" label="Year" density="compact" />
      </v-col>
    </v-row>
    <v-table density="compact" height="300" fixed-header>
      <thead>
        <tr>
          <th>Day of Month</th>
          <th>Passage</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in monthPassages" :key="row.day">
          <td>{{ row.day }}</td>
          <td>
            <v-dialog v-model="dialogOpen[row.day]" max-width="600" persistent>
              <template v-slot:activator="{ props: activatorProps }">
                <div v-bind="activatorProps" style="cursor: pointer">{{ row.passage }}</div>
              </template>
              <v-card>
                <v-card-title>Day {{ row.day }}</v-card-title>
                <v-card-text>
                  <PassagePicker
                    :ref="(el) => setPickerRef(row.day, el)"
                    :ppID="row.day"
                    v-model="row.passage"
                    @ready="(v) => (pickerReady[row.day] = v)"
                    @can-advance="(v) => (pickerCanAdvance[row.day] = v)"
                  />
                </v-card-text>
                <v-card-actions class="flex-wrap justify-end">
                  <v-btn color="warning" variant="text" @click="cancelEdit(row.day)">Cancel</v-btn>
                  <v-btn v-if="pickerCanAdvance[row.day]" color="indigo" variant="text" @click="pickerRefs[row.day]?.advance()">
                    Next
                  </v-btn>
                  <v-btn v-if="pickerReady[row.day]" color="success" variant="text" @click="saveEdit(row.day)">Save</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </td>
        </tr>
      </tbody>
    </v-table>
    <v-snackbar v-model="snack" :timeout="3000" :color="snackColor">
      {{ snackText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snack = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-form>
</template>

<script setup lang="ts">
const props = defineProps<{
  propPlanName?: string
  propDescription?: string
  propTempStore?: Record<string, Record<string, string>>
}>()

const userStore = useUserStore()

const PlanEditorForm = ref()

const planName = ref(props.propPlanName || '')
const nameRules = [(v: string) => !!v || 'Name is required'] // !! converts to boolean
const description = ref(props.propDescription || '')
const descriptionRules = [(v: string) => !!v || 'Description is required']
const initialTADescription = 'A simple description of your plan'
const initialTARows = '1'

const date = ref(new Date().toISOString().substring(0, 7)) // YYYY-MM

const monthOptions = [
  { title: 'January', value: 1 }, { title: 'February', value: 2 }, { title: 'March', value: 3 },
  { title: 'April', value: 4 }, { title: 'May', value: 5 }, { title: 'June', value: 6 },
  { title: 'July', value: 7 }, { title: 'August', value: 8 }, { title: 'September', value: 9 },
  { title: 'October', value: 10 }, { title: 'November', value: 11 }, { title: 'December', value: 12 }
]
const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 12 }, (_, i) => currentYear - 3 + i)

const selectedYear = computed({
  get: () => Number(date.value.slice(0, 4)),
  set: (year: number) => {
    tempStoreMonthPassages()
    date.value = `${year}-${date.value.slice(5, 7)}`
  }
})

const selectedMonthNum = computed({
  get: () => Number(date.value.slice(5, 7)),
  set: (month: number) => {
    tempStoreMonthPassages()
    const monthStr = month < 10 ? `0${month}` : `${month}`
    date.value = `${date.value.slice(0, 4)}-${monthStr}`
  }
})

interface DayPassage {
  day: number
  passage: string
}

const tempStore = ref<Record<string, DayPassage[]>>(initTempStore())
const submitStore: Record<string, Record<string, string>> = {}
let sortedSubmitStore: Record<string, Record<string, string>> = {}

const { snack, snackColor, snackText, showSnack } = useSnackbar()

const dialogOpen = ref<Record<number, boolean>>({})
const pickerReady = ref<Record<number, boolean>>({})
const pickerCanAdvance = ref<Record<number, boolean>>({})
const pickerRefs: Record<number, any> = {}

function setPickerRef(day: number, el: any) {
  pickerRefs[day] = el
}

function cancelEdit(day: number) {
  showSnack('Canceled', 'error')
  dialogOpen.value[day] = false
  pickerRefs[day]?.reset()
}

function saveEdit(day: number) {
  showSnack('Data saved', 'success')
  dialogOpen.value[day] = false
  pickerRefs[day]?.reset()
}

// Checking if the chosen month has any passages stored
function isTempStored(): boolean {
  return !!tempStore.value[date.value]
}

function tempStoreMonthPassages() {
  const currentDate = date.value
  const currentMonthPassages = monthPassages.value
  tempStore.value[currentDate] = currentMonthPassages
}

const displayMonthInUTCFormat = computed(() => {
  // Needed to match the server's "MMM YYYY" month-key format
  const d = new Date(date.value)
  return d.toString().substring(4, 7) + ' ' + d.toString().substring(11, 15)
})

const numDaysInCurrentMonth = computed(() => {
  return new Date(Number(date.value.slice(0, 4)), Number(date.value.slice(5, 7)), 0).getDate()
})

const monthPassages = computed<DayPassage[]>(() => {
  if (!isTempStored()) {
    const currentMonthPassages: DayPassage[] = []
    for (let i = 1; i <= numDaysInCurrentMonth.value; i++) {
      currentMonthPassages.push({ day: i, passage: '-- Enter Passage --' })
    }
    return currentMonthPassages
  }
  return tempStore.value[date.value]!
})

// preparing for submission, get tempstore and current month
function emptyPassageExtraction() {
  const monthKey = displayMonthInUTCFormat.value

  // Storing current active month
  const currentMonthObject: Record<string, string> = {}
  for (const row of monthPassages.value) {
    if (row.passage !== '-- Enter Passage --') {
      currentMonthObject[row.day.toString()] = row.passage
    }
  }
  if (Object.keys(currentMonthObject).length !== 0) {
    submitStore[monthKey] = currentMonthObject
  }

  // Storing other months
  for (const [key, monthRows] of Object.entries(tempStore.value)) {
    const otherMonthObject: Record<string, string> = {}
    const convertedKey = new Date(key).toString().substring(4, 7) + ' ' + new Date(key).toString().substring(11, 15)
    for (const row of monthRows) {
      if (row.passage !== '-- Enter Passage --') {
        otherMonthObject[row.day.toString()] = row.passage
      }
    }
    if (!Object.prototype.hasOwnProperty.call(submitStore, convertedKey) && Object.keys(otherMonthObject).length !== 0) {
      submitStore[convertedKey] = otherMonthObject
    }
  }
}

// Must be done after submit store is prepared by emptyPassageExtraction()
function sortPassageByDate() {
  const sortedKeys = Object.keys(submitStore)
    .map((key) => new Date(key))
    .slice()
    .sort((a, b) => a.getTime() - b.getTime())

  sortedSubmitStore = {}
  for (const sortedDate of sortedKeys) {
    const tempKey = sortedDate.toString().substring(4, 7) + ' ' + sortedDate.toString().substring(11, 15)
    sortedSubmitStore[tempKey] = submitStore[tempKey]!
  }
}

function getPlan() {
  emptyPassageExtraction()
  sortPassageByDate()
  return {
    creatorEmail: userStore.userID,
    planName: planName.value,
    description: description.value,
    passages: sortedSubmitStore
  }
}

function monthToNumConvertor(month: string): number {
  return 'JanFebMarAprMayJunJulAugSepOctNovDec'.indexOf(month) / 3 + 1 // Get month in number
}

function numDaysInMonth(month: number, year: string): number {
  return new Date(Number(year), month, 0).getDate()
}

function initTempStore(): Record<string, DayPassage[]> {
  const result: Record<string, DayPassage[]> = {}
  if (props.propTempStore == null) return result

  for (const [key, value] of Object.entries(props.propTempStore)) {
    const numofDays = numDaysInMonth(monthToNumConvertor(key.slice(0, 3)), key.slice(4, 8))
    const currentMonthPassages: DayPassage[] = []
    for (let i = 1; i <= numofDays; i++) {
      currentMonthPassages.push({ day: i, passage: '-- Enter Passage --' })
    }

    for (const [day, passage] of Object.entries(value)) {
      currentMonthPassages[Number(day) - 1]!.passage = passage
    }

    let month = monthToNumConvertor(key.slice(0, 3)).toString()
    // ISO month needs 0 in front
    if (Number(month) < 10) {
      month = '0' + month
    }
    result[key.slice(4, 8) + '-' + month] = currentMonthPassages
  }
  return result
}

async function checkValidation(): Promise<boolean> {
  const { valid } = await PlanEditorForm.value.validate()
  return valid
}

defineExpose({ getPlan, checkValidation })
</script>
