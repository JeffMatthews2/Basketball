// If user is not logged in, stop and re-direct.
function ensureAuthenticated( req, res, next ) {
	if( req.isAuthenticated() ) {
		return next();
	} else {
		res.redirect('/users/login');
	}
}

module.exports = {
    ensureAuthenticated: ensureAuthenticated
};
