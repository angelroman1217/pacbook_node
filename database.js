const mongoose = require('mongoose');

//const URI = 'mongodb://localhost:27017/pacbook_2022';
const URI = 'mongodb://pacbook:pacbookS3M1CM3X@52.71.135.145:27017/pacbook_v2';


    mongoose.connect(URI, {
      useMongoClient: true
    })
    .then(db => console.log('DB is connected'))
    .catch(err => console.log(err))

module.exports = mongoose;