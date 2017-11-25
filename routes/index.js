var express = require('express');
var ObjectId = require('mongodb').ObjectId;

var RSVP = require('../models/rsvp');
var User = require('../models/user');
var Global = require('../models/global');

var auth = require.main.require('./my_modules/authentication');

var router = express.Router();

var _client = {};

// Get Homepage
router.get('/', auth.ensureAuthenticated, function(req, res) {
	//  Gets all Users' attendance information and populates the view.

	// client is the logged-in user, as opposed to other registered users.
	_client = req.user;

	getHomePageData().then( (
		// This is an object composed of all data received.
		{	eventDate: eventDate,
			clientIsAdmin: clientIsAdmin,
			clientAttendance: clientAttendance,
			clientIsOut: clientIsOut,
			clientIsMaybe: clientIsMaybe,
			clientIsIn: clientIsIn,
			clientAttendanceNotes: clientAttendanceNotes,
			rsvpsIn: rsvpsIn,
			rsvpsMaybe: rsvpsMaybe,
			rsvpsOut: rsvpsOut
		}) =>
		{
			// Here is the callback contents.
			// Pass the object to the view and call the view.

			//console.log('admin? ' + clientIsAdmin);
			res.render('index',
				{
					eventDate: eventDate,
					clientIsAdmin: clientIsAdmin,
					clientAttendance: clientAttendance,
					clientIsOut: clientIsOut,
					clientIsMaybe: clientIsMaybe,
					clientIsIn: clientIsIn,
					clientAttendanceNotes: clientAttendanceNotes,
					rsvpsIn: rsvpsIn,
					rsvpsMaybe: rsvpsMaybe,
					rsvpsOut: rsvpsOut
				});
	  }).catch( (err) => {
		  console.log(err);
	  });
});

function getHomePageData(){

	//  Gets all Users' attendance information for the Home view.
	return new Promise( (resolve, reject) => {

		// Left join rsvp collection to users collection using mongoose.
		RSVP.aggregate([{
		    $lookup: {
		        from: "users", // collection name in db
		        localField: "userId",
		        foreignField: "_id",
		        as: "user"
		    }
		}
		]).exec( (err, rsvpList) => {
			if (err) throw err("Mongoose aggregate failed to join rsvps to users: " + err);

			let eventDate = "";

			Global.getGlobal().then( (global) => {
				if (global) {

					eventDate = global.eventDate;

					// Strip ending period if there is one.  The period is added in the view.
					if ( eventDate.endsWith('.') ) {
						eventDate = eventDate.substr(0, eventDate.length - 1);
					}

					let clientIsAdmin = ( _client.email.trim().toLowerCase() === 'jeff@superdocs.com' ? true: false );

					// console.log('client is admin: ' + clientIsAdmin);
					// console.log(_client.email.trim().toLocaleLowerCase());

					// These are client's defaults for handlebars to use
					// to set the value of the view's attendance radio buttons.
					let clientAttendance = "out";  // not used
					let clientIsOut = true;
					let clientIsMaybe = false;
					let clientIsIn = false;

					let clientAttendanceNotes = "";

					// These will be separate lists of all users' responses
					// to show in the view.
					let rsvpsIn = [];
					let rsvpsMaybe = [];
					let rsvpsOut = [];


					if (rsvpList.length === 0) {
						// No data.  We're done.
						resolve({
							eventDate: eventDate,
							clientIsAdmin: clientIsAdmin,
							clientAttendance: clientAttendance,  // not used
							clientIsOut: clientIsOut,
							clientIsMaybe: clientIsMaybe,
							clientIsIn: clientIsIn,
							clientAttendanceNotes: clientAttendanceNotes,
							rsvpsIn: rsvpsIn,
							rsvpsMaybe: rsvpsMaybe,
							rsvpsOut: rsvpsOut
						});
					} else {
						let responseCounter = rsvpList.length;

						// Iterate the joined rsvp records.
						rsvpList.forEach( response => {

							// This will be pushed into the appropriate list.
							let newRSVP = { userName: response.user[0].name, notes: response.notes };

							if ( response.response === "in" ) {
								rsvpsIn.push(newRSVP);
							} else if ( response.response === 'maybe' ) {
								rsvpsMaybe.push(newRSVP);
							} else {
								rsvpsOut.push(newRSVP);
							}

							// Is this User the Client?
							if ( response.user[0]._id.toString() === _client.id ) {
								// These are passed to the view.
								clientAttendance = response.response;  // not used
								clientIsOut = ( response.response === 'out' ? true : false );
								clientIsMaybe = ( response.response === 'maybe' ? true : false );
								clientIsIn = ( response.response === 'in' ? true : false );
								clientAttendanceNotes = response.notes;
							}

							// Decrement and if we are done, return all the data.
							responseCounter -= 1;
							if (responseCounter === 0){
								//console.log(typeof eventDate);
								resolve({
									eventDate: eventDate,
									clientIsAdmin: clientIsAdmin,
									clientAttendance: clientAttendance,  // not used
									clientIsOut: clientIsOut,
									clientIsMaybe: clientIsMaybe,
									clientIsIn: clientIsIn,
									clientAttendanceNotes: clientAttendanceNotes,
									rsvpsIn: rsvpsIn,
									rsvpsMaybe: rsvpsMaybe,
									rsvpsOut: rsvpsOut
								});
							}
						});
					}
				} else {
					console.log('getGlobal() failed from getHomePage().')
				}
			}).catch( (err) => {
				console.log('getGlobal() failed from getHomePage().');
			});
		});
	});
}

// Client is submitting his attendance data.
router.post('/', auth.ensureAuthenticated, function(req, res){

	var query = { userId: req.user.id };

	var update = {
		userId: new ObjectId(req.user.id),
		response: req.body.inOrOut,
	  	notes: req.body.notes
	};

	//  Upsert
	var options = { upsert: true };

	// Use mongoose to save via upsert.
	RSVP.findOneAndUpdate( query, update, options, (err, doc) => {
			if ( err ) throw err;
	});

	//  Back to home so it can re-load and show changes.
	res.redirect('/');
});


// Admin is changing the event date.
router.post('/changeDate', auth.ensureAuthenticated, (req, res) => {

	Global.changeEventDate(req.body.eventDate).then( (doc) => {

		if (req.body.zapRSVPs === "zapRSVPs" && req.body.confirmZapRSVPs === "confirmZapRSVPs") {
			RSVP.zapRSVPs().then( (result) => {
				//res.redirect('/');
			}).catch( (err) => {
				console.log(err);
			});
		}

	}).catch( (err) => {
		console.log(err);
	});

	res.redirect('/');
});

module.exports = router;
