import passport from 'passport';
// import GoogleStrategy from 'passport-google-oauth20';
import { ExtractJwt, Strategy } from 'passport-jwt';
import config from './config';
import * as usersService from '../services/user.service';
import * as tokensService from '../services/token.service';
import { User } from '../model/postgres/index';

const jwtVerify = async (payload, done) => {
    try {
        const user = await User.findByPk(payload.id, {
            include: [],
        });
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    } catch (error) {
        done(error, false);
    }
};

export const initialize = function (app) {
    // init default passport behavior
    app.use(passport.initialize());

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    // add jwt strategy
    const opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.jwtSecret,
    };
    passport.use(
        new Strategy(opts, jwtVerify),
    );
};
