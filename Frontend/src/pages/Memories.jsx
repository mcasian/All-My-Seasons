// ---------- IMPORTS ----------
import React, { useState, useContext, useEffect } from 'react';
import { LoginContext } from '../Contexts/UserDataContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// ---------- IMPORTS END ----------



// ---------- REACT COMPONENT ----------
function Memories() {
    const {memories, userData} = useContext(LoginContext);
    const [sortOrder, setSortOrder] = useState('newest');
    const navigate = useNavigate();

    
    // UseEffect to log userData
    useEffect(() => {
        console.log("User Data: ", userData);
    }, [userData]);

    // UseEffect to log the user's memories
    useEffect(() => {
        console.log("Memories: ", memories)
    }, [memories]);

    // Deletes the specified memory from the database after prompting the user to confirm
    const handleDelete = async (id) => {
        const confirmed = window.confirm("Are you sure you want to delete this post? It will be permanently deleted and cannot in any way be recovered.");
        if (confirmed) {
            try {
                await axios.delete(`https://all-my-seasons-express-api.vercel.app/api/memories/${id}`, {
                    params: {
                        username: userData.username,
                    }
                });
                window.location.reload();
            } catch (err) {
                console.log(err);
            }
        }
    };

    // Function to sort memories by date in descending order (newest first)
    const sortMemoriesByDateDescending = (memories) => {
        return [...memories].sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    // Function to sort memories by date in ascending order (oldest first)
    const sortMemoriesByDateAscending = (memories) => {
        return [...memories].sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    // Function to shuffle memories in random order
    const shuffleMemories = (memories) => {
        const shuffled = [...memories];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Function to sort memories based on sortOrder using the Fisher-Yates shuffle algorithm
    const sortMemories = (memories, sortOrder) => {
        switch (sortOrder) {
            case 'newest':
                return sortMemoriesByDateDescending(memories);
            case 'oldest':
                return sortMemoriesByDateAscending(memories);
            case 'random':
                return shuffleMemories(memories);
            default:
                return memories;
        }
    };

    // Memories are sorted and stored here for the user to view
    const sortedMemories = sortMemories(memories, sortOrder);



    // ---------- JSX HTML RETURN ----------
    return (
        <div className="memory-page">
            <div className="top-left-button">
                <button className="home-button" onClick={() => navigate('/home')}>Back to Home</button>
            </div>
            <div className='memory-page-header'>
                <h1>Memories</h1>
                <h2>All your life, your seasons &lt;3</h2>

                <div className="sort-dropdown">
                    <p style={{ marginBottom: "0px", marginTop: "30px" }}>Sort memories by:</p>
                    <select onChange={(e) => setSortOrder(e.target.value)} value={sortOrder}>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="random">Random</option>
                    </select>
                </div>
            </div>
            <div className="memories-container">
                {sortedMemories.map((memory, index) => (
                    <div className={`memory ${index % 2 === 0 ? 'left-image' : 'right-image'}`} key={memory.id}>

                        <div className="creator-tag">
                            <p>Added by {memory.creator}</p>
                        </div>

                        <div className="dropdown">
                            <button className="dropbtn"></button>
                            <div className="dropdown-content">
                                <p onClick={() => navigate(`/updatememory/${memory.id}`)}>Edit</p>
                                <p onClick={() => handleDelete(memory.id)}>Delete</p>
                            </div>
                        </div>
                        
                        <div className="imageContainer">
                            <img src={memory.imageUrl} alt="za memory" style={{ borderRadius: "30px" }} />
                        </div>

                        <div className="memoryText">
                            <div className="memoryDateContainer">
                                <h1>{memory.date}</h1>
                            </div>
                            <div className="memoryDescriptionContainer">
                                <p>{memory.desc}</p>
                            </div>
                        </div>
                        
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Memories;