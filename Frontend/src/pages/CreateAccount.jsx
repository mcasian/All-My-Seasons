// ---------- IMPORTS ----------
import React, { useState} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// ---------- IMPORTS END ----------



// ---------- REACT COMPONENT ----------
function CreateAccount() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();


    // Submits a new account to the database
    const handleSubmit = async (e) => {
        e.preventDefault();

        //Valiate password requirements
        if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
            alert('Password does not meet the requirements.');
            return;
        }

        // Tries to post the new account to the database
        try{
            const response = await axios.post('https://all-my-seasons-express-api.vercel.app/api/createAccount', {
                username,
                password,
            });
            if (response.status === 201) {
                alert('Your account was successfully created');
                console.log('Account creation successful:', response.data);
                navigate('/');
            }
        } catch(error){
            console.log(error);
        }
    }



    // ---------- JSX HTML RETURN ----------
    return (
        <div>
            <h1>Welcome to All My Seasons</h1>
            <h1>Create an Account</h1>

            <form className="createAccountForm" onSubmit={handleSubmit}>
                <input type="text" id="username" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)} />
                <input type="text" id="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                <div style={{fontSize: '12px', marginBottom: "10px"}}>Password must have at least 8 characters, include both uppercase and lowercase letters, a number, and a special character.</div>
                <button type="submit">Create Account</button>
            </form>
            <p style={{marginTop: "10px", marginBottom: "5px"}}>Already have an account?</p>
            <a id="loginLink" href="/">Login To Existing Account</a>
        </div>
    )
}

export default CreateAccount