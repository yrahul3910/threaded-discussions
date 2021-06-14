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
 * @param {string} session - The session entered
 * @param {string} pwd - The plaintext password entered
 * @param {Function} func - The callback function
 */
exports.authenticate = (username, pwd, callback) => {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    client.connect(err => {
        if (err) throw err;

        const collection = client.db('db').collection('sessAuth');
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
exports.createSession = async(title, pwd) => {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await client.connect();

    const db = client.db('db');
    const sessCollection = db.collection('sessions');
    const authCollection = db.collection('sessAuth');
    const id = createId();

    await sessCollection.insertOne({
        id,
        title,
        createdOn: new Date()
    });

    const hashedPwd = await bcrypt.hash(pwd, 10);

    await authCollection.insertOne({
        id,
        pwd: hashedPwd
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
            message: 'Invalid session ID'
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
                message: 'Invalid replyTo'
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
                        'replies.$[commentArr].replies': {
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
                { arrayFilters: [{ 'commentArr.id': responseTo }]}
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
 * Updates the comment vote.
 *
 * @param {string} userId - The username of the person voting
 * @param {string commentId - The comment ID
 * @param {Number} vote - The vote
 */
exports.updateVote = async(username, commentId, vote) => {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await client.connect();

    const votesCollection = client.db('db').collection('votes');
    const commCollection = client.db('db').collection('comments');

    // First, check if comment-user pair exists.
    const voteDoc = await votesCollection.findOne({
        commentId,
        username
    });

    if (!voteDoc) {
        // Create it
        await votesCollection.insertOne({
            commentId,
            username,
            vote
        });

        // Update the comments collection
        if (vote === 1) {await commCollection.updateOne({ id: commentId }, { $inc: { upvotes: 1 } });}
        else {await commCollection.updateOne({ id: commentId }, { $inc: { downvotes: 1 } });}

        return { success: true };
    }

    // If the vote is the same, delete the document.
    if (voteDoc.vote === vote) {
        await votesCollection.deleteOne(voteDoc);

        // Update the comments collection
        if (vote === 1) {await commCollection.updateOne({ id: commentId }, { $inc: { upvotes: -1 } });}
        else {await commCollection.updateOne({ id: commentId }, { $inc: { downvotes: -1 } });}

        return { success: true };
    }

    // The other case, you update the doc.
    await votesCollection.updateOne({
        commentId,
        username
    }, { $set: { vote } });

    // Update the comments doc
    if (vote === 1) {
        await commCollection.updateOne({ id: commentId }, {
            $inc: {
                upvotes: 1,
                downvotes: -1
            }
        });
    }
    else {
        await commCollection.updateOne({ id: commentId }, {
            $inc: {
                upvotes: -1,
                downvotes: 1
            }
        });
    }

    return { success: true };
};


/**
 * Gets the upvotes and downvotes for a given comment.
 * @param {String} id - the comment id
 */
exports.getVotes = async id => {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await client.connect();

    const db = client.db('db');
    const votesCollection = db.collection('votes');

    const documents = await votesCollection.find({ commentId: id }).toArray();
    if (!documents) return null;
    if (!documents.length) return [0, 0];

    const upvotes = documents.filter(x => x.vote === 1).length;
    const downvotes = documents.filter(x => x.vote === -1).length;

    return [upvotes, downvotes];
};

/**
 * Fetches a session.
 * @param {string} id - The session ID
 */
exports.getComments = async(id, pwd) => {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await client.connect();

    const db = client.db('db');

    // Check the password
    const authCollection = db.collection('sessAuth');
    const hashedPwd = await authCollection.findOne({ id });

    if (!hashedPwd) {
        return { success: false };
    }

    const pwdCheck = await bcrypt.compare(pwd, hashedPwd.pwd);
    if (!pwdCheck) {
        return {
            success: false,
            message: 'Incorrect password.'
        };
    }

    // Get all the comment locations for the session
    const locCollection = db.collection('commentLocations');
    const commentsLoc = await locCollection.find({
        sessionId: id,
        path: { $size: 0 }
    }).toArray();

    // Get the comments themselves
    let comments = [];  // eslint-disable-line
    const commentCount = commentsLoc.length;
    if (commentCount > 0) {
        const commCollection = db.collection('comments');
        await commentsLoc.forEach(async meta => {
            const commentData = await commCollection.findOne({ id: meta.commentId }, { projection: { _id: 0 } });

            // Now, calculate the votes for each comment.
            comments.push(commentData);
        });
    }

    // Finally, fetch metadata about the session.
    const sessCollection = db.collection('sessions');
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
