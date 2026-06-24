const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT;
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("AuraNex Server is running");
});

const uri = process.env.MONGO_DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const database = client.db("auranex_db");
        const appointmentsCollection = database.collection("appointments");
        const reviewsCollection = database.collection("reviews");
        const doctorsCollection = database.collection("doctors");
        const paymentsCollection = database.collection("payments");
        const slotsCollection = database.collection("slots");
        const prescriptionsCollection = database.collection("prescriptions");
        const usersCollection = database.collection("user");
        const storiesCollection = database.collection("success_stories");

        app.post("/api/payments", async(req, res) => {
            try {
                const existing = await paymentsCollection.findOne({
                    stripeSessionId: req.body.stripeSessionId
                });

                if (existing) {
                    return res.status(200).json({ success: true, message: "Already saved" });
                }

                const result = await paymentsCollection.insertOne({
                    ...req.body,
                    paymentDate: new Date(),
                });
                res.status(201).json({ success: true, insertedId: result.insertedId });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.post("/api/appointments", async(req, res) => {
            try {
                const existing = await appointmentsCollection.findOne({
                    stripeSessionId: req.body.stripeSessionId
                });

                if (existing) {
                    return res.status(200).json({ success: true, message: "Already saved" });
                }

                const result = await appointmentsCollection.insertOne({
                    ...req.body,
                    createdAt: new Date(),
                });
                res.status(201).json({ success: true, insertedId: result.insertedId });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get("/api/success-stories", async(req, res) => {
            try {
                const stories = await storiesCollection.find({}).sort({ createdAt: -1 }).toArray();
                res.status(200).json({ success: true, stories });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.post("/api/success-stories", async(req, res) => {
            try {
                const storyData = {...req.body, createdAt: new Date() };
                const result = await storiesCollection.insertOne(storyData);
                res.status(201).json({ success: true, insertedId: result.insertedId });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        //admin related api
        app.get("/api/admin/users", async(req, res) => {
            try {
                const users = await usersCollection
                    .find({})
                    .sort({ createdAt: -1 })
                    .toArray();
                res.status(200).json({ success: true, users });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.delete("/api/admin/users/:id", async(req, res) => {
            try {
                const { id } = req.params;
                const result = await usersCollection.deleteOne({
                    _id: new ObjectId(id),
                });
                if (result.deletedCount === 1) {
                    res.status(200).json({ success: true, message: "User deleted" });
                } else {
                    res.status(404).json({ success: false, message: "User not found" });
                }
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.patch("/api/admin/users/:id/status", async(req, res) => {
            try {
                const { id } = req.params;
                const { status } = req.body;
                const result = await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } }, );
                res.status(200).json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get("/api/admin/doctors", async(req, res) => {
            try {
                const { status } = req.query;
                const query = status ? { verificationStatus: status } : {};
                const doctors = await doctorsCollection
                    .find(query)
                    .sort({ createdAt: -1 })
                    .toArray();
                res.status(200).json({ success: true, doctors });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.patch("/api/admin/doctors/:id/verify", async(req, res) => {
            try {
                const { id } = req.params;
                const { action } = req.body;
                const statusMap = {
                    verify: "verified",
                    reject: "rejected",
                    cancel: "pending",
                };
                const verificationStatus = statusMap[action];
                if (!verificationStatus) {
                    return res
                        .status(400)
                        .json({ success: false, message: "Invalid action" });
                }
                const result = await doctorsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { verificationStatus, updatedAt: new Date() } }, );
                res.status(200).json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get("/api/admin/appointments", async(req, res) => {
            try {
                const { status, page = 1, limit = 10 } = req.query;
                const query = status ? { appointmentStatus: status } : {};
                const skip = (parseInt(page) - 1) * parseInt(limit);
                const total = await appointmentsCollection.countDocuments(query);
                const appointments = await appointmentsCollection
                    .find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .toArray();
                res.status(200).json({
                    success: true,
                    appointments,
                    total,
                    totalPages: Math.ceil(total / parseInt(limit)),
                    currentPage: parseInt(page),
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get("/api/admin/payments", async(req, res) => {
            try {
                const { page = 1, limit = 10 } = req.query;
                const skip = (parseInt(page) - 1) * parseInt(limit);
                const total = await paymentsCollection.countDocuments({});
                const payments = await paymentsCollection
                    .find({})
                    .sort({ paymentDate: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .toArray();
                res.status(200).json({
                    success: true,
                    payments,
                    total,
                    totalPages: Math.ceil(total / parseInt(limit)),
                    currentPage: parseInt(page),
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get("/api/admin/stats", async(req, res) => {
            try {
                const [
                    totalDoctors,
                    totalPatients,
                    totalAppointments,
                    totalReviews,
                    totalPayments,
                ] = await Promise.all([
                    doctorsCollection.countDocuments({ verificationStatus: "verified" }),
                    usersCollection.countDocuments({ role: "patient" }),
                    appointmentsCollection.countDocuments({}),
                    reviewsCollection.countDocuments({}),
                    paymentsCollection.countDocuments({}),
                ]);

                const revenueAgg = await paymentsCollection
                    .aggregate([
                        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
                    ])
                    .toArray();

                res.status(200).json({
                    success: true,
                    stats: {
                        totalDoctors,
                        totalPatients,
                        totalAppointments,
                        totalReviews,
                        totalPayments,
                        totalRevenue: (revenueAgg[0] && revenueAgg[0].totalRevenue) || 0,
                    },
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get("/api/admin/doctor-performance", async(req, res) => {
            try {
                const performance = await reviewsCollection
                    .aggregate([{
                            $group: {
                                _id: "$doctorEmail",
                                avgRating: { $avg: "$rating" },
                                totalReviews: { $sum: 1 },
                            },
                        },
                        {
                            $lookup: {
                                from: "doctors",
                                localField: "_id",
                                foreignField: "email",
                                as: "doctorInfo",
                            },
                        },
                        {
                            $unwind: {
                                path: "$doctorInfo",
                                preserveNullAndEmptyArrays: false,
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                name: "$doctorInfo.doctorName",
                                specialization: "$doctorInfo.specialization",
                                avgRating: { $round: ["$avgRating", 1] },
                                totalReviews: 1,
                            },
                        },
                        { $sort: { avgRating: -1 } },
                        { $limit: 10 },
                    ])
                    .toArray();

                res.status(200).json({ success: true, data: performance });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        //doctor related api
        app.patch("/api/doctors/update/:email", async(req, res) => {
            try {
                const { email } = req.params;
                const {
                    qualifications,
                    experience,
                    consultationFee,
                    availableSlots,
                    availableDays,
                    hospitalName,
                    specialization,
                    profileImage,
                } = req.body;
                const result = await doctorsCollection.updateOne(
                    { email: email },
                    {
                        $set: {
                            qualifications,
                            experience: Number(experience),
                            consultationFee: Number(consultationFee),
                            availableSlots: availableSlots || [],
                            availableDays: availableDays || [],
                            hospitalName,
                            specialization,
                            profileImage: profileImage || '',
                            updatedAt: new Date(),
                        },
                        $setOnInsert: { email, createdAt: new Date(), verificationStatus: 'pending' },
                    },
                    { upsert: true }
                );
                res.status(200).json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get("/api/doctors/profile/:email", async(req, res) => {
            try {
                const { email } = req.params;
                const doctor = await doctorsCollection.findOne({ email: email });
                if (doctor) {
                    res.status(200).json({ success: true, doctor });
                } else {
                    res.status(404).json({ success: false, message: "Doctor not found" });
                }
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get("/api/appointments/doctor/:email", async(req, res) => {
            try {
                const email = req.params.email;
                const result = await appointmentsCollection
                    .find({ doctorEmail: email })
                    .toArray();
                res.status(200).json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.patch("/api/appointments/status/:id", async(req, res) => {
            try {
                const { id } = req.params;
                const { status } = req.body;
                const result = await appointmentsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { appointmentStatus: status } }, );
                res.status(200).json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get("/api/doctor/prescriptions", async(req, res) => {
            try {
                const { email } = req.query;
                if (!email)
                    return res
                        .status(400)
                        .json({ success: false, message: "Doctor email is required" });
                const prescriptions = await prescriptionsCollection
                    .find({ doctorEmail: email })
                    .toArray();
                res.status(200).json({ success: true, data: prescriptions });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.post("/api/doctor/prescriptions", async(req, res) => {
            try {
                const { doctorEmail, patientEmail, diagnosis, medications, notes } =
                req.body;
                if (!doctorEmail || !patientEmail || !diagnosis || !medications) {
                    return res
                        .status(400)
                        .json({ success: false, message: "All fields are required" });
                }
                const newPrescription = {
                    doctorEmail,
                    patientEmail,
                    diagnosis,
                    medications,
                    notes: notes || "",
                    createdAt: new Date(),
                };
                const result = await prescriptionsCollection.insertOne(newPrescription);
                res
                    .status(201)
                    .json({
                        success: true,
                        data: { _id: result.insertedId, ...newPrescription },
                    });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.put("/api/doctor/prescriptions/:id", async(req, res) => {
            try {
                const { id } = req.params;
                const { diagnosis, medications, notes } = req.body;
                const result = await prescriptionsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { diagnosis, medications, notes, updatedAt: new Date() } }, );
                res.status(200).json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.delete("/api/doctor/prescriptions/:id", async(req, res) => {
            try {
                const { id } = req.params;
                const result = await prescriptionsCollection.deleteOne({
                    _id: new ObjectId(id),
                });
                if (result.deletedCount === 1) {
                    res
                        .status(200)
                        .json({
                            success: true,
                            message: "Prescription deleted successfully",
                        });
                } else {
                    res
                        .status(404)
                        .json({ success: false, message: "Prescription not found" });
                }
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get("/api/doctor/slots", async(req, res) => {
            try {
                const { email } = req.query;
                if (!email) {
                    return res
                        .status(400)
                        .json({ success: false, message: "Doctor email is required" });
                }
                const slots = await slotsCollection
                    .find({ doctorEmail: email })
                    .toArray();
                res.status(200).json({ success: true, data: slots });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.post("/api/doctor/slots", async(req, res) => {
            try {
                const { doctorEmail, time } = req.body;

                if (!doctorEmail || !time) {
                    return res
                        .status(400)
                        .json({ success: false, message: "All fields are required" });
                }

                const newSlot = {
                    doctorEmail,
                    time,
                    isBooked: false,
                    createdAt: new Date(),
                };

                const result = await slotsCollection.insertOne(newSlot);
                res
                    .status(201)
                    .json({
                        success: true,
                        data: { _id: result.insertedId, ...newSlot },
                    });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.delete("/api/doctor/slots/:id", async(req, res) => {
            try {
                const { id } = req.params;
                const { ObjectId } = require("mongodb");
                const result = await slotsCollection.deleteOne({
                    _id: new ObjectId(id),
                });
                if (result.deletedCount === 1) {
                    res
                        .status(200)
                        .json({ success: true, message: "Slot deleted successfully" });
                } else {
                    res.status(404).json({ success: false, message: "Slot not found" });
                }
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get("/api/doctors", async(req, res) => {
            try {
                const {
                    search,
                    specialization,
                    sortBy,
                    page = 1,
                    limit = 6,
                } = req.query;

                const query = { verificationStatus: "verified" };

                if (search) {
                    query.doctorName = { $regex: search, $options: "i" };
                }

                if (specialization) {
                    query.specialization = specialization;
                }

                const sortOptions = {};
                if (sortBy === "fee_low") sortOptions.consultationFee = 1;
                if (sortBy === "fee_high") sortOptions.consultationFee = -1;
                if (sortBy === "experience") sortOptions.experience = -1;
                if (sortBy === "rating") sortOptions.rating = -1;

                const parsedPage = parseInt(page);
                const parsedLimit = parseInt(limit);
                const skip = (parsedPage - 1) * parsedLimit;

                const totalDoctors = await doctorsCollection.countDocuments(query);
                const doctors = await doctorsCollection
                    .find(query)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parsedLimit)
                    .toArray();

                res.status(200).json({
                    success: true,
                    doctors,
                    totalDoctors,
                    totalPages: Math.ceil(totalDoctors / parsedLimit),
                    currentPage: parsedPage,
                });
            } catch (error) {
                res
                    .status(500)
                    .json({ success: false, error: "Failed to fetch doctors data" });
            }
        });

        app.get("/api/doctors/:id", async(req, res) => {
            try {
                const doctor = await database
                    .collection("doctors")
                    .findOne({ _id: new ObjectId(req.params.id) });
                if (doctor) {
                    res.json({ success: true, doctor });
                } else {
                    res.status(404).json({ success: false, message: "Doctor not found" });
                }
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        //patient related api
        app.get("/api/appointments/patient/:email", async(req, res) => {
            const email = req.params.email;
            const query = { patientEmail: email };
            const result = await appointmentsCollection.find(query).toArray();
            res.send(result);
        });

        app.patch("/api/appointments/cancel/:id", async(req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: { appointmentStatus: "canceled" },
                };
                const result = await appointmentsCollection.updateOne(filter, updateDoc);
                res.status(200).json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.patch("/api/appointments/reschedule/:id", async(req, res) => {
            try {
                const id = req.params.id;
                const { newDate } = req.body;
                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: {
                        selectedDate: newDate,
                        appointmentStatus: "pending",
                    },
                };
                const result = await appointmentsCollection.updateOne(filter, updateDoc);
                res.status(200).json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get("/payments/:email", async(req, res) => {
            try {
                const { email } = req.params;
                const paymentRecords = await appointmentsCollection
                    .find({
                        patientEmail: email,
                        paymentStatus: "paid",
                    })
                    .sort({ createdAt: -1 })
                    .toArray();

                res.status(200).json({ success: true, payments: paymentRecords });
            } catch (error) {
                res
                    .status(500)
                    .json({ success: false, error: "Internal Server Error" });
            }
        });

        app.get("/api/reviews/patient/:email", async(req, res) => {
            try {
                const email = req.params.email;
                const reviews = await reviewsCollection
                    .find({ patientEmail: email })
                    .toArray();
                res.status(200).json({ success: true, reviews });
            } catch (error) {
                res
                    .status(500)
                    .json({ success: false, error: "Failed to fetch reviews" });
            }
        });

        app.delete("/api/reviews/:id", async(req, res) => {
            try {
                const id = req.params.id;
                const result = await reviewsCollection.deleteOne({
                    _id: new ObjectId(id),
                });
                res
                    .status(200)
                    .json({ success: true, deletedCount: result.deletedCount });
            } catch (error) {
                res
                    .status(500)
                    .json({ success: false, error: "Failed to delete review" });
            }
        });

        app.post("/api/reviews", async(req, res) => {
            try {
                const reviewData = {...req.body, createdAt: new Date() };
                const result = await reviewsCollection.insertOne(reviewData);
                res.status(201).json({ success: true, insertedId: result.insertedId });
            } catch (error) {
                res
                    .status(500)
                    .json({ success: false, error: "Failed to post review" });
            }
        });


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!",
        );
    } catch (error) {
        console.error("Database connection error:", error);
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`AuraNex app listening on port ${port}`);
});