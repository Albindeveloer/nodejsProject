var db = require("../config/connection");
var collection = require("../config/collections");
const { PRODUCT_COLLECTION } = require("../config/collections");
const { response } = require("express");
const bcrypt = require("bcrypt");
var objectID = require("mongodb").ObjectID;
module.exports = {
  addProduct: (product, callback) => {
    product.totalQuantity = parseInt(product.totalQuantity);
    if(product.totalQuantity<=0){                                      //totalQuantity and availability for know outofstock or not.myworkann
      product.availability=true
    }else{
      product.availability=false
    }
    console.log(product);
    db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .insertOne(product)
      .then((data) => {
        callback(data.ops[0]._id);
      });
  },

  getAllProduct: () => {
    return new Promise((resolve, reject) => {
      let products = db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .removeOne({ _id: objectID(prodId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getProductDetails: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectID(prodId) })
        .then((product) => {
          resolve(product);
        });
    });
  },
  updateProduct: (prodId, proDetails) => {
    proDetails.totalQuantity = parseInt(proDetails.totalQuantity);
    if(proDetails.totalQuantity<=0){                                      //totalQuantity and availability for know outofstock or not.myworkann
      proDetails.availability=true
    }else{
      proDetails.availability=false
    }
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectID(prodId) },
          {
            $set: {
              name: proDetails.name,
              category: proDetails.category,
              price: proDetails.price,
              description: proDetails.description,
              totalQuantity:proDetails.totalQuantity,
              availability:proDetails.availability
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  doSignup: (adminData) => {
    return new Promise(async (resolve, reject) => {
      adminData.password = await bcrypt.hash(adminData.password, 10);
      db.get()
        .collection(collection.ADMIN_COLLECTION)
        .insertOne(adminData)
        .then((data) => {
          resolve(data.ops[0]);
        });
    });
  },

  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      
      let loginStatus = false;
      let response = {};

      let admin = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ email: adminData.email });
      if (admin) {
        bcrypt.compare(adminData.password, admin.password).then((status) => {
          if (status) {
            console.log("login success");
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            console.log("login failed in crrt psw");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed inncorrect email");
        resolve({ status: false });
      }
    });
  },
};
