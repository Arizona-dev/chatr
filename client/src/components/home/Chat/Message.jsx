import { Delete, Save } from '@mui/icons-material';
import { ListItem, Box, IconButton, Grid, TextField, Typography } from '@mui/material';
import DOMPurify from 'dompurify';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { UserContext } from '../../../contexts/user.context';
import ProfilePopover from '../components/ProfilePopover';

export default function Message({ sameSenderOfLastMessage, message, socket }) {
    const { user } = useContext(UserContext);
    const componentRef = useRef(null);

    const sanitizedData = (data) => ({
        __html: DOMPurify.sanitize(data)
    })

    function handleMessageClick(e, message) {
        if (message.sender.id === user.id) {
            setEditInput(message.text);
            setIsClicked(true);
        }

    }

    const daysBetween = (messageDate) => {
        const today = new Date();
        const message = new Date(messageDate);
        const one = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const two = new Date(message.getFullYear(), message.getMonth(), message.getDate());
        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const millisBetween = two.getTime() - one.getTime();
        const days = millisBetween / millisecondsPerDay;
        return Math.floor(days);
    }

    const [isClicked, setIsClicked] = useState(false);
    const [editInput, setEditInput] = useState(null);

    function handleBlur() {
        setIsClicked(false);
    }


    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event) {
            if (componentRef.current && !componentRef.current.contains(event.target)) {
                handleBlur();
            }
        }

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
            setIsClicked(false);
        };
    }, [componentRef]);

    function handleEdit(e) {
        e.stopPropagation();
        setIsClicked(false);
        const editedMessage = { ...message };
        editedMessage.text = editInput;
        socket.emit('update', editedMessage);
    }

    function handleDelete() {
        socket.emit('delete', message)
    }

    const input = useRef(null);

    if (message.deleted === true) {
        return ('')

    }

    const friendId = message.sender.id === user.id ? message.receiver.id : message.sender.id;

    return (
        <ListItem ref={componentRef} sx={{ display: 'box', paddingX: '14px', paddingY: '1px' }} onClick={(e) => handleMessageClick(e, message)}>
            <Grid item container direction="column">
                <Grid item container direction='row' sx={{ display: 'flex', verticalAlign: 'top' }}>
                    {
                        !sameSenderOfLastMessage && (
                            <Grid item container direction='row' sx={{ display: 'flex', verticalAlign: 'top' }}>
                                <Grid item container direction='column'>
                                    <Grid item container >
                                        <ProfilePopover user={{ id: friendId }} />
                                        <Typography
                                            sx={{ marginLeft: '10px', marginRight: '5px', lineHeight: '1.375rem' }}
                                            component="span"
                                            variant="subtitle2"
                                            color="text.primary"
                                        >
                                            {message.sender
                                                ? message.sender.id === user.id ? 'Moi ' : message.sender.username
                                                : message.receiver.username}
                                        </Typography>
                                        <Typography
                                            sx={{ fontWeight: '400', fontSize: '12px' }}
                                            component="span"
                                            variant="subtitle2"
                                            color="text.secondary"
                                        >
                                            {`${daysBetween(message.createdAt) === 0
                                                ? 'Today at ' + new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : daysBetween(message.createdAt) === -1
                                                    ? 'Yesterday '
                                                    : new Date(message.createdAt).toLocaleDateString()
                                                    + ' at '
                                                    + new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                        </Typography>
                                        {message.edited === true && (
                                            <Typography
                                                sx={{ display: 'inline' }}
                                                component="span"
                                                variant="subtitle2"
                                                color="text.secondary"
                                            > - Edited
                                            </Typography>
                                        )}
                                    </Grid>
                                    <Grid item container direction='row' sx={{ width: "full" }}>
                                        {isClicked ? <Box sx={{ display: "flex" }}>
                                            <TextField ref={input} value={editInput} onChange={(e) => setEditInput(e.target.value)} id="outlined-basic" label="Edit" variant="standard" />
                                            <IconButton onClick={handleEdit}>
                                                <Save color='success' />
                                            </IconButton>
                                            <IconButton onClick={handleDelete}>
                                                <Delete color='error' />
                                            </IconButton>
                                        </Box>
                                            : <div style={{ marginLeft: '-14px', paddingLeft: '64px' }} dangerouslySetInnerHTML={sanitizedData(message.text)} />}
                                    </Grid>

                                </Grid>
                            </Grid>
                        )
                    }
                    <Grid item container direction='row' sx={{ display: 'flex', verticalAlign: 'top' }}>
                        {
                            sameSenderOfLastMessage && (
                                <div style={{ marginLeft: '-14px', paddingLeft: '64px' }} dangerouslySetInnerHTML={sanitizedData(message.text)} />
                            )
                        }
                    </Grid>
                </Grid>

                {/* {
                    !sameSenderOfLastMessage && (
                        <Grid item container direction='row' sx={{ width: "full" }}>
                            {isClicked ? <Box sx={{ display: "flex", alignItems: 'end' }}>
                                <TextField ref={input} value={editInput} onChange={(e) => setEditInput(e.target.value)} id="outlined-basic" label="Edit" variant="standard" />
                                <IconButton onClick={handleEdit}>
                                    <Save color='success' />
                                </IconButton>
                                <IconButton onClick={handleDelete}>
                                    <Delete color='error' />
                                </IconButton>
                            </Box>
                                : <div style={{ marginLeft: '-43px', paddingLeft: '86px' }} dangerouslySetInnerHTML={sanitizedData(message.text)} />}
                        </Grid>
                    )
                } */}
            </Grid>
        </ListItem>
    )
}
