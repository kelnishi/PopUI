import React, { useState } from 'react';

const CharacterSheet: React.FC = () => {
    // State for basic info
    const [name, setName] = useState('');
    const [race, setRace] = useState('Human');
    const [charClass, setCharClass] = useState('Fighter');
    const [alignment, setAlignment] = useState('True Neutral');
    const [level, setLevel] = useState(1);

    // State for ability scores
    const [strength, setStrength] = useState(10);
    const [dexterity, setDexterity] = useState(10);
    const [constitution, setConstitution] = useState(10);
    const [intelligence, setIntelligence] = useState(10);
    const [wisdom, setWisdom] = useState(10);
    const [charisma, setCharisma] = useState(10);

    // State for additional picker widget (e.g., hair color)
    const [hairColor, setHairColor] = useState('#000000');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const characterData = {
            name,
            race,
            class: charClass,
            alignment,
            level,
            abilities: { strength, dexterity, constitution, intelligence, wisdom, charisma },
            hairColor,
        };
        console.log('Submitted character:', characterData);
        // Additional submission logic can be added here.
    };

    // Inline styling objects for good alignment and visual appeal
    const containerStyle: React.CSSProperties = {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
    };

    const sectionStyle: React.CSSProperties = {
        marginBottom: '20px',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '8px',
        marginBottom: '10px',
        borderRadius: '4px',
        border: '1px solid #ccc',
    };

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
    };

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
    };

    return (
        <div style={containerStyle}>
            <h2>Edit RPG Character Sheet</h2>
            <form onSubmit={handleSubmit}>
                {/* Character Name */}
                <div style={sectionStyle}>
                    <label style={labelStyle} htmlFor="name">Character Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        style={inputStyle}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter character name"
                    />
                </div>

                {/* Race Dropdown */}
                <div style={sectionStyle}>
                    <label style={labelStyle} htmlFor="race">Race</label>
                    <select
                        id="race"
                        value={race}
                        style={inputStyle}
                        onChange={(e) => setRace(e.target.value)}
                    >
                        <option value="Human">Human</option>
                        <option value="Elf">Elf</option>
                        <option value="Dwarf">Dwarf</option>
                        <option value="Halfling">Halfling</option>
                        <option value="Orc">Orc</option>
                    </select>
                </div>

                {/* Class Dropdown */}
                <div style={sectionStyle}>
                    <label style={labelStyle} htmlFor="class">Class</label>
                    <select
                        id="class"
                        value={charClass}
                        style={inputStyle}
                        onChange={(e) => setCharClass(e.target.value)}
                    >
                        <option value="Fighter">Fighter</option>
                        <option value="Wizard">Wizard</option>
                        <option value="Rogue">Rogue</option>
                        <option value="Cleric">Cleric</option>
                        <option value="Ranger">Ranger</option>
                        <option value="Paladin">Paladin</option>
                    </select>
                </div>

                {/* Alignment Dropdown */}
                <div style={sectionStyle}>
                    <label style={labelStyle} htmlFor="alignment">Alignment</label>
                    <select
                        id="alignment"
                        value={alignment}
                        style={inputStyle}
                        onChange={(e) => setAlignment(e.target.value)}
                    >
                        <option value="Lawful Good">Lawful Good</option>
                        <option value="Neutral Good">Neutral Good</option>
                        <option value="Chaotic Good">Chaotic Good</option>
                        <option value="Lawful Neutral">Lawful Neutral</option>
                        <option value="True Neutral">True Neutral</option>
                        <option value="Chaotic Neutral">Chaotic Neutral</option>
                        <option value="Lawful Evil">Lawful Evil</option>
                        <option value="Neutral Evil">Neutral Evil</option>
                        <option value="Chaotic Evil">Chaotic Evil</option>
                    </select>
                </div>

                {/* Level Slider */}
                <div style={sectionStyle}>
                    <label style={labelStyle} htmlFor="level">Level: {level}</label>
                    <input
                        type="range"
                        id="level"
                        value={level}
                        style={{ width: '100%' }}
                        min={1}
                        max={20}
                        onChange={(e) => setLevel(parseInt(e.target.value))}
                    />
                </div>

                {/* Ability Scores using sliders in a grid layout */}
                <div style={sectionStyle}>
                    <h3>Ability Scores</h3>
                    <div style={gridStyle}>
                        <div>
                            <label style={labelStyle} htmlFor="strength">Strength: {strength}</label>
                            <input
                                type="range"
                                id="strength"
                                value={strength}
                                style={{ width: '100%' }}
                                min={1}
                                max={20}
                                onChange={(e) => setStrength(parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <label style={labelStyle} htmlFor="dexterity">Dexterity: {dexterity}</label>
                            <input
                                type="range"
                                id="dexterity"
                                value={dexterity}
                                style={{ width: '100%' }}
                                min={1}
                                max={20}
                                onChange={(e) => setDexterity(parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <label style={labelStyle} htmlFor="constitution">Constitution: {constitution}</label>
                            <input
                                type="range"
                                id="constitution"
                                value={constitution}
                                style={{ width: '100%' }}
                                min={1}
                                max={20}
                                onChange={(e) => setConstitution(parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <label style={labelStyle} htmlFor="intelligence">Intelligence: {intelligence}</label>
                            <input
                                type="range"
                                id="intelligence"
                                value={intelligence}
                                style={{ width: '100%' }}
                                min={1}
                                max={20}
                                onChange={(e) => setIntelligence(parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <label style={labelStyle} htmlFor="wisdom">Wisdom: {wisdom}</label>
                            <input
                                type="range"
                                id="wisdom"
                                value={wisdom}
                                style={{ width: '100%' }}
                                min={1}
                                max={20}
                                onChange={(e) => setWisdom(parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <label style={labelStyle} htmlFor="charisma">Charisma: {charisma}</label>
                            <input
                                type="range"
                                id="charisma"
                                value={charisma}
                                style={{ width: '100%' }}
                                min={1}
                                max={20}
                                onChange={(e) => setCharisma(parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Color Picker for Hair Color */}
                <div style={sectionStyle}>
                    <label style={labelStyle} htmlFor="hairColor">Hair Color</label>
                    <input
                        type="color"
                        id="hairColor"
                        value={hairColor}
                        style={{ width: '100%', height: '40px', border: 'none', padding: '0' }}
                        onChange={(e) => setHairColor(e.target.value)}
                    />
                </div>

                {/* Submit Button */}
                <button type="submit" style={buttonStyle}>Submit</button>
            </form>
        </div>
    );
};

export default CharacterSheet;