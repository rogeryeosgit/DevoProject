<template>
  <h1>list of journal entries</h1>
</template>

<script>
export default {
  middleware: ['checkAuth', 'loginCheck']
};
</script>