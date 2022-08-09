import { Op } from 'sequelize';
import { Friend, User, Message } from '../model/postgres/index';
import { friendsStatus } from '../utils/Helpers';

export const getFriendsList = async (userId, status = [friendsStatus.ACTIVE, friendsStatus.PENDING]) => Friend.findAll({
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

export const sendFriendInvitation = ({ senderId, receiverId }) => {
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
                        };;
                    });
            })
        } else {
            return {
                status: friendsStatus.UNKNOWN_USER,
            };;
        }
    })
        .catch((err) => {
            console.log(err)
        })
};

export const acceptFriendInvitation = (friendId) => Friend.update(
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

export const blockFriend = (friendId) => Friend.update(
    {
        status: friendsStatus.BLOCKED,
    },
    {
        where: {
            id: friendId,
        },
        returning: true,
    },
).then((res) => res[1][0]);

export const deleteFriend = (friendId) => Friend.destroy({
    where: {
        id: friendId,
    },
});

export const getFriendChat = (friendOneId, friendTwoId) => Message.findAll({
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
    console.log(err)
});
