var mysql = require("mysql");
var inquirer = require("inquirer");
var item = 0;
var quantity = 0;
var dbQuantity = 0;

var connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "root",
  database: "bamazon_db"
});

connection.connect(function(err) {
  if (err) throw err;
  // console.log("connected as id " + connection.threadId + "\n"); //remember to comment this out
  showProducts();
});

function showProducts() {
  console.log("Selecting all products...\n");
  console.log("WELCOME TO BAMAZON MARKETSPACE!\n");
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    // Log all results of the SELECT statement
    for (var i = 0; i < res.length; i++) {
      console.log(`${res[i].product_name.toString()}\nItem ID: ${res[i].item_id}\n$${res[i].price}\nCurrent stock: ${res[i].stock_quantity}\n--------------------`);
    }
    transaction();
  });
  
}

function transaction() {
  inquirer.prompt([
    {
        type: "input",
        message: "Which item would you like to purchase? Please enter the Item ID.",
        name: "product"
    },
    {
        type: "input",
        message: "How many would you like?",
        name: "quantity"
    }
  ]).then(function(userInput) {
      item = userInput.product;
      quantity = userInput.quantity;
      connection.query(`SELECT * FROM products WHERE item_id=${parseInt(item)}`, function(err, res) {
        if (err) throw err;
        dbQuantity = res[0].stock_quantity;
        if (quantity <= dbQuantity) {
          var total = (quantity * res[0].price).toFixed(2);
          inquirer.prompt([
            {
                type: "confirm",
                message: `${quantity} ${res[0].product_name}(s) added to cart!\nYour current total is $${total}\nConfirm purchase?\n`,
                name: "confirm"
            }
          ]).then(function(userConfirm) {
            if (userConfirm.confirm) {
              console.log('Processing payment...\nPayment successful\nPurchase confirmed!\n');
              updateInventory();
            }
            else {
              transaction();
            }
          })
        }
        else {
          console.log(`Sorry, we do not have ${quantity} ${res[0].product_name}(s) in stock...\n`);
          transaction();
        }
      })
  })
}

function updateInventory() {
  connection.query(
    "UPDATE products SET ? WHERE ?",
    [
      {
        stock_quantity: dbQuantity-quantity
      },
      {
        item_id: item
      }
    ],
    function(err, res) {
      if (err) throw err;
      showProducts();
    })
};