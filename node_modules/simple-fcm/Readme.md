
# Simple FCM

A simple way to send firebase cloud messages to android/ios.

## Installation

```
$ npm install DarrylD/simple-fcm
```

## Example

```
var SimpleFcm = require('simple-fcm')

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
```

Note: [payload data from firebase](https://firebase.google.com/docs/cloud-messaging/http-server-ref)

# License

MIT
