// ---------- IMPORTS ----------
// Package imports
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';

// Component imports
import './App.css';
import { LoginContext } from './Contexts/UserDataContext';
import CreateAccount from './pages/CreateAccount';
import Login from './pages/Login';
import Home from './pages/Home';
import CreateMemory from './pages/CreateMemory';
import Memories from './pages/Memories';
import UpdateMemory from './pages/UpdateMemory';
import Default from './pages/Default';
import Profile from './pages/Profile';
// ---------- IMPORTS END ----------



// ---------- REACT COMPONENT ----------
function App() {
  const [userData, setUserData] = useState(null);
  const [loginStatus, setLoginStatus] = useState(false);
  const [memories, setMemories] = useState([]);


  // Sets the title the application on the tabs bar
  useEffect(() => {
    document.title = 'All My Seasons';
  }, []);

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
              setLoginStatus(true);
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
      };
    fetchUserData();
  }, []);

  // Fetches the all of the user's memories from the database
  useEffect(() => {
    const fetchAllMemories = async () => {
        try {
            const res = await axios.get("https://all-my-seasons-express-api.vercel.app/api/memories", {
                params: {
                    username: userData.username,
                    soulmate: userData.soulmate,
                }
            });

            if (res.status === 200) {
                console.log('Memory data:', res.data);
                setMemories(res.data);

                const preloadImages = (allMemories) => {
                  allMemories.forEach((memoryImg) => {
                    const img = new Image();
                    img.src = memoryImg.img;
                  });
                };
                preloadImages(res.data);
            }
        } catch (err) {
            console.log(err);
        }
    };
    if (userData) {
        fetchAllMemories();
    }
}, [userData]);

  // UseEffect to log loginStatus
  useEffect(() => {
    console.log("Login Status: ", loginStatus)
  }, [loginStatus]);



  // ---------- JSX HTML RETURN ----------
  return (
    <BrowserRouter>
      <LoginContext.Provider value={{ userData, setUserData, setLoginStatus, memories, setMemories,}}>
        <Routes>
          {loginStatus ? (
          <>
            <Route path="/" element={<Default />} />
            <Route path="/createaccount" element={<CreateAccount />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/creatememory" element={<CreateMemory />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/updatememory/:memoryId" element={<UpdateMemory />} />
            <Route path="/profile" element={<Profile />} />
          </>
          ) :  (
          <>
            <Route path="/" element={<Default />} />
            <Route path="/createaccount" element={<CreateAccount />} />
            <Route path="/login" element={<Login />} />
          </>)}
          
        </Routes>
      </LoginContext.Provider>
    </BrowserRouter>
  );
}

export default App;
