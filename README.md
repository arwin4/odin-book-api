# Odinstagram (Instagram-like social app)

This is a backend implementation of [The Odin Project's full stack _Odin-Book_ project](https://www.theodinproject.com/lessons/nodejs-odin-book).

It is the final project in the Odin Project's curriculum, and together with [Messaging App](https://github.com/arwin4/messaging-app-api), is the culmination of everything I've learned during the course.

Visitors can sign up locally, post images, change their avatar, follow other users, comment on posts, and like posts.

Check out [the app's frontend](https://github.com/arwin4/odin-book), a React Router app.

## Some notable features

These are highlights of the backend only.

- Endpoints implemented according to [JSON:API](https://jsonapi.org/) v1.1.
- Local user creation and authorization using PassportJS
- A Jest + supertest test suite for all endpoints, which uses MongoMemoryServer to set up and tear down a test database.
- Error handling with appropriate HTTP status codes and form validation
- Includes a script that feeds the database with fake users, posts, comments, and likes using Faker.
- MongodDB aggregate pipelines and pagination
- Automatically posts a random post every hour on average to make the network feel alive.

## Usage

Create a new MongoDB Atlas cluster. Add the following environment variables to an `.env` file or supply them to your host:

- `MONGODB_CONNECTION_STRING` - Your MongoDB connection string
- `JWT_SECRET_KEY` - Newly created random key
- `SESSION_SECRET` - Newly created random secret
- `CORS_ORIGIN` - Domain of your frontend (or wildcard `*` for testing purposes)
- `NODE_ENV = 'production'` - seeds the database

Clone the repo and install dependencies `npm i`, then run `npm start`.
