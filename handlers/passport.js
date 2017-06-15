/**
 * Created by esteban on 11/6/17.
 */

const passport  = require('passport');
const mongoose = require('mongoose');

const User = mongoose.model('User');


passport.use(User.createStrategy());


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());