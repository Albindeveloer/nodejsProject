function addToCart(proId) {
  $.ajax({
    url: "/add-to-cart/" + proId,
    method: "get",
    success: (response) => {
      if (response.status) {
        let count = $("#cart-count").html();
        console.log(typeof count);
        count = parseInt(count) + 1; //string to integer akkan
        console.log(typeof count);
        $("#cart-count").html(count);
      }
    },
  });
}

function changeQuantity(cartId, proId,userId, count) {
  let quantity = parseInt(document.getElementById(proId).innerHTML);
  $.ajax({
    url: "/change-product-quantity",
    data: { user:userId, cart: cartId, product: proId, count: count, quantity: quantity },
    method: "post",
    success: (response) => {
      if (response.removeProduct) {
        alert("prduct removed from cart");
        location.reload();
      } else {
        document.getElementById(proId).innerHTML = quantity + count;
        console.log(response.total)
        document.getElementById("total").innerHTML=response.total
      }
    },
  });
}

function removeProduct(cartId, proId) {
  $.ajax({
    url: "/remove-product",
    data: { cart: cartId, product: proId },
    method: "post",
    success: (response) => {
      if (response.removeProduct) {
        alert("Are u sure to remove product from cart");
        location.reload();
      }
    },
  });
}
