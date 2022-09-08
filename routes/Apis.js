var express = require('express');
var router = express.Router();

const Carretera = require('../models/Carretera');
const History = require('../models/History');
const PaletasKm = require('../models/PaletasKm');

const Proceso = require('./Proceso');
const Validacion = require('./Validacion');
const Rangos = require('./Rangos');

var APIs = {
    getRutasByEdo: async(req, res) => {
      var edo = req.query.edo
      const query = {'estado' : edo, 'status' : true}
      const rutas = await Carretera.find().where(query).distinct('ruta');
      res.json(rutas);
    },
    mapByEdo: async(req, res) => {
      var edo = req.query.edo
      var ruta = req.query.ruta
      var js = {
        autopistas  : await APIs.getInfoRoad(edo, "A", ruta),
        corredores  : await APIs.getInfoRoad(edo, "C", ruta),
        basicas     : await APIs.getInfoRoad(edo, "B", ruta),
        secundarias : await APIs.getInfoRoad(edo, "S", ruta)
      };
      res.json(js) 
    },
    getInfoRoad  : async(edo, red, ruta) => {
      const query = {'estado' : edo, 'red' : red, 'status' : true}
      if (ruta != 'All') {
        query.ruta = ruta;
      }

      var roads = await Carretera.find({},{"tramo": 1,"carretera": 1,"red": 1,"clave_sct": 1})
      .where(query).sort("carretera"); 

      if (roads.length > 0) {
        var i = 0;
        for (const road of roads){
          var sen = [];
          var car = [];
          var clave = road.tramo;
          const sentidos = await History.find({'tramo' : clave}).distinct('sentido');
          const carriles = await History.find({'tramo' : clave}).distinct('carril');
          sentidos.forEach(item => sen.push([item]));
          carriles.forEach(item => car.push([item]));
          roads[i]._doc.sentidos = sen;
          roads[i]._doc.carriles = car;
          
          var trazo = [];
          if (sentidos.length > 0 && carriles.length > 0) {
          trazo = await History.find({'tramo' : clave, 'sentido' : sentidos[0], 'carril' : carriles[0]},{"latitud": 1,"longitud": 1}).sort("de_cad_geo");
          }
          var longitudes = [];
          for (const sn of sentidos){
            const l1 = await History.find({'tramo' : clave, 'sentido' : sn, 'carril' : carriles[0]}, {"cad_de_num" : 1}).sort({"de_cad_geo" : 1}).limit(1);
            const l2 = await History.find({'tramo' : clave, 'sentido' : sn, 'carril' : carriles[0]}, {"cad_de_num" : 1}).sort({"de_cad_geo" : -1}).limit(1);
            var tmp = 0;
            if ( parseInt(sn) === 1)  {
              tmp = parseInt(l2[0].cad_de_num) - parseInt(l1[0].cad_de_num);
            } else {
              tmp = parseInt(l1[0].cad_de_num) - parseInt(l2[0].cad_de_num);
            }
            longitudes.push(tmp)
          }


          roads[i]._doc.longitudes = longitudes;
          roads[i]._doc.road = trazo; 

          i++
        };
      } else {
        roads = [];
      }
      
      return  roads;

    },
    getTrazoByStudy: async(req, res) =>{
      var data = req.query;
      var year = data.anio;
      var study = data.study;
      var type = data.type;
      var sentido = data.sentido;
      var carril = data.carril;
      var needInfo = data.needInfo;
      var tramo = data.tramo;

      var red = null;
      const road = await Carretera.find({'tramo':tramo},{"red": 1});
      if (road[0]) {
        red = road[0].red;
      }
      var var_prom = await Proceso.getStudyVar(study,year,type);
      const rec = await History.find({'tramo':tramo,'sentido':parseInt(sentido),'carril':parseInt(carril)}).sort('de_cad_geo');

      var segmentos;

      if (study !== "tdpa" && study !== "tipo_pavimento") {
        segmentos = await Proceso.splitToKM2(rec, true);
        segmentos = await Proceso.promedios(segmentos, var_prom, study.toUpperCase(), red);
      } else {
        segmentos = await Proceso.splitToSegment(rec, var_prom);
      }
      
      segmentos = await Proceso.formatPaths(segmentos);
      var info = []
      if (needInfo) {
        for (const value of rec) {
          var promedios = await APIs.validateProm(value._doc,year,red);
          var tmpInfo = {
            "cadenamiento" : value._doc["de_cad"],
            "latitud" : value._doc['latitud'].toFixed(6),
            "longitud" : value._doc['longitud'].toFixed(6),
            "promedios" : promedios
          }
          info.push(tmpInfo);
        }
      }
      var result = [segmentos];
      result.push(info)
      res.json(result);
      
    },
    validateProm: async(info, year, red) => {
      var newData = {};
      var promVal;

      promVal = info.hasOwnProperty('iri_promedio_'+year) ? info['iri_promedio_'+year] : null;
      newData.iri_promedio = promVal;
      newData.iri_evaluacion = promVal !== null ? Validacion.IRI(promVal, red) : "NO_DATA";

      promVal = info.hasOwnProperty('pr_promedio_'+year) ? info['pr_promedio_'+year] : null;
      newData.pr_promedio = promVal;
      newData.pr_evaluacion = promVal !== null ? Validacion.PR(promVal, red) : "NO_DATA";

      promVal = info.hasOwnProperty('mac_promedio_'+year) ? info['mac_promedio_'+year] : null;
      newData.mac_promedio = promVal;
      newData.mac_evaluacion = promVal !== null ? Validacion.MAC(promVal, red) : "NO_DATA";

      promVal = info.hasOwnProperty('det_'+year) ? info['det_'+year] : null;
      promVal = promVal !== null ? promVal.toFixed(2) : promVal;
      newData.det_promedio = promVal*100;
      newData.det_evaluacion = promVal !== null ? Validacion.DET(promVal, red) : "NO_DATA";

      promVal = info.hasOwnProperty('coeficiente_friccion_'+year) ? info['coeficiente_friccion_'+year] : null;
      info['coeficiente_friccion_'+year] = info['coeficiente_friccion_'+year];
      newData.friccion_promedio = info['coeficiente_friccion_'+year] ? info['coeficiente_friccion_'+year] : null;
      newData.friccion_evaluacion = promVal !== null ? Validacion.FR(promVal) : "NO_DATA";

      promVal = info.hasOwnProperty('deflexiones_'+year) ? info['deflexiones_'+year] : null;
      newData.deflexiones_promedio = promVal;
      newData.deflexiones_evaluacion = promVal !== null ? Validacion.DEF(promVal, red) : "NO_DATA";

      promVal = info.hasOwnProperty("irap_"+year+"_clasificacion_estrellas_suavizada") ? info["irap_"+year+"_clasificacion_estrellas_suavizada"] : null;
      newData.irap_promedio = promVal;
      newData.irap_evaluacion = promVal !== null ? Validacion.IRAP(promVal) : "NO_DATA";

      promVal = info.hasOwnProperty('TDPA_'+year) ? info['TDPA_'+year] : null;
      newData.tdpa_promedio = promVal;
      newData.tdpa_evaluacion = promVal !== null ? Rangos.getWidthTDP(promVal) : "NO_DATA";

      return newData;
    },
    getByRoad: async(req, res) => {
      var tramo = req.query.tramo;
      var sentido = req.query.sentido;
      
      const kms = await PaletasKm.find({"tramo": tramo, "sentido" : parseInt(sentido)}).sort("cadGeo"); 
      for (const value of kms) {
        value._doc.descripcion = value._doc.descripcion.replace("Poste ", "");
      }
      res.json(kms);
    }
}



module.exports = APIs;