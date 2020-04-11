export default function (context) {
    console.log('[Middleware] Login Check Done');
    if (!context.store.getters['userStore/isAuthenticated']) {
        context.redirect('/error')  // Just throw any page for the time being
    }
}