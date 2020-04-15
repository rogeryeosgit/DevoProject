export default function (context) {
    console.log('[Middleware] Check Auth Called');
    context.store.dispatch("userStore/initAuth", context.req);
}