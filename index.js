// Initialize express
let express = require('express');
let app = express();
app.use('/', express.static('public'));

// Initialize body-parser
let bodyParser = require('body-parser');
app.use(bodyParser.json());

// Initialize nedb
let Datastore = require('nedb');
let db = new Datastore('breathData.db');
db.loadDatabase();


// Initialize http
let http = require('http');
let server = http.createServer(app);
let port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log('Server listening at port: ' + port);
});

app.get('/getBreaths/:user', (req, res) => {
    let userName = req.params.user
    console.log(userName);
    db.find({"name" : userName}, (err, docs) => {
        if (err) {
            res.json({"task" : "failed"});
        } else {
            let obj = {data : docs};
            res.json(obj);
        }
    });
});

// Process GET requests for Client data initialization
app.get('/getBreaths', (req, res) => {
    db.find({}, (err, docs) => {
        if (err) {
            res.json({"task" : "failed"});
        } else {
            let obj = {data : docs};
            res.json(obj);
        }
    });
});

// Process POST requests and insert data whenever a user completes a breath
app.post('/sendBreaths', (req, res) => {
    console.log(req.body);
    db.find({"name" : req.body.name}, (err, docs) => {
        // console.log(docs);
        if (!docs[0]) {
            db.insert(req.body, (err, newDocs) => {
                if (err) {
                    res.json('failed');
                } else {
                    console.log("new user data added");
                    res.json({"task" : "success"});
                }
                db.persistence.compactDatafile();
            });
        } else {
            console.log({"name" : req.body.name})
            let jsonQuery = JSON.stringify({"name" : req.body.name});
            console.log(jsonQuery);
            db.update({"name" : req.body.name}, req.body, {}, (err, numReplaced, upsert) => {
                if (err) {
                    console.log("error");
                    res.json('failed');
                } else {
                    res.json({"task" : "success"});
                }
                console.log(numReplaced, upsert);
                db.persistence.compactDatafile();
            });
        }
    })
    
});

// Initialize Socket
let io = require('socket.io').listen(server);

// Listen for Individual Connection
io.sockets.on('connection', function(socket) {
    console.log ('New client: ' + socket.id);
    
    socket.on('msg', function(newBreaths) {
        // console.log(userObject);
        socket.broadcast.emit('msg', newBreaths);
    });

    socket.on('bet', function(bet) {
        // console.log(bet);
        socket.broadcast.emit('bet', bet);
    });

    socket.on('challengeAccepted', function(challengeObject) {
        console.log(challengeObject);
        io.sockets.emit('challengeAccepted', challengeObject);
    });

    socket.on('bettingOver', function(scoreObject) {
        console.log(scoreObject);
        socket.broadcast.emit('bettingOver', scoreObject);
    });
});

// db.remove({"_id":"Atuf9xwlq4dTrVWk"}, {}, function (err, numRemoved) {
//     // numRemoved = 1
//   });