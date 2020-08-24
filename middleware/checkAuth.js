// Checks if user is already logged in and if so, reloads token into store
export default function (context) {
    console.log('[Middleware] Check Auth Called');
    context.store.dispatch("userStore/checkCookie", context.req);
}