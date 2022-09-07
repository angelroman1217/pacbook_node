const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HistoSchema = new Schema({
    _id: Schema.ObjectId,
    tramo: { type: String },
    sentido: { type: Number },
    carril: { type: Number },
    cad_de_num: { type: String },
    de_cad_geo: { type: String }
    
});

const emp = mongoose.model('historial', HistoSchema, 'historial');
module.exports= emp;