//jshint esversion:6

const express = require("express");
const ejs = require('ejs');
const bodyParser = require('body-parser'); //html parse
//const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public')); //static folders such as image,css

app.use(bodyParser.urlencoded({ extended: false }));

mongoose.set('useFindAndModify', false);
mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser : true,useUnifiedTopology: true});
const itemsSchema ={
  item : String
};
//mongos model based on schema.
const Item = mongoose.model("Item",itemsSchema);

//const items = ["Buy Food","Eat Food"];
const item1 = new Item({
  item : "Welcome to your to-do list."
})
const item2 = new Item({
  item : "Hit the + button to add new item."
})
const item3 = new Item({
  item : "<-- Hit this to delete an item."
})

const defaultItems = [item1,item2,item3];

const listSchema = {
  name : String,
  items: [itemsSchema]
}

const List = mongoose.model("List",listSchema);

app.get("/",function(req,res){

  //let day = date.getDate();
  Item.find({},function(err,itemFind){
if(itemFind.length === 0){
  Item.insertMany(defaultItems,function(err){
    if(err){
      console.log(err);
    }
    else{
      console.log("Successfully saved default items to DB.");
    }
  });
  res.redirect("/");
}
else{
  res.render("list", {listTitle : "Today", newListItems :itemFind});
}

  });
})

app.get("/:categoryName",function(req,res){
   const categoryName = _.capitalize(req.params.categoryName);
   List.findOne({name : categoryName},function(err,foundList){
     if(!err){
       if(!foundList){
        //Create a new list
           const list = new List({
             name : categoryName,
             items: defaultItems
           });
           list.save();
           res.redirect("/" + categoryName);
       }
       else{
        res.render("list", {listTitle : foundList.name, newListItems :foundList.items})
       }
     }
   });



});


app.post("/",function(req,res){

  const itemName = req.body.newItem;

  const listName = req.body.list;

  const item = new Item({
    item : itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name : listName}, function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);;
    })
  }




  //console.log(req.body);
// if(req.body.list === "Work" ){
//   workItems.push(item);
//   res.redirect("/work");
// }
// else{
//   items.push(item);
//   res.redirect("/");
// }

});

app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
const listName = req.body.listName;

if(listName === "Today"){
  Item.findByIdAndRemove(checkedItemId,function(err){
    if(!err){
      console.log("Successfully deleted checked item.");
      res.redirect("/");
    }
  });
}else{
        List.findOneAndUpdate({name : listName},{$pull: {items:{_id: checkedItemId} }},function(err,foundList){
          if(!err){
            res.redirect("/"+listName);
          }
        })
    }

});



app.get("/about",function(req,res){
  res.render("about");
});




app.listen(3000,function(){
  console.log("Server started on port 3000");
})
