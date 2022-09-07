var express = require('express');
var router = express.Router();

var Rang = {
  getWidthTDP(value) {
    var width = 1;
    switch (value) {
      case value >= 1 && value <= 500:
        width = 1;
        break;
      case value > 500 && value <= 1000:
        width = 2;
        break;
      case value > 1000 && value <= 1500:
        width = 3;
        break;
      case value > 1500 && value <= 2000:
        width = 4;
        break;
      case value > 2000 && value <= 2500:
        width = 5;
        break;
      case value > 2500 && value <= 3000:
        width = 6;
        break;
      case value > 3000 && value <= 4000:
        width = 7;
        break;
      case value > 4000 && value <= 5000:
        width = 8;
        break;
      case value > 5000 && value <= 6000:
        width = 9;
        break;
      case value > 6000 && value <= 8000:
        width = 10;
        break;
      case value > 8000 && value <= 10000:
        width = 11;
        break;
      case value > 10000 && value <= 15000:
        width = 12;
        break;
      case value > 15000 && value <= 20000:
        width = 13;
        break;
      case value > 20000 && value <= 25000:
        width = 14;
        break;
      case value > 25000 && value <= 30000:
        width = 15;
        break;
      case value > 30000:
        width = 16;
        break;
    }

    return width;
  }
}



module.exports = Rang;