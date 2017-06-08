const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const {catchErrors} = require('../handlers/errorHandlers');

// Do work here

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', storeController.addStore);
router.post('/add/:id',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore));

router.post('/add',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.createStore));
router.get('/stores/:id/edit', catchErrors(storeController.editStore));


router.get('/store/:slug', catchErrors(storeController.getStorebySlug));
router.get('/tags', catchErrors(storeController.getStorebyTag));
router.get('/tags/:tag', catchErrors(storeController.getStorebyTag));

router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);


// 1) Need to validate the register form
// 2) register the user
// 3) we need to log them

router.post('/register', userController.validateRegister);


module.exports = router;
