var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var bcrypt = require('bcryptjs');

var User = require('../models/user');

var auth = require.main.require('./my_modules/authentication');


const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');


// Register
router.get('/register', function(req, res){
	res.render('register');
});

// Login
router.get('/login', (req, res) => {
	res.render('login');
});

// Profile
router.get('/profile', auth.ensureAuthenticated, (req, res) => {
	res.render('profile');
});


const nameValidationChain = () => {

	// Provides all validation of the value the user supplies for his name.
	// returns: a validation chain.  https://github.com/ctavan/express-validator#validation-chain-api

	const nameCheck = [
		check('name')

		.trim()

		.isLength( {min: 5, max: undefined } )
		.withMessage('Name must be at least 5 characters.')

		.custom( (name, {req}) => {

			// If req.user is defined, we have a logged-in user changing his profile.
			// In that case, only check the name if the name was changed.

			// validation by default
			let testName = true;

			//  No validation if the length test didn't pass (we checked it above).
			testName = (name.length >= 5);

			if (testName) {
				let IsNewUser = (typeof req.user === 'undefined');

				if (!IsNewUser) {
					// no validation if user did not change his name.
					testName = ( name.toLowerCase().trim() !== req.user.name.toLowerCase().trim() );
				}
			}

			if (testName) {
				return new Promise( (resolve, reject) => {
					User.getUserByName(name).then(user => {
						reject('This name has already been registered by another user.');
					}).catch( err => {
						resolve(true);
					});
				});
				//return false;
			} else {
				return true;
			}
		}).withMessage('This name has already been registered by another user.'),

		sanitize('name').trim()
	]

	return nameCheck;
}


const emailValidationChain = () => {

	// Provides all validation of the value the user supplies for his email.
	// returns: a validation chain.  https://github.com/ctavan/express-validator#validation-chain-api

	const emailCheck = [
		check('email')

		.trim()

		.isEmail()
		.withMessage('Please enter a valid email address.')

		.custom( (email, {req}) => {

			// If req.user is defined, we have a logged-in user changing his profile.
			// In that case, only check the email if it was changed.

			// validation by default
			let testEmail = true;

			let IsNewUser = (typeof req.user === 'undefined');

			if (!IsNewUser) {
				// don't validate if user did not change his email.
				testEmail = ( email.toLowerCase().trim() !== req.user.email.toLowerCase().trim() );
			}

			if (testEmail) {
				return new Promise( (resolve, reject) => {
					User.getUserByEmail(email).then(user => {
						reject('This email address has already been registered by another user.');
					}).catch( err => {
						resolve(true);
					});
				});
				//return false;
			} else {
				return true;
			}
		}).withMessage('This email address has already been registered by another user.'),

		sanitize('email').trim()
	]

	return emailCheck;
}

const pwValidationChain = () => {

	// Provides all validation of the value the user supplies for his password.
	// returns: a validation chain.  https://github.com/ctavan/express-validator#validation-chain-api

	const pwCheck = [
		check('password')

		.trim()

		.custom( (password, {req}) => {

			// validation by default.
			let testPw = true;

			// If req.user is defined, we have a logged-in user changing his profile.
			let isNewUser = (typeof req.user === 'undefined');

			if (!isNewUser){
				// don't validate if user didn't check the box to change his password.
				testPw = (req.body.changePw === 'changePwIsChecked');
			}

			if (testPw) {
				if (password.trim().length < 5 ) {
					return false;
				} else {
					return true;
				}
			} else {
				return true;
			}

		}).withMessage('Password must be at least 5 characters.'),

		sanitize('password').trim()
	]

	return pwCheck;
}

const pw2ValidationChain = () => {

	// Provides all validation of the value the user supplies for his confirmation of password.
	// returns: a validation chain.  https://github.com/ctavan/express-validator#validation-chain-api

	const pw2Check = [
		check('password2')

		.trim()

		.custom( (password2, {req}) => {

			// validation by default
			let testPw = true;

			// If req.user is defined, we have a logged-in user changing his profile.
			let isNewUser = (typeof req.user === 'undefined');

			if (!isNewUser) {
				// no need to validate if user didn't check the box to change password
				testPw = (req.body.changePw === 'changePwIsChecked')
			}

			if ( testPw && password2 !== req.body.password ) {
				return false;
			} else {
				return true;
			}
		}).withMessage('Passwords do not match.'),

		sanitize('password2').trim()
	]

	return pw2Check;
}


// Profile
router.post('/profile', auth.ensureAuthenticated, [

	nameValidationChain(),
	emailValidationChain(),
	pwValidationChain(),
	pw2ValidationChain()

], (req, res, next) => {

	let newUser = new User({
		name: req.body.name,
		email: req.body.email,
		username: req.body.name,
		password: req.body.password
	});

	let errors = validationResult(req);
	let changePwIsChecked = (req.body.changePw === 'changePwIsChecked');

	if (!errors.isEmpty()) {
		// console.log('Oops!  validationResult contains one or more errors.');
		// console.log(errors.array());

		res.render( 'profile', {errors: errors.array(), newUser: newUser, changePwIsChecked: changePwIsChecked, password2: req.body.password2} );
		return;
	} else {

		let user = req.user;

		user.name = newUser.name;
		user.username = newUser.username;
		user.email = newUser.email;

		if (changePwIsChecked) {
			bcrypt.genSalt(10, function(err, salt) {
			    bcrypt.hash(newUser.password, salt, function(err, hash) {
			        user.password = hash;
			    });
			});
		}

		User.updateUser(user, function(err, updatedUser){

			if(err) throw err;

			// log in under new credentials
			req.logIn(updatedUser, (error) => {

				if (!error) {
					// successfully serialized user to session
					res.redirect('/');
				} else{

				}
			});
		});
	}
});


router.post('/register', [

	nameValidationChain(),
	emailValidationChain(),
	pwValidationChain(),
	pw2ValidationChain()

], (req, res, next) => {

	let newUser = new User( {
		name: req.body.name,
		email: req.body.email,
		username: req.body.name,
		password: req.body.password
	});

	let errors = validationResult(req);

	if (!errors.isEmpty()) {
		// console.log('Oops!  validationResult contains one or more errors.');
		// console.log(errors.array());

		//  Send newUser back to retain values for editing.
		res.render('register', {errors: errors.array(), newUser: newUser});
		return;

	} else {
		//User.createUser(newUser, (err, user) => {

		User.createUser(newUser).then( (user) => {

			// log in under new credentials
			req.logIn(user, (error) => {

				if (!error) {
					// successfully serialized user to session
					res.redirect('/');
				} else{
					console.log('Oops! ' + error);
					res.redirect('/');
				}

			});

		}).catch( (err) => {
			console.err('caught: ' + err);
			return;
		});
	}
});


passport.use(new LocalStrategy( (name, password, done) => {

    User.getUserByName(name).then(user => {

		User.comparePassword(password, user.password, (err, isMatch) => {
	   		if(err) done(err); //throw err;
	   		if(isMatch){
	   			return done(null, user);
	   		} else {
	   			return done(null, false, {message: 'Invalid password.'});
	   		}
	   	});

	}).catch(err => {
		return done(null, false, {message: 'There is no user registered under this name.'});
	});
}));

router.post( '/login',
	passport.authenticate( 	'local',
		{
			successRedirect:'/',
			failureRedirect:'/users/login',
			failureFlash: true
		}
	)
);

router.get( '/logout', (req, res) =>
	{
		req.logout();
		req.flash('success_msg', 'You are logged out.');
		res.redirect('/users/login');
	}
);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

module.exports = router;
