import React, { useState, FormEvent } from 'react';

interface Character {
  name: string;
  race: string;
  class: string;
  level: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  background: string;
}

const CharacterSheet: React.FC = () => {
  const [character, setCharacter] = useState<Character>({
    name: '',
    race: '',
    class: '',
    level: 1,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    background: ''
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCharacter((prev) => ({
      ...prev,
      [name]:
        name === 'level' ||
        name === 'strength' ||
        name === 'dexterity' ||
        name === 'constitution' ||
        name === 'intelligence' ||
        name === 'wisdom' ||
        name === 'charisma'
          ? parseInt(value, 10)
          : value
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Handle your submit logic here (e.g., send data via Electron IPC)
    console.log('Character submitted:', character);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}
    >
      <h1>RPG Character Sheet</h1>

      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={character.name}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="race">Race:</label>
        <input
          type="text"
          id="race"
          name="race"
          value={character.race}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="class">Class:</label>
        <input
          type="text"
          id="class"
          name="class"
          value={character.class}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="level">Level:</label>
        <input
          type="number"
          id="level"
          name="level"
          value={character.level}
          onChange={handleChange}
        />
      </div>

      <h2>Attributes</h2>

      <div>
        <label htmlFor="strength">Strength:</label>
        <input
          type="number"
          id="strength"
          name="strength"
          value={character.strength}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="dexterity">Dexterity:</label>
        <input
          type="number"
          id="dexterity"
          name="dexterity"
          value={character.dexterity}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="constitution">Constitution:</label>
        <input
          type="number"
          id="constitution"
          name="constitution"
          value={character.constitution}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="intelligence">Intelligence:</label>
        <input
          type="number"
          id="intelligence"
          name="intelligence"
          value={character.intelligence}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="wisdom">Wisdom:</label>
        <input
          type="number"
          id="wisdom"
          name="wisdom"
          value={character.wisdom}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="charisma">Charisma:</label>
        <input
          type="number"
          id="charisma"
          name="charisma"
          value={character.charisma}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="background">Background:</label>
        <textarea
          id="background"
          name="background"
          value={character.background}
          onChange={handleChange}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <button type="submit">Submit</button>
      </div>
    </form>
  );
};

export default CharacterSheet;