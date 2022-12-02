const express= require('express')
const app= express()
const cors= require('cors')
const jwt= require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port= process.env.PORT || 5000
app.use(cors())
app.use(express.json())

console.log(process.env.DB_USER);




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.sayatpw.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT( req, res, next){
  const authHeader= req.headers.authorization
  if(!authHeader){
    return res.status(401).send({message : 'unauthorized access'})
  }

    const token= authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){

      if(err){
        return res.status(401).send({message : 'unauthorized access'})
      }
      req.decoded= decoded
      next()
    })
  
}


async function run (){
   try{
     const serviceCollection= client.db('geniusCar').collection('services')
     const orderCOllection= client.db('geniusCar').collection('orders')
      
     app.post('/jwt' , (req, res)=>{
         const user= req.body
         const token= jwt.sign(user, process.env.ACCESS_TOKEN ,{expiresIn : '1h'})
         res.send({token})
     })


     app.get('/services' , async (req, res)=>{
       const query= {}
       const cursor= serviceCollection.find(query)
       const services= await cursor.toArray()
       res.send(services)
     })

     app.get('/services/:id',  async(req, res)=>{
      const id= req.params.id
      const query={_id: ObjectId(id)}
      const service= await serviceCollection.findOne(query)
      res.send(service)


     })

    //  order api>>>>>>>

    app.get('/orders',verifyJWT,  async(req, res)=>{
    
      const decoded= req.decoded
      console.log('inside', decoded);
      if(decoded.email !== req.query.email ){
        return res.status(403).send({message : 'unauthorized access'})
      }
           
      let query= {}
      
      if(req.query.email){
        query={
          email: req.query.email
        }
      }

      const cursor= orderCOllection.find(query)
      const order= await cursor.toArray()
      res.send(order)
    })

    app.post('/orders' , async(req, res)=>{
          const order= req.body
          const result= await orderCOllection.insertOne(order)
          res.send(result)
    })

    app.patch('/orders/:id', async(req, res)=>{
      const id = req.params.id
      const status= req.body.status
      const query= {_id : ObjectId(id)}
      const updateDoc ={
        $set :{
          status : status
        }
      }
      const result= await orderCOllection.updateOne(query, updateDoc)
      res.send(result)
    })

    app.delete('/orders/:id', async(req, res)=>{
      const id = req.params.id
      const query= {_id : ObjectId(id)}
      const result= await orderCOllection.deleteOne(query)
      res.send(result)
    })




   }

   finally{

   }
}


run().catch(e=>console.error(e))



app.get('/', (req, res)=>{
    res.send('genius car')
})












app.listen(port, ()=>{
    console.log(`server running ${port}`);
})