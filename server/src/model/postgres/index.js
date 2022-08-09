// eslint-disable-next-line no-unused-vars
import { connection } from '../../core/db/postgres/db.postgres';
// eslint-disable-next-line no-unused-vars
import { mongoose } from '../../core/db/mongodb/db.mongodb';

import { Message } from './Message.postgres';
import { Friend } from './Friend.postgres';
import { User } from './User.postgres';
import { Token } from './Token.postgres';

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

export {
    User, Message, Friend, connection, Token,
};

// User.hasMany(Message, {
//     as: 'messages',
//     foreignKey: 'senderId',
// });

// User.hasMany(Message, {
//     as: 'receivedMessages',
//     foreignKey: 'receiverId',
// });
