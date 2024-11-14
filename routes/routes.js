const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs = require('fs');

//image upload
var storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./uploads')//uploaded all photos automatically save into upload folder
    },
    filename: function(req,file,cb){
        cb(null,file.fieldname+"_"+Date.now()+"_"+file.originalname);
    },
})

var upload = multer({
    storage:storage,
}).single("image");

//Insert an user into datacase route
router.post('/add',upload,async(req,res)=>{
    const user = new User({
        name: req.body.name,
        email:req.body.email,
        phone: req.body.phone,
        image:req.file.filename,
    });
    try {
        await user.save(); // Using async/await instead of callback
        req.session.message = {
            type: 'success',
            message: 'User added successfully'
        };
        res.redirect("/");
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

//get all user route
router.get('/', async (req, res) => {
    try {
        const users = await User.find(); // Use await instead of exec() with a callback
        res.render('index', {
            title: 'Home',
            users: users,
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});

router.get("/add",(req,res)=>{
    res.render("add_users",{title:"Add users"});
})
//Edit an user router
router.get('/edit/:id', async (req, res) => {
    let id = req.params.id;
    try {
        const user = await User.findById(id); // Await the result of the query
        if (!user) {
            // If user is not found
            return res.redirect('/');
        }
        res.render('edit_user', {
            title: 'Edit User',
            user: user,
        });
    } catch (err) {
        // Handle errors (e.g., invalid ID format)
        res.redirect('/');
    }
});
//update user route
router.post('/update/:id',upload,async(req,res)=>{
    let id = req.params.id;
    let new_image = '';

    if(req.file){
        new_image = req.file.filename;
        try{
            fs.unlinkSync('./uploads'+req.body.old_image)
        }catch(err){
            console.log(err);

        }
    }else{
        new_image = req.body.old_image;
    }

    try {
        await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        });
        req.session.message = {
            type: 'success',
            message: 'User Updated Successfully',
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
    
});

//delete User route
router.get('/delete/:id', async (req, res) => {
    let id = req.params.id;
    try {
        const result = await User.findByIdAndDelete(id); // Use findByIdAndDelete instead of findByIdAndRemove
        if (result && result.image) {
            // If an image exists, attempt to delete the file
            try {
                fs.unlinkSync('./uploads/' + result.image);
            } catch (err) {
                console.log('Error deleting image file:', err);
            }
        }
        req.session.message = {
            type: 'info',
            message: 'User deleted successfully',
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message });
    }
});
module.exports = router;