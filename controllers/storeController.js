const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');


const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next){
        const isPhoto = file.mimetype.startsWith('image/');

        if (isPhoto) {
            next(null, true);
        } else {
            next({message: 'That filetype isn\'t allowed'}, false);
        }
    }
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    if (!req.file) {
        next(); //skip to the next middleware

    }

    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;

    // now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    //once we have written our photo  to our filesystem continue
    next();

};


exports.homePage = (req, res) => {
    res.render('index', {title: 'home'});
};

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add Store'});
};

exports.createStore = async (req, res) => {

    req.body.author = req.user._id;
    console.log(req.body.author);
    const store = await (new Store(req.body)).save();

    req.flash('success', `Succesfully created ${store.name}`);

    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {

    //1. Query the database for a list of stores

    const stores = await Store.find();

    res.render('stores', {title: "Stores", stores})

};


const confirmOwner = (store, user) => {
    console.log(user);
    if (!store.author.equals(user._id)) {
        throw Error('You must own a store before you Edit it!');
    }
};


exports.editStore = async (req, res) => {



//    1. find the store given the id
    const store = await Store.findOne({_id: req.params.id});


//    2. confirm they are the owner of the store
    confirmOwner(store, req.user);
//    3. render out the form so the user can update their store
    res.render('editStore', {title: `Edit ${store.name}`, store});

};

exports.updateStore = async (req, res) => {

    // set the location data to be a point

    req.body.location.type = 'Point';

    //find and update the store

    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body,
        {
            new: true, // return the new store instead of the old one
            runValidators: true
        }).exec();


    req.flash('success', `Successfully updated <strong>${store.name}</strong>.<a href="/stores/${store.slug}">View Store -></a> `)
    //    redirect them to the store and tell them it worked
    res.redirect(`/stores/${store.id}/edit`)
};

exports.getStorebySlug = async (req, res, next) => {
    const store = await Store.findOne({slug: req.params.slug}).populate('author');

    if (!store) return next();

    res.render('store', {store, title: store.name});

};


exports.getStorebyTag = async (req, res) => {

    const tag = req.params.tag;
    const tagquery = tag || {$exists: true};

    const tagsPromise = Store.getTagsList();
    const storePromise = Store.find({tags: tagquery});

    const [tags, stores] = await Promise.all([tagsPromise, storePromise]);


    res.render('tags', {tags, title: 'Tags', tag, stores})

};

exports.searchStores = async (req, res) => {
    const stores = await Store.//first find stores  that match
    find({
        $text: {
            $search: req.query.q,

        }
    }, {
        score: {$meta: 'textScore'}
    }).//then sort them
    sort({
        score: {$meta: 'textScore'}
    })
    //then limit it
        .limit(5);
    res.json(stores);

};

exports.mapStores = async (req,res)=>{
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);

    const q = {

        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 10000
            }
        }
    };
    const  stores = await Store.find(q).select('slug name description location photo').limit(10);
    res.json(stores);

};


exports.mapPage = async (req,res)=>{
  res.render('map', {title: 'Map'});
};


exports.heartStore = async (req,res) =>{
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user =  await User.findByIdAndUpdate(
    req.user._id,
      {[operator] : {hearts: req.params.id}},
      {new:true}
  );

 res.json(user);

};