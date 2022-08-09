import { VisibilityOff, Visibility } from '@mui/icons-material';
import { Box, Button, Container, FormControl, FormHelperText, IconButton, InputAdornment, InputLabel, Modal, OutlinedInput, Typography, Alert } from '@mui/material';
import TextField from '@mui/material/TextField';
import { useFormik } from 'formik';
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { UserContext } from '../../contexts/user.context';
import { authService } from '../../services/auth.service';
import logo from '../../../assets/images/messenger.png';
import { io } from 'socket.io-client';
import config from '../../config/config';

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

const validationSchemaLogin = yup.object().shape({
    email: yup
        .string('Enter your email')
        .email('Enter a valid email')
        .required('Email is required'),
    password: yup
        .string('Enter your password')
        .min(8, 'Password should be at least 8 characters')
        .required('Password is required'),
});

const validationSchemaResetPassword = yup.object({
    email: yup
        .string('Enter your email')
        .email('Enter a valid email')
        .required('Email is required'),
});

export default function Login() {

    const { setUser, setSocket } = useContext(UserContext);

    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const formikLogin = useFormik({
        initialValues: {
            email: '',
            password: ''
        },
        validationSchema: validationSchemaLogin,
        onSubmit: ({ email, password }, { setStatus }) => {
            authService
                .login(email, password)
                .then((res) => {
                    setUser(res.user);
                    localStorage.removeItem('session_id');
                    const newSocket = io(config.apiUrl, {
                        query: { userId: res.user.id }
                    });
                    setSocket(newSocket);
                    setStatus(null);
                    navigate('/');
                })
                .catch((err) => {
                    let customError = "Something went wrong";
                    if (err.match(/credentials/i)) {
                        customError = "Invalid credentials";
                    }
                    if(err.match(/User account is not active/i)){
                        customError = "Please confirm your email";
                    }
                    setStatus(customError);
                });
        }
    });


    const formikResetPassword = useFormik({
        initialValues: {
            email: ''
        },
        validationSchema: validationSchemaResetPassword,
        onSubmit: ({ email }, { setStatus }) => {
            authService
                .sendResetPassword(email)
                .then(() => {
                    setEmailSent(true);
                    setStatus(null);
                })
                .catch((err) => {
                    setEmailSent(false);
                    let customError = "Something went wrong";
                    if (err.match(/identifiant/i)) {
                        customError = "Invalid credentials";
                    }
                    if (err.match(/Email already sent/i)) {
                        customError = "An email has already been sent";
                    }
                    setStatus(customError);
                });
        }
    })

    return (
        <Box sx={
            {
                minHeight: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }
        }
        >
            <Container sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box
                    component="form"
                    onSubmit={formikLogin.handleSubmit}
                    sx={{
                        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        padding: '20px',
                        width: 500
                    }}
                >
                    <Typography sx={{
                        textAlign: 'center',
                    }} variant="h6" gutterBottom component="div">
                        Login
                    </Typography>
                    <Box sx={{ textAlign: 'center' }}>
                        <img src={logo} width='40' />
                    </Box>
                    <TextField
                        margin='dense'
                        fullWidth
                        type='email'
                        id="email"
                        label="Email"
                        variant="outlined"
                        value={formikLogin.values.email}
                        onChange={formikLogin.handleChange}
                        error={formikLogin.touched.email && Boolean(formikLogin.errors.email)}
                        helperText={formikLogin.touched.email && formikLogin.errors.email} />
                    <FormControl
                        fullWidth
                        margin='dense'
                        variant="outlined"
                        error={formikLogin.touched.password && Boolean(formikLogin.errors.password)}
                    >
                        <InputLabel htmlFor="password">Password</InputLabel>
                        <OutlinedInput
                            id="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={formikLogin.values.password}
                            onChange={formikLogin.handleChange}
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
                            {formikLogin.touched.password && formikLogin.errors.password}
                        </FormHelperText>
                    </FormControl>

                    {formikLogin.status ? <Typography sx={{
                        color: 'red'
                    }} variant='subtitle2'> {formikLogin.status} </Typography> : null}


                    <Button sx={{
                        marginTop: '1rem'
                    }} fullWidth variant="contained" type='submit' onTouchStart={() => formikLogin.handleSubmit}>Login</Button>
                    <Typography mt={2} variant="subtitle1" gutterBottom component="div">
                        Don&apos;t have an account yet ?
                    </Typography>
                    {/* register */}
                    <Typography
                        sx={{
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontWeight: 'bold',
                            width: 'fit-content',
                        }}
                        onClick={() => navigate('/register')}
                        variant="subtitle1" color={'primary'} gutterBottom component="div">
                        Register
                    </Typography>

                    {/* forgot password */}
                    <Typography
                        sx={{
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontWeight: 'bold',
                            width: 'fit-content',
                        }}
                        onClick={handleOpen}
                        variant="subtitle1" color={'primary'} gutterBottom component="div">
                        Forgot your password?
                    </Typography>

                    <Modal
                        open={open}
                        onClose={handleClose}
                        aria-labelledby="modal-modal-title"
                        aria-describedby="modal-modal-description"
                    >
                        <Box 
                            component="form"
                            onSubmit={formikResetPassword.handleSubmit}
                            sx={style}>
                            <Typography id="modal-modal-title" variant="h6" component="h2">
                                Enter your email, you will receive a link to change your password
                            </Typography>
                            <Alert severity="success" sx={{ width: '100%', display: emailSent ? 'flex': 'none' }}>
                                Email sent!
                            </Alert>
                            <TextField
                                margin='dense'
                                fullWidth
                                type='email'
                                id="email"
                                label="Email"
                                variant="outlined"
                                value={formikResetPassword.values.email}
                                onBlur={formikResetPassword.handleBlur}
                                onChange={formikResetPassword.handleChange}
                                error={formikResetPassword.touched.email && Boolean(formikResetPassword.errors.email)}
                                helperText={formikResetPassword.touched.email && formikResetPassword.errors.email} />

                            {formikResetPassword.status ? <Typography sx={{
                                color: 'red'
                            }} variant='subtitle2'> {formikResetPassword.status} </Typography> : null}

                            <Button sx={{
                                marginTop: '1rem'
                            }} fullWidth variant="contained" type='submit'>send</Button>
                        </Box>
                    </Modal>

                </Box>
            </Container>

        </Box>
    );
}