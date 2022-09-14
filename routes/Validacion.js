var express = require('express');
var router = express.Router();

var validation = {
  IRI(value, red = null) {
    if (value == "NO_DATA") {
      value = 0;
    }
    var valoracion = null;
    if (red === 'A' || red === 'C') {
      if (value < 1.8) {
        valoracion = "Bueno";
      }
      if (value >= 1.8 && value <= 2.5) {
        valoracion = "Aceptable";
      }
      if (value > 2.5) {
        valoracion = "No_Aceptable";
      }
    } else {
      if (value < 2.5) {
        valoracion = "Bueno";
      }
      if (value >= 2.5 && value <= 3.5) {
        valoracion = "Aceptable";
      }
      if (value > 3.5) {
        valoracion = "No_Aceptable";
      }
    }

    return valoracion;
  },

  PR(value, red = null) {
    var valoracion = null;
    if (red === 'A' || red === 'C') {
      if (value < 5.0) {
        valoracion = "Bueno";
      }
      if (value >= 5.0 && value <= 8.0) {
        valoracion = "Aceptable";
      }
      if (value > 8.0) {
        valoracion = "No_Aceptable";
      }
    } else {
      if (value < 7.0) {
        valoracion = "Bueno";
      }
      if (value >= 7.0 && value <= 9.0) {
        valoracion = "Aceptable";
      }
      if (value > 9.0) {
        valoracion = "No_Aceptable";
      }
    }

    return valoracion;
  },

  MAC(value, red = null) {
    var valoracion = null;
    if (red === 'A' || red === 'C') {
      if (value > 0.90) {
        valoracion = "Bueno";
      }
      if (value >= 0.75 && value <= 0.90) {
        valoracion = "Aceptable";
      }
      if (value < 0.75) {
        valoracion = "No_Aceptable";
      }
    } else {
      if (value > 0.80) {
        valoracion = "Bueno";
      }
      if (value >= 0.65 && value <= 0.80) {
        valoracion = "Aceptable";
      }
      if (value < 0.65) {
        valoracion = "No_Aceptable";
      }
    }

    return valoracion;
  },

  DET(val, red = null) {
    var valoracion = null;
    var value = parseFloat(val * 100);
    if (red === 'A' || red === 'C') {
      if (value < 5.0) {
        valoracion = "Bueno";
      }
      if (value >= 5.0 && value <= 8.0) {
        valoracion = "Aceptable";
      }
      if (value > 8.0) {
        valoracion = "No_Aceptable";
      }
    } else {
      if (value < 7.0) {
        valoracion = "Bueno";
      }
      if (value >= 7.0 && value <= 9.0) {
        valoracion = "Aceptable";
      }
      if (value > 9.0) {
        valoracion = "No_Aceptable";
      }
    }
    return valoracion;
  },

  FR(value, red = null) {
    var valoracion = null;
    if (value <= 0.4) {
      valoracion = "No_Aceptable";
    }
    if (value >= 0.41 && value <= 0.60) {
      valoracion = "Aceptable";
    }
    if (value > 0.60 && value <= 0.90) {
      valoracion = "Bueno";
    }
    if (value > 0.90) {
      valoracion = "No_Aceptable";
    }
    return valoracion;
  },

  DEF(value, red = null) {
    var valoracion = null;
    if (red === 'A' || red === 'C') {
      if (value <= 0.4) {
        valoracion = "Bueno";
      }
      if (value > 0.4) {
        valoracion = "No_Aceptable";
      }
    } else {
      if (value <= 0.5) {
        valoracion = "Bueno";
      }
      if (value > 0.5 && value <= 0.8) {
        valoracion = "Regular";
      }
      if (value > 0.8) {
        valoracion = "No_Aceptable";
      }
    }
    return valoracion;
  },

  IRAP(value, red = null) {
    var valoracion = parseInt(value) + "_estrellas";
    return valoracion;
  }
}



module.exports = validation;