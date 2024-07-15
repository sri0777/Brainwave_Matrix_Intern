const express = require('express');
const app = express();
const multer = require('multer');
app.set('view engine', 'ejs')
const session = require('express-session');
const cookie = require('cookie-parser');
app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: '123abc123',
    cookie: ({ maxAge: 24 * 60 * 60 * 1000 })
}))
app.use(express.static(__dirname + '/assets'));
app.use(express.urlencoded({ extended: false }))


const mongodb = require('mongodb');
const client = mongodb.MongoClient;
const ObjectId = require("mongodb").ObjectId;//to convert string to object id
let dbInstance;
client.connect("mongodb+srv://sri0777:2211981406@cluster777.abi0vyz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster777").then(database => {
    dbInstance = database.db('Blog');
    if (dbInstance) console.log("connected");
}).catch(err => {
    console.log(err);
})
app.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect('/blog');
    }
    else {
        res.render('login', { mes: "" });
    }
})
app.get('/signup', (req, res) => {
    res.render('signup', { mes: "" })
})

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
})
app.get('/addPost', (req, res) => {
    res.render('addPost', data = "");
})
app.get(['/', '/blog'], (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
    }
    else {
        dbInstance.collection('Products').find({}).toArray().then(data => {
            console.log(data);
            res.render('blog', { data: data, user: req.session.user });
        }).catch(err => {
            console.log(err);
        })
    }
})
app.get('/dashboard', (req, res) => {
    console.log(req.session.user.name);
    dbInstance.collection('Products').find({ user: req.session.user.name }).toArray().then(product => {
        res.render('dashboard', { data: product, user: req.session.user });
    }).catch(err => {
        console.log(err);
    })
})
app.get('/delete/:id', (req, res) => {
    dbInstance.collection('Products').deleteOne({ _id: new ObjectId(req.params.id) }).then(data => {
        res.redirect('/blog');
    }).catch(err => {
        console.log(err);
    })
})
app.get('/view/:id', (req, res) => {
    dbInstance.collection('Products').findOne({ _id: new ObjectId(req.params.id) }).then(data => {
        res.render('view', { data: data });
    }).catch(err => {
        console.log(err);
    })
})
app.get('/edit/:id', (req, res) => {
    const id = req.params.id;
    dbInstance.collection('Products').findOne({ _id: new ObjectId(id) }).then(data => {
        res.render('editPost', { data: data });
    }).catch(err => {
        console.log(err);
    })
})
app.post('/edit/:id', (req, res) => {
    const id = req.params.id;
    dbInstance.collection('Products').updateOne({ _id: new ObjectId(id) }, { $set: req.body }).then(() => {
        res.redirect('/blog');
    }).catch(err => {
        console.log(err);
    })
})
const storage = multer.diskStorage({
    destination: ((req, file, cb) => {
        cb(null, __dirname + '/assets');
    }),
    filename: ((req, file, cb) => {
        cb(null, Date.now() + file.fieldname + '.png');
    })
})
const filter = ((req, file, cb) => {
    let ext = file.mimetype.split('/')[1];//output is ['image','jpg']
    console.log(typeof ext); //string
    let extArray = ['jpg', 'txt', 'jpeg', 'png'];
    if (extArray.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error("Invalid Image type"), false);
    }
})
const upload = multer({ storage: storage, filefilter: filter, limits: ({ filesize: 10 * 1024 * 1024 }) })
app.post("/upload", upload.single("productImage"), (req, res) => {
    console.log(req.body);
    let obj = {
        product: req.body.productName,
        image: req.file.filename,
        description: req.body.productDescription,
        user: req.session.user.name
    };
    dbInstance.collection('Products').insertOne(obj).then(data => {
        res.redirect('/addPost');
    }).catch(err => {
        console.log(err);
    })
});
app.post('/login', (req, res) => {
    let user = req.body;
    dbInstance.collection('Credentials').findOne({ $and: [{ 'name': req.body.name }, { 'password': req.body.password }] }).then(data => {
        if (data == null) {
            res.render('login', { mes: "User Doesn't Exist" });
        }
        else {
            req.session.user = data;
            res.redirect('/blog');
        }
    })
})
app.post('/signup', (req, res) => {
    let user = req.body;
    dbInstance.collection('Credentials').findOne({ $and: [{ 'name': req.body.name }, { 'password': req.body.password }] }).then(data => {
        if (data != null) {
            res.render('signup', { mes: "User already exists" })
        }
        else {
            user.role = 'user';
            dbInstance.collection('Credentials').insertOne(user).then(resp => {
                res.redirect('/blog');
            }).catch(err => {
                console.log(err);
            })
        }
    })
})
app.listen(3000, (err) => {
    console.log("first server is running on port 3000");
})
