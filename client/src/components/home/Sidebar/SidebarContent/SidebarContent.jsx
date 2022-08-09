import React, { useCallback, useContext, useState, useEffect } from 'react';
import { Divider, Grid, Stack, IconButton, Box, Typography } from '@mui/material';
import FriendItemsConversation from './FriendItemsConversation';
import { UserContext } from '../../../../contexts/user.context';
import { ColorModeContext } from '../../../../contexts/colorMode.context';
import UserAvatar from '../../components/UserAvatar';
import Settings from '../../components/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import logoWhite from '../../../../../assets/images/chatbox_light.png';
import logoDark from '../../../../../assets/images/chatbox_dark.png';
import { Link } from 'react-router-dom';

export default function SidebarContent({ navigationIndex }) {
    const { user, socket } = useContext(UserContext);
    const { toggleColorMode, colorMode } = useContext(ColorModeContext);

    const navSwitch = useCallback((navigationIndex) => {
        switch (navigationIndex) {
            case 0:
                return <FriendItemsConversation socket={socket} />;
            default:
                return <></>;
        }
    }, []);

    return (
        <Grid container direction="row" height={'100%'} maxHeight={'100vh'}>
            <Grid item container direction="column" xs={2.6} sx={{ bgcolor: 'background.darkest' }}>
                <Grid item container direction="column" justifyContent="flex-start" overflow="hidden">
                    <Box>
                        {/* <img src={colorMode === 'dark' ? logoDark : logoWhite} width='76' /> */}
                        <Typography alignSelf='center' p={1.3} variant="h6" noWrap component="div" pt={2}>
                            <Link to="/" style={{ textDecoration: 'none', fontWeight: 'bold', color: `${colorMode === 'dark' ? 'white' : 'black' }` }}>ChatR</Link>
                        </Typography>
                    </Box>
                    <Stack spacing={2} p={1} sx={{ boxSizing: 'border-box', overflowY: 'hidden scroll', overflowX: 'hidden', width: 'calc(100% + 1000px)', scrollbarWidth: 'none', msOverflowStyle: 'hidden scroll', flex: '1' }}>
                        {/* <Avatar sx={{ bgcolor: green[500] }} variant="rounded">
                            <AssignmentIcon />
                        </Avatar> */}
                    </Stack>
                </Grid>
                <Divider sx={{ margin: '6px' }} />
                <Grid item container direction="column" justifyContent="flex-end" xs>
                    <Stack spacing={2} p={2.4}>
                        <IconButton onClick={toggleColorMode} color='inherit' sx={{ padding: '8px', '&:hover': { opacity: 0.8 } }}>
                            {colorMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                        <Settings />
                    </Stack>
                </Grid>
            </Grid>
            <Divider orientation="vertical" />
            <Grid item container direction="column" xs>
                <Grid item sx={{ overflowY: 'hidden scroll', flex: '1' }}>
                    {navSwitch(navigationIndex)}
                </Grid>
                <Grid item container direction="column" justifyContent="flex-end">
                    <Grid container sx={{ padding: '16px', bgcolor: 'background.darkest' }} width="100%">
                        <Box sx={{ marginRight: '10px' }}>
                            <UserAvatar user={user} />
                        </Box>
                        <Typography sx={{ fontWeight: 'bold' }} variant="body1" noWrap component="div">
                            {user.username}
                            <Typography sx={{ fontWeight: 'bold' }} variant="body2" noWrap>
                                #{user.discriminator}
                            </Typography>
                        </Typography>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    )
}