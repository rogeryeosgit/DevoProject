<template>
  <div>{{ logout() }}</div>
</template>

<script>
export default {
  methods: {
    logout() {
      this.$store.dispatch('userStore/logout');
      this.$router.push('/');
    }
  }
};
</script>