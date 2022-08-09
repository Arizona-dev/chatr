import express from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import messageRoutes from './message.routes';
import friendRoutes from './friend.routes';
import logRoutes from './log.routes';
import analyticRoutes from './analytic.routes';

const router = express.Router();

const routes = [
    {
        path: 'auth',
        routes: authRoutes,
    },
    {
        path: 'users',
        routes: userRoutes,
    },
    {
        path: 'messages',
        routes: messageRoutes,
    },
    {
        path: 'friends',
        routes: friendRoutes,
    },
    {
        path: 'logs',
        routes: logRoutes,
    },
    {
        path: 'analytics',
        routes: analyticRoutes,
    },
];

routes.forEach((route) => {
    router.use(`/${route.path}`, route.routes);
});

export default router;
