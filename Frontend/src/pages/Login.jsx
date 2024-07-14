// ---------- IMPORTS ----------
import React, { useState, useContext } from 'react';
import { LoginContext } from '../Contexts/UserDataContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// ---------- IMPORTS END ----------



// ---------- REACT COMPONENT ----------
function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { setUserData, setLoginStatus } = useContext(LoginContext);
    const navigate = useNavigate();


    // Logs the user in and stores a login token in local storage if a valid username and password are inputted
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Tries to validate login with the database
        try {
            const response = await axios.post('https://all-my-seasons-express-api.vercel.app/api/login', {
                username, password 
            });

            // If successful, the user is logged in and a token is stored
            if (response.status === 200) {
                const { loginToken: token } = response.data;  // Destructure correctly
                console.log("Login JWT Token: ", token);
                localStorage.setItem('token', token); // Store the token

                try {
                    const decodedUserData = await axios.get('https://all-my-seasons-express-api.vercel.app/api/user', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                     });
                    setUserData(decodedUserData.data);
                    setLoginStatus(true)
                } catch (error) {
                  console.error('Error fetching user data:', error);
                }
                
                alert('Login successful');
                navigate("/home");
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Invalid username or password');
        }
    };



    // ---------- JSX HTML RETURN ----------
    return (
        <div className="login-page">
            <div className="login-form-container">
                <h1>Welcome to<br/>All My Seasons</h1>
                <form className="loginForm" onSubmit={handleSubmit}>
                    <h2>Login</h2>
                    <input type="text" id="username" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)} />
                    <input type="password" id="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="submit">Login</button>
                </form>
                <div className="noAccountLink">
                    <p>Don't have an account?</p>
                    <a href="/createaccount">Create an Account</a>
                </div>
            </div>
        </div>
    );
}

export default Login;
