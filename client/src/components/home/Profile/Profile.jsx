import React, { useContext, useEffect, useCallback, useState } from 'react';
import * as yup from 'yup';
import { useFormik } from 'formik';
import { Box } from '@mui/system';
import EditIcon from '@mui/icons-material/Edit';
import { Button, FormControl, FormHelperText, InputAdornment, InputLabel, OutlinedInput, TextField, Typography, IconButton, Alert } from '@mui/material';
import { UserContext } from '../../../contexts/user.context';
import { userService } from '../../../services/user.service';
import EditPassword from './EditPassword/EditPassword';

const validationSchema = yup.object({
    username: yup
        .string('Enter your username')
        .required('Username is required')
        .min(3)
        .max(32)
});

export default function Profile() {

    const { user, setUser } = useContext(UserContext);

    const [profileUpdated, setProfileUpdated] = useState(false);

    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const formik = useFormik({
        initialValues: {
            email: user.email,
            username: user.username,
            password: 'hey what are you looking at?',
        },
        validationSchema,
        onSubmit: ({ username, interests }, { setStatus }) => {
            userService.updateProfile({ username, interests }).then(res => {
                setProfileUpdated(true);
                setUser(res);
            }).catch(err => {
                let customError = "error occured, try again";
                setProfileUpdated(false);
                if (err.match(/username/)) {
                    customError = "Username is already taken";
                }
                setStatus(customError) 
            })
        }
    });

    return (
        <Box sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{
                    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
                    borderRadius: '10px',
                    padding: '40px',
                    width: 'fit-content'
                }}
            >
                <Typography sx={{
                    textAlign: 'center',
                }} variant="h6" gutterBottom component="div">
                    Profile
                </Typography>
                <Box sx={{ textAlign: 'center' }}>
                    <img src={user.avatar} width='40' />
                </Box>
                <Alert severity="success" sx={{ width: '100%', display: profileUpdated ? 'flex': 'none', my: '15px' }}>
                    Profile updated successfully!
                </Alert>
                <TextField
                    disabled
                    margin='dense'
                    fullWidth
                    type='email'
                    id="email"
                    label="Email"
                    variant="outlined"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    sx={{ my: '15px' }} />
                <TextField
                    margin='dense'
                    fullWidth
                    type='username'
                    id="username"
                    label="Username"
                    variant="outlined"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    error={formik.touched.username && Boolean(formik.errors.username)}
                    helperText={formik.touched.username && formik.errors.username}
                    sx={{ my: '15px' }} />
                <FormControl
                    fullWidth
                    margin='dense'
                    variant="outlined"
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    sx={{ my: '15px' }}
                >
                    <InputLabel htmlFor="password">Password</InputLabel>
                    <OutlinedInput
                        readOnly
                        id="password"
                        label="Password"
                        type="password"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.password && Boolean(formik.errors.password)}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleOpen}
                                    edge="end"
                                >
                                    <EditIcon />
                                </IconButton>
                            </InputAdornment>
                        }
                    />
                    <FormHelperText error >
                        {formik.touched.password && formik.errors.password}
                    </FormHelperText>
                </FormControl>

                {formik.status ? <Typography sx={{
                    color: 'red'
                }} variant='subtitle2'> {formik.status} </Typography> : null}


                <Button sx={{
                    marginTop: '1rem'
                }} fullWidth variant="contained" type='submit'>Save</Button>

                <EditPassword open={open} handleClose={handleClose} handleOpen={handleOpen} setProfileUpdated={setProfileUpdated} />

            </Box>

        </Box>
    );
}