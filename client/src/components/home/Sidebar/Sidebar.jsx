import { AppBar, Box, Drawer, IconButton, Toolbar } from '@mui/material';
import React, { useContext, useState } from 'react';
import SidebarContent from './SidebarContent/SidebarContent';
import BottomNavigationSidebar from './BottomNavigationSideBar/BottomNavigationSideBar';
import MenuIcon from '@mui/icons-material/Menu';
import { UserContext } from '../../../contexts/user.context';
import { useNavigate } from 'react-router-dom';
import { SidebarContext } from '../../../contexts/sidebar.context';

export default function Sidebar({ sidebarWith }) {

    const { user, socket } = useContext(UserContext);

    const { sidebarOpen, setSidebarOpen } = useContext(SidebarContext)

    const [navigationIndex, setNavigationIndex] = useState(0);
    const navigate = useNavigate();

    const handleLogout = () => {
        socket.close()
        navigate('/logout');
    }

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <AppBar position="fixed" sx={{
                width: { sm: `calc(100% - ${sidebarWith}px)` },
                ml: { sm: `${sidebarWith}px` },
            }}
            >
                {/* Top NavBar */}
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    {/* <Box sx={{ display: 'flex' }}>
                        <Box sx={{ display: { xs: 'none', sm: 'flex'} }}>
                            <img src={logo} width='40'  />
                        
                            <Typography alignSelf='center' ml={2} variant="h6" noWrap component="div">
                                CroustiChat
                            </Typography>
                        </Box>
                    </Box> */}
                    
                    {/* <Box sx={{ display: 'flex' }}>
                        {user.role === 'ROLE_ADMIN' && 
                            <Button 
                                onClick={() => navigate('/admin')}
                                sx={{
                                    marginRight: '2rem',
                                }} color='inherit' 
                                startIcon={<AdminPanelSettingsIcon  
                                />}>
                                Admin
                            </Button>
                        }
                        
                        <p style={{ marginRight: '10px', fontWeight: 'bold' }}>{user.username}</p>
                        <IconButton
                            id="basic-button"
                            variant="contained"
                            aria-controls={open ? 'basic-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                            onClick={handleClick}
                        >
                            <Avatar alt={user.username} src={user.avatar} />
                        </IconButton>
                        <Menu
                            id="basic-menu"
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            MenuListProps={{
                                'aria-labelledby': 'basic-button',
                            }}
                        >
                            <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>

                        </Menu>
                    </Box> */}
                </Toolbar>
                {/* End Top NavBar */}

            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: sidebarWith }, flexShrink: { sm: 0 } }}
            >

                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: sidebarWith },
                    }}
                    open
                >
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <SidebarContent navigationIndex={navigationIndex} />
                    </Box>
                </Drawer>

                {/* Below is for mobile (responsive) */}
                <Drawer
                    variant="temporary"
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(!sidebarOpen)}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: sidebarWith },
                    }}
                >
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <SidebarContent navigationIndex={navigationIndex} />
                    </Box>
                </Drawer>
                {/* end for mobile  (responsive) */}

            </Box>
        </>
    )
}