const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CarreteraSchema = new Schema({
    _id: Schema.ObjectId,
    tramo: { type: String },
    carretera: { type: String },
    red: { type: String },
    clave_sct: { type: String }
    
});

const emp = mongoose.model('carreteras', CarreteraSchema);
module.exports= emp;