import express from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import messageRoutes from './message.routes';
import friendRoutes from './friend.routes';
import interestRoutes from './interest.routes';

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
        path: 'interests',
        routes: interestRoutes,
    },
];

routes.forEach((route) => {
    router.use(`/${route.path}`, route.routes);
});

export default router;
