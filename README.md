# DevoProject

## Overview

This project is a culmination of my own technical learning over the last year or so. It is meant to move me from pen and paper journaling of my Quiet Times to being internet based.
It is also meant to make it easy for people who ever want to read a passage of scripture for devotion without the hassle of finding a book. You can find the final form at (<https://qt.navigators.tech>)

### Technical Stack

- [Vuetify](https://vuetifyjs.com/en/) - Vue UI Library based on [Material Design](https://material.io/design/introduction)
- [Nuxt](https://nuxtjs.org/) - Vue Framework that allowed me to do SSR
- [VueJS](https://vuejs.org/) - JS Framework for frontend
- [Node](https://nodejs.org/en/) - JS Runtime built on top of Chrome V8 engine
- [Express](https://expressjs.com/) - Web Application frame work for Node
- [MongoDB](https://www.mongodb.com/cloud/atlas) - Cloud hosted MongoDB database. AWS behind the scenes.
- [Firebase Auth](https://firebase.google.com/products/auth) - Simple free multiplatform sign in

### Extra Stuff

Don't suppose anyone would ever want to read it, but my thinking and work progress is documented in [Notes.md](Notes.md) along with some of the other repos in my github.
Project work progress can be seen in the github Projects Tab. Welcome comments for improvement and pull requests.

## Version 1.0 - 2 Sep 2020

> Features

- Authenticated access to Journal and Plans for personalization with Authorization checks
- Create, list, update, delete and select QT Plans
- Ability to write, list, update and delete QT journal entries
- Passages are obtained from chosen QT Plans and shown on the landing page
- Default passage comes from Proverbs

## Version 1.0.1 - 23 Sep 2020

- Updated site meta and visuals
- Resolved a number of bugs
- Journal entry creation and Plans creation now includes some validation to ensure fields are filled

## Version 1.0.2 - 26 Sep 2020

- Set up encryption for journal entries (I can't read them in plain text now...)
- Passages are cached for quick access
- Solved a reload bug for front page

## Version 1.0.3 - 23 May 2021

- Patched Pslams wrong number of verses bug
- Implemented reset password functionality

## Version 1.0.4 - 12 Feb 2022

- Updated to work with MongoDB 5.0
- Functionality to copy journal entries to clipboard

## Build Setup

``` bash
# install dependencies
$ npm install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

Created using Nuxt, check out [Nuxt.js docs](https://nuxtjs.org).
