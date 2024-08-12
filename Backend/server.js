/*
**NOTE TO SELF FOR BACKEND DEVELOPMENT**
    Be sure to change http endpoints to "http://localhost:*****"
    and to start the express server locally

    Remember to change http endpoints back to
    "https://all-my-seasons-express-api.vercel.app"
    before pushing to production
*/

// ---------- IMPORTS ----------
import express, { query } from 'express';
import mysql from 'mysql';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';
// ---------- IMPORTS END ----------





// ---------- SETTING UP SERVER ----------
// Secret Keys and URLS
dotenv.config();
const databaseUrl = process.env.DATABASE_URL;
const databaseUser = process.env.DATABASE_USER;
const databasePassword = process.env.DATABASE_PASSWORD;
const databaseName = process.env.DATABASE_NAME;
const tokenSecretKey = process.env.LOGIN_TOKEN_KEY;
const s3BucketName = process.env.S3_BUCKET_NAME;
const s3AccessKey = process.env.S3_ACCESS_KEY;
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const s3BucketRegion = process.env.S3_BUCKET_REGION;
const port = process.env.PORT || 3000;
const tokenExpiration = process.env.TOKEN_EXPIRATION;
const allowedDomains = (process.env.ALLOWED_DOMAINS || '').split(',');

// Express server and CORS configuration
const app = express();
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedDomains.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json());

// MySQL server configuration
const db = mysql.createPool({
    connectionLimit: 10,
    host: databaseUrl,
    user: databaseUser,
    password: databasePassword,
    database: databaseName
});

// Handle MySQL connection errors
db.on('error', (err) => {
    console.error('MySQL error:', err);
});

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Amazon S3 configuration
const s3 = new S3Client({
    credentials: {
        accessKeyId: s3AccessKey,
        secretAccessKey: s3SecretAccessKey,
    },
    region: s3BucketRegion,
});
// ---------- SETTING UP SERVER END ----------





// ---------- API METHODS ----------
/**
 * Prints the default message for the local host
 * for when the express server is running
 */
app.get("/api", (req, res) => {
    res.json("hello, this is the backend for All My Seasons :P");
});


// ----- USER RELATED METHODS -----
/**
 * Creates an account for a user
 * 
 * @param username - the username for the new account
 * @param password - the password for the new account
 */
app.post("/api/createAccount", async (req, res) => {
    const { username, password } = req.body;

    // Validates that a username and password have been passed
    if (!username || !password) {
        return res.status(400).json({ message: "username and password are required" });
    }

    try {
        // Hash the user's password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Posts the new user account to the database
        const query = `INSERT INTO users (username, password) VALUES (?, ?)`;
        db.query(query, [username, hashedPassword], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: "Failed to create an account. Possibly duplicate username." });
            }
            res.status(201).json({ message: "Account created successfully! You can now log in." });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: "Server error" });
    }
});


/**
 * Login method for users with an account
 * 
 * @param username - the username of the existing account
 * @param password - the password of the existing account
 * 
 * @returns JWT login token containing the user id
 */
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    // Validates that a username and password have been passed
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        // Checks if the user exists
        const query = "SELECT id, username, password FROM users WHERE username = ?";
        db.query(query, [username], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: "Server error" });
            }
            if (results.length === 0) {
                return res.status(401).json({ message: "Invalid username or password" });
            }

            // Verify password
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid username or password" });
            }

            // If the password is correct, create and send JWT token
            const loginToken = jwt.sign({ id: user.id }, tokenSecretKey, { expiresIn: tokenExpiration });

            // Returns success status and a JWT login token
            res.status(200).json({ loginToken });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: "Server error" });
    }
});


/**
 * Middleware to authenticate JWT token
 * 
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function
 */
const authenticateJWT = (req, res, next) => {
    // Extract the token from the 'Authorization' header
    const token = req.header('Authorization')?.split(' ')[1];

    // Validate that a token is passed
    if (!token) {
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        // Verify the token using the secret key
        const verified = jwt.verify(token, tokenSecretKey);
        req.user = verified;

        // Proceed to the next middleware function
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};


/**
 * Gets the user data using the JWT token
 * 
 * @param token - JWT token to extract user id from
 * 
 * @return user data
 */
app.get("/api/user", authenticateJWT, (req, res) => {
    // This route handler will only be called if authenticateJWT calls next()
    // This function assumes user ID is in the JWT payload

    // Query the database for the user data using the user ID from the token payload
    const query = "SELECT id, username, soulmate FROM users WHERE id = ?";
    db.query(query, [req.user.id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: "Server error" });
        }
        // If the query is successful, return user data
        res.status(200).json(result[0]);
    });
});


/**
 * Sends a soulmate request to a user
 * 
 * @param requester - the user sending the soulmate request
 * @param reciever - the user recieving the soulmate request
 */
app.post("/api/soulmate-request", async (req, res) => {
    const { requester, reciever } = req.body;

    try {
        // First, check that the recieving user does not already have a soulmate
        // Query for check happens below
        const checkQuery = 'SELECT soulmate FROM users WHERE username = ?';
        const checkResult = await new Promise((resolve, reject) => {
            db.query(checkQuery, [reciever], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        // Actual validation that the recieving user does not have a soulmate happens here
        if (checkResult[0].soulmate) {
            return res.status(409).json({ message: "You already have a soulmate" });
        }

        // Query to add a new soulmate request to the database
        const query = 'INSERT INTO soulmate_requests (`sender`, `reciever`) VALUES (?, ?)';
        await new Promise((resolve, reject) => {
            db.query(query, [requester, reciever], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        res.status(200).json({ message: "soulmate request successful" });

    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ message: "Server error" });
    }
});


/**
 * Gets all of the user's soulmate requests
 * 
 * @param username - the username of the user who is recieving said requests
 */
app.get("/api/soulmate-requests", (req, res) => {
    const {username} = req.query;

    const query = `SELECT * FROM soulmate_requests WHERE reciever = ?`;
    db.query(query, [username], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: "Server error" });
        }
        return res.status(200).json(result);
    });
});


/**
 * Accepts a soulmate request and deletes the [now accepted] request
 * *NOTE* IN PROGRESS
 * *NOTE* Yes I am aware this is callback hell, I will refactor later lol
 * @param username - the username of the user whose soulmate will be accepted
 */
app.put("/api/soulmate-request", (req, res) => {
    const { requester, reciever } = req.query;

    const insertQuery = `
        UPDATE users 
        SET soulmate = CASE 
            WHEN username = ? THEN ?
            WHEN username = ? THEN ?
            ELSE soulmate
        END
        WHERE username IN (?, ?)
    `;
    const deleteQuery = 'DELETE FROM soulmate_requests WHERE sender = ? OR sender = ? OR reciever = ? OR reciever = ?';

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            return res.status(500).json({ message: "Server error" });
        }

        connection.beginTransaction((transactionErr) => {
            if (transactionErr) {
                console.error('Transaction start error:', transactionErr);
                connection.release();
                return res.status(500).json({ message: "Server error" });
            }

            connection.query(insertQuery, [reciever, requester, requester, reciever, requester, reciever], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('Database error during insert:', insertErr);
                    return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ message: "Server error" });
                    });
                }

                connection.query(deleteQuery, [requester, reciever, requester, reciever], (deleteErr, deleteResult) => {
                    if (deleteErr) {
                        console.error('Database error during delete:', deleteErr);
                        return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({ message: "Server error" });
                        });
                    }

                    connection.commit((commitErr) => {
                        if (commitErr) {
                            console.error('Transaction commit error:', commitErr);
                            return connection.rollback(() => {
                                connection.release();
                                res.status(500).json({ message: "Server error" });
                            });
                        }

                        connection.release();
                        res.status(200).json({ message: "Soulmate inserted and previous requests deleted successfully" });
                    });
                });
            });
        });
    });
});

app.delete("/api/soulmate-request", (req, res) => {
    const { requester, reciever } = req.query;
    
    const deleteQuery = 'DELETE FROM soulmate_requests WHERE sender = ? OR sender = ? OR reciever = ? OR reciever = ?';
    db.query(deleteQuery, [requester, reciever, requester, reciever], (deleteErr, deleteResult) => {
        if (deleteErr) {
            console.error('Database error:', err);
            return res.status(500).json({ message: "Server error" });
        }
        return res.status(200).json({ message: "Soulmate request deleted successfully" });
    });
});
// ----- USER RELATED METHODS END -----



// ----- MEMORY RELATED METHODS -----
/**
 * Posts memory text data to the MySQL database
 * and post image to S3 bucket
 * 
 * @param creator - the user that created the post
 * @param desc - the description for the post
 * @param date - the date that the memory was on
 * @param req.file - the file name and buffer for memory image
 */
app.post("/api/memories", upload.single('img'), async (req, res) => {
    const { creator, desc, date } = req.body;

    // Validates that a file was passed
    if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
    }

    // Generates a unique file prefix to ensure no duplicate file names exist in the S3 bucket
    const generateUniqueFilePrefix = (bytes = 16) => crypto.randomBytes(bytes).toString('hex');
    const uniqueFileName = generateUniqueFilePrefix() + req.file.originalname;

    // Tries to upload the memory image to S3 and post the memory data to the database
    try {
        // S3 bucket uploading
        const params = {
            Bucket: s3BucketName,
            Key: uniqueFileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };
        const command = new PutObjectCommand(params);
        await s3.send(command);

        // Database posting
        const query = "INSERT INTO memories (`creator`, `date`, `desc`, `img`) VALUES (?, ?, ?, ?)";
        db.query(query, [creator, date, desc, uniqueFileName], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: "Failed to create memory. Please try again later." });
            }
            res.status(201).json({ message: "Memory uploaded successfully!" });
        });
    } catch (error) {
        console.error('Error uploading to S3:', error);
        res.status(500).json({ message: "Error uploading to S3" });
    }
});


/**
 * Gets all of the posts that belong to the user
 * 
 * @param username - the username of the user
 * 
 * @return all of the posts made by the user
 */
app.get("/api/memories", async (req, res) => {
    const { username, soulmate } = req.query;

    // Validates that a username was passed
    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    let query = `SELECT * FROM memories WHERE creator = ?`
    let queryDependency = [username];
    if (soulmate) {
        query = `SELECT * FROM memories WHERE creator = ? OR creator = ?`
        queryDependency = [username, soulmate];
    }

    // Tries to get memory data from the database and URLs for each memory image from S3
    try {
        // Gets memory data from the database
        db.query(query, queryDependency, async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: "Failed to fetch memories. Please try again later." });
            }

            // Generate signed URLs for each memory image
            const memoriesWithSignedUrls = await Promise.all(results.map(async (memory) => {
                const signedUrl = await getSignedUrl(
                    s3,
                    new GetObjectCommand({
                        Bucket: s3BucketName,
                        Key: memory.img
                    }),
                    { expiresIn: 3600 } // URL expiration time in seconds
                );

                // Returns the memory data including signed URLs for viewing the images
                return { ...memory, imageUrl: signedUrl };
            }));

            res.status(200).json(memoriesWithSignedUrls);
        });
    } catch (error) {
        console.error('Error fetching memories:', error);
        res.status(500).json({ message: "Error fetching memories" });
    }
});


/**
 * Getting data for a particular memory 
 * 
 * This is used to get prior data before updating a memory
 * 
 * @param memoryId - the id of the memory that will be updated
 * @param username - the username of the creator of the memory
 * 
 * @return the memory data associated with the memory id and username
 */
app.get("/api/memories/:memoryId", (req, res) => {
    const { memoryId } = req.params;
    const { username } = req.query;

    // Validates that a memory ID and username were passed
    if (!username || !memoryId) {
        return res.status(400).json({ message: "Username and memoryId are required" });
    }

    // Gets the memory data from the database
    const query = 'SELECT * FROM memories WHERE id = ? AND creator = ?';
    db.query(query, [memoryId, username], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: "Server error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Memory not found' });
        }
        return res.json(results[0]);
    });
});


/**
 * Updates a memory's text data
 * 
 * @param memoryId - the id of the memory being updated
 * @param username - the username of the user updating the memory 
 *                   to ensure that only the creator can update the memory
 * @param date - the updated date for the memory
 * @param desc - the updated description for the memory
 */
app.put("/api/memories/:memoryId", (req, res) => {
    const memoryId = req.params.memoryId;
    const { username, date, desc } = req.body;

    // Puts the updated memory data into the database
    const query = "UPDATE memories SET `date` = ?, `desc` = ? WHERE id = ? AND creator = ?";
    db.query(query, [date, desc, memoryId, username], (err, data) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: "Server error" });
        }
        return res.json({ message: "Memory updated successfully" });
    });
});


/**
 * Deletes a memory
 * 
 * @param memoryId - the id of the memory to be deleted
 * @param username - the username of the user requesting a deletion
 */
app.delete("/api/memories/:id", async (req, res) => {
    const memoryId = req.params.id;
    const { username } = req.query;
    
    // Validates that a username was passed
    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    try {
        // Gets the memory's img file name from the database
        const getQuery = "SELECT img FROM memories WHERE id = ? AND creator = ?";
        db.query(getQuery, [memoryId, username], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: "Server error" });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Memory not found' });
            }

            const memoryImgFileName = results[0].img;

            // Deletes the memory image file from S3
            const params = {
                Bucket: s3BucketName,
                Key: memoryImgFileName
            };
            const command = new DeleteObjectCommand(params);
            await s3.send(command);

            // Deletes the memory data from the database
            const deleteQuery = "DELETE FROM memories WHERE id = ? AND creator = ?";
            db.query(deleteQuery, [memoryId, username], (err, data) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: "Server error" });
                }
                return res.json({ message: "Memory deleted successfully" });
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: "Server error" });
    }
});
// -----MEMORY RELATED METHODS END -----
// ---------- API METHODS END ----------





// ---------- LOCAL HOST LISTENING PORT ----------
app.listen(port, () => {
    console.log("The Server is Up and Running <3");
});
// ---------- LOCAL HOST LISTENING PORT END ----------
