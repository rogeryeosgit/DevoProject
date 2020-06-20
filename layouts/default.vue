<template>
  <v-app :dark="setTheme">
    <v-navigation-drawer v-model="drawer" :mini-variant="miniVariant" fixed temporary app right>
      <v-list>
        <v-list-item v-for="(item, i) in items" :key="i" :to="item.to" router exact>
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="item.title" />
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="!isAuthenticated" to="/auth" nuxt exact>
          <v-list-item-action>
            <v-icon>mdi-account-circle</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Login</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="isAuthenticated" to="/logout" nuxt exact>
          <v-list-item-action>
            <v-icon>mdi-exit-to-app</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar fixed app color="indigo" dark>
      <v-toolbar-title v-text="title" to="/" nuxt />
      <v-spacer />
      <v-app-bar-nav-icon right @click.stop="drawer = !drawer" />
    </v-app-bar>
    <v-content>
      <v-container>
        <nuxt />
      </v-container>
    </v-content>
    <v-footer :fixed="fixed" app color="indigo" dark>
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      drawer: false,
      fixed: true,
      items: [
        {
          icon: "mdi-home",
          title: "QT App",
          to: "/"
        },
        {
          icon: "mdi-pencil",
          title: "Journal",
          to: "/journal"
        },
        {
          icon: "mdi-clipboard-text",
          title: "Plans",
          to: "/plansList"
        }
      ],
      miniVariant: false,
      title: "QT App"
    };
  },
  computed: {
    setTheme() {
      return (this.$vuetify.theme.dark = false);
    },
    isAuthenticated() {
      return this.$store.getters["userStore/isAuthenticated"];
    }
  }
};
</script>
