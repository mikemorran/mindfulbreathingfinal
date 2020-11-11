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
    console.log(req.body.name);
    db.find({"name" : req.body.name}, (err, docs) => {
        console.log(docs);
        if (!docs[0]) {
            db.insert(req.body, (err, newDocs) => {
                if (err) {
                    res.json('failed');
                } else {
                    console.log("new user data added");
                    res.json({"task" : "success"});
                }
            });
        } else {
            db.update({"name" : req.body.name}, req.body, {multi: true}, (err, numReplaced) => {
                console.log("userData updated");
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
});

