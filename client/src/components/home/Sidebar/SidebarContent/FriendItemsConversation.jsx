import { Avatar, List, ListItem, ListItemAvatar, ListItemText, Typography, Button, Box, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Alert, Divider } from '@mui/material';
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendService } from '../../../../services/friend.service';
import { UserContext } from '../../../../contexts/user.context';
import { useForm, Controller } from 'react-hook-form';
import { SidebarContext } from '../../../../contexts/sidebar.context';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import ProfilePopover from '../../components/ProfilePopover';

export default function FriendItemsConversation() {
    const { user, socket } = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(true);
    const [friends, setFriends] = useState([]);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState({});
    const { handleSubmit, reset, control } = useForm();

    const onSubmit = async (data) => {
        if (data.username === '') {
            setError({ message: "Please enter a username or email !", severity: 'error' });
        } else {
            const request = await friendService.addFriend(data.username);
            reset();
            switch (request.status) {
                case 'UNKNOWN_USER':
                    setError({ message: "Incorrect username or email !", severity: 'error' });
                    break;
                case 'EXISTS':
                    setError({ message: "You are already friends with this user !", severity: 'warning' });
                    break;
                case 'ADDED':
                    setError({ message: "Friend request sent successfully !", severity: 'success' });
                    loadFriendList();
                    socket.emit('friendRequest', { senderId: request.senderId, receiverId: request.receiverId });
                    break;
                case 'PENDING':
                    setError({ message: "You already sent a request !", severity: 'success' });
                    break;
                case 'ERROR_SAME_USER':
                    setError({ message: "You can't add yourself !", severity: 'error' });
                    break;
                case 'ERROR_INVALID_USERNAME_OR_EMAIL':
                    setError({ message: "Invalid username or email format !", severity: 'error' });
                    break;
                case 'ERROR_INVALID_USERNAME':
                    setError({ message: "Invalid username format !", severity: 'error' });
                    break;
                default:
                    setError({ message: "Something went wrong !", severity: 'error' });
            }
        }
    };

    const openAddFriendModal = () => {
        setError({});
        setOpen(true);
    }

    const closeAddFriendModal = () => {
        setOpen(false);
    }

    const loadFriendList = () => {
        setIsLoading(true);
        friendService.getFriendsList(user.id).then(res => {
            setFriends(res);
        }).catch(err => {
            setFriends([]);
        }).finally(() => {
            setIsLoading(false);
        })
    }

    useEffect(() => {
        socket.on('friendRequest', () => {
            loadFriendList();
        }),
            loadFriendList();
    }, [socket]);

    return (
        <>
            <Box textAlign='center'>
                <Button variant='contained' sx={{ width: '90%', marginY: '15px' }} onClick={openAddFriendModal}>
                    Add friends
                </Button>
                <Divider sx={{ margin: '6px' }} />
                <Typography
                    sx={{ display: 'inline', fontWeight: 'bold' }}
                    component="span"
                    variant="subtitle2"
                    color="text.primary"
                >
                    PRIVATE MESSAGES
                </Typography>
            </Box>
            <List>
                {friends.map((friend, index) => (
                    <FriendItem key={index} friend={friend} loadFriendList={loadFriendList} />
                ))}
            </List>
            <Dialog open={open} onClose={closeAddFriendModal}>
                <DialogTitle>Add a friend</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You can add a friend using their chatr tag or email. Watch out for CaPiTaLs!
                    </DialogContentText>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Controller
                            name={"username"}
                            control={control}
                            defaultValue=""
                            rules={{ required: true }}
                            render={({ field: { onChange, value } }) => (
                                <div>
                                    <TextField
                                        onChange={(e) => onChange(e)}
                                        value={value}
                                        autoFocus
                                        margin="dense"
                                        id="username"
                                        label="Enter a username#0000 or email"
                                        type="text"
                                        fullWidth
                                        variant="standard"
                                    />
                                    {error && error.severity && error.message && <Alert severity={error.severity}>{error.message}</Alert>}
                                </div>
                            )}
                        />
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeAddFriendModal}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit)}>Add friend</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

const FriendItem = (props) => {
    const { user, socket } = useContext(UserContext);
    const { setSidebarOpen } = useContext(SidebarContext)
    const navigate = useNavigate()
    const friend = props.friend.sender.id === user.id ? props.friend.receiver : props.friend.sender;
    // If pendingRequest is 1, the user is the receiver else 2 if it is the sender else it is 0 when active
    let pendingRequest = 0;
    if (props.friend.status === 'PENDING') {
        if (props.friend.receiverId === user.id) {
            pendingRequest = 1;
        } else if (props.friend.senderId === user.id) {
            pendingRequest = 2;
        }
    }

    return (
        // If friendship is active
        (pendingRequest === 0 ?
            <ListItem button sx={{ p: '8px' }} onClick={() => {
                setSidebarOpen(false)
                navigate(`friends/${friend.id}`)
            }} alignItems="flex-start">
                <ListItemAvatar>
                    <ProfilePopover user={friend} />
                    {/* <Avatar alt={friend.username} src={friend.avatar || 'https://avatars.dicebear.com/api/male/2.svg'} /> */}
                </ListItemAvatar>
                <ListItemText
                    primary={friend.username || 'DeletedUser'}
                    secondary={
                        <React.Fragment>
                            <Typography
                                sx={{ display: 'inline' }}
                                component="span"
                                variant="body2"
                                color="text.primary"
                            >
                                {friend.lastMessage}
                            </Typography>
                        </React.Fragment>
                    }
                />
            </ListItem>
            :
            // If friendship is pending for user interaction
            (pendingRequest === 1 ?
                <ListItem button sx={{ p: '8px' }} alignItems="flex-start" width="100%">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }} >
                        <Box sx={{ display: 'flex' }}>
                            <ListItemAvatar>
                                <Avatar alt={friend.username} src={friend.avatar || 'https://avatars.dicebear.com/api/male/2.svg'} />
                            </ListItemAvatar>
                            <ListItemText
                                primary={friend.username || 'DeletedUser'}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space', alignItems: 'center' }}>
                            <Button variant='contained' size='small' color='primary' sx={{ marginRight: '10px', minWidth: '10px' }} onClick={() => {
                                friendService.acceptFriend(props.friend.id).finally(() => {
                                    props.loadFriendList();
                                    socket.emit('friendRequest', {senderId: props.friend.senderId, receiverId: props.friend.receiverId});
                                })
                            }}><PersonAddAlt1Icon /></Button>
                            <Button variant='contained' size='small' color='secondary' sx={{ minWidth: '10px' }} onClick={() => {
                                friendService.deleteFriend(props.friend.id).finally(() => {
                                    props.loadFriendList();
                                    socket.emit('friendRequest', {senderId: props.friend.senderId, receiverId: props.friend.receiverId});
                                })
                            }}><DeleteIcon /></Button>
                        </Box>
                    </Box>
                </ListItem>
                :
                // If friendship is pending for answer
                <ListItem button alignItems="flex-start" width="100%">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }} >
                        <ListItemAvatar>
                            <Avatar alt={friend.username} src={friend.avatar || 'https://avatars.dicebear.com/api/male/2.svg'} />
                        </ListItemAvatar>
                        <ListItemText
                            primary={friend.username || 'DeletedUser'}
                            secondary={
                                <React.Fragment>
                                    <Typography
                                        sx={{ display: 'inline' }}
                                        component="span"
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        <i>Waiting for answer</i>
                                    </Typography>
                                </React.Fragment>
                            }
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space', alignItems: 'center' }}>
                            <Button variant='contained' color='secondary' size='small' sx={{ minWidth: '10px' }} onClick={() => {
                                friendService.deleteFriend(props.friend.id).finally(() => {
                                    props.loadFriendList();
                                    socket.emit('friendRequest', {senderId: props.friend.senderId, receiverId: props.friend.receiverId});
                                })
                            }}><DeleteIcon /></Button>
                        </Box>
                    </Box>
                </ListItem>
            )
        )
    )
}
