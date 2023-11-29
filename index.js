const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.imeoc20.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const Survey = require('./surveyModel');
const surveyRoutes = require('./surveyRoutes');

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const userCollection = client.db("surveyMaster").collection("users");
        const reviewCollection = client.db("surveyMaster").collection("reviews");
        const surveyCollection = client.db("surveyMaster").collection("surveys");

        // JWT related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            })
            res.send({ token });
        });

        // JWT middlewares (verify token)
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
        }

        // verify admin 
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

        // post user to the database
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });


        // get user from database
        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        })


        app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
            try {
                const id = req.params.id;
                const { role } = req.body; // Extract the role from the request body
                const filter = { _id: new ObjectId(id) };
                const updatedDoc = {
                    $set: {
                        role: role // Set the role to the one received from the request body
                    }
                }
                const result = await userCollection.updateOne(filter, updatedDoc);
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: 'Error updating user role' });
            }
        });

        app.get('/users/surveyor/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let surveyor = false;
            if (user) {
                surveyor = user?.role === 'surveyor';
            }
            res.send({ surveyor });
        })


        // delete user
        app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });


        // get reviews from database
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        });

        // Get all surveys
        app.get('/surveys', async (req, res) => {
            try {
                const surveys = await surveyCollection.find().toArray();
                res.json(surveys);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

       
        // Create a new survey
        app.post('/surveys', verifyToken, async (req, res) => {
            try {
                const surveyData = req.body; // Assuming the request body contains survey details
                // Add timestamp to the survey data
                surveyData.timestamp = new Date().toISOString();

                const result = await surveyCollection.insertOne(surveyData);
                res.status(201).json(result);
            } catch (error) {
                res.status(400).json({ message: error.message });
            }
        });


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// Use the survey routes
app.use('/surveys', surveyRoutes);

app.get('/', (req, res) => {
    res.send('Server is running')
})

app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`)
})