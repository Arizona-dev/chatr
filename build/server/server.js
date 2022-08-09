import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import morganBody from 'morgan-body';
import { Server } from 'socket.io';
import winston from 'winston';
import 'winston-mongodb';
import mongoose from 'mongoose';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import bcryptjs from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import Sequelize, { DataTypes, Model, Op, ValidationError } from 'sequelize';
import jwt from 'jsonwebtoken';
import { v4 } from 'uuid';
import SibApiV3Sdk from 'sib-api-v3-sdk';

var config$1 = {
    jwtSecret: process.env.JWT_SECRET,
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
    frontBaseUrl: process.env.FRONT_BASE_URL || 'http://localhost:8001',
    backBaseUrl: process.env.BACK_BASE_URL || 'http://localhost:9000',
    mongodb: {
        dbname: process.env.MONGODB_DBNAME,
        host: process.env.MONGODB_HOST,
        port: process.env.MONGODB_PORT,
        login: process.env.MONGODB_LOGIN,
        password: process.env.MONGODB_PASSWORD,
        uri: process.env.MONGODB_URI,
    },
    expressPort: process.env.PORT || 9000,
    env: process.env.NODE_ENV || 'development',
    mailerKey: process.env.MAILER_KEY,
};

/* eslint-disable no-undef */

mongoose.set('strictQuery', false);

// connect database
mongoose.connect(config$1.mongodb.uri || 'mongodb://localhost:27017/notes-project');

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', () => {
    console.log('Mongoose default connection open');
});

// If the connection throws an error
mongoose.connection.on('error', (err) => {
    console.log(`Mongoose default connection error: ${err}`);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});

// use the syntax below if you want to host your express api on serverless functions (like firebase functions)

// import mongoose from 'mongoose';
// import config from '../config/config';

// let conn = null;

// const uri = config.mongodb.uri || 'mongodb://localhost:27017/notes-project';

// exports.connect = async function () {
//     if (conn == null) {
//         console.log('Creating new connection');
//         conn = mongoose.connect(uri, {
//             serverSelectionTimeoutMS: 5000,
//         }).then(() => mongoose);

//         // `await`ing connection after assigning to the `conn` variable
//         // to avoid multiple function calls creating new connections
//         await conn;
//     }

//     return conn;
// };

const { transports } = winston;

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new transports.MongoDB({
            db: mongoose.connection,
            collection: 'logs',
        }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    );
}

const config = process.env.NODE_ENV === 'development' ? {
    newUrlParser: true,
} : {
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
};

const connection = new Sequelize(process.env.POSTGRES_DATABASE_URL, config);

connection.authenticate().then(() => {
    console.log('Postgres (with sequelize) default connection open.');
}).catch((err) => {
    console.error(`Unable to connect to the database >> ${process.env.POSTGRES_DATABASE_URL}:`, err);
});

class Message extends Model {}

Message.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        text: {
            type: DataTypes.STRING(5000),
            allowNull: false,
        },
        edited: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize: connection,
        modelName: 'message',
    },
);

class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (stack) {
             this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

const roles = Object.freeze({
    ROLE_ADMIN: 'ROLE_ADMIN',
    ROLE_USER: 'ROLE_USER',
});

const friendsStatus = Object.freeze({
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    BLOCKED: 'BLOCKED',
    EXISTS: 'EXISTS',
    UNKNOWN_USER: 'UNKNOWN_USER',
    ADDED: 'ADDED',
    ERROR_SAME_USER: 'ERROR_SAME_USER',
});

const tokenTypes = Object.freeze({
    CONFIRM_EMAIL: 'CONFIRM_EMAIL',
    RESET_PASSWORD: 'RESET_PASSWORD',
});

class Friend extends Model {}

Friend.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        status: {
            type: DataTypes.STRING,
            validate: {
                isIn: {
                    args: [Object.values(friendsStatus)],
                    msg: `Status must be one of: ${Object.values(friendsStatus)}`,
                },
            },
            allowNull: false,
        },
    },
    {
        sequelize: connection,
        modelName: 'friend',
    },
);

Friend.addHook('beforeCreate', (friend, options) => Friend.findOne({
    where: {
        [Op.or]: [
            {
                senderId: friend.senderId,
                receiverId: friend.receiverId,
            },
            {
                senderId: friend.receiverId,
                receiverId: friend.senderId,
            },
        ],
    },
}).then((result) => {
    if (result) {
        throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'friend already exists');
    }
}));

class User extends Model {}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        discriminator: {
            type: DataTypes.INTEGER,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: [8, 100],
            },
        },
        googleId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: roles.ROLE_USER,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: `https://avatars.dicebear.com/api/male/${Math.random() * 100}.svg`,
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        sequelize: connection,
        modelName: 'user',
    },
);

User.addHook('beforeCreate', async (user) => {
    if (user.password) {
        // eslint-disable-next-line no-param-reassign
        user.password = await bcryptjs.hash(
            user.password,
            await bcryptjs.genSalt(),
        );
    }

    user.discriminator = await generateDiscriminator(user.username);
});

User.addHook('beforeUpdate', async (user, { fields }) => {
    if (fields.includes('password')) {
        // eslint-disable-next-line no-param-reassign
        user.password = await bcryptjs.hash(
            user.password,
            await bcryptjs.genSalt(),
        );
    }
});

const generateDiscriminator = async (username) => {
    const x1 = Math.floor(Math.random() * 10), x2 = Math.floor(Math.random() * 10), x3 = Math.floor(Math.random() * 10), x4 = Math.floor(Math.random() * 10);
    const discriminator = `${x1}${x2}${x3}${x4}`;
    const userWithSameUsernameAndDiscriminator = await User.findOne({
        where: {
            username: username,
            discriminator: discriminator,
        },
    });

    if (userWithSameUsernameAndDiscriminator) {
        await generateDiscriminator(username);
    }

    return discriminator;
};

class Token extends Model {}

Token.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: {
                    args: [Object.values(tokenTypes)],
                    msg: `type must be one of: ${Object.values(tokenTypes)}`,
                },
            },
        },
    },
    {
        sequelize: connection,
        modelName: 'token',
    },
);

// eslint-disable-next-line no-unused-vars

Message.belongsTo(User, {
    as: 'sender',
    foreignKey: 'senderId',
});

Message.belongsTo(User, {
    as: 'receiver',
    foreignKey: 'receiverId',
});

Friend.belongsTo(User, {
    as: 'sender',
    foreignKey: 'senderId',
});

Friend.belongsTo(User, {
    as: 'receiver',
    foreignKey: 'receiverId',
});

User.hasMany(Message, {
    as: 'invitations',
    foreignKey: 'receiverId',
});

User.hasMany(Token);
Token.belongsTo(User);

// User.hasMany(Message, {
//     as: 'messages',
//     foreignKey: 'senderId',
// });

// User.hasMany(Message, {
//     as: 'receivedMessages',
//     foreignKey: 'receiverId',
// });

const createUser = async (userBody) => {
    const {
        email, username, password,
    } = userBody;

    const newUser = await User.create({
        email,
        username,
        password,
    });

    return User.findByPk(newUser.id, {
        include: [],
    });
};

const loginUserWithEmailAndPassword = async (email, password) => {
    const user = await User.findOne({ where: { email }, include: [] });
    if (!user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect credentials');
    }
    if (!user.active) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'User account is not active');
    }
    if (user?.googleId) {
        return false;
    }
    const isPasswordMatch = await bcryptjs.compare(password, user?.password);
    if (!isPasswordMatch) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect credentials');
    }

    return user;
};

const getAccessTokens = async (user) => {
    const token = jwt.sign({ id: user.id }, config$1.jwtSecret, { expiresIn: '1y' });
    return token;
};

const jwtVerify = async (payload, done) => {
    try {
        const user = await User.findByPk(payload.id, {
            include: [],
        });
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    } catch (error) {
        done(error, false);
    }
};

const initialize = function (app) {
    // init default passport behavior
    app.use(passport.initialize());

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    // add jwt strategy
    const opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config$1.jwtSecret,
    };
    passport.use(
        new Strategy(opts, jwtVerify),
    );
};

const createMessage = async (message) => {
    const m = await Message.create(message);
    const s = await Message.findOne({
        where: { id: m.dataValues.id },
        include: [
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'email'],
            },
            {
                model: User,
                as: 'receiver',
                attributes: ['id', 'username', 'email'],

            },
        ],
    });
    return s;
};

const getMessagesFromUsers$1 = (senderId, receiverId) => Message.findAll({
    where: {
        [Op.or]: [
            {
                senderId,
                receiverId,
            },
            {
                senderId: receiverId,
                receiverId: senderId,
            },
        ],
        deleted: false
    },
    include: [
        {
            model: User,
            as: 'sender',
            attributes: ['email'],
        },
        {
            model: User,
            as: 'receiver',
            attributes: ['email'],
        },
    ],
    order: [['createdAt', 'ASC']],
});

const updateMessage$1 = (message) => Message.update(message, {
    where: {
        id: message.id,
    },
});

const deleteMessage = (messageId, message) => Message.update(message, {
    where: {
        id: messageId,
    },
});

const messages = new Set();

class Connection {
    constructor(io, socket) {
        this.socket = socket;
        this.user = socket.handshake.query.userId;
        this.socket.join(this.user);
        this.io = io;

        this.io.sockets.emit('usersCount', this.io.sockets.sockets.size);

        socket.on('getMessages', () => this.getMessages());
        socket.on('message', (value) => this.handleMessage(value));
        socket.on('friendRequest', (value) => this.handleFriendRequest(value));
        socket.on('update', (message) => this.editMessage(message));
        socket.on('delete', (message) => this.deleteMessage(message));
        socket.on('disconnect', () => this.disconnect());
        socket.on('isTyping', (data) => this.sendIsTyping(data));
        socket.on('connect_error', (err) => {
            console.log(`connect_error due to ${err.message}`);
        });
    }

    async sendMessage(data) {
        const message = await createMessage({
            text: data.text,
            senderId: data.sender.id,
            receiverId: data.receiver.id,
        });

        if (this.user) {
            this.io.sockets.to([data.receiver.id, data.sender.id]).emit('message', message);
        }
    }

    getMessages() {
        messages.forEach((message) => this.sendMessage(message));
    }

    handleFriendRequest(value) {
        this.io.sockets.to([value.senderId, value.receiverId]).emit('friendRequest');
    }

    handleMessage(value) {
        const message = {
            id: v4(),
            text: value.text,
            receiver: {
                ...value.receiver,
            },
            sender: {
                ...value.sender,
            },
            createdAt: Date.now(),
        };

        messages.add(message);
        this.sendMessage(message);
        messages.delete(message);
    }

    async sendIsTyping(data) {
        if (this.user) {
            this.io.sockets.to([data.receiver.id, data.sender.id]).emit('isTyping', {
                id: v4(),
                ...data,
            });
        }
    }

    async deleteMessage(message) {
        if (message.sender.id === this.user) {
            const tmp = message;
            tmp.deleted = true;
            const result = await deleteMessage(message.id, tmp);

            if (result[0] > 0) {
                this.io.sockets.to([message.receiver.id, message.sender.id]).emit('delete', tmp);
            }
        }
    }

    async editMessage(message) {
        if (message.sender.id === this.user) {
            const tmp = message;
            tmp.edited = true;
            tmp.updated_at = Date.now();
            const result = await updateMessage$1(tmp);
            if (result[0] > 0) this.io.sockets.to([tmp.receiver.id, tmp.sender.id]).emit('update', tmp);
        }
    }

    disconnect() {
        this.socket.leave(this.user);
        this.user = null;
        this.socket.disconnect();
        this.socket.broadcast.emit('usersCount', this.io.sockets.sockets.size);
    }
}

function chat(io) {
    io.on('connection', (socket) => {
        new Connection(io, socket);
    });
}

const _formatError = (validationError) => validationError.errors.reduce((acc, error) => {
    acc[error.path] = error.message;
    return acc;
}, {});

const errorHandler = (err, req, res, next) => {
    if (err instanceof ValidationError) {
        logger.warn(`Validation error: ${JSON.stringify(_formatError(err))}`, {
            metadata: {
                url: req.url,
                method: req.method,
                service: 'server',
            },
        });
        return res.status(422).json(_formatError(err));
    }

    // else ApiError
    const { statusCode, message } = err;

    const response = {
        code: statusCode || 500,
        message,
        // stack: err.stack,
    };

    if (response.code >= 500) {
        logger.error(`Internal server error: ${JSON.stringify(response)}`, {
            metadata: {
                url: req.url,
                method: req.method,
                body: JSON.stringify(req.body || {}),
                service: 'server',
            },
        });
    } else {
        logger.warn(`${response.code} error: ${JSON.stringify(response)}`, {
            metadata: {
                url: req.url,
                method: req.method,
                service: 'server',
            },
        });
    }

    res.status(response.code).json(response);
};

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = config$1.mailerKey;

const sendRegistrationMail = async (email, username, token) => {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = {
        to: [{
            email,
        }],
        templateId: 2,
        params: {
            name: username,
            link: `${config$1.backBaseUrl}/api/v1/auth/validate?token=${token}`,
        },
    };

    return apiInstance.sendTransacEmail(sendSmtpEmail)
    .then(function(data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
      }, function(error) {
        console.error(error);
      });
};

const sendResetPassword = async (email, username, token) => {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = {
        to: [{
            email,
        }],
        templateId: 3,
        params: {
            name: username,
            link: `${config$1.frontBaseUrl}/reset-password?token=${token}`,
        },
    };

    return apiInstance.sendTransacEmail(sendSmtpEmail);
};

const register = async (req, res, next) => {
    try {
        const user = await createUser(req.body);
        const emailToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        await Token.create({
            userId: user.id,
            token: emailToken,
            type: tokenTypes.CONFIRM_EMAIL,
        });

        await sendRegistrationMail(req.body.email, req.body.username, emailToken);
        res.json({ id: user.id });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await loginUserWithEmailAndPassword(email, password);
        const token = await getAccessTokens(user);
        res.send({ user, token });
    } catch (err) {
        next(err);
    }
};

const validate = async (req, res, next) => {
    try {
        const { token } = req.query;
        // find token include user
        const tokenRecord = await Token.findOne({
            where: {
                token,
                type: tokenTypes.CONFIRM_EMAIL,
            },
            include: [
                {
                    model: User,
                    as: 'user',
                },
            ],
        });

        // delete token
        await tokenRecord.destroy();

        await User.update(
            {
                active: true,
            },
            {
                where: { email: tokenRecord?.user?.email },
                returning: true,
                individualHooks: true,
            },
        );
        res.redirect(301, config$1.frontBaseUrl);
    } catch (err) {
        next(err);
    }
};

const resetPassword$1 = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({
            where: {
                email,
            },
            include: [
                {
                    model: Token,
                    as: 'tokens',
                    where: {
                        type: tokenTypes.RESET_PASSWORD,
                    },
                },
            ],
        });

        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'An email has already been sent');
        }

        const oldToken = await Token.findOne({
            where: {
                userId: user.id,
                type: tokenTypes.RESET_PASSWORD,
            },
        });

        if (oldToken) {
            if (oldToken.dataValues.createdAt > new Date(Date.now() - 5 * 60 * 1000)) {
                return res.json({ id: user.id })
            }
            await oldToken.destroy();
        }


        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await Token.create({
            userId: user.id,
            token,
            type: tokenTypes.RESET_PASSWORD,
        });
        await sendResetPassword(user.email, user.username, token);
        res.json({ id: user.id });
    } catch (err) {
        next(err);
    }
};

const router$6 = express.Router();

router$6.post('/register', register);
router$6.post('/login', login);
router$6.get('/validate', validate);
router$6.post('/reset-password', resetPassword$1);

/* eslint-disable no-param-reassign */

const getUserByToken = async (req, res, next) => {
    try {
        res.json(req.user);
    } catch (err) {
        next(err);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;

        const tokenRecord = await Token.findOne({
            where: {
                token,
                type: tokenTypes.RESET_PASSWORD,
            },
            include: [
                {
                    model: User,
                    as: 'user',
                },
            ],
        });

        if (!tokenRecord) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token');
        }

        // delete token
        await tokenRecord.destroy();

        await User.update(
            {
                password,
            },
            {
                where: { email: tokenRecord?.user?.email },
                returning: true,
                individualHooks: true,
            },
        );

        res.json({
            message: 'Password has been changed',
        });
    } catch (err) {
        next(err);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { username } = req.body;

        const user = await User.findOne({
            where: {
                id: req.user.id,
            }
        }).then(async (u) => {
            if (!u) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
            }
            u.username = username;
            return u.save();
        }).then((u) => User.findByPk(u.id, { attributes: {exclude: ['password', 'googleId', 'active', 'role']} }));
        res.json(user);
    } catch (err) {
        next(err);
    }
};

const updatePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;

        // check old one
        const user = await User.findOne({
            where: {
                id: req.user.id,
            },
        });

        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
        }
        const isPasswordMatch = await bcryptjs.compare(oldPassword, user?.password);

        if (!isPasswordMatch) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect credentials');
        }

        const newUser = await User.update({
            password: newPassword,
        }, {
            where: {
                id: req.user.id,
            },
            returning: true,
            individualHooks: true,
        });

        res.json(newUser);
    } catch (err) {
        next(err);
    }
};

const verifyCallback = (req, resolve, reject, role) => async (err, user, info) => {
    if (err || info || !user) {
        return reject(new ApiError(StatusCodes.UNAUTHORIZED, 'unauthorized'));
    }

    // do stuff about user role
    // if (user.role !== role) { ... }

    req.user = user;
    resolve();
};

function authorized(role = roles.ROLE_USER) {
    return async (req, res, next) => new Promise((resolve, reject) => {
        passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject))(req, res, next);
    })
        .then(() => next())
        .catch((err) => {
            next(err);
        });
}

const router$5 = express.Router();

router$5.post('/reset-password', resetPassword);
router$5.get('/token', authorized(), getUserByToken);
router$5.put('/profile', authorized(), updateProfile);
router$5.put('/password', authorized(), updatePassword);

const sendMessage = async (req, res, next) => {
    try {
        const { text, receiverId } = req.body;
        const message = await createMessage({
            text,
            senderId: req.user.id,
            receiverId,
        });
        res.json(message);
    } catch (e) {
        next(e);
    }
};

const getMessagesFromUsers = async (req, res, next) => {
    try {
        const { senderId, receiverId } = req.params;
        const messages = await getMessagesFromUsers$1(senderId, receiverId);
        res.json(messages);
    } catch (e) {
        next(e);
    }
};

const updateMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { body } = req;
        if (!body.text) {
            res.status(422).json({
                error: 'text is required',
            });
        }
        const content = {
            text: body.text,
            updated_at: new Date(),
        };
        const message = await updateMessage$1(messageId, content);
        res.json(message);
    } catch (e) {
        next(e);
    }
};

const areFriends = async (req, res, next) => {
    const { receiverId } = req.body;
    const { id } = req.user;

    const friend = await Friend.findOne({
        where: {
            [Op.or]: [
                {
                    senderId: id,
                    receiverId,
                },
                {
                    senderId: receiverId,
                    receiverId: id,
                },
            ],
        },
    });

    if (!friend) {
        next(new ApiError(StatusCodes.UNAUTHORIZED, 'You are not friends with this user'));
    }

    next();
};

const isMyMessage = async (req, res, next) => {
    const { id } = req.user;
    const { messageId } = req.params;
    const message = await Message.findByPk(messageId);

    if (message.senderId !== id) {
        next(new ApiError(StatusCodes.UNAUTHORIZED, 'Cant edit a message that is not yours'));
    }
    next();
};

const router$4 = express.Router();

router$4.post('/', authorized(), areFriends, sendMessage);

// used for DELETE or UPDATE a message cf : cahier des charges
router$4.put('/:messageId', authorized(), isMyMessage, updateMessage);
router$4.get('/:senderId/:receiverId', authorized(), getMessagesFromUsers);

const getFriendsList$1 = async (userId, status = [friendsStatus.ACTIVE, friendsStatus.PENDING]) => Friend.findAll({
    where: {
        [Op.or]: [
            {
                senderId: userId,
            },
            {
                receiverId: userId,
            },
        ],
        status: {
            [Op.or]: status,
        }
    },
    include: [
        {
            model: User,
            as: 'sender',
            attributes: ['id', 'email', 'username', 'avatar']
        },
        {
            model: User,
            as: 'receiver',
            attributes: ['id', 'email', 'username', 'avatar']
        },
    ],
});

const sendFriendInvitation$1 = ({ senderId, receiverId }) => {
    if (receiverId === '' || receiverId === undefined) {
        return 'null'
    }

    const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    const isEmail = regex.test(receiverId);
    const isUsername = !isEmail;

    let receiverUsername = '';
    let receiverDiscriminator = null;
    let receiverEmail = '';

    // regex to match username format 'username#XXXX'
    const regexUsername = /^[a-zA-Z0-9]+(#[0-9]{4})?$/;

    if (isEmail) {
        receiverEmail = receiverId;
    } else if (isUsername && receiverId.includes('#')) {
        if (regexUsername.test(receiverId)) {   
            receiverUsername = receiverId.split('#')[0];
            receiverDiscriminator = receiverId.split('#')[1];
        } else {
            return {
                status: 'ERROR_INVALID_USERNAME',
            };
        }
    } else {
        return {
            status: 'ERROR_INVALID_USERNAME_OR_EMAIL',
        };
    }

    return User.findOne({
        where: {
            [Op.or]: [
                {
                    username: receiverUsername,
                    discriminator: receiverDiscriminator,
                },
                {
                    email: receiverEmail,
                },
            ],
        },
    }).then((receiver) => {
        if (receiver) {
            if (receiver.id === senderId) {
                return {
                    status: 'ERROR_SAME_USER'
                };
            }
            return Friend.findOne({
                where: {
                    [Op.or]: [
                        {
                            senderId: senderId,
                            receiverId: receiver.id,
                        },
                        {
                            senderId: receiver.id,
                            receiverId: senderId,
                        },
                    ],
                },
            }).then((friend) => {
                if (friend) {
                    switch (friend.status) {
                        case friendsStatus.ACTIVE:
                            return {
                                status: friendsStatus.EXISTS,
                            }
                        case friendsStatus.PENDING:
                            return {
                                status: friendsStatus.PENDING,
                            };
                    }
                }
                return Friend.create({
                    senderId,
                    receiverId: receiver.id,
                    status: friendsStatus.PENDING,
                })
                    .then(() => {
                        return {
                            status: friendsStatus.ADDED,
                            receiverId: receiver.id,
                        };                    });
            })
        } else {
            return {
                status: friendsStatus.UNKNOWN_USER,
            };        }
    })
        .catch((err) => {
            console.log(err);
        })
};

const acceptFriendInvitation$1 = (friendId) => Friend.update(
    {
        status: friendsStatus.ACTIVE,
    },
    {
        where: {
            id: friendId,
        },
        returning: true,
    },
    // because update return nb of rows updated and the updated rows
).then((res) => res[1][0]);

const getFriendChat$1 = (friendOneId, friendTwoId) => Message.findAll({
    where: {
        [Op.or]: [
            {
                senderId: friendOneId,
                receiverId: friendTwoId,
            },
            {
                senderId: friendTwoId,
                receiverId: friendOneId,
            },
        ],
        deleted: false
    },
    include: [
        {
            model: User,
            as: 'sender',
            attributes: ['id', 'email', 'username', 'avatar']
        },
        {
            model: User,
            as: 'receiver',
            attributes: ['id', 'email', 'username', 'avatar']
        }
    ],
}
).then(async (messages) => {
    const user = await User.findOne({
        where: {
            id: friendOneId
        },
        attributes: ['id', 'email', 'username', 'avatar']});

    return {
        friend: user,
        messages,
    }

}).catch((err) => {
    console.log(err);
});

const getFriendsList = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const friendsList = await getFriendsList$1(userId);
        res.json(friendsList || []);
    } catch (err) {
        next(err);
    }
};

const sendFriendInvitation = async (req, res, next) => {
    try {
        const { receiverNameOrEmail } = req.body;

        const pendingFriend = await sendFriendInvitation$1({
            senderId: req.user.id,
            receiverId: receiverNameOrEmail,
        });
        res.json(pendingFriend);
    } catch (e) {
        next(e);
    }
};

const acceptFriendInvitation = async (req, res, next) => {
    try {
        const { friendId } = req.params;
        const friend = await acceptFriendInvitation$1(friendId);
        res.json(friend);
    } catch (e) {
        next(e);
    }
};

const deleteFriend = async (req, res, next) => {
    try {
        const { friendId } = req.params;

        const friend = await Friend.destroy({
            where: {
                id: friendId,
            },
        });
        res.json(friend);
    } catch (e) {
        next(e);
    }
};

const getFriendChat = async (req, res, next) => {
    try {
        const { friendId } = req.params;
        const friendChat = await getFriendChat$1(friendId, req.user.id);
        res.json(friendChat || {});
    } catch (e) {
        next(e);
    }
};

const router$3 = express.Router();

router$3.get('/:userId', authorized(), getFriendsList);
router$3.post('/add', authorized(), sendFriendInvitation);
router$3.put('/:friendId', authorized(), acceptFriendInvitation);
router$3.delete('/:friendId', authorized(), deleteFriend);
router$3.get('/:friendId/chat', authorized(), getFriendChat);

//
const logSchema = new mongoose.Schema(
    {
        level: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        meta: {
            type: Object,
            required: false,
        },
    },
    {
        timestamps: true,
    },
);

// text index on message
logSchema.index({ message: 'text' });

const Log = mongoose.model('Log', logSchema);

const create = async (req, res, next) => {
    try {
        const { level, message, meta } = req.body;
        switch (level) {
        case 'error':
            logger.error(message, { metadata: meta });
            break;
        case 'warn':
            logger.warn(message, { metadata: meta });
            break;
        case 'info':
            logger.info(message, { metadata: meta });
            break;
        default:
            throw new Error('Level is not valid');
        }
        res.json({ message, meta });
    } catch (e) {
        next(e);
    }
};

const search = async (req, res, next) => {
    try {
        // search by date range and pagination
        const {
            startDate, endDate, page, limit, textSearch, severity, application,
        } = req.body;
        const match = {
            // search contain message
            // tips de dev senior no raj ptdr (c juste pour pas que le clé soit enumerable si e.g texSearch === undefined)
            ...(textSearch && {
                $text: {
                    $search: textSearch,
                },
            }),
            ...(severity && { level: severity }),
            ...(application && { 'meta.service': application }),
            ...((startDate && endDate) && {
                timestamp: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            }),
        };

        const logs = await Log.find(match)
            .skip((page) * limit)
            .limit(limit)
            .sort({ timestamp: -1 });
        const total = await Log.countDocuments(match);

        res.json({ logs, total });
    } catch (e) {
        next(e);
    }
};

const router$2 = express.Router();

router$2.post('/', authorized(), create);
router$2.post('/search', authorized('ROLE_ADMIN'), search);

const getUsersActive = () => User.count({
    where: {
        active: true,
    },
});

const analyticSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        sessions: {
            type: [
                {
                    sessionId: {
                        type: String,
                        required: true,
                    },
                    device: {
                        type: String,
                        required: true,
                    },
                    browser: {
                        type: String,
                        required: true,
                    },
                    os: {
                        type: String,
                        required: true,
                    },
                    country: {
                        type: String,
                        required: true,
                    },
                    duration: {
                        type: Number,
                    },
                    timestamp: {
                        type: Date,
                        default: Date.now,
                    },
                },
            ],
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

const Analytic = mongoose.model('Analytic', analyticSchema);

const addNewSession = async (req, res, next) => {
    try {
        const { userId, config } = req.body;

        const analytic = await Analytic.findOne({ userId });

        if (!analytic) {
            const newAnalytic = await Analytic.create({
                userId,
                sessions: [{ ...config }],
            });

            res.json({ id: newAnalytic.id });
        } else {
            analytic.sessions.push(config);
            await analytic.save();
            res.json({ id: analytic.id });
        }
    } catch (e) {
        next(e);
    }
};

const updateSession = async (req, res, next) => {
    try {
        const { userId, sessionId, duration } = req.body;

        const analytic = await Analytic.updateOne(
            { userId, 'sessions.sessionId': sessionId },
            { $set: { 'sessions.$.duration': duration } },
        );

        res.json({ id: analytic.id });
    } catch (e) {
        next(e);
    }
};

const getSessions = async (req, res, next) => {
    try {
        const analytic = await Analytic.find();

        res.json(analytic);
    } catch (e) {
        next(e);
    }
};

const stats = async (req, res, next) => {
    try {
        const statsArr = [];

        const countUsersActive = await getUsersActive();
        statsArr.push({
            count: countUsersActive,
            text: "Nombres d'utilisateurs confirmés",
            iconName: 'VerifiedUser',
        });

        res.json(statsArr || []);
    } catch (err) {
        next(err);
    }
};

const router$1 = express.Router();

router$1.get('/stats', authorized('ROLE_ADMIN'), stats);
router$1.post('/addNewSession', authorized(), addNewSession);
router$1.post('/updateSession', authorized(), updateSession);
router$1.post('/getSessions', authorized(), getSessions);

const router = express.Router();

const routes = [
    {
        path: 'auth',
        routes: router$6,
    },
    {
        path: 'users',
        routes: router$5,
    },
    {
        path: 'messages',
        routes: router$4,
    },
    {
        path: 'friends',
        routes: router$3,
    },
    {
        path: 'logs',
        routes: router$2,
    },
    {
        path: 'analytics',
        routes: router$1,
    },
];

routes.forEach((route) => {
    router.use(`/${route.path}`, route.routes);
});

const server = express();

server.use(
    cors({
        origin: '*', // only allow front call
    }),
);

server.use(bodyParser.json());

morganBody(server, {
    logResponseBody: true,
});

server.use(express.json());

initialize(server);

server.use(compression({
    level: 9,
}));

// If you want to make a render from the server, you can uncomments this line
// server.use(express.static(process.env.NODE_ENV === 'development' ? '../build/client' : './build/client'));
server.get('/ping', (req, res) => {
    res.send('pong');
});

server.use('/api/v1', router);

server.use(errorHandler);

const app = createServer(server);
const io = new Server(app, {
    cors: {
        origin: config$1.frontBaseUrl,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

app.listen(config$1.expressPort, () => logger.info(`server started on port ${config$1.expressPort} with env ${config$1.env}`, {
    metadata: {
        service: 'server',
    },
}));

chat(io);
