var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
var objectID = require("mongodb").ObjectID;
const productHelpers = require("./product-helpers");
const { response } = require("express");

const Razorpay=require("razorpay");
const { resolve } = require("path");
var instance = new Razorpay({
  key_id: 'rzp_test_YHAW7E0bY9Fl9U',
  key_secret: 'TMoT53mn8wO9LB7ZVynVFsj3',
});

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data.ops[0]);
        });
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};

      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            console.log("login success");
            response.user = user;
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
  addToCart: (prodId, userId) => {
    let proObj = {
      item: objectID(prodId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectID(userId) });
      console.log(userCart);
      console.log(prodId);
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == prodId
        );
        console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectID(userId), "products.item": objectID(prodId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectID(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectID(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectID(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  GetCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectID(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectID(details.cart) },
            {
              $pull: { products: { item: objectID(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectID(details.cart),
              "products.item": objectID(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({status:true});
          });
      }
    });
  },

  removeProduct: (details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: objectID(details.cart) },
          {
            $pull: { products: { item: objectID(details.product) } },
          }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    });
  },

  getTotalAmount:(userId)=>{
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectID(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group:{
              _id:null,
              total:{$sum:{$multiply:["$quantity",{$convert:{input:'$product.price',to:'int'}}]}}
            }
          }
        ])
        .toArray();
        console.log(total[0].total)
      resolve(total[0].total);
    });
  },

  placeOrder:(order,products,total)=>{
    return new Promise((resolve,reject)=>{
      console.log(order,products,total)
      let status=order["payment-method"]==='COD'?'placed':'pending';
      let orderObj={
        deliveryDetails:{
          mobile:order.mobile,
          address:order.address,
          pincode:order.pincode
        },
        userId:order.userId,
        paymentMethod:order["payment-method"],
        products:products,
        totalAmount:total,
        status:status,
        date:new Date()
      }

      db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
        db.get().collection(collection.CART_COLLECTION).removeOne({user:objectID(order.userId)})
        console.log("orderid is:",response.ops[0]._id)
        resolve(response.ops[0]._id)
      })
    })
  },
  getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectID(userId)})
      resolve(cart.products)
    })
  },
  getUserOrders:(userId)=>{
    
    return new Promise(async(resolve,reject)=>{
      console.log(userId);
      let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:userId}).toArray()
      console.log(orders);
      resolve(orders)
    })
  },
  getOrderProducts:(orderId)=>{
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectID(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
        console.log(orderItems);
      resolve(orderItems);
    });
  },

  generateRazorpay:(orderId,total)=>{
    return new Promise((resolve,reject)=>{
      var options = {
        amount: total*100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: ""+orderId
      };
      instance.orders.create(options, function(err, order) {
        if(err){
          console.log(err)
        }else{
          console.log("new order",order);
          resolve(order)
        }
        
      });
    })
  },

  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto = require("crypto");
      let hmac=crypto.createHmac('sha256','TMoT53mn8wO9LB7ZVynVFsj3')

      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
      hmac=hmac.digest('hex')
      if(hmac==details['payment[razorpay_signature]']){
        resolve()
      }else{
        reject()
      }
    })
  },

  changeOrderStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.ORDER_COLLECTION)
      .updateOne({_id:objectID(orderId)},
      {
        $set:{
          status:"placed"
        }
      }).then(()=>{
        resolve()
      })
    })
  },


  
};

