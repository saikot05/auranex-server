const express = require('express');
const cors = require('cors');
const app = express();

require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('AuraNex Server is running');
});


const uri = process.env.MONGO_DB_URI;

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


        const database = client.db("auranex_db");
        const appointmentsCollection = database.collection("appointments");


        //patient related api
        app.get('/api/appointments/patient/:email', async(req, res) => {
            const email = req.params.email;
            const query = { patientEmail: email };
            const result = await appointmentsCollection.find(query).toArray();
            res.send(result);
        })

        app.patch('/api/appointments/cancel/:id', async(req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { status: 'canceled' },
            };
            const result = await appointmentsCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        app.patch('/api/appointments/reschedule/:id', async(req, res) => {
            const id = req.params.id;
            const { newDate } = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    date: newDate,
                    status: 'pending'
                },
            };
            const result = await appointmentsCollection.updateOne(filter, updateDoc);
            res.send(result);
        });



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error("Database connection error:", error);
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`AuraNex app listening on port ${port}`);
});