const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImagenesSchema = new Schema({
    _id: Schema.ObjectId,
    tramo: { type: String },
    sentido: { type: Number },
    cadReal: { type: String },
    cadGeo: { type: String },
    imgCen: { type: String },
    imgDer: { type: String },
    imgIzq: { type: String },
    imgLatDer: { type: String },
    imgTras: { type: String }    
});

const emp = mongoose.model('imagenes', ImagenesSchema, 'imagenes');
module.exports= emp;