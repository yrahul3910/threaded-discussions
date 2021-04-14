import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const hostname = process.env.DB_URL;
const uri = `mongodb+srv://${user}:${password}@${hostname}/db?retryWrites=true&w=majority`;

const ID_LENGTH = 7;
const createId = () => Math.random().toString(36).substring(ID_LENGTH);

/**
 * Checks if the user has entered the right set of authentication details.
 * @param {string} username - The username entered
 * @param {string} pwd - The plaintext password entered
 * @param {Function} func - The callback function
 */
exports.authenticate = (username, pwd, callback) => {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    client.connect(err => {
        if (err) throw err;

        const collection = client.db('db').collection('users');
        collection.findOne({ username }, (findErr, results) => {
            if (findErr) {
                callback({
                    success: false,
                    message: 'Find failed.'
                });
                return;
            }

            // If empty results, error.
            if (!results) {
                callback(null, {
                    success: false,
                    message: 'Invalid username'
                });
                return;
            }

            // Check password
            bcrypt.compare(pwd, results.password, (e, res) => {
                if (e || !res) {
                    callback({
                        success: false,
                        message: 'Comparison failed'
                    });
                    return;
                }

                callback(null, {
                    success: true,
                    results
                });
            });
        });

        client.close();
    });
};

/**
 * Registers a user by adding the details to the users table. Also adds user to
 * subscriptions table, since by default, every user subscribes to him/herself.
 * @param {string} username - The username of the new user
 * @param {string} pwd - The plaintext password of a user. This will be hashed.
 * @param {string} name - The user's name
 * @param {Function} func - The callback function
 */
exports.register = (username, pwd, name, callback) => {
    console.log(uri);
    const client = new MongoClient(uri, { useNewUrlParser: true });
    client.connect(err => {
        if (err) throw err;

        const collection = client.db('db').collection('users');
        collection.findOne({ username }, (e, results) => {
            if (e) {
                callback({
                    success: false,
                    message: 'Could not find user.'
                });
                return;
            }

            // If username exists, error
            if (results) {
                callback({
                    success: false,
                    message: 'Username exists.'
                });
                return;
            }

            // Hash the password
            bcrypt.hash(pwd, 10, (hashErr, hash) => {
                if (hashErr) {
                    callback({
                        success: false,
                        message: 'Failed to hash password.'
                    });
                    return;
                }

                // Insert into the database
                collection.insertOne({
                    username,
                    password: hash,
                    dp: null,
                    privacy: 'private',
                    profileImage: null,
                    name
                }, e_ => {
                    if (e_) {
                        callback({
                            success: false,
                            message: 'Failed to insert'
                        });
                        return;
                    }

                    callback(null, { success: true });
                });
            });
        });
    });
    client.close();
};

/**
 * Deletes a user from the database.
 * @param {string} username - The username of the user to delete.
 */
exports.deleteUser = async username => {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    client.connect(async err => {
        if (err) throw err;

        const collection = client.db('db').collection('users');
        const result = await collection.deleteOne({ username });

        return { success: result.acknowledged };
    });
};


/**
 * Creates a new session.
 * @param {string} title
 */
exports.createSession = async title => {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await client.connect();

    const db = client.db('db');
    const sessCollection = db.collection('sessions');
    const id = createId();

    await sessCollection.insertOne({
        id,
        title,
        createdOn: new Date()
    });
    return {
        success: true,
        id
    };
};


/**
 * Adds a comment.
 * @param {string} sessionId - The session ID
 * @param {string} comment - The comment text
 * @param {string} username - The username
 * @param {string} responseTo - The comment ID it responds to
 */
exports.addComment = async(sessionId, comment, username, responseTo) => {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await client.connect();

    const db = client.db('db');
    const commCollection = db.collection('comments');
    const locCollection = db.collection('commentLocations');
    const date = new Date();

    // Verify the session exists.
    const sessCollection = db.collection('sessions');
    const sessResult = await sessCollection.findOne({ id: sessionId });

    if (!sessResult) {
        return {
            success: false,
            error: 'Invalid session ID'
        };
    }

    if (!responseTo) {
        /*
         * This is a top-level comment.
         * First, add it to the locations collection.
         */
        const commentId = createId();
        await locCollection.insertOne({
            sessionId,
            commentId,
            path: []
        });

        // Now, add it to the comments collection.
        await commCollection.insertOne({
            id: commentId,
            username,
            upvotes: 0,
            downvotes: 0,
            text: comment,
            date,
            replies: []
        });

        return { success: true };
    }
    else {
        // First, check that replyTo is valid.
        const commentLoc = await locCollection.findOne({
            sessionId,
            commentId: responseTo
        });

        if (!commentLoc) {
            return {
                success: false,
                error: 'Invalid replyTo'
            };
        }

        // Traverse the path.
        const { path } = commentLoc;

        const commentId = createId();

        if (path.length) {
            const topLevel = await commCollection.findOne({ id: path[0] });
            let currComment = topLevel;

            for (const id of path.slice(1)) {
                const { replies } = currComment;
                currComment = replies.filter(x => x.id === id);
            }

            /*
             * Use the MongoDB 3.6 $[] operator:
             * https://stackoverflow.com/a/51596944
             */
            await commCollection.update(
                { _id: topLevel['_id'] },
                {
                    $push: {
                        'replies.$[].$[comment_arr].replies': {
                            id: commentId,
                            username,
                            upvotes: 0,
                            downvotes: 0,
                            text: comment,
                            date,
                            replies: []
                        }
                    }
                },
                { arrayFilters: [{ 'comment_arr.id': responseTo }]}
            );

            // Finally, update the commentLocations collection.
            path.push(currComment.id);
        }
        else {
            path.push(responseTo);

            // Now add the reply in the comments collection
            const curReply = {
                id: commentId,
                username,
                upvotes: 0,
                downvotes: 0,
                text: comment,
                date,
                replies: []
            };

            await commCollection.update(
                { id: responseTo },
                { $push: { replies: curReply } }
            );
        }

        await locCollection.insertOne({
            sessionId,
            commentId,
            path
        });

        return { success: true };
    }
};


/**
 * Fetches a session.
 * @param {string} id - The session ID
 */
exports.getComments = async id => {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await client.connect();

    // Get all the comment locations for the session
    const locCollection = client.db('db').collection('commentLocations');
    const commentsLoc = await locCollection.find({
        sessionId: id,
        path: { $size: 0 }
    });

    // Get the comments themselves
    let comments = [];  // eslint-disable-line
    const commentCount = await commentsLoc.count();
    if (commentCount > 0) {
        const commCollection = client.db('db').collection('comments');
        await commentsLoc.forEach(async meta => {
            const commentData = await commCollection.findOne({ id: meta.commentId }, { projection: { _id: 0 } });
            comments.push(commentData);
        });
    }

    // Finally, fetch metadata about the session.
    const sessCollection = client.db('db').collection('sessions');
    const session = await sessCollection.findOne({ id }, { projection: { _id: 0 } });

    // Put the results together.
    const result = {
        meta: session,
        comments,
        success: true
    };

    return result;
};

module.exports = exports;
