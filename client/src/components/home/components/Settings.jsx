import React, { useState, useContext, forwardRef, useMemo } from 'react';
import { Button, Drawer, ListItemText, ListItem, List, Divider, AppBar, Toolbar, IconButton, Typography, Grow, Box, MenuList, MenuItem, Grid, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import Profile from '../Profile/Profile';
import { UserContext } from '../../../contexts/user.context';
import { useNavigate } from 'react-router-dom';

const Transition = forwardRef(function Transition(props, ref) {
  return <Grow in={open} ref={ref} {...props} />;
});

export default function Settings() {
  const [open, setOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const { socket } = useContext(UserContext);
  const navigate = useNavigate();
  const sidebarWidth = useMemo(() => 350, []);
  const [settingsSidebar, setSettingsSidebar] = useState(true);

  const handleChangeIndex = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleSettings = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpenLogoutModal = () => {
    setOpenLogoutModal(true);
  };

  const handleCloseLogoutModal = () => {
    setOpenLogoutModal(false);
  };

  const handleLogout = () => {
    socket.close()
    navigate('/logout');
  }

  const RenderTabIndex = () => {
    switch (tabIndex) {
      case 0:
        return <Profile />;
      case 1:
        return <div>Profil d'utilisateur</div>;
      case 2:
        return <div>Settings</div>;
      default:
        return <div>Settings</div>;
    }
  }

  return (
    <>
      <IconButton
        id="basic-button"
        color="inherit"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleSettings}
        sx={{ padding: '8px', '&:hover': { opacity: 0.8 } }} >
        <SettingsIcon />
      </IconButton>
      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
      >
        <Grid container direction="row" height={'100%'} maxHeight={'100vh'}>
          <Grid item container direction="column" height={'100%'} xs={3.5} bgcolor={'background.default'} sx={{ paddingLeft: '80px' }}>
            <Box sx={{ paddingTop: '60px', paddingBottom: '60px' }} height={'100%'} overflow={'hidden scroll'}>
              <Typography variant="h6" component="span" sx={{ textTransform: 'uppercase', fontSize: '15px', fontWeight: 'bold' }}>
                User settings
              </Typography>
              <MenuList>
                <MenuItem onClick={(e) => handleChangeIndex(e, 0)}>
                  <ListItemText>
                    <Typography variant="body1" component="span" sx={{ fontWeight: '500' }}>
                      My account
                    </Typography>
                  </ListItemText>
                </MenuItem>
                {/* <MenuItem onClick={(e) => handleChangeIndex(e, 1)}>
                  <ListItemText>
                    <Typography variant="body1" component="span" sx={{ fontWeight: '500' }}>
                      My profile
                    </Typography>
                  </ListItemText>
                </MenuItem> */}
                <Divider />
                <MenuItem onClick={(e) => handleOpenLogoutModal()}>
                  <ListItemText>
                    <Typography variant="body1" component="span" sx={{ fontWeight: '500' }}>
                      Logout
                    </Typography>
                  </ListItemText>
                </MenuItem>
              </MenuList>
            </Box>
          </Grid>
          <Divider orientation="vertical" flexItem height={'100vh'} />
          <Grid item container direction="row" height={'100%'} xs>
            <Grid item container direction="column" height={'100%'} width={'100%'}>
              <Box sx={{ paddingRight: '100px', padding: '60px' }} overflow={'hidden scroll'}>
                <RenderTabIndex />
              </Box>
            </Grid>
            <Button
              edge="start"
              onClick={handleClose}
              aria-label="close"
              startIcon={<CloseIcon />}
              color="inherit"
              sx={{ right: '25px', top: '15px', padding: '10px', '&:hover': { opacity: 0.8 }, position: 'absolute' }} >
              <Typography variant="h6" component="span" sx={{ textTransform: 'uppercase', fontSize: '14px', fontWeight: 'bold' }}>
                ESC
              </Typography>
            </Button>
          </Grid>
        </Grid>
        <Dialog
          open={openLogoutModal}
          onClose={handleCloseLogoutModal}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Logout"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description" sx={{ paddingBottom: '10px', paddingRight: '20px' }}>
              Are you sure you want to logout?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ paddingBottom: '20px', paddingRight: '20px' }}>
            <Button color="cancel" onClick={handleCloseLogoutModal}>Cancel</Button>
            <Button color="danger" variant="contained" onClick={handleLogout} autoFocus>
              Logout
            </Button>
          </DialogActions>
        </Dialog>
      </Dialog>
    </>
  );
}
