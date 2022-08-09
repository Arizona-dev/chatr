import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../../../contexts/user.context';
import { Paper, IconButton, InputBase } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Send from '@mui/icons-material/Send';
import DOMPurify from 'dompurify';
import useHistoryState from '../../../hooks/useHistoryState';

const NewMessage = ({ socket, friend }) => {
    const { user } = useContext(UserContext);
    const [value, setValue] = useHistoryState('');
    const [lastPosition, setLastPosition] = useState(null);

    const sendMessage = () => {
        if (value.trim().length === 0) return;
        if (value.length > 2000 && user.role !== 'ROLE_STAR') return;
        if (value.length > 2000 && user.role === 'ROLE_STAR' && value.length > 5000) return;
        const sanitizedMessage = () => ({
            __html: DOMPurify.sanitize(value.replace(/\n/g, '<br>'))
        })
        socket.emit('message', {
            receiver: {
                ...friend
            },
            sender: {
                ...user
            },
            text: sanitizedMessage().__html
        });
        setValue('');
    };

    const handleUpload = (e) => {
        e.preventDefault();
    }

    useEffect(() => {
        const textarea = document.getElementById('textareaMessage');
        const handleMessage = (e) => {
            if (e.keyCode == 229) return;
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            } else if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                let splitText = '';
                if (value.length) {
                    const start = e.target.selectionStart, end = e.target.selectionEnd;
                    const startText = value.substring(0, start);
                    const endText = value.substring(end);

                    splitText = startText + "\n" + endText;
                } else {
                    splitText = "\n";
                }
                setValue(splitText);
            }
        }

        if (textarea) {
            textarea.addEventListener('keydown', handleMessage);
        }
        return () => {
            textarea.removeEventListener('keydown', handleMessage);
        }
    }, [value, lastPosition]);

    useEffect(() => {
        socket.emit('isTyping', {
            receiver: {
                ...friend
            },
            sender: {
                ...user
            },
            text: value
        });
    }, [value])

    return (
        <Paper
            sx={{ m: '0 15px 15px 15px', display: 'flex', alignItems: 'flex-start', width: '90%', position: 'relative', bottom: '0', right: '0' }}
        >
            <IconButton onClick={(e) => handleUpload(e)} sx={{ p: '10px' }} aria-label="upload">
                <AddCircleIcon />
            </IconButton>
            <InputBase
                id='textareaMessage'
                autoFocus
                sx={{ m: 1, flex: 1 }}
                value={value}
                placeholder={`Send a message to @${friend.username}`}
                multiline
                error={value.length > 2500}
                minRows={1}
                maxRows={21}
                maxLength={2500}
                inputProps={{ 'aria-label': 'send a message' }}
                onChange={(e) => {
                    setValue(e.currentTarget.value);
                }}
            />
            <IconButton onClick={() => { sendMessage() }} sx={{ p: '10px' }} aria-label="send">
                <Send />
            </IconButton>
        </Paper>
    );
};

export default NewMessage;
