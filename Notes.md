## 1 Apr 2020

- Fixed Server Middleware - Needs to be included in Nuxt config file

- Tweaked Bible Retrieval to text that I need [Need to remember to change token]

- Added date file plug in. Realized need to re-compile using webpack for some reason for it to kick in

- Worked on cards and theme displays for Vuetify and made it LIGHT

- Practiced passing props into components

# TODO 

- Do a generic date check and choose passages accordingly

- Set authentication in place so that users can journal in private and see past journal entries

- Format verse numbers to display nicer, superscript instead of brackets


## 9 Apr 2020

- Figured out the struture of the app (journal is list of QT journal entries, auth is for authenticated related pages, plans is for creation of plans without dabbling in code)

- Authentication needs to be done on the server side, passing of email and pwd need to be encrypted over transfer

- Token needs to be passed back to client and stored in a cookie

- Journal entries need to be identified by the clients id (email)

- User needs to have plan tied to his information for nuxtserverinit display

# TODO

- Having problems with Client to Server Post calls for authentication (no token returned, bug, invalid signature after returned)

- Logging for server side needs to be sorted out (solved server middleware issue) - can't figure out why logging is not coming out from express starting page

