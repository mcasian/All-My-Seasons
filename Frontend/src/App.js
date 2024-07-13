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
// ---------- IMPORTS END ----------



// ---------- REACT COMPONENT ----------
function App() {
  const [userData, setUserData] = useState(null);
  const [loginStatus, setLoginStatus] = useState(false);


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
              setLoginStatus(true)
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
      };
    fetchUserData();
  }, [setUserData]);

  // UseEffect to log loginStatus
  useEffect(() => {
    console.log("Login Status: ", loginStatus)
  }, [loginStatus]);



  // ---------- JSX HTML RETURN ----------
  return (
    <BrowserRouter>
      <LoginContext.Provider value={{ userData, setUserData, setLoginStatus}}>
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
