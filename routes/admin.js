var express = require("express");
const { route } = require("./users");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const { response } = require("express");

const verifyLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

/* GET users listing. */
router.get("/",verifyLogin, function (req, res, next) {
  let adminsession = req.session.admin;

  productHelpers.getAllProduct().then((products) => {
    console.log(products);
    res.render("admin/view-products", { admin: true, products,adminsession });
  });
});
router.get("/login", (req, res) => {
  if (req.session.admin) {
    res.redirect("/admin");
  } else {
    res.render("admin/admin-login", {admin:true, loginErr: req.session.adminLoginErr });
    req.session.adminLoginErr = false;
  }
});
// router.get("/admin-signup", (req, res) => {
//   res.render("admin/admin-signup");
// });
// router.post("/admin/admin-signup", (req, res) => {
//   productHelpers.doSignup(req.body).then((response) => {
//     console.log(response);
  
//     req.session.admin = response;
//     req.session.adminLoggedIn = true;
    
//     res.redirect("/admin");
//   });
// });

router.post("/admin/admin-login", (req, res) => {
  productHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
     
      req.session.admin = response.admin;
      req.session.adminLoggedIn = true;
      res.redirect("/admin");
    } else {
      req.session.adminLoginErr = "invalid emailid or password";
      res.redirect("/admin");
    }
  });
});
router.get("/logout", (req, res) => {
  
  req.session.admin=null
  req.session.adminLoggedIn=false
  res.redirect("/admin")
  
});
router.get("/add-product", verifyLogin,(req, res) => {
  res.render("admin/add-product",{admin: true,adminsession: req.session.admin});
});
router.post("/add-product",verifyLogin, (req, res) => {
  console.log(req.body);
  console.log(req.files.image);

  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image;
    console.log(id);
    
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-product",{admin: true,adminsession: req.session.admin});
      } else {
        console.log(err);
      }
    });
  });
});

router.get("/delete-product/:id", (req, res) => {
  let prodId = req.params.id;
  console.log(prodId);
  productHelpers.deleteProduct(prodId).then((response) => {
    res.redirect("/admin");
  });
});

router.get("/edit-product/:id",verifyLogin, async (req, res) => {
  let prodId = req.params.id;
  let product = await productHelpers.getProductDetails(prodId); //.then vachum edukam.normsl cheyunapole
  console.log(product);
  res.render("admin/edit-product", { product,admin: true,adminsession: req.session.admin });
});

router.post("/edit-product/:id", (req, res) => {
  let prodId = req.params.id;
  productHelpers.updateProduct(prodId, req.body).then(() => {
    res.redirect("/admin");
    if (req.files.image) {
      let image = req.files.image;
      image.mv("./public/product-images/" + prodId + ".jpg");
    }
  });
});
module.exports = router;
