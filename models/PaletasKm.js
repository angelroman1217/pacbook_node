const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaletasKmSchema = new Schema({
    _id: Schema.ObjectId,
    tramo: { type: String },
    sentido: { type: Number },
    carril: { type: Number },
    cadReal: { type: String },
    cadGeo: { type: String },
    descripcion: { type: String }
    
});

const emp = mongoose.model('paletaskm', PaletasKmSchema);
module.exports= emp;