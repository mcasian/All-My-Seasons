import React, { useContext, useEffect, useState } from "react";
import "../style/UpdateMemory.css";
import { useNavigate, useParams } from 'react-router-dom';
import { LoginContext } from '../Contexts/UserDataContext';
import axios from "axios";

function UpdateMemory() {
    const { memoryId } = useParams();
    const [memoryData, setMemoryData] = useState({
        memoryDateInput: "",
        memoryDescriptionInput: ""
    });
    const [charCount, setCharCount] = useState(300);
    const { userData } = useContext(LoginContext);
    const navigate = useNavigate();

    // Fetches the original memory data as default values for updating
    useEffect(() => {
        const fetchPostDetail = async () => {
            try {
                const response = await axios.get(`https://all-my-seasons-express-api.vercel.app/api/memories/${memoryId}`, {
                    params: {
                        username: userData.username,
                    }
                });
                if (response.status === 200) {
                    const fetchedData = response.data;
                    setMemoryData({
                        memoryDateInput: fetchedData.date,
                        memoryDescriptionInput: fetchedData.desc
                    });
                    setCharCount(300 - fetchedData.desc.length);
                }
            } catch (error) {
                console.error('Failed to fetch post details:', error);
                alert("Either this memory does not exist or this is not your memory. Do not try to alter the memories of others.");
                navigate('/home');
            }
        };
        if(userData && memoryId){
            fetchPostDetail();
        }
    }, [memoryId, userData, navigate]);

    // UseEffect to log memoryData
    useEffect(() => {
        console.log("Memory Data: ", memoryData);
    }, [memoryData]);

    // UseEffect to log userData
    useEffect(() => {
        console.log("User Data: ", userData);
    }, [userData]);

    // Updates and sets memoryData to the inputs by the user
    const handleChange = (e) => {
        const { name, value } = e.target;

        setMemoryData(prev => ({ ...prev, [name]: value }));

        if (name === "memoryDescriptionInput") {
            setCharCount(300 - value.length);
        }
    };

    // Puts the new memory data into the database to update the previous memory data
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.put(`https://all-my-seasons-express-api.vercel.app/api/memories/${memoryId}`, {
                username: userData.username,
                id: memoryId,
                date: memoryData.memoryDateInput,
                desc: memoryData.memoryDescriptionInput,
            });
            alert('Memory updated successfully');
            navigate('/memories')
            window.location.reload();
        } catch (err) {
            console.error('Error updating memory:', err);
            alert('Failed to update memory');
        }
    };



    // ---------- JSX HTML RETURN ----------
    return (
        <div className="update-page">
            <div className="top-left-button">
                <button className="home-button" onClick={() => navigate('/home')}>Back to Home</button>
            </div>
            
            <h1>Update A Memory</h1>

            <div>
                <p>NOTE: the image for a memory cannot be updated.</p>
            </div>

            {memoryData ? (
                <form className="updateMemoryForm" onSubmit={handleSubmit}>
                    <div className="form-input">
                        <label htmlFor="memoryDateInput">Enter The Date of the Memory: </label>
                        <input 
                            type="date"
                            name="memoryDateInput"
                            required
                            value={memoryData.memoryDateInput}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-input">
                        <label htmlFor="memoryDescriptionInput">Short Description For the Memory: </label>
                        <br />
                        <textarea
                            name="memoryDescriptionInput"
                            rows="7"
                            cols="60"
                            maxLength={300}
                            required
                            value={memoryData.memoryDescriptionInput}
                            onChange={handleChange}
                        />
                        <p>{charCount} characters remaining</p>
                    </div>

                    <div className="form-input">
                        <button type="submit">Submit Memory Update</button>
                    </div>
                </form>
            ) : (
                <p>Loading memory data...</p>
            )}
        </div>
    );
}

export default UpdateMemory;