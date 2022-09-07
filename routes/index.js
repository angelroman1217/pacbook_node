var express = require('express');
var router = express.Router();

const APIs = require('./Apis')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//APIs
router.get('/api/mapByEdo/get', APIs.mapByEdo)
router.get('/api/getRutasByEdo', APIs.getRutasByEdo)
router.get('/api/trazo/get', APIs.getTrazoByStudy)
router.get('/api/road/paletaskm', APIs.getByRoad)

module.exports = router;
