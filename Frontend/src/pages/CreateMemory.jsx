// ---------- IMPORTS ----------
import React, { useState, useEffect, useContext } from 'react';
import { LoginContext } from '../Contexts/UserDataContext';
import "../style/CreateMemory.css"
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// ---------- IMPORTS END ----------



// ---------- REACT COMPONENT ----------
function CreateMemory() {
    const [memoryData, setMemoryData] = useState({
        memoryDateInput: null,
        memoryDescriptionInput: null,
    });
    const [memoryImg, setMemoryImg] = useState(null);
    const [charCount, setCharCount] = useState(300);
    const { userData } = useContext(LoginContext);
    const navigate = useNavigate();


    // UseEffect to log useData
    useEffect(() => {
        console.log("User Data: ", userData);
    }, [userData]);

    // Updates and stores memory text data from user input
    const handleChange = (e) => {
        const { name, value } = e.target;

        setMemoryData(prev => ({ ...prev, [name]: value }));

        if (name === "memoryDescriptionInput") {
            setCharCount(300 - value.length);
        }
    };

    // Updates and stores memory image from user input
    const handleImgChange = (e) => {
        setMemoryImg(e.target.files[0]);
    };

    // Uploads the memory to the database
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Set data into a FormData object since an image file will be passed
        const formData = new FormData();
        formData.append("creator", userData.username);
        formData.append("date", memoryData.memoryDateInput);
        formData.append("desc", memoryData.memoryDescriptionInput);
        formData.append("img", memoryImg);
    
        // Tries to post the data to the database
        try {
            const res = await axios.post("https://all-my-seasons-express-api.vercel.app/api/memories", 
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if(res.status === 200){
                console.log("Memory created successfully");
            }
            navigate("/home");
        } catch (error) {
            alert("Failed to post memory. Please try again.");
            console.error("Error posting memory:", error);
        }
    }
    


    // ---------- JSX HTML RETURN ----------
    return (
        <div className="create-memory-page">
            <div className="top-left-button">
                <button className="home-button" onClick={() => navigate('/home')}>Back to Home</button>
            </div>
            
            <div className="create-memory-form-container">
                <h1>Create a Memory</h1>

                <form className="createMemoryForm" onSubmit={handleSubmit}>
                    <div className="form-input">
                        <label htmlFor="memoryDateInput">Enter The Date of the Memory: </label>
                        <input type="date" name="memoryDateInput" required onChange={handleChange} />
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
                            onChange={handleChange}
                        />
                        <p>{charCount} characters remaining</p>
                    </div>

                    <div className="form-input">
                        <label htmlFor="memoryImageInput">Memory Image: </label>
                        <br/>
                        <p style={{marginTop: "0px", marginBottom:"0px"}}>*only accepts jpg and jpeg*</p>
                        <input type="file" name="memoryImageInput" accept=".jpeg, .jpg" required onChange={handleImgChange} />
                    </div>

                    <div className="form-input">
                        <button type="submit">Submit Memory</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateMemory;
