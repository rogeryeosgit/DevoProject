<template>
  <v-form ref="lazyForm" lazy-validation>
    <v-card width="400" class="mx-auto mt-5">
      <v-card-title>
        <h1 class="display-1">Login</h1>
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
          :type="showPassword ? 'text' : 'password'"
          label="Password"
          prepend-icon="mdi-lock"
          :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append="showPassword = !showPassword"
          v-model="password"
          v-on:keyup.enter="login"
        />
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn @click="register" color="success">Register</v-btn>
        <v-spacer></v-spacer>
        <v-btn @click="login" color="info">Login</v-btn>
      </v-card-actions>
    </v-card>
    <center>
      <a><v-card-text @click="validate()">Forgot Password?</v-card-text></a>
    </center>
    <v-snackbar v-model="snack" :timeout="4000" :color="snackColor">
      {{ snackText }}
      <v-btn text @click="snack = false">Close</v-btn>
    </v-snackbar>
  </v-form>
</template>

<script>
export default {
  data() {
    return {
      showPassword: false,
      email: "",
      emailRules: [
        v => !!v || "Please enter an email address", // !! converts to boolean
        v => /.+@.+\..+/.test(v) || "E-mail must be valid"
      ],
      password: "",
      snack: false,
      snackColor: "",
      snackText: ""
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
    },
    register() {
      this.$store.dispatch("userStore/authenticateUser", {
        isLogin: false,
        id: this.email,
        pwd: this.password
      });
    },
    async passwordReset() {
      try {
        await this.$fire.auth.sendPasswordResetEmail(this.email, {
          url: 'https://qt.navigators.tech'
        }).then(() => {
          this.snack = true;
          this.snackColor = "success";
          this.snackText = "Password Reset Email Sent!";
        });
      } catch (e) {
        // When firebase returns an error looking up email in the database
        console.log(e);
        this.snack = true;
        this.snackColor = "error";
        this.snackText = "Error, Email Not Found!";
      }
    },
    validate() {
      if (this.$refs.lazyForm.validate()) {
        this.passwordReset();
      }
    }
  },
  watch: {
    isAuthenticated: function() {
      if (this.isAuthenticated) {
        // Removed because of excessive calls on the backend, believe to have been superceded by updates. To be deleted KIV
        // this.$store.dispatch("planStore/getPlanChosen");
        this.$router.push("/");
      }
    },
    errorOccured: function() {
      if (this.errorOccured) {
        this.snack = true;
        this.snackColor = "error";
        this.snackText = "Authentication failed";
        this.$store.dispatch("userStore/clearError");
      }
    }
  },
  computed: {
    isAuthenticated: function() {
      return this.$store.getters["userStore/isAuthenticated"];
    },
    errorOccured: function() {
      return this.$store.getters["userStore/errorOccured"];
    }
  }
};
</script>
