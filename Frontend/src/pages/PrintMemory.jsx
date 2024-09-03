import {React, useContext, useEffect} from 'react';
import { LoginContext } from '../Contexts/UserDataContext';
import "../style/PrintMemories.css";


const PrintMemory = () => {
    const {memories} = useContext(LoginContext);
    const sortMemoriesByDateAscending = (memories) => {
        return [...memories].sort((a, b) => new Date(a.date) - new Date(b.date));
    };
    const sortedMemories = sortMemoriesByDateAscending(memories);

    useEffect(() => {
        window.alert("*THIS ONLY WORKS ON PC* Press ctrl + p to print this page after it fully loads. " +
            "Ensure the layout is on portrait and everything looks correct before printing. Note, " + 
            "this feature is a work in process and bugs may occur.");
    }, []);

    return (
        <div className="print-memories-page">
            <div className="memories">
                {sortedMemories.map((memory) => (
                    <div className='print-memory' key={memory.id}>

                        <div className="print-creator-tag">
                            <p>Added by <span><strong>{memory.creator}</strong></span></p>
                        </div>
                        
                        <div className="print-imageContainer">
                            <img src={memory.imageUrl} alt="za memory" style={{ borderRadius: "30px" }} />
                        </div>

                        <div className="print-memoryText">
                            <div className="print-memoryDateContainer">
                                <h1>{memory.date}</h1>
                            </div>
                            <div className="print-memoryDescriptionContainer">
                                <p>{memory.desc}</p>
                            </div>
                        </div>
                        
                    </div>
                ))}
                </div>
        </div>
    );
};

export default PrintMemory;
