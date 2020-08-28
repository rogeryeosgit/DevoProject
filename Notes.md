# 1 Apr 2020

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

## 23 May 2020

- Working on getting passage picker dialog box to the correct size

## 5 June 2020

- What is v-slot:activator?

## 7 June 2020

- Done most of the PassagePicker, only that edit-dialog component doesn't get re-rendered. Need to make stepper start at 1 again.
- PassagePicker done
- Working on Storing Passage into mongoDB.

## 10 June 2020

- Storing passage completed
- Tweaked superscript for verses in Passage Component
- Fine tuned log in process with feedback for failed login
- Need to do RUD of CRUD for Plans (Need to figure out if reading needs to retrieve all plans if too many? what to do?)

## 13 June 2020

- Made a default passage (Provers [day of the month]) display if plan is not carefully defined.

## 14 June 2020

- A "thrown" error is causing some problems. Comes after response is sent back to client. - Solved. Not to return anything else after await

- Created Users database for data that relates to the User

- Created Model for QTEntry and Users

- If Vuex Store module wants to access another stores action, can use {root : true}

- Figuring out how to get getters from another module. - solved

- Asynchronous issue, need to figure out how to send back chosenPlanID.

## 19 June 2020

- Chosen plan retrieved and store in vuex

- Front page passage should update dynamically

- Working on listing saved plans, need to set up route on the server side.

## 20 June 2020

- plans can now be read and listed

- Not sure why reload of plans page makes it show json instead - solved

- Need to sort passages in plans according to date - solved

- Plan can now be deleted

- Solved date UTC problem, causing some bugs to current month in focus

## 21 June 2020

- need to check owner of plan for update and deletion - solved

- plan selected is now shown in plan list and is dynamically changeable

- Solved on reload problem, handled with cookie with storage of id

- Starting work on the journal entries part of the app

- When page is reloaded, userID is null, because only token and expiry are around long term. - solved

## 3 July 2020

- Started working on updating plans (updating of plans now possible)

- sorted out a bug that stores wrong plan data (objects need to be refreshed correctly)

## 24 July 2020

- Thinking about the fields needed for the journal entry. (Date, Passage in Mention, Title, Thoughts, Application / Implication)

## 5 Aug 2020

- Trying to understand flexbox and grid system so as to align items better. Horizontal uses justify while verticle alignment uses alignment

- v-cols need to come right after v-rows

- any column modification for v-col using md lg or xl is like a breakpoint where things change from the original "cols" prop. By default is span by 12

- Started working on JournalStore, stopped at defining rest in store.

- How should the journal entry data be represented in firebase for most efficient use case? Store 10 last entries in user collection while having the rest of the entries in qtEntries collection? How about the instance where a user wants to see even earlier entries? Get all? How to sort and get?

## 7 Aug 2020

- The reason why we do referencing in "qtEntries" documents is because if we keep an ever increasing "user" document, we might hit a document size limit in the future. It is also not so efficient because whenever a document is changed, it has to create one and not just increase the size of the exisiting document to accomodate the new data.

- Pagination can have 2 types. Seeking or Cursor based. Seeking becomes inefficient over time because you still need to iterate through each document to skip to page of need. Cursor based ones store additional data of the previous document and therefore won't hit such limitations over time.

- Why am I using email as my foreign key rather then id and does it actually matter? It doesn't actually matter since email login is unique anyway. (ensure unique)

- When I am creating journal entries, I am using ISO timing so that sorting can happen correctly on MongoDB.

- Removed qtEntries array from mongoose User Schema. Tested seems working. May need to be more thorough in testing.

- Starting to work on retreival of qt entries.

## 8 Aug 2020

- Finished creating new QT Entries

- Spotted some problems with 201 return status for plans. - done (no problem, just have to be careful which Axio method I'm using)

## 14 Aug 2020

- Solved some ES6 issues with VSCode. Backticks keep changing to unicode. Solved by installing ESLint extension, setting default auto formatter and reloading.

- Thinking through layout of journal entries.

- Seems like mx-auto did most of the trick

- Started working on QTJournalEditor and templating the form. Need to finish up individual journal edits as well as use template in entry creation.

## 19 Aug 2020

- Finished QTJournalEditor Component and solved some minor visual padding issues.

- Used QTJournalEditor Component on journal entry creation

- Reversing journal entry display

- Working on Journal entry update and deletion - done

- There is a difference in the received response status for Axios $put $post and delete. Appearantly on delete it returns as an object and not a status string.

- Add number of characters in the thoughts box in the journal entry page - done

- Remove entries stored in store upon logout - Has intermitten errors that keep it cycling....

- Looking through authentication again to see if I can verify token through Firebase Admin SDK. Is Axios using https?

## 21 Aug 2020

- Dealing with Axios https.

- Used mkcert to make a localhost cert and CA for dev purposes.

- Tried using this, <https://stackoverflow.com/questions/56966137/how-to-run-nuxt-npm-run-dev-with-https-in-localhost> but didn't work out. mkcert needs to be done in project folder for keys to be in folder.

- Finally used this in the end <https://stackoverflow.com/questions/55440261/nuxt-js-problem-with-server-side-api-call-with-https> to overcome localhost certificate trusting issues

- There is a difference between Intermediate Certification Authorities and Trusted Root Certification Authorities. Place CA certs in TRCA.

- Question regarding httpOnly cookie. if I use it, I lose the ability to check for "logged in" users on client side. What should I do?

- Using token because cookie information changes order? Seems strange.

- Reading firebase admin sdk docs.

- When I send token to FB server, I get a uid.. but what do i check for to ensure user is who he claims to be? I can use email returned from check to ensure that email has not been changed.

- Generated a key for firebase proj. Trying to see what I can verify using returned data

- <https://github.com/gerywahyunugraha/heroku-google-application-credentials-buildpack> this will come in handy for deploying in heroku for google cred.

- Need to think through abit more what I actually want to verify from the client end.

## 22 Aug 2020

- Starting working on checking tokens. Done with journal entries. Figuring out plan deletion at the moment. Some concurrency issue.

## 24 Aug 2020

- Got deleting plans working with checks. Need to test creating plans with checks. With token change still can delete..

- Solved logout loop issue

- Update, deletes need to think through abit more about change of cookies. Checks done.

- Button at bottom of front page done.

- Enabled Dark theme - Ready for deployment after extraction of keys

- Trying to deploy but not serving page yet.

- <https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04>

- <https://medium.com/codeartisan/how-to-run-nuxt-js-on-digitalocean-159fc558d2ab>

- <https://nuxtjs.org/faq/deployment-pm2/>

- <https://pm2.keymetrics.io/docs/usage/log-management/>

## 28 Aug 2020

- Load PM2 on start up <https://pm2.keymetrics.io/docs/usage/startup/>

- Launch Nginx on startup <https://serverfault.com/questions/69350/launch-nginx-on-startup/994316>

## Running TODO LIST

- Implementing encryption between client and server communication and server encryption to other servers

- Figure out refresh token procedures

- Personalize front page after people have signed in

- Validate login data, provide a forget password feature and validate email address to be authentic

- Add additional login methods (Google Sign-In, etc.)

- Validation that verses chosen are selected after the previous verse

- Allow journaling without passage? (ETWG, Prayer List, or Any other entries?)

- Need to have feedback on Create Plan page if plan created is successful

- Server side needs to check cookie for user validity / need to check token for every modification of backend

- Need to handle pagination for plans and journal entries, in case too many plans and entries get returned all at once in future

- On plan deletion, need to ascertain there is a catch all for users who use the plan

- Excessive checkAuth used. Need to figure out best practices.

- Perhaps have a way to input plans using csv

- Automatically find images that suit tone of journal entries?

- Analyze for keywords in the journals and give option to give summary automatically over timeframe?

- Make a highlighting component that automatically quotes text and add highlighting while journalling.

- Deletion of plans need to ask for confirmation

- If logged in show write journal button on front page, if logged out show log in to write or something like that

- Need to have a cache on the server so that I don't have to always access ESVApi and reduces the chance of it hitting the limit
