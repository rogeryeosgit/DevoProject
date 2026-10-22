// One snackbar's state for the component that calls it - replaces the
// snack/snackColor/snackText trio that used to be declared in every page.
// The template still binds v-model="snack", :color="snackColor" and
// {{ snackText }}; showSnack() sets all three at once.
export function useSnackbar() {
  const snack = ref(false)
  const snackColor = ref('')
  const snackText = ref('')

  function showSnack(text: string, color: string) {
    snackText.value = text
    snackColor.value = color
    snack.value = true
  }

  return { snack, snackColor, snackText, showSnack }
}
