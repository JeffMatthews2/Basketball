var express = require('express');
var router = express.Router();
var auth = require.main.require('./my_modules/authentication');

router.get('/profile.js', auth.ensureAuthenticated, function(req, res){
    res.sendFile( 'profile.js', {root: '\scripts'} );
});

router.get('/index.js', auth.ensureAuthenticated, function(req, res){
    res.sendFile( 'index.js', {root: '\scripts'} );
});

// router.get('/manifest.json', function(req, res){
//     res.sendFile( 'manifest.json', {root: '\public\icons'} );
// });

module.exports = router;
