var SimpleFcm = require('./')

var fcm = new SimpleFcm('your-server-key')

var payload = {
    data: {
        doggie: 'Cane Corso',
        name: 'Abel'
    },
    condition: "'dogs' in topics",
    notification:{
        title: 'New Doggie! 🐕',
        body: 'A new dog was born! 😊' //yes, emojis work
    }
}

fcm.send(payload)
    .then(function (response) {
        console.log(response)
    })
    .catch( function(err){
        console.log(err)
    })
