//const http = require('http');
const path = require('path');
const fs = require('fs');
const https = require('https');

//install express
//npm install --save express
const express = require('express');

//import admin data
const adminRoutes = require('./routes/admin');
//import shop routes
const shopRoutes = require('./routes/shop');

const authRoutes = require('./routes/auth');

const bodyParser = require('body-parser');

//npm install --save mongoose
const mongoose = require('mongoose');

//npm install --save express-session
const session = require('express-session');

//npm install --save connect-mongodb-session
const MongoDBStore = require('connect-mongodb-session')(session);

//npm install --save csurf
const csrf = require('csurf');

//npm install --save connect-flash
const flash = require('connect-flash');

// npm install --save multer
const multer = require('multer');

//npm install --save helmet
const helmet = require('helmet');

//npm install --save morgan
const morgan = require('morgan');

//npm install --save compression
const compression = require('compression');

const errorController = require('./controllers/error');

//const mongoConnect = require('./util/database').mongoConnect;

const User = require('./models/user');

const MONGODB_URI = 
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-7xgym.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const app = express();

const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

//initialize csrf protection
const csrfProtection = csrf();

//npm install --save ejs pug express-handlebars

// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname );
    }
});

const fileFilter = (req, file, cb) => {
    if ( file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

//set up the engine

//this is the default and would only have to be set if in another 
//folder that isn't named views, such as templates, etc
app.set('view engine', 'ejs');
app.set('views', 'views');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.get('/favicon.ico', (req, res) => res.status(204));

//import static ting
app.use(express.static(path.join(__dirname, 'public')));
//so we render images in the images folder
app.use('/images', express.static(path.join(__dirname, 'images')));

//register body parser
// npm install --save body-parser
app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));


//initialize session
app.use(session({ 
    secret: 'my secret', 
    resave: false, 
    saveUninitialized: false, 
    store: store 
}));

app.use(csrfProtection);

//initialize flash connect
app.use(flash());

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);


/* app.use('/', (req, res, next) => {
    console.log('this always runs');
    next(); //allows request to continue to next middlware in line
}); */

//const server = http.createServer(app);

//server.listen(3000);

app.get('/500', errorController.get500);

//404 page not found
app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.redirect('/500');
});

mongoose
    .connect(MONGODB_URI)
    .then(result => {
        app.listen(process.env.PORT || 3000);
        // https
        //     .createServer({ key: privateKey, cert: certificate }, app)
        //     .listen(process.env.PORT || 3000);
    })
    .catch(err => console.log(err));

/* mongoConnect(() => {
    app.listen(3000);
}); */
