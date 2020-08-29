// Checks if user is already logged in and if so, reloads token into store
export default function (context) {
    context.store.dispatch("userStore/checkCookie", context.req);
}