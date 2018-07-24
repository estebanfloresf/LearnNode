const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: "You are now logged in! "


});


exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are logged out');
    res.redirect('/');
};

exports.isloggedIn = (req, res, next) => {
    // first check if the user is authenticated
    if (req.isAuthenticated()) {
        next();
        return;

    }
    req.flash('error', 'Oops you must be  logged in to do that');
    res.redirect('/login');
};


exports.forgot = async (req, res) => {


    // 1. See if the user exists
    const user = await User.findOne({
        email: req.body.email
    });


    if (!user) {
        req.flash('error', 'We are sending you an email! Thanks');
        res.redirect('/login');
    }

    // 2. Reset token and expiry on their accounts
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();


    // 3. Send an email with new toker
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

    await mail.send({
        user,
        subject: 'Password Reset',
        resetURL,
        filename: 'password-reset'


    });


    req.flash('success', 'You have been sent a password reset link!');


    // 4. Redirect to login page after email token has been set

    res.redirect('/login');
};


exports.reset = async (req, res) => {

    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
            $gt: Date.now()
        }
    });

    if (!user) {
        req.flash('error', 'Password reset is invalid or has expired');
        return res.redirect('/login');
    }
    //    If there is a user, show the rest of the form
    res.render('reset', {
        title: 'Reset your password'
    })

};


exports.confirmedPasswords = (req, res, next) => {

    if (req.body.password === req.body['password-confirm']) {
        console.log("Si entra" + req.body.password + req.body['password-confirm']);
        return next();
    }

    req.flash('error', 'Passwords do not match');
    res.redirect('back');

};

exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
            $gt: Date.now()
        }
    });
    if (!user) {
        req.flash('error', 'Password reset is invalid or has expired');
        return res.redirect('/login');
    }


    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordExpires = undefined;
    user.resetPasswordToken = undefined;

    const updatedUser = await user.save;

    await req.login(updatedUser);
    req.flash('success', 'Nice! Your password has been reset!');
    res.redirect('/');



};