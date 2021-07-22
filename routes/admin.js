var express = require("express");
const { route } = require("./users");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const { response } = require("express");
/* GET users listing. */
router.get("/", function (req, res, next) {
  productHelpers.getAllProduct().then((products) => {
    console.log(products);
    res.render("admin/view-products", { admin: true, products });
  });
});

router.get("/add-product", (req, res) => {
  res.render("admin/add-product");
});
router.post("/add-product", (req, res) => {
  console.log(req.body);
  console.log(req.files.image);

  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image;
    console.log(id);
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-product");
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

router.get("/edit-product/:id", async (req, res) => {
  let prodId = req.params.id;
  let product = await productHelpers.getProductDetails(prodId); //.then vachum edukam.normsl cheyunapole
  console.log(product);
  res.render("admin/edit-product", { product });
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
