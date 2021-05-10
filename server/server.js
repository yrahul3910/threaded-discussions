import express from 'express';
import path from 'path';
import compression from 'compression';
import dotenv from 'dotenv';
import chalk from 'chalk';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import webpack from 'webpack';
import rateLimit from 'express-rate-limit';
import owasp from 'owasp-password-strength-test';
import jwt from 'jsonwebtoken';

import config from '../webpack.config.dev.js';
import dbUtils from './db';

const port = 8000;
const app = express();
const compiler = webpack(config);

owasp.config({
    allowPassphrases: true,
    minLength: 8
});

const limiter = rateLimit({
    windowMs: 1000 * 60, // 1 minute
    max: 30
});

dotenv.config();
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser({ extended: true }));
app.use(express.static(`${__dirname }/public`));
app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
}));
app.use(limiter);

const illegalCharsFormat = /[!@#$%^&*()+=[\]{};':"\\|,.<>/?]/;

const logRequest = req => (
    `REQUEST at ${
        req.url
    } from ${
        req.ip
    } FORWARDED from ${
        req.ips.toString()
    } BODY ${
        JSON.stringify(req.body)}`
);

app.get('/*', (req, res) => {
    console.log(chalk.gray(`INFO: ${ logRequest(req)}`));
    res.sendFile(path.join(__dirname, '../src/index.html'));
});


/*
 * Fetches a session and its comments. Expects a request with
 * JSON body:
 * {
 *     sessionId: string
 * }
 */
app.post('/api/session/fetch', async(req, res) => {
    console.log(chalk.gray(`INFO: ${ logRequest(req)}`));
    res.writeHead(200, { 'Content-Type': 'application/json' });

    const { id } = req.body;

    // Check for empty input
    if (!id) {
        console.log(chalk.yellow(`WARN: Empty fields${ req}`));
        res.end(JSON.stringify({
            success: false,
            message: 'Fields cannot be empty'
        }));
        return;
    }

    const results = await dbUtils.getComments(id);

    if (!results.success) {
        console.log(chalk.red(`ERR: Request to fetch session failed: ${results.error}`));
        res.end(JSON.stringify({
            success: false,
            message: 'Unknown error occurred.'
        }));
        return;
    }

    console.log(chalk.green('INFO: Request successful.'));
    res.end(JSON.stringify({
        success: true,
        ...results
    }));
});


/*
 * Adds a comment to a session. Expects a request body in JSON:
 * {
 *     sessionId: string,
 *     comment: string,
 *     user: string,
 *     responseTo: string
 * }
 */
app.post('/api/session/comment', async(req, res) => {
    console.log(chalk.gray(`INFO: ${ logRequest(req)}`));
    res.writeHead(200, { 'Content-Type': 'application/json' });

    const { sessionId, comment, user, responseTo } = req.body;

    // Sanitize input
    if (!sessionId || !comment || !user ||
        illegalCharsFormat.test(sessionId) ||
        illegalCharsFormat.test(user) ||
        (responseTo && illegalCharsFormat.test(responseTo))) {
        console.log(chalk.yellow('WARN: Bad request caught.'));
        res.end(JSON.stringify({
            success: false,
            error: 'Bad parameters.'
        }));
        return;
    }

    const result = await dbUtils.addComment(sessionId, comment, user, responseTo);

    if (!result.success) {
        console.log(chalk.yellow(`WARN: Adding comment failed: ${result.error}`));
    }

    res.end(JSON.stringify(result));
});


/**
 * Creates a new session. Expects a request body with JSON:
 * {
 *     title: string
 * }
 */
app.post('/api/session/create', async(req, res) => {
    console.log(chalk.gray(`INFO: ${ logRequest(req)}`));
    res.writeHead(200, { 'Content-Type': 'application/json' });

    const { title } = req.body;
    if (!title ||
        illegalCharsFormat.test(title)) {
        console.log(chalk.yellow(`WARN: Empty fields${ req}`));
        res.end(JSON.stringify({
            success: false,
            message: 'Fields cannot be empty'
        }));

        return;
    }

    const response = await dbUtils.createSession(title);

    res.end(JSON.stringify(response));
});


/**
 * Updates the vote on a comment. Expects a request with a body JSON
 * {
 *     vote: +1/-1,
 *     commentId: string,
 *     userId: string
 * }
 */
app.post('/api/comment/vote', async(req, res) => {
    console.log(chalk.gray(`INFO: ${ logRequest(req)}`));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const { vote, commentId, userId } = req.body;

    if ((vote !== 1 && vote !== -1) ||
        illegalCharsFormat.test(commentId) ||
        illegalCharsFormat.test(userId)) {
        console.log(chalk.yellow('WARN: Invalid params passed.'));
        res.end(JSON.stringify({ success: false }));
        return;
    }

    const result = await dbUtils.updateVote(userId, commentId, vote);
    if (result.success) {console.log(chalk.green('Successful request!'));}

    res.end(JSON.stringify(result));
});


/* Authenticates the user. */
app.post('/api/authenticate', (req, res) => {
    console.log(chalk.gray(`INFO: ${ logRequest(req)}`));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const { username, password } = req.body;

    // Check for empty strings.
    if (!username || !password) {
        console.log(chalk.yellow(`WARN: Empty fields${ req}`));
        res.end(JSON.stringify({
            success: false,
            message: 'Fields cannot be empty'
        }));
    }
    else {
        dbUtils.authenticate(username, password, (err, authResult) => {
            if (err) {
                console.log(chalk.red(`ERROR: ${err.message}`));
                res.end(JSON.stringify({ success: false }));
                return;
            }

            if (authResult.success) {
                const user = {
                    username: authResult.results.username,
                    name: authResult.results.name,
                    dp: authResult.results.dp
                };

                const token = jwt.sign(user, process.env.SESSION_SECRET, { expiresIn: '3 days' });

                console.log(chalk.green('INFO: Successful request'));
                res.end(JSON.stringify({
                    success: true,
                    message: 'Logged in successfully!',
                    user,
                    token
                }));
            }
            else {
                console.log(chalk.yellow('WARN: Authentication failed.'));
                res.end(JSON.stringify({
                    success: false,
                    message: authResult.message
                }));
            }
        });
    }
});

app.post('/api/register', (req, res) => {
    console.log(chalk.gray(`INFO: ${logRequest(req)}`));
    res.writeHead(200, { 'Content-Type': 'application/json' });

    const { username, password, name } = req.body;

    // Check empty strings or null
    if (!username || !password || !name) {
        console.log(chalk.yellow('WARN: Empty fields in body.'));
        res.end(JSON.stringify({
            success: false,
            message: 'Empty input'
        }));
        return;
    }

    // Test for illegal characters
    if (illegalCharsFormat.test(username) ||
        illegalCharsFormat.test(name)) {
        console.log(chalk.yellow('WARN: Username or name contains invalid bytes.'));
        res.end(JSON.stringify({
            success: false,
            message: 'Invalid characters in input'
        }));
        return;
    }

    // Check spaces in username
    if (username.includes(' ')) {
        console.log(chalk.yellow('WARN: Username contains spaces'));
        res.end(JSON.stringify({
            success: false,
            message: 'Username includes spaces'
        }));
        return;
    }

    // Check that the password is secure.
    if (!owasp.test(password).strong) {
        console.log(chalk.yellow('WARN: Password not secure.'));
        res.end(JSON.stringify({ success: false }));
        return;
    }

    dbUtils.register(username, password, name, (err, result) => {
        if (err) {
            console.log(chalk.red(`ERROR: Database registration failed: ${err.message}`));
            res.end(JSON.stringify(result));
            return;
        }

        if (result.success) {
            const user = {
                username,
                password,
                name,
                dp: null
            };
            const token = jwt.sign(user, process.env.SESSION_SECRET, { expiresIn: '1 day' });

            console.log(chalk.green('INFO: Request successful.'));

            res.end(JSON.stringify({
                ...result,
                token
            }));
        }
        else {
            console.log(chalk.yellow(`WARN: Database registration failed: ${err.message}`));
            res.end(JSON.stringify(result));
        }
    });
});

app.put('/api/authenticate', async(req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    console.log(chalk.gray(`INFO: ${logRequest(req)}`));

    const { token, password } = req.body;

    // Check that the password is secure.
    if (!owasp.test(password).strong) {
        console.log(chalk.yellow('WARN: Password not secure.'));
        res.end(JSON.stringify({ success: false }));
        return;
    }

    // Verify token
    if (token) {
        jwt.verify(token, process.env.SESSION_SECRET, async(err, decoded) => {
            if (err) {
                console.log(chalk.yellow('WARN: JWT verification failed.'));
                res.end(JSON.stringify({ success: false }));
                return;
            }

            const { username } = decoded;
            const result = await dbUtils.updatePassword(username, password);

            if (result) {
                console.log(chalk.green('INFO: Request successful.'));
                res.end(JSON.stringify({ success: true }));
                return;
            }
            else {
                console.log(chalk.yellow('WARN: Failed to update password.'));
                res.end(JSON.stringify({ success: false }));
                return;
            }
        });
    }
    else {
        console.log(chalk.yellow('WARN: Empty token passed.'));
        res.end(JSON.stringify({ success: false }));
        return;
    }
});

app.listen(port, err => {
    if (err) throw err;
    console.log(chalk.green(`Server is running at port ${ port}`));
});
