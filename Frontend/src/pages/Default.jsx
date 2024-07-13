import React from 'react'
import { useNavigate } from 'react-router-dom';

function Default() {
    const navigate = useNavigate();

  return (
    <div className='default-page'>
        <h1>Welcome to All My Seasons</h1>

        <div className="about-section">
            <h2>About</h2>
            <p>
                <span className="gold-text">All My Seasons</span> is a online photo album website to store
                your precious memories in the cloud. I, the creator, created this website as an online photo
                album to store my memories with my beautiful girlfriend. Following this motivation, the name 
                "All My Seasons," was inspiried by the a lyric from the song "Seaons" by the band Wave to 
                Earth: "If I could be by your side, I’ll give you all my life, my seasons." Of course, I'm 
                not the memory police and you, as the user, are not forced to upload only romantic memories.
            </p>
        </div>

        <div className="login-or-create-account">
            <button style={{marginRight: "30px"}} onClick={() => navigate("/login")}>Login</button>
            <button onClick={() => navigate("/createaccount")}>Create Account</button>
        </div>
    </div>
  )
}

export default Default