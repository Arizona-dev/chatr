import React, { useContext, useState } from 'react';
import { UserContext } from '../../../contexts/user.context';
import { IconButton, Avatar, Box, Menu } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function ProfilePopover(props) {
  const { user, socket } = useContext(UserContext);
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    socket.close()
    navigate('/logout');
  }

  return (
    <>
      <IconButton
        id="userProfileButton"
        variant="outlined"
        aria-controls={open ? 'userProfileMenu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        sx={{ padding: '0px', '&:hover': { opacity: 0.8 } }}
      >
        <Avatar sx={{ backgroundImage: 'linear-gradient(to top, #48c6ef 0%, #6f86d6 100%)', borderRadius: '12px' }} alt={user.username} src={user.avatar} />
      </IconButton>
      {props.user.id === user.id
        ?
        <Menu
          id="userProfileMenu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'userProfileButton',
          }}
        >
          <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
          {user.role === 'ROLE_ADMIN' &&
            <MenuItem onClick={() => navigate('/admin')}>
              <AdminPanelSettingsIcon />
              Admin Panel
            </MenuItem>
          }
        </Menu>
        :
        <Menu
          id="userProfileMenu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}>
          Ok
        </Menu>
      }
    </>
  )
};
