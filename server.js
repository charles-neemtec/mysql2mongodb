var db = require('./Mysql2Mongo');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/public');
app.set('port', (process.env.PORT || 2000));

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    res.render('index');
});

app.post('/mysql/connect', function (req, res) {
    var body = req.body;
    var source = db.newDataSource(body.host, body.port, body.user, body.password, body.database);
    db.setSource(source);

    db.connectSource(function (err) {
        if (err) {
            res.send("Error in database connection");
        } else {
            res.send('success');
        }
    });
});

app.post('/mongodb/connect', function (req, res) {
    var body = req.body;
    var config = db.newDataSource(body.host, body.port, body.user, body.password, body.database);
    config.type = 'mongodb';
    db.setConfig(config);

    db.connectDestination(function (err) {
        if (err) {
            res.send("Error in database connection");
        } else {
            res.send('success');
        }
    });
});

function processListPage(res) {
    db.getSourceTables(function (rows, err) {
        if (err) {
            res.send(err);
        } else {
            res.render('list', {result: rows});
        }
    });
}

var tables = [];
app.get('/mongodb/migrate', function (req, res) {
    db.migrate(function (data) {
        tables.push(data);
    });
    res.send('ok');
});

app.get('/:source', function (req, res) {
    switch (req.params.source) {
        case 'list':
            processListPage(res);
            break;
        case 'status':
            res.send({tables: tables});
            break;
        default:
            res.render(req.params.source);
    }
});

app.post('/:source', function (req, res) {
    var body = req.body;
    var page = req.params.source;

    switch (page) {
        case 'summary':
            var data = body.table instanceof Array ? body.table : [body.table];
            db.setTables(data);
            break;
    }
    res.render(page, {data: data});
});

app.listen(app.get('port'), function () {
    console.log('Server started');
});
