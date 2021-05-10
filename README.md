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

A `sessions` collection stores metadata about each session. It has the schema:

```{json}
{
    title: string,
    id: string,
    createdOn: Date,

}
```

Comments in sessions are stored in a recursive form, in the `comments` collection. The schema is below:

```{json}
{
    id: string,
    username: string,
    upvotes: number,
    downvotes: number,
    text: string,
    date: Date,
    replies: [{
        // Same structure, nested.
    }]
}
```

However, to add a reply, we need an efficient method to search the parent comment in the database and update it. Therefore, a `commentLocations` collection is used, with the following schema:

```{json}
{
    sessionId: string,
    commentId: string,
    path: Array[string]
}
```

The `path` attribute stores an array of comment IDs to follow in the comments database.

A `votes` collection stores user votes per comment.

```{json}
{
    commentId: string,
    username: string,
    vote: +1 / -1
}
```

