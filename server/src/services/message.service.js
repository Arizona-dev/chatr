import { Op } from 'sequelize';
import { Message, User } from '../model/postgres/index';

export const createMessage = async (message) => {
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

export const getMessagesFromUsers = (senderId, receiverId) => Message.findAll({
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

export const updateMessage = (message) => Message.update(message, {
    where: {
        id: message.id,
    },
});

export const deleteMessage = (messageId, message) => Message.update(message, {
    where: {
        id: messageId,
    },
});
