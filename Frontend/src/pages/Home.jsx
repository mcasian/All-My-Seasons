import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { LoginContext } from '../Contexts/UserDataContext';
import { useNavigate } from 'react-router-dom';

function Home() {
    const { userData, setUserData, setLoginStatus } = useContext(LoginContext);
    const navigate = useNavigate();
    const [randomMemory, setRandomMemory] = useState(null);
    const [memories, setMemories] = useState(null);


    // Fetches the user's data using the JWT login token stored in local storage
    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await axios.get('https://all-my-seasons-express-api.vercel.app/api/user', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setUserData(response.data);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };
        fetchUserData();
    }, [setUserData]);

    // Fetches the all of the user's memories from the database
    useEffect(() => {
        const fetchAllMemories = async () => {
            try {
                const res = await axios.get("https://all-my-seasons-express-api.vercel.app/api/memories", {
                    params: {
                        username: userData.username,
                    }
                });

                if (res.status === 200) {
                    console.log('Memory data:', res.data);
                    setMemories(res.data);
                }
            } catch (err) {
                console.log(err);
            }
        };
        if (userData) {
            fetchAllMemories();
        }
    }, [userData]);

    // UseEffect to log the user's memories
    useEffect(() => {
        console.log("User's Memories: ", memories);
    }, [memories]);

    // UseEffect to log userData
    useEffect(() => {
        console.log("User Data: ", userData);
    }, [userData]);

    // Navigates to the memories page
    const viewMemoriesClick = () => {
        navigate("/memories")
    }

    // Navigates to the create memory page
    const createMemoryClick = () => {
        navigate("/creatememory")
    }

    // Generates a random memory for the user to view
    const generateRandomMemory = () => {
        if (memories && memories.length > 0) {
            const randomMemoryIndex = Math.floor(Math.random() * memories.length);
            setRandomMemory(memories[randomMemoryIndex]);
        }
    };

    // Logs out the user by clearing userData and deleting their login token
    const logout = () => {
        localStorage.removeItem('token');
        setUserData(null);
        setLoginStatus(false);
        console.log("User is being logged out");
        navigate("/");
        window.location.reload();
    }


    
    // ---------- JSX HTML RETURN ----------
    return (
        <div className="home-container">
            <div className="top-right-button">
                <button className="logout-button" onClick={logout}>Logout</button>
            </div>

            {userData ?
                <h1 className="welcome-text">{`Welcome, ${userData.username}! This is your home page`}</h1>
                : <h1 className="welcome-text">Welcome! This is your home page</h1>}
                <p>There will be more stuff here soon...</p>

            <div className="button-container">
                <button className="action-button" onClick={viewMemoriesClick}>View Memories</button>
                <button className="action-button" onClick={createMemoryClick}>Create Memory</button>
                <button className="action-button" onClick={generateRandomMemory}>Generate Random Post</button>
            </div>

            {randomMemory && (
                <div className="random-post">
                    <h2 className="random-post-title">Random Post</h2>
                    <div className="memory">
                        <div className="imageContainer">
                            <img src={randomMemory.imageUrl} alt="Random Memory" style={{ borderRadius: "30px" }} />
                        </div>
                        <div className="memoryText">
                            <div className="memoryDateContainer">
                                <h1>{randomMemory.date}</h1>
                            </div>
                            <div className="memoryDescriptionContainer">
                                <p>{randomMemory.desc}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;