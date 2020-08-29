// Merely checks if the user is logged in
export default function (context) {
    if (!context.store.getters['userStore/isAuthenticated']) {
        context.redirect('/error')  // Just throw any page for the time being
    }
}