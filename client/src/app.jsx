import React, { useEffect, useState, useMemo } from "react";
import { Navigate, Route, Routes } from 'react-router-dom';
import { io } from "socket.io-client";
import AuthRoute from './components/auth/AuthRoute';
import Login from './components/auth/Login';
import Logout from './components/auth/Logout';
import Register from './components/auth/Register';
import ResetPassword from './components/auth/ResetPassword';
import { UserContext } from './contexts/user.context';
import { ColorModeContext } from './contexts/colorMode.context';
import { userService } from './services/user.service';
import Box from '@mui/material/Box';
const Home = React.lazy(() => import('./components/home/Home'));
const Admin = React.lazy(() => import('./components/admin/Admin'));
const Reports = React.lazy(() => import('./components/admin/AdminContent/Reports/ReportsTable'));
const Logs = React.lazy(() => import('./components/admin/AdminContent/Logs/Logs.jsx'));
const Analytics = React.lazy(() => import('./components/admin/AdminContent/Analytics/AnalyticsTable'));
const Profile = React.lazy(() => import('./components/home/Profile/Profile'))
const Chat = React.lazy(() => import('./components/home/Chat/Chat'))
import config from './config/config';
import { analyticService } from './services/analytic.service';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { grey } from "@mui/material/colors";
import darkScrollbar from "@mui/material/darkScrollbar";
import CssBaseline from "@mui/material/CssBaseline";

export default function App() {

    const [user, setUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [nbUsersConnected, setNbUsersConnected] = useState(0);
    const [colorMode, setMode] = useState(localStorage.getItem('color_mode') ?? 'light');

    const colorModeContext = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => {
                    const newMode = (prevMode === 'light' ? 'dark' : 'light');
                    localStorage.setItem('color_mode', newMode);
                    return newMode;
                });
            },
            colorMode: localStorage.getItem('color_mode') ?? 'light'
        }),
        [],
    );

    const mainTheme = useMemo(
        () =>
            createTheme({
                palette: (colorMode === 'dark' ?
                    {
                        colorMode,
                        primary: {
                            main: '#2196f3',
                        },
                        secondary: {
                            main: '#ff3d00',
                        },
                        danger: {
                            main: '#f44336'
                        },
                        cancel: {
                            main: '#ffffff',
                        },
                        background: {
                            default: '#292929',
                            paper: '#212121',
                            darkest: '#151515',
                        },
                        text: {
                            primary: '#eeeeee',
                            secondary: '#bdbdbd',
                        },
                    } :
                    {}),
                components: {
                    MuiCssBaseline: {
                        styleOverrides: {
                            html: {
                                ...darkScrollbar(colorMode === 'light' ? {
                                    track: grey[400],
                                    thumb: grey[400],
                                    // active: grey[200],
                                } : {
                                    track: grey[600],
                                    thumb: grey[600],
                                }),
                                scrollbarWidth: "thin",
                                '& ::-webkit-scrollbar': {
                                    width: '5px',
                                    background: '#303030',
                                },
                                '& ::-webkit-scrollbar-track': {
                                    // background: 'background.default'
                                },
                                '& ::-webkit-scrollbar-thumb': {
                                },
                                '& ::-webkit-scrollbar-thumb:hover': {

                                },
                            }
                        }
                    },
                }
            }),
        [colorMode],
    );

    useEffect(() => {
        userService.getUserByToken().then(res => {
            if (res) {
                setUser(res);
                const newSocket = io(config.apiUrl, {
                    query: { userId: res.id }
                });
                setSocket(newSocket);
            }
        }).catch(_ => {
            setUser(null);
        }).finally(() => {
            setIsLoading(false);
        })
    }, []);

    socket && socket.on('connect', () => {

        socket.on('usersCount', function (number) {
            setNbUsersConnected(number);
        });

        const session_id = localStorage.getItem('session_id');

        if (!session_id) {
            let id = `id-${Math.random().toString(16).slice(2)}`;
            localStorage.setItem('session_id', id);
            const newSession = {
                sessionId: id,
                device: navigator.userAgentData.mobile ? 'Mobile' : 'Desktop',
                os: navigator.userAgentData.platform,
                browser: 'Chrome',
                country: navigator.language.split('-')[0],
            };
            analyticService.addNewSession({ userId: user.id, config: newSession });
            localStorage.setItem('sessionStart', new Date().getTime());
        }

        socket.on('disconnect', () => {
            const sessionEnd = new Date().getTime();
            const sessionStart = localStorage.getItem('sessionStart');
            const sessionDuration = sessionEnd - sessionStart;
            analyticService.updateSession({ userId: user.id, sessionId: session_id, duration: sessionDuration });
        })
    });

    return (
        <>
            {!isLoading &&
                <UserContext.Provider value={{
                    user,
                    setUser,
                    socket,
                    setSocket,
                    nbUsersConnected,
                    setNbUsersConnected
                }} >
                    <ColorModeContext.Provider value={colorModeContext}>
                        <ThemeProvider theme={mainTheme}>
                            <CssBaseline />
                            <Routes>

                                <Route path="login" element={
                                    user ? <Navigate to="/" /> : <Login />
                                } />
                                <Route path="register" element={
                                    user ? <Navigate to="/" /> : <Register />
                                } />
                                <Route path="/logout" element={<Logout />} />

                                <Route path="/reset-password" element={<ResetPassword />} />

                                <Route
                                    path="/"
                                    element={
                                        <AuthRoute >
                                            <React.Suspense fallback={<>...</>}>
                                                <Home />
                                            </React.Suspense>
                                        </AuthRoute>
                                    }
                                >
                                    <Route path="/" element={
                                        <Box ml={1}>
                                            <h1>Welcome back {user?.username} 👋</h1>
                                            <ul>
                                                <li>Start chating with your friends by sending invitations !</li>
                                            </ul>
                                        </Box>
                                    } />

                                    <Route path="profile" element={
                                        <React.Suspense fallback={<>...</>}>
                                            <Profile />
                                        </React.Suspense>
                                    } />
                                    <Route path="friends/:friendId" element={
                                        <React.Suspense fallback={<>...</>}>
                                            <Chat />
                                        </React.Suspense>
                                    } />
                                </Route>

                                <Route
                                    element={
                                        <AuthRoute role="ROLE_ADMIN" >
                                            <React.Suspense fallback={<>...</>}>
                                                <Admin />
                                            </React.Suspense>
                                        </AuthRoute>

                                    }>
                                    {/* default route is Logs */}
                                    <Route path="admin/logs" element={
                                        <React.Suspense fallback={<>...</>}>
                                            <Logs />
                                        </React.Suspense>
                                    } />
                                    <Route path="admin/reports" element={
                                        <React.Suspense fallback={<>...</>}>
                                            <Reports />
                                        </React.Suspense>
                                    } />
                                    <Route path="admin/analytics" element={
                                        <React.Suspense fallback={<>...</>}>
                                            <Analytics />
                                        </React.Suspense>
                                    } />
                                    <Route path="admin" element={<Navigate to="logs" />} />
                                </Route>
                            </Routes>
                        </ThemeProvider>
                    </ColorModeContext.Provider>
                </UserContext.Provider>
            }
        </>
    );
}