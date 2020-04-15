<template>
  <v-app>
    <v-card width="400" class="mx-auto mt-5">
      <v-card-title>
        <h1 class="display-1">Login</h1>
      </v-card-title>
      <v-card-text>
        <v-form>
          <v-text-field v-model="email" label="Username" prepend-icon="mdi-account-circle" />
          <v-text-field
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            prepend-icon="mdi-lock"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="showPassword = !showPassword"
            v-model="password"
          />
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn @click="register" color="success">Register</v-btn>
        <v-spacer></v-spacer>
        <v-btn @click="login" color="info">Login</v-btn>
      </v-card-actions>
    </v-card>
  </v-app>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      showPassword: false,
      email: "",
      password: ""
    };
  },
  methods: {
    login() {
      // TODO: validate log in data https://www.youtube.com/watch?v=_-_bz5lH_fI
      this.$store.dispatch("userStore/authenticateUser", {
        isLogin: true,
        id: this.email,
        pwd: this.password
      });
      this.$router.push("/");
    },
    register() {
      this.$store.dispatch("userStore/authenticateUser", {
        isLogin: false,
        id: this.email,
        pwd: this.password
      });
      this.$router.push("/");
    }
  }
};
</script>