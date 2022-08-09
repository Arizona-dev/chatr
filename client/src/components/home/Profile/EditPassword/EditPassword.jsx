import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, Button, FormControl, FormHelperText, IconButton, InputAdornment, InputLabel, Modal, OutlinedInput, Typography } from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import * as yup from 'yup';
import { userService } from '../../../../services/user.service';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

const validationSchemaResetPassword = yup.object({
    password: yup.string().min(8, 'Password should be at least 8 characters').required('Password is required'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('password'), null], 'Passwords must match'),
    newPassword: yup.string().min(8, 'Password should be at least 8 characters').required('Password is required'), 
});

export default function EditPassword ({ open, handleClose, handleOpen, setProfileUpdated }) {

    const [showPassword, setShowPassword] = useState(false);

    const handleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const formikResetPassword = useFormik({
        initialValues: {
            password: '',
            confirmPassword: '',
            newPassword: '',
        },
        validationSchema: validationSchemaResetPassword,
        onSubmit: ({ password, newPassword }, { setStatus }) => {
            userService.updatePassword(password, newPassword).then(res => {
                setProfileUpdated(true)
                handleClose()
            }).catch(err => {
                let error = "Error occured, try again"
                if(err.match(/Incorrect credentials/i)) {
                    error = "Incorrect credentials"
                }
                setStatus(error)
            })
        }
    });

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box 
                component="form"
                onSubmit={formikResetPassword.handleSubmit}
                sx={style} >

                <Typography sx={{
                    textAlign: 'center',
                }} variant="h6" gutterBottom component="div">
                        Edit password
                </Typography>
                <Box sx={{ textAlign: 'center' }}>
                </Box>
                <FormControl
                    fullWidth
                    margin='dense'
                    variant="outlined"
                    error={formikResetPassword.touched.password && Boolean(formikResetPassword.errors.password)}
                >
                    <InputLabel htmlFor="password">Password</InputLabel>
                    <OutlinedInput
                        id="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={formikResetPassword.values.password}
                        onChange={formikResetPassword.handleChange}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleShowPassword}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        }
                    />
                    <FormHelperText error id="accountId-error">
                        {formikResetPassword.touched.password && formikResetPassword.errors.password}
                    </FormHelperText>
                </FormControl>

                <FormControl
                    fullWidth
                    margin='dense'
                    variant="outlined"
                    error={formikResetPassword.touched.confirmPassword && Boolean(formikResetPassword.errors.confirmPassword)}
                >
                    <InputLabel htmlFor="password">Confirm Password</InputLabel>
                    <OutlinedInput
                        id="confirmPassword"
                        label="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formikResetPassword.values.confirmPassword}
                        onChange={formikResetPassword.handleChange}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleShowPassword}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        }
                    />
                    <FormHelperText error id="accountId-error">
                        {formikResetPassword.touched.confirmPassword && formikResetPassword.errors.confirmPassword}
                    </FormHelperText>
                </FormControl>

                <FormControl
                    fullWidth
                    margin='dense'
                    variant="outlined"
                    error={formikResetPassword.touched.newPassword && Boolean(formikResetPassword.errors.newPassword)}
                >
                    <InputLabel htmlFor="password">New Password</InputLabel>
                    <OutlinedInput
                        id="newPassword"
                        label="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formikResetPassword.values.newPassword}
                        onChange={formikResetPassword.handleChange}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleShowPassword}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        }
                    />
                    <FormHelperText error id="accountId-error">
                        {formikResetPassword.touched.newPassword && formikResetPassword.errors.newPassword}
                    </FormHelperText>
                </FormControl>

                {formikResetPassword.status ? <Typography sx={{
                    color: 'red'
                }} variant='subtitle2'> {formikResetPassword.status} </Typography> : null}


                <Button sx={{
                    marginTop: '1rem'
                }} fullWidth variant="contained" type='submit'>Change password</Button>


            </Box>
        </Modal>
    )
}