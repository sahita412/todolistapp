//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config()

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose.connect('mongodb+srv://admin:Test123@cluster0.jtpkulk.mongodb.net/todolistDB');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

const itemsSchema = {
  name:String
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "welcome to your todo list"
});

const item2 = new Item({
  name: "Add + button to add an item."
});

const item3 = new Item({
  name: "<-- Hit this to delete me."
});

const defaultItems = [item1,item2,item3]; 


const listSchema = {
  name: String,
  items: [itemsSchema]
}
const List = mongoose.model("List", listSchema);
 

app.get("/", function(req, res) {
  
  console.log(process.env);
  Item.find({}).then(function(foundItems,err){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems);
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName}).then(function(foundList,err){
      if(foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName);
      }
      else{
        console.log(err);
      }
    });
  }
});

app.post("/delete", function(req,res){
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedId).then(res.redirect("/"));
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedId}}}).then(()=>{
      res.redirect("/"+listName);
    });
  }

});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName); 
  
  List.findOne({name: customListName}).then(function(foundList){
    if(foundList){
      //list exists
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items })
    }
    else{
      //new list is created
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/"+customListName);
    }
  } );
});

app.get("/about", function(req, res){
  res.render("about");
});


connectDB().then(() => {
  app.listen(PORT, () => {
      console.log("listening for requests");
  });
});
// app.listen(3000, function() {
//   console.log("Server started on port 3000");
// });
