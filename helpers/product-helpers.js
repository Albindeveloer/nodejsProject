var db = require("../config/connection");
var collection = require("../config/collections");
const { PRODUCT_COLLECTION } = require("../config/collections");
const { response } = require("express");
var objectID = require("mongodb").ObjectID;
module.exports = {
  addProduct: (product, callback) => {
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
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
};
