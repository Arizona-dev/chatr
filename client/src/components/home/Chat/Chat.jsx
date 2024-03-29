import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import Messages from './Messages';
import MessageInput from './MessageInput';
import { friendService } from '../../../services/friend.service';
import { UserContext } from '../../../contexts/user.context';
import { Box, Typography, Divider } from '@mui/material';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';

export default function Chat() {
    const { socket } = useContext(UserContext)
    let params = useParams();
    const [messages, setMessages] = useState([]);
    const [friend, setFriend] = useState({});

    useEffect(() => {
        const loadFriendChat = async () => {

            await friendService.getFriendChat(params.friendId).then(res => {
                setMessages(res.messages);
                setFriend(res.friend);
            });
        }

        loadFriendChat();
    }, [params]);

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {socket && friend ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            
                    <Box sx={{ display: 'flex', flexDirection: 'row', padding: '8px', alignItems: 'center', height: '48px' }}>
                        <AlternateEmailIcon sx={{ color: 'gray', height: '24px'}} />
                        <Typography
                            sx={{ display: 'inline', fontWeight: '500', fontSize: '16px', marginX: '8px' }}
                            component="span"
                            variant="h3"
                            color="text.primary"
                        >
                            {friend.username}
                        </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
                        <Messages socket={socket} oldMessages={messages} friend={friend} sx={{ flex: '1 1 auto' }} />
                        <MessageInput socket={socket} friend={friend} fixed sx={{ bottom: '0px', margin: '10px' }} />
                    </Box>
                </Box>
            ) : (
                <div>Not Connected</div>
            )}
        </Box>
    );
}