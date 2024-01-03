const express = require('express');
const cors = require('cors')
const app =express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000

require('dotenv').config()

//middleware
app.use(cors())
app.use(express.json())
console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fpdogwm.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
   

    //all database collection
   const userCollection = client.db("localeFoodDB").collection("users")
   const productCollection = client.db("localeFoodDB").collection("products")



  //jwt related api
  app.post('/jwt',async(req,res)=>{
    const user =req.body
    const token =jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'24h'})
    res.send({token})
  })

  //verify token milldlewares

  const verifyToken =(req,res,next)=>{
    console.log('inside verfiy token',req.headers);
    if(!req.headers.authorization){
      return res.status(401).send({message: 'forbidden access'})
    }
    const token = req.headers.authorization.split(' ')[1]
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
      if(err){
        return res.status(401).send({message: 'forbidden access'})
      }
      req.decoded =decoded
      next()
    })
  }

   //users related api
   app.post('/users',async(req,res)=>{
    const user= req.body;
    //insert email if user does not exist
    const query = {email: user.email}
    const existingUser = await userCollection.findOne(query)
    if(existingUser){
      return res.send({message: 'user already exist',insertedId:null})
    }
    const result = await userCollection.insertOne(user)
    res.send(result)
   })

///vendor list
   app.get('/users/vendor',async(req,res)=>{
    const roll=req.query.roll
    const query = {roll: roll}
    const result =await userCollection.find(query).toArray()
    res.send(result)
  })
  
//customer list
app.get('/users/customer',async(req,res)=>{
  const roll=req.query.roll
  const query = {roll: roll}
  const result =await userCollection.find(query).toArray()
  res.send(result)
})

//admin list
app.get('/users/admin',verifyToken,async(req,res)=>{
  const roll=req.query.roll
  const query = {roll: roll}
  const result =await userCollection.find(query).toArray()
  res.send(result)
})
//delete admin
app.delete('/users/admin/:email', async(req,res)=>{
  const email = req.params.email
  const query= {email: email}
  const result = await userCollection.deleteOne(query)
  res.send(result)
})

 //delete vendor data

app.delete('/users/vendor/:email',async(req,res)=>{
  const email = req.params.email
  const query= {email: email}
  const result = await userCollection.deleteOne(query)
  res.send(result)
})

//admin made api
app.patch('/users/admin/:id',async(req,res)=>{
  const id = req.params.id
  const filter= {_id: new ObjectId(id)}
const updatedDoc ={
$set:{
  roll: 'admin'
}
}
const result = await userCollection.updateOne(filter,updatedDoc)
res.send(result)
})

//check admin
app.get('/users/admin/:email',verifyToken,async(req,res)=>{
  const email =req.params.email
  if(email!==req.decoded.email){
    return res.status(403).send({message:'unauthorized access'})
  }
  const query={email:email}
  const user =await userCollection.findOne(query)
  let admin=false
  if(user){
    admin=user?.roll==='admin'
  }
  res.send({admin})
})


//check vendor
app.get('/users/vendor/:email',async(req,res)=>{
  // console.log(req.headers);
  const email =req.params.email
  // if(email!==req.decoded.email){
  //   return res.status(403).send({message:'unauthorized access'})
  // }
  const query={email:email}
  const user =await userCollection.findOne(query)
  let vendor=false
  if(user){
    vendor=user?.roll==='vendor'
  }
  res.send({vendor})
})

//delete products by vendor
  app.delete('/products/:id',async(req,res)=>{
    const id = req.params.id
    const query= {_id: new ObjectId(id)}
    const result = await productCollection.deleteOne(query)
    res.send(result)
  })







 //delete customer data

app.delete('/users/customer/:email',async(req,res)=>{
  const email = req.params.email
  const query= {email: email}
  const result = await userCollection.deleteOne(query)
  res.send(result)
})



  //update vendor
    app.patch('/users/email/:email', async (req, res) => {
    try {
      const email = req.params.email;
  
      
      const filter = { email: email };
     console.log(email);
     console.log(filter);
     
      const dataToUpdate = {
        shop: req.body.shop,
        date: req.body.date,
        address: req.body.address,
        phone: req.body.phone,
        image: req.body.image,
        roll: req.body.roll,
        // add other fields here if needed
      };
    console.log(dataToUpdate);
      const updateDoc = {
        $set: dataToUpdate,
      };
  
      
      const result = await userCollection.updateOne(filter, updateDoc);
  
      res.send(result);
    } catch (error) {
      console.error('Error updating badge:', error);
      res.status(500).send('Internal Server Error');
    }
  });


   //email specific user info
   app.get('/users/info', async (req, res) => {
    try {
      const email = req.query.email;
      const query = { email: email };
      const result = await userCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  //products related api
  app.post('/products',async(req,res)=>{
    const product =req.body
    const result = await productCollection.insertOne(product)
    res.send(result)
  })


   //email specific vendor product list
   app.get('/products/vendor',async(req,res)=>{
    try {
      const email = req.query.email;
      const query = { email: email };
      const result = await productCollection.find(query).sort({ createdAt: -1 }).toArray();
      console.log(result);
      res.send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
   })


  //roll specific customer for admin
  // app.get('/users/allCustomers',async(req,res)=>{
  //   try {
  //     const roll = req.query.roll;
  //     const query = { roll: roll };
  //     const result = await usersCollection.find(query).toArray();
  //     console.log(result);
  //     res.send(result);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send('Internal Server Error');
  //   }
  //  })









    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);















app.get('/',(req,res)=>{
  res.send('flavour food server is running')
})

app.listen(port,()=>{
  console.log(`server is running on PORT: ${port}`);
})

