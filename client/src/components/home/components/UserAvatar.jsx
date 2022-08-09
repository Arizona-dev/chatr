import React, { useContext, useState } from 'react';
import { UserContext } from '../../../contexts/user.context';
import { Paper, IconButton, InputBase, Avatar, Menu, MenuItem, Typography } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate } from 'react-router-dom';
import ProfilePopover from './ProfilePopover';


export default function UserAvatar(props) {
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
        <Avatar sx={{ backgroundImage: 'linear-gradient(to top, #48c6ef 0%, #6f86d6 100%)', borderRadius: '14px' }} alt={user.username} src={user.avatar} />
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
          <MenuItem onClick={() => { }}>Online</MenuItem>
          <MenuItem onClick={() => { }}>Away</MenuItem>
          <MenuItem onClick={() => { }}>
            <Typography variant="body1" noWrap>
              Do not disturb
            </Typography>
          </MenuItem>
          {user.role === 'ROLE_ADMIN' &&
            <MenuItem onClick={() => navigate('/admin')}>
              <AdminPanelSettingsIcon />
              Admin Panel
            </MenuItem>
          }
        </Menu>
        :
        <ProfilePopover user={props.user} />
      }
    </>
  )
};
