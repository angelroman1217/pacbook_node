var express = require('express');
var router = express.Router();

const APIs = require('./Apis')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Pacbook Node Server is working' });
});

//APIs
router.get('/api/cadenamiento/get', APIs.goToKm)
router.get('/api/compare/getInfoChart', APIs.getInfoChart)
router.get('/api/compare/getInfoMap', APIs.getInfoMap)
router.get('/api/compare/getResumenInfo', APIs.getResumenInfo)
router.get('/api/getRutasByEdo', APIs.getRutasByEdo)
router.get('/api/imagenes/get', APIs.getImgs)
router.get('/api/mapByEdo/get', APIs.mapByEdo)
router.get('/api/nearestpoint/compare', APIs.getNearestPointComp)
router.get('/api/nearestpoint/get', APIs.getNearestPoint)
router.get('/api/road/get', APIs.getTrazo)
router.get('/api/road/paletaskm', APIs.getByRoad)
router.get('/api/trazo/get', APIs.getTrazoByStudy)

module.exports = router;
