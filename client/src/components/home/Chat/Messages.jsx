import { Box, Grid, List } from '@mui/material';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import useDebounce from '../../../hooks/useDebounce';
import './messages.css'
import { UserContext } from '../../../contexts/user.context';
import Message from './Message';

function Messages({ socket, oldMessages, friend }) {
    const { user } = useContext(UserContext);
    const [messages, setMessages] = useState([]);
    let params = useParams();
    const bottomRef = useRef(null);

    const [isTyping, setIsTyping] = useState(false)

    const isTypingDebounced = useDebounce(isTyping, 400000)

    useEffect(() => {
        setMessages(oldMessages);
    }, [params, oldMessages]);

    useEffect(() => {
        const messageListener = (message) => {
            if (message.senderId === params.friendId || message.senderId === user.id) {
                setIsTyping(false)
                setMessages((prevMessages) => {
                    const newMessages = [...prevMessages];
                    newMessages.push(message);
                    return newMessages;
                });
            }
        };

        const isTypingListener = (message) => {
            if (message.sender.id !== user.id) {
                if (message.text !== '') {
                    // bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                    setIsTyping(message.id)
                } else {
                    setIsTyping(false)
                }
            }
        }

        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

        const onMessageUpdate = (message) => {
            setMessages((prevMessages) => {
                const newMessages = [...prevMessages];
                const index = prevMessages.findIndex((m) => m.id === message.id);
                newMessages[index] = message;
                return newMessages;
            });
        };


        socket.on('message', messageListener);
        socket.on('delete', onMessageUpdate);
        socket.on('update', onMessageUpdate);
        socket.on('isTyping', isTypingListener);

        return () => {
            socket.off('message', messageListener);
            socket.off('delete', onMessageUpdate);
            socket.off('update', onMessageUpdate);
            socket.off('isTyping', isTypingListener);
            setIsTyping(false)
        }
    }, [socket, params, messages]);

    useEffect(() => {
        if (isTyping) {
            setIsTyping(false)
        }
    }, [isTypingDebounced])

    const renderMessages = [...Object.values(messages)].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const getLastSender = (index, message) => {
        if (index === 0) {
            return false;
        }
        const msg = renderMessages[index-1];
        if (msg.sender.id === message.sender.id) {
            return true;
        }
        return false;
    }

    return (
        <Grid container sx={{ flex: '1', overflowY: 'auto', flexDirection: 'column' }}>
            <List sx={{ flex: '1' }}>
                {
                    renderMessages.map((message, index) => (
                        <Message key={message.id} sameSenderOfLastMessage={getLastSender(index, message)} message={message} socket={socket} />
                    ))
                }

            </List>
            <div ref={bottomRef} />
            <Box sx={{
                marginLeft: '1rem',
                display: 'flex',
                color: 'gray',
                visibility: isTyping ? 'visible' : 'hidden',
            }}>
                <Box
                    component="img"
                    src={friend.avatar}
                    sx={{ width: 20, marginRight: 1 }}>

                </Box>
                <span>{friend.username} is typing</span>
                <Box id="wave">
                    <span className="dot one"></span>
                    <span className="dot two"></span>
                    <span className="dot three"></span>
                </Box>
            </Box>


        </Grid>
    );
}

export default Messages;
