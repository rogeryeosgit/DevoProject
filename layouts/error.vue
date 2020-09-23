<template>
  <v-app>
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="10">
          <v-card outlined>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  class="headline mb-1 text-wrap"
                >Your Personal QT and Journaling App</v-list-item-title>
                <v-list-item-subtitle
                  v-if="error.statusCode === 404"
                  class="text--primary text-wrap"
                >
                  {{ pageNotFound }}
                  <br />You will have to log in to view this page
                </v-list-item-subtitle>
                <v-list-item-subtitle v-else class="text--primary text-wrap">
                  {{ otherError }}
                  <br />You will have to log in to view this page
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <center>
      <v-btn
        to="/auth"
        nuxt
        exact
        color="primary"
      >Proceed to log in</v-btn>
    </center>
  </v-app>
</template>

<script>
export default {
  props: {
    error: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      pageNotFound: "404 Not Found",
      otherError: "An error occurred",
    };
  },
  head() {
    const title =
      this.error.statusCode === 404 ? this.pageNotFound : this.otherError;
    return {
      title,
    };
  },
};
</script>
