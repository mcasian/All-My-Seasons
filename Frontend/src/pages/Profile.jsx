import React, { useContext, useState, useEffect } from 'react';
import { LoginContext } from '../Contexts/UserDataContext';
import "../style/Profile.css";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
    const { userData, setUserData, setLoginStatus } = useContext(LoginContext);
    const [soulmate, setSoulmate] = useState("");
    const [soulmateRequests, setSoulmateRequests] = useState([]);
    const navigate = useNavigate();

    
    useEffect(() => {
        const fetchSoulmateRequests = async () => {
            if (userData && !userData.soulmate) {
                try {
                    const res = await axios.get("https://all-my-seasons-express-api.vercel.app/api/soulmate-requests", {
                        params: { username: userData.username }
                    });
                    setSoulmateRequests(res.data);
                } catch (err) {
                    console.log("Error fetching soulmate requests: ", err);
                }
            }
        };
        fetchSoulmateRequests();
    }, [userData]);

    const logout = () => {
        localStorage.removeItem('token');
        setUserData(null);
        setLoginStatus(false);
        console.log("User is being logged out");
        navigate("/");
        window.location.reload();
    };

    const acceptSoulmateRequest = async (senderUsername) => {
        try{
            const res = await axios.put("https://all-my-seasons-express-api.vercel.app/api/soulmate-request", null, {
                params: {
                    requester: senderUsername,
                    reciever: userData.username
                }
            });            
            
            if(res.status === 200){
                console.log("Your soulmate request from " + senderUsername + " has been accepted");
                alert("Your soulmate request from " + senderUsername + " has been accepted");
                window.location.reload();
            }
        } catch (err) {
            alert("There was an error accepting the soulmate request. Please try again");
            console.log("An error occurred when attempting to accept soulmate request", err);
            window.location.reload();
        }
    }

    const declineSoulmateRequest = async (senderUsername) => {
        try{
            const res = await axios.delete("https://all-my-seasons-express-api.vercel.app/api/soulmate-request", {
                params: {
                    requester: senderUsername,
                    reciever: userData.username
                }
            });            
            
            if(res.status === 200){
                console.log("Your soulmate request from " + senderUsername + " has been deleted");
                alert("All soulmate requests from " + senderUsername + " has been deleted");
                window.location.reload();
            }
        } catch (err) {
            alert("There was an error deleting the specified soulmate request(s). Please try again");
            console.log("An error occurred when attempting to delete the specified soulmate request(s)", err);
            window.location.reload();
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post("https://all-my-seasons-express-api.vercel.app/api/soulmate-request", {
                requester: userData.username,
                reciever: soulmate
            });

            if (response.status === 200) {
                console.log("Soulmate request successful");
                alert("Soulmate request successfully sent to " + soulmate);
            }
        } catch (err) {
            alert("Failed to send soulmate request. It is likely that this user either does not exist or already has a soulmate");
            console.error("Error sending soulmate request:", err);
        }
    };



    return (
        <div className="profile-page">
            <div className="top-left-button">
                <button className="home-button" onClick={() => navigate('/home')}>Back to Home</button>
            </div>
            
            <div className="top-right-button">
                <button className="logout-button" onClick={logout}>Logout</button>
            </div>
            
            <h1>{userData.username}</h1>

            {userData.soulmate ? 
                <>
                    <h2>Your soulmate is {userData.soulmate}</h2>
                </> 
            : 
                <>
                    <div className="soulmate-request-search">
                        <form className="soulmate-request-form" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Search for a soulmate"
                                onChange={(e) => setSoulmate(e.target.value)}
                                className="search-input"
                            />
                            <button type="submit" className="search-button">Search</button>
                        </form>
                    </div>

                    <div className="soulmate-request-listing">
                        <h2>Soulmate Requests:</h2>
                        {soulmateRequests.map((request) => (
                            <div className="soulmate-request" key={request.id}>
                                <h3>{request.sender}</h3>
                                <div className="buttons">
                                    <button className="accept-button" onClick={() => acceptSoulmateRequest(request.sender)}>Accept</button>
                                    <button className="decline-button" onClick={() => declineSoulmateRequest(request.sender)}>Decline</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            }
        </div>
    );
}

export default Profile;