var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var UserSchema = mongoose.Schema({
	username: {
		type: String,
		index:true
	},
	password: {
		type: String
	},
	email: {
		type: String
	},
	name: {
		type: String
	}
});

var User = module.exports = mongoose.model('User', UserSchema);


module.exports.createUser = (newUser) => {

	return new Promise( (resolve, reject) => {

		bcrypt.genSalt(10, function(err, salt) {
		    bcrypt.hash(newUser.password, salt, function(err, hash) {
		        newUser.password = hash;

				//newUser.save(callback);
				newUser.save( (err, user) => {
					if (err) reject('Error: ' + err);

					if (user) {
						resolve(user);
					} else {
						reject('createUser() could not save the data.');
					}
				});
		    });
		});
	});
}

module.exports.updateUser = function(user, callback) {

	User.getUserById(user.id, (err, foundUser) => {

		if (err) throw err;

		if (foundUser) {
			foundUser.name = user.name;
			foundUser.username = user.name;
			foundUser.email = user.email;
			foundUser.password = user.password;

			foundUser.save(callback);
		}
	});
}

module.exports.getUserByUsername = function(username, callback){
	var query = {'username': username};
	User.findOne(query, callback);
}

module.exports.getUserByName = function(name){
	return new Promise( (resolve, reject) => {

		// Case-insensitive.
		// Match whole words only.  (don't return "Deshaun" when search is on "esHau")

		// Still needs work.  Disallow search on empty or null.
		let query = { 'name': new RegExp('^'+name+'$', "i") }; //'/name/i' }; //new RegExp(name, 'i') };

		User.findOne(query, (err, user) => {
			if (err) throw err;

			if (user){
				resolve(user);
			}
			else {
				reject('User: "' + name + '" could not be found.');
			}
		}) //.catch( err => {
		// 	console.log('getUserByName() could not perform the query.');
		// });
	});
}

//module.exports.getUserByEmail = (email, callback) => {
	// let query = { 'email': email };
	// User.findOne(query, callback);
module.exports.getUserByEmail = (email) => {

	return new Promise( (resolve, reject) => {

		// Case-insensitive.
		// Match whole words only.  (don't return "Deshaun" when search is on "esHau")

		// Still needs work.  Disallow search on empty or null.
		let query = { 'email': new RegExp('^'+email+'$', "i") }; //'/name/i' }; //new RegExp(name, 'i') };

		User.findOne(query, (err, user) => {
			if (err) throw err;

			if (user){
				resolve(user);
			}
			else {
				reject('A user with email address, "' + email + '," could not be found.');
			}
		}) //.catch( err => {
		// 	console.log('getUserByName() could not perform the query.');
		// });
	});

}

module.exports.getUserById = function(id, callback){
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
}
