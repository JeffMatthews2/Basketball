let mongoose = require('mongoose');

// Date Schema
var GlobalSchema = mongoose.Schema({
	eventDate: {
		type: String
	},
});

var Global = module.exports = mongoose.model('Global', GlobalSchema);


module.exports.getGlobal = () => {
    //var query = { eventDate: req.body.eventDate };
    return new Promise ( (resolve, reject ) => {

        // Use mongoose to save via upsert.
        // There is only 1 record in the global selection, so query is null.
        Global.findOne( null, (err, doc) => {
            if ( err ) reject(err);

            if (doc) {
                //console.log(doc);
                resolve(doc);
            } else {
                reject("getGlobal() could not get the data.");
            }
        });
    });
}


module.exports.changeEventDate = (newEventDate) => {
    //var query = { eventDate: req.body.eventDate };
    return new Promise ( (resolve, reject ) => {
        var update = {
            eventDate: newEventDate
        };

        //  Upsert
        var options = { upsert: true };

        // Use mongoose to save via upsert.
        // There is only 1 record in the global selection, so query is null.
        Global.findOneAndUpdate( null, update, options, (err, doc) => {
            if ( err ) reject(err);

            if (doc) {
                resolve(doc);
            } else {
                reject("changeEventDate() could not save the data.");
            }
        });
    });
}
