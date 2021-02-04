# Threaded Messaging Tool

This is meant as a supplement to programs like Zoom, to provide more organized messaging between attendees.

## Goals

* Threaded, like Reddit
* Session IDs with passwords
* Anonymous
* Downloadable
* Upvote/downvote system
* Updates periodically

## Setup

Create a `.env` file:
```
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_URL=<same as DB_HOST>
```

## Database Schema

Each object in the MongoDB database will have the form:

```{json}
{
    "session_id": Number,
    "comment_id": Number,
    "date": Date,
    "username": String,
    "comment": String,
    "upvotes": Number,
    "downvotes": Number,
    "reply_to": Number
}
```

