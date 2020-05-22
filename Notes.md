## 1 Apr 2020

- Fixed Server Middleware - Needs to be included in Nuxt config file

- Tweaked Bible Retrieval to text that I need [Need to remember to change token]

- Added date file plug in. Realized need to re-compile using webpack for some reason for it to kick in

- Worked on cards and theme displays for Vuetify and made it LIGHT

- Practiced passing props into components


## 9 Apr 2020

- Figured out the struture of the app (journal is list of QT journal entries, auth is for authenticated related pages, plans is for creation of plans without dabbling in code)

- Authentication needs to be done on the server side, passing of email and pwd need to be encrypted over transfer

- Token needs to be passed back to client and stored in a cookie

- Journal entries need to be identified by the clients id (email)

- User needs to have plan tied to his information for nuxtserverinit display

- Having problems with Client to Server Post calls for authentication (no token returned, bug, invalid signature after returned) - solved async issue

- Logging for server side needs to be sorted out (solved server middleware issue) - can't figure out why logging is not coming out from express starting page. - solved sequence of loading. Server middle ware only loaded after express is started.


## 11 Apr 2020

- Figuring out Express structure - In asynchronous programming callbacks are alot more predictable then in "return" statements

- Implementing Cookies for storage of token and expiration time on client side (done, but may not want to use cookies)

- Implementing logout from app / expired or manual - done


## 12 Apr 2020

- Implemented logout checks on client side, so that journal and plans are not accessible when not logged in

- Figure out how to include token in headers for API calls to server - Will always be included in post to server


## 15 Apr 2020

- Check if Client is still authenticated? But need to figure out which pages need logout function. Seems to be called excessively.

- Implemented Logout for app. Done.

- When logged in, login should be disabled completed.

- Re-did naming convention of REST service for service to indicate resources properly in url (proper naming conventions)

- Get services don't carry payload on send. Post requests can carry payload.

- Logging in is done. Starting to work on plans and layout of how plans page should be


## 17 Apr 2020

- Did comparison between MongoDB and Cloud Firestore. Mongo is cheaper in the long run. Also more widely used.

- Able to enter plan data into MongoDB (decided against firebase)

- created structure for plan creation and listing. Form is not completed yet.


## 27 Apr 2020

- Still working on plan creation, still considering how data should be stored if month changes happen.


## 2 May 2020

- Done temp store for plan creation

- Figuring out how to make passage picker component


## 21 May 2020

- Working on Bible Passages. Not sure why V-Model doesn't work as it should, seems to toggle. Did a workaround.

- Currently working on multiple chapter selects and verse selects for choosing bible passages.

## Running TODO LIST

- Do a generic date check and choose passages accordingly

- Set authentication in place so that users can journal in private and see past journal entries

- Format verse numbers to display nicer, superscript instead of brackets

- Implementing encryption between client and server communication and server encryption to other servers

- Figure out refresh token procedures

- Personalize front page after people have signed in

- Validate login data, provide a forget password feature and validate email address to be authentic

- Add additional login methods (Google Sign-In, etc.)

- Create Plans / Pick Plan / Update and DeletePlan (if owner)

- Click into Plans to see verses for the month

- Plans need to have month, date, passage, owner, short description, id

- Design - Expansion panels to display plans

- Upon submission of created plan, need to take out all days and months that have "Enter Passage" default data

- Cancelling creation of plans should pop a prompt to confirm, in case all data create gets lost

- To structure returned passage properly, need to check maximum 2 consecutive chapters (Allow more? unlikely)

- Validation that verses chosen are selected after the previous verse