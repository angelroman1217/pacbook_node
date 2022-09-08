const mongoose = require('mongoose');

const URI = 'mongodb://localhost:27017/pacbook_2022'

    mongoose.connect(URI, {
      useMongoClient: true
    })
    .then(db => console.log('DB is connected'))
    .catch(err => console.log(err))

module.exports = mongoose;