import React, { useState } from 'react';

const MicrowaveControlPanel: React.FC = () => {
    // Component state
    const [powerLevel, setPowerLevel] = useState('Medium');
    const [mode, setMode] = useState('Cook');
    const [timer, setTimer] = useState(30); // seconds
    const [temperature, setTemperature] = useState(100); // °F
    // Keypad input is maintained as a string to allow incremental editing.
    const [keypadInput, setKeypadInput] = useState(timer.toString());

    // Handle form submission
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        console.log('Submitted settings:', { powerLevel, mode, timer, temperature });
    };

    // Synchronize timer and keypad when slider or numeric input changes.
    const handleTimerChange = (value: number) => {
        setTimer(value);
        setKeypadInput(value.toString());
    };

    // Handle keypad button clicks.
    const handleKeypadClick = (value: string) => {
        let newInput = keypadInput;
        if (value === 'Clear') {
            newInput = '';
        } else if (value === 'Backspace') {
            newInput = newInput.slice(0, -1);
        } else {
            // Replace if empty or currently "0"
            newInput = (newInput === '' || newInput === '0') ? value : newInput + value;
        }
        // Parse the new input as a number; if valid, clamp it between 0 and 300.
        const numericValue = parseInt(newInput, 10);
        const clampedValue = !isNaN(numericValue)
            ? Math.max(0, Math.min(300, numericValue))
            : 0;
        setTimer(clampedValue);
        setKeypadInput(newInput);
    };

    // Inline styles for layout and alignment
    const containerStyle: React.CSSProperties = {
        maxWidth: '400px',
        margin: '40px auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        fontFamily: 'Arial, sans-serif'
    };

    const formGroupStyle: React.CSSProperties = {
        marginBottom: '15px',
        display: 'flex',
        flexDirection: 'column'
    };

    const labelStyle: React.CSSProperties = {
        marginBottom: '5px',
        fontWeight: 600
    };

    const sliderContainerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center'
    };

    const sliderStyle: React.CSSProperties = {
        flexGrow: 1,
        marginRight: '10px'
    };

    const keypadContainerStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridGap: '10px'
    };

    const keypadButtonStyle: React.CSSProperties = {
        padding: '15px',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'pointer',
        textAlign: 'center'
    };

    const buttonStyle: React.CSSProperties = {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    };

    return (
        <div style={containerStyle}>
            <h2 style={{ textAlign: 'center' }}>Microwave Oven Control Panel</h2>
            <form onSubmit={handleSubmit}>
                {/* Power Level Dropdown */}
                <div style={formGroupStyle}>
                    <label htmlFor="powerLevel" style={labelStyle}>Power Level</label>
                    <select
                        id="powerLevel"
                        value={powerLevel}
                        onChange={(e) => setPowerLevel(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px' }}
                    >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>

                {/* Mode Dropdown */}
                <div style={formGroupStyle}>
                    <label htmlFor="mode" style={labelStyle}>Mode</label>
                    <select
                        id="mode"
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px' }}
                    >
                        <option value="Cook">Cook</option>
                        <option value="Defrost">Defrost</option>
                        <option value="Reheat">Reheat</option>
                    </select>
                </div>

                {/* Timer with Slider and Numeric Entry */}
                <div style={formGroupStyle}>
                    <label htmlFor="timer" style={labelStyle}>Timer (seconds):</label>
                    <div style={sliderContainerStyle}>
                        <input
                            type="range"
                            id="timer"
                            min="0"
                            max="300"
                            value={timer}
                            onChange={(e) => handleTimerChange(Number(e.target.value))}
                            style={sliderStyle}
                        />
                        <input
                            type="number"
                            min="0"
                            max="300"
                            value={timer}
                            onChange={(e) => handleTimerChange(Number(e.target.value))}
                            style={{ width: '60px', marginLeft: '10px' }}
                        />
                    </div>
                </div>

                {/* Keypad Entry */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Keypad Entry:</label>
                    <div style={keypadContainerStyle}>
                        {['1','2','3','4','5','6','7','8','9','Clear','0','Backspace'].map((key) => (
                            <button
                                type="button"
                                key={key}
                                onClick={() => handleKeypadClick(key)}
                                style={keypadButtonStyle}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                        <strong>Current Keypad Value:</strong> {keypadInput || '0'}
                    </div>
                </div>

                {/* Temperature Slider */}
                <div style={formGroupStyle}>
                    <label htmlFor="temperature" style={labelStyle}>Temperature (°F): {temperature}</label>
                    <div style={sliderContainerStyle}>
                        <input
                            type="range"
                            id="temperature"
                            min="100"
                            max="500"
                            value={temperature}
                            onChange={(e) => setTemperature(Number(e.target.value))}
                            style={sliderStyle}
                        />
                        <span>{temperature} °F</span>
                    </div>
                </div>

                {/* Submit Button */}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button type="submit" style={buttonStyle}>Submit</button>
                </div>
            </form>
        </div>
    );
};

export default MicrowaveControlPanel;