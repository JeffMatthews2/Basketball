let mongoose = require('mongoose');
//let ObjectId = require('mongodb').ObjectId;

// RSVP Schema
var RSVPSchema = mongoose.Schema({
	userId: {
		//type: String,
		type: mongoose.Schema.Types.ObjectId,
		index:true
	},
	response: {
		type: String
	},
	notes: {
		type: String
	},
});

var RSVP = module.exports = mongoose.model('RSVP', RSVPSchema);


module.exports.zapRSVPs = () => {
    //var query = { eventDate: req.body.eventDate };
    return new Promise ( (resolve, reject ) => {

        // Allows Admin to remove all RSVPs to start over for the next event date.
		mongoose.connection.db.dropCollection('rsvps', (err, result) => {
			if (err) {
				reject("zapRSVPs() failed.");
			} else {
				resolve(result);
			}
		});
    });
}
