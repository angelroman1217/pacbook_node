var express = require('express');
var router = express.Router();

const validacion = require('./Validacion');
const rangos = require('./Rangos')

var Process = {
  getStudyVar(study, year, type = null) {
    var variable = "";
    switch (study) {
      case 'iri':
      case 'pr':
      case 'mac':
        variable = study + "_promedio_" + year;
        break;

      case 'det':
      case 'deflexiones':
        variable = study + "_" + year;
        break;

      case 'friccion':
        variable = "coeficiente_friccion_" + year;
        break;

      case 'irap':
        variable = study + "_" + year + "_clasificacion_estrellas_suavizada";
        break;

      case 'tipo_pavimento':
        variable = 'tipo_pavimento_2020';
        break;

      case 'tdpa':
        variable = type === "A" || type === "B" ? type + "_" + year : (type === "total_camiones" ? "CAMIONES_" + year : "TDPA_" + year);
        break;

      default:
        variable = ""
        break;
    }

    return variable
  },
  cleanArray(actual){
    var newArray = new Array();
    if (actual) {
      for( var i = 0, j = actual.length; i < j; i++ ){
        if ( actual[ i ] ){
          newArray.push( actual[ i ] );
      }
    }
    return newArray; 
    }
  },
  splitToKM2: async(data) =>{
    var segmentos = {};
    var akm = []
    var i = 0;
    for (const row of data){
      const km = await row._doc.de_cad.split("+")[0];
      if (!segmentos.hasOwnProperty(km)) {
        segmentos[km] = []
        akm.push(km)
      }
      segmentos[km][i] = row._doc
      i++
    }
    for (const kmr of akm){
      var oldakm = segmentos[kmr]
      const newkmr = await Process.cleanArray(oldakm)
      delete segmentos[kmr]
      segmentos[kmr] = newkmr;
    }
    
    return segmentos;
  },
  fmtNumLikePHP(num){
    var number = Math.round((num + Number.EPSILON) * 100) / 100;
    return number;
  },
  promedios(data, index, rub, red){
    var rubro = rub === "FRICCION" ? "FR" : (rub === "DEFLEXIONES" ? "DEF" : rub );
    var result = [];
    for (const km in data){
      var data_row = data[km]
      var sum = 0;
      var count_rows = 0;
      for (const row in data_row){
        var drio = data_row[row][index];
        sum +=parseFloat(((!drio) ? 0 : drio));
        count_rows += ((!drio) ? 0 : 1);
      }
      
      var prom = (count_rows>1) ? Process.fmtNumLikePHP(parseFloat(sum/count_rows)) : "NO_DATA";
      prom = (sum == 0)? 0 : prom;
      //desviazion estandar 
      var variante = 0;
      var sum_dsv = 0;
      var desviacion_st = null;
      var vcaract = null;
      var caracteristico = 0.84162123;
      var pushup = new Object();
      var vcar_std = ["IRI","PR","MAC","DET","DEF","FR"];
      if (prom != "NO_DATA" && vcar_std.includes(rubro)) {
        for (const row in data_row){
          var dri = (!data_row[row][index]) ? 0 : data_row[row][index];
          if (prom != 0 ) {
            sum_dsv += (dri-prom)*(dri-prom);
          }  
        }
        variante = sum_dsv/(count_rows-1);
        var desviacion_st = (variante != 0) ? Math.sqrt(variante) : null;
        //valor caracteristico
        if(rubro == 'MAC' || rubro == 'FR'){
          vcaract = (desviacion_st != null) ? Process.fmtNumLikePHP(parseFloat(((prom - desviacion_st) * caracteristico).toFixed(2))):null
        }else{
          vcaract = (desviacion_st != null) ? Process.fmtNumLikePHP(parseFloat(((prom + desviacion_st) * caracteristico).toFixed(2))):null
        }
      }
      pushup = ({
        "km": parseInt(km),
        "promedio": rubro === 'DET' ? prom*100 : prom,
        "evaluacion": (prom != "NO_DATA" && prom != 0) ? validacion[rubro](prom,red) : "NO_DATA",
        "vcaract": (vcaract != null)? rubro === 'DET' ? vcaract*100 : vcaract : "NO_DATA",
        "evaluacion_vcaract": (vcaract != null)? validacion[rubro](vcaract,red) : "NO_DATA",        
        "paths": data_row
      });
      result.push(pushup);
    }
    return result;
  },
  splitToSegment(data, field){ 
    var segments = {}
    //TIPO DE PAVIMENTO
    if(field == "tipo_pavimento_2020"){
      for (const row of data){
        var insert = true;
        row._doc.latitud = parseFloat(row._doc.latitud);
        row._doc.longitud = parseFloat(row._doc.longitud);
        km = row._doc.de_cad.split("+")[0];
        var tp = row._doc[field] ? row._doc[field] : ""
        if (!segments.hasOwnProperty([tp+km])) {
          segments[tp+km] = {
            "km" : km,
            "prom" : row._doc[field] ? row._doc[field] : null,
            "evaluacion" : row._doc[field] ? row._doc[field] : "NO_DATA",
            "paths" : []
          }
          segments[tp+km]['paths'][0] = row._doc
          insert = false;
        } else {
          insert = true;
        }

        if (insert) {
          segments[tp+km]['paths'][segments[tp+km]['paths'].length] = row._doc
        } 
      }
      return Process.array_values(segments)
    }
    //TDPA
    for (const row of data){
      var insert = true;
      row._doc.latitud = parseFloat(row._doc.latitud);
      row._doc.longitud = parseFloat(row._doc.longitud);
      if (!segments.hasOwnProperty([parseInt(row._doc[field])])) {
        segments[parseInt(row._doc[field])] = {
          "tdp" : row._doc[field],
          "evaluacion" : row._doc[field] ? "TDPA" : "NO_DATA",
          "width" : row._doc[field] ? rangos.getWidthTDP(row._doc[field]) : "NO_DATA",
          "paths" : []
        }
        segments[parseInt(row._doc[field])]['paths'][0] = row._doc;
        insert = false;
      } else {
        insert = true;
      }

      if (insert) {
        segments[parseInt(row._doc[field])]['paths'][segments[parseInt(row._doc[field])]['paths'].length] = row._doc
      } 
    }
    return Process.array_values(segments)
  },
  array_values(n) {
    const tmpArr = []
    let key = ''
    for (key in n) {
      tmpArr[tmpArr.length] = n[key]
    }
    return tmpArr
  },
  formatPaths(data, history=false){
    var segments = [];
    var last_path = [];
    for (const segment of data) {
      var paths = [];
      for (const path of segment["paths"]) {
        if (history){
          paths.push([path["LONGITUD"],path["LATITUD"]]);
        }
        else {
          paths.push([path["longitud"],path["latitud"]]);
        }
      }
      segment["paths"] = last_path.length > 0 ? last_path.concat(paths) : paths;
      segments.push(segment);
      last_path  = paths.length > 0 ? [paths[paths.length-1]] : 0;
    }
    return segments;
  }
}



module.exports = Process;