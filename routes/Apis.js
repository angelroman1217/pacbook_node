var express = require('express');
var router = express.Router();

const Carretera = require('../models/Carretera');
const History = require('../models/History');
const PaletasKm = require('../models/PaletasKm');
const Imagenes = require('../models/Imagenes');

const Proceso = require('./Proceso');
const Validacion = require('./Validacion');
const Rangos = require('./Rangos');

var APIs = {
    //APIs Principales
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
    getInfoRoad: async(edo, red, ruta) => {
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
    getRutasByEdo: async(req, res) => {
      var edo = req.query.edo
      const query = {'estado' : edo, 'status' : true}
      const rutas = await Carretera.find().where(query).distinct('ruta');
      res.json(rutas);
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

      var red;
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
    getByRoad: async(req, res) => {
      var tramo = req.query.tramo;
      var sentido = req.query.sentido;
      
      const kms = await PaletasKm.find({"tramo": tramo, "sentido" : parseInt(sentido)}).sort("cadGeo"); 
      for (const value of kms) {
        value._doc.descripcion = value._doc.descripcion.replace("Poste ", "");
      }
      res.json(kms);
    },
    getImgs: async(req, res) => {
      var tramo = req.query.tramo;
      var sentido = req.query.sentido;
      var carril = req.query.carril;
      var year = req.query.anio;

      const imagenes = await Imagenes.find({"tramo": tramo, "sentido" : parseInt(sentido)}).sort("cadGeo");
      var img = [];
      for (const value of imagenes) {
        img.push(value._doc.imgCen.replace("JPEG", "jpeg"));
      }
      var result = [img]
      res.json(result);
    },
    getNearestPoint: async(req, res) => {
      var tramo = req.query.tramo;
      var sentido = parseInt(req.query.sentido);
      var carril = parseInt(req.query.carril);
      var lng = parseFloat(req.query.lng);
      var lat = parseFloat(req.query.lat);

      var maxDistance = 200;

      var cond = {"tramo": tramo, "sentido" : sentido, "carril": carril};
      var loc = { center: [lng, lat], maxDistance: maxDistance };

      const imagenes = await History.find(cond).where('loc').nearSphere(loc).limit(1);

      var info = [];
      if (imagenes) {
        info = [
          imagenes[0]._doc.de_cad,
          imagenes[0]._doc.latitud,
          imagenes[0]._doc.longitud,

        ]
      }
      res.json(info);

    },
    getNearestPointComp: async(req, res) => {
      var tramo = req.query.tramo;
      var sentido = parseInt(req.query.sentido);
      var carril = parseInt(req.query.carril);
      var lng = parseFloat(req.query.lng);
      var lat = parseFloat(req.query.lat);

      var maxDistance = 20;

      var cond = {"tramo": tramo, "sentido" : sentido, "carril": carril};
      var loc = { center: [lng, lat], maxDistance: maxDistance };

      const imagenes = await History.find(cond).where('loc').nearSphere(loc).limit(1);

      var info = [];
      if (imagenes) {
        info = [
          imagenes[0]._doc.de_cad,
          imagenes[0]._doc.latitud,
          imagenes[0]._doc.longitud,

        ]
      }
      res.json(info);

    },
    goToKm: async(req, res) => {
      var tramo = req.query.tramo;
      var sentido = parseInt(req.query.sentido);
      var carril = parseInt(req.query.carril);
      var cad = req.query.cad;
      var de_cad = await APIs.formatCad(cad)
      cad = cad.replace("+","");

      var cond = {"tramo": tramo, "sentido" : sentido, "carril": carril, "de_cad": de_cad};

      const result = await History.find(cond);

      if (result.length == 0) {
        result = await History.find({"tramo": tramo, "sentido" : sentido, "carril": carril}).where('cadReal').gt(parseFloat(cadenamiento)).sort("carretera").limit(10);
      }
      var info = [];
      if (result && result[0]) {
        info = [
          result[0]._doc.de_cad,
          result[0]._doc.latitud,
          result[0]._doc.longitud,

        ]
      }
      res.json(info);

    },
    getInfoChart: async(req, res) => {
      var study = req.query.study;
      var type  = req.query.type;
      var years = req.query.years;
      var road = req.query.road;
      var carril = parseInt(req.query.carril);
      var sentido = parseInt(req.query.sentido);

      var cond = {"tramo": road, "sentido": sentido, "carril": carril};
      var condYear = [];
      var condYearObj = {};

      if (years == "all") {
        for (var i = 2021; i > 2016; i--) {
          condYear.push(Proceso.getStudyVar(study, i));
          condYearObj[Proceso.getStudyVar(study, i)] = 1;
        }
      } else {
        var tmpyears = years.split(",")
        for (const y of tmpyears) {
          condYear.push(Proceso.getStudyVar(study, y))
          condYearObj[Proceso.getStudyVar(study, y)] = 1;
        }
      }
      var fields = condYearObj;
      fields.de_cad = 1;
      var records = await History.find(cond,fields).sort("de_cad_geo");
      var segmentos = await Proceso.splitToKM2(records, true);
      
      var red;
      var road = await Carretera.find({tramo: road}, {"red": 1})
      if(road[0]){
        red = road[0].red;
      }
      var result = {};
      condYear = condYear.sort();
      for (const year of condYear) {
        var bueno = 0; var aceptable = 0; var no_aceptable = 0;
        var segmentos2 = Proceso.promedios(segmentos,year,study.toUpperCase(),red);
        for (const seg of segmentos2) {
          var prom  = seg.promedio;
          var ev = await APIs.getValidacion(study, prom, red);
          if (ev == "Bueno") {
            bueno++
          } else if (ev == "Aceptable") {
            aceptable++
          } else if (ev == "No_Aceptable") {
            no_aceptable++
          }
        }
        result[year] = {"bueno": bueno, "aceptable": aceptable, "no_aceptable": no_aceptable}
      }
      var all1 = [study.toUpperCase(), "Bueno", "Aceptable", "No Aceptable"];
      var all2 = [];
      for (const value of Object.keys(result)) {
        var val = result[value];
        var toreplace = study == "det" ? "det_" : study+"_promedio_";
        all2 = [value.replace(toreplace, ""), val.bueno, val.aceptable, val.no_aceptable];
      }
      var all = [all1, all2]
      res.json(all);
    },
    getInfoMap: async(req, res) => {
      var year = req.query.year;
      var study = req.query.study;
      var sentido = parseInt(req.query.sentido);
      var carril = parseInt(req.query.carril);
      var type  = req.query.type;
      var tramo = req.query.tramo;

      var red;
      var road = await Carretera.find({tramo: tramo}, {"red": 1})
      if(road[0]){
        red = road[0].red;
      }
      var var_prom = await Proceso.getStudyVar(study, year, type);
      var cond = {tramo: tramo, sentido: sentido, carril: carril}
      var get = {'de_cad': 1}
      get[var_prom] = 1;
      get.latitud = 1;
      get.longitud = 1;
      const rec = await History.find(cond, get).sort("de_cad_geo");
      var segmentos;
      if (study !== "tdpa" && study !== "tipo_pavimento") {
        segmentos = await Proceso.splitToKM2(rec, true);
        segmentos = await Proceso.promedios(segmentos, var_prom, study.toUpperCase(), red);
      } else {
        segmentos = await Proceso.splitToSegment(rec, var_prom);
      }
      
      segmentos = await Proceso.formatPaths(segmentos);
      res.json(segmentos);

    },
    getResumenInfo: async(req, res) => {
      var year = req.query.year;
      var study = req.query.study;
      var sentido = parseInt(req.query.sentido);
      var carril = parseInt(req.query.carril);
      var tramo = req.query.tramo;

      var var_prom = await Proceso.getStudyVar(study, year);
      var cond = {tramo: tramo, sentido: sentido, carril: carril}
      var get = {'de_cad': 1, 'latitud' : 1, 'longitud' : 1}
      get[var_prom] = 1;
      const rec = await History.find(cond, get).sort("de_cad_geo");

      var red;
      var road = await Carretera.find({tramo: tramo}, {"red": 1})
      if(road[0]){
        red = road[0].red;
      }

      var all = [];
      var pushup = new Object();
      for (const value of Object.keys(rec)) {
        var x = rec[value];
        var prom = x._doc[var_prom];
        var ev = await APIs.getValidacion(study, prom, red)
        pushup = {
          "cad": x._doc['de_cad'],
          "latitud": x._doc['latitud'],
          "longitud": x._doc['longitud'],
          "promedio": study === 'det' ? prom*100 : prom,
          "evaluacion": (prom != "NO_DATA" && prom != 0 && prom != null) ? ev : "NO_DATA"
        }
        all.push(pushup);
      }
      
      res.json(all);

    },
    getTrazo: async(req, res) =>{
      var data = req.query;
      var year = data.anio;
      var sentido = parseInt(data.sentido);
      var needInfo = data.needInfo;
      var tramo = data.tramo;
      var carril = parseInt(data.carril);

      const trazo = await History.find({'tramo':tramo,'sentido':sentido,'carril':carril}).sort('de_cad_geo');

      var red;
      const road = await Carretera.find({'tramo':tramo},{"red": 1});
      if (road[0]) {
        red = road[0].red;
      }
      
      var paths = [];
      var info = []
      for (const value of trazo) {
        paths.push([value._doc['longitud'], value._doc['latitud']]);
        if (needInfo) {
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
      var tmp = [{"evaluacion": "TRAZO", "paths": paths}]
      var result = [tmp];
      result.push(info)
      res.json(result);
      
    },
    //APIs Complementarias
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
    getValidacion: async(study, prom, red) => {
      var ev = "";
      switch (study) {
        case 'iri':
          ev = Validacion.IRI(prom, red);
          break;
        case 'pr':
          ev = Validacion.PR(prom, red);
          break;
        case 'mac':
          ev = Validacion.MAC(prom, red);
          break;
        case 'det':
          ev = Validacion.DET(prom, red);
          break;
        case 'friccion':
          ev = Validacion.FR(prom);
          break;
        case 'deflexiones':
          ev = Validacion.DEF(prom, red);
          break;
        case 'irap':
          ev = Validacion.IRAP(prom);
          break;
        default:
          ev = null;
          break;
      }
  
      return ev;
    },
    formatCad: async(cad) => {
      var len = cad.length;
      var cadenamiento = "";
      if (len == 1) {
        cadenamiento = "0+00"+cad;
      } else if (len == 2) {
        cadenamiento = "0+0"+cad;
      } else if (len == 3) {
        cadenamiento = "0+"+cad;
      } else if (len > 4) {
        var tmp = len - 3;
        var newstring = cad.substring(tmp);
        var newstring2 = cad.substring(0, tmp);
        cadenamiento = newstring2+"+"+newstring;        
      } else {
        cadenamiento = cad;
      }
      return cadenamiento;
    }
}



module.exports = APIs;