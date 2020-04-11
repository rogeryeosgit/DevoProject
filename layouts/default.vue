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
      </v-list>
    </v-navigation-drawer>
    <v-app-bar fixed app color="indigo" dark>
      <v-toolbar-title v-text="title" />
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
          icon: "mdi-chart-bubble",
          title: "Login",
          to: "/auth"
        },
                {
          icon: "mdi-chart-bubble",
          title: "Journal",
          to: "/journal"
        }
      ],
      miniVariant: false,
      title: "QT App"
    };
  },
  computed: {
    setTheme() {
      return (this.$vuetify.theme.dark = false);
    }
  }
};
</script>
