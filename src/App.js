import React, { useState, useEffect } from "react";
import { ref, onValue, get, update } from "firebase/database";
import { database } from "./firebase-config"; // Import your Firebase configuration

const App = () => {
  // State for user inputs
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");
  const [data, setData] = useState([]); // To store fetched data
  const currentDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  // const generateRandomNumber = (min, max) => {
  //   return Math.floor(Math.random() * (max - min + 1)) + min;
  // };

  // const currentDate = `2025-01-${String(generateRandomNumber(1, 30)).padStart(
  //   2,
  //   "0"
  // )}`;
  // Function to write data to Realtime Database
  const writeData = () => {
    if (input1 === "" || input2 === "") {
      alert("Please fill in both inputs.");
      return;
    }

    // Get the current date in YYYY-MM-DD format

    // Reference to the specific date node in the "Dairy" collection
    const dateRef = ref(database, `Dairy/${currentDate}`);

    // Check if data already exists for the date
    get(dateRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          alert("Data already exists for the given date.");
        } else {
          // Data does not exist, update with new entries
          update(dateRef, {
            Morning: input1,
            Evening: input2,
          })
            .then(() => {
              alert("Data added successfully!");
              setInput1("");
              setInput2("");
            })
            .catch((error) => {
              console.error("Error writing data: ", error);
            });
        }
      })
      .catch((error) => {
        console.error("Error checking existing data: ", error);
      });
  };

  const fetchData = () => {
    const dairyRef = ref(database, "Dairy");

    onValue(dairyRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedData = Object.entries(snapshot.val()).map(
          ([date, records]) => ({
            date, // The date (e.g., 2025-01-23)
            ...records, // Morning and Evening data
          })
        );
        setData(fetchedData); // Save the fetched data to state
      } else {
        setData([]); // If no data exists, reset state
      }
    });
  };
  // Fetch data when the component mounts
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      {/* {/* //sdfpj  */}
      <div className="container">
        <div className="form">
          <h2 className="title">Daily Milk Track</h2>
          <div>
            <strong>Date:</strong> {currentDate} <br />
          </div>
          <div className="input-field">
            <i class="bi bi-droplet-half"></i>
            <input
              type="number"
              value={input1}
              placeholder="Morning"
              onChange={(e) => setInput1(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="input-field">
            <i class="bi bi-droplet-half"></i>
            <input
              type="number"
              value={input2}
              placeholder="Evening"
              onChange={(e) => setInput2(e.target.value)}
            />
          </div>
          <button className="form-btn btn  " onClick={writeData}>
            <span>
              Add
              <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
            </span>
          </button>
          <h2>Milk Records</h2>
          <ul>
            {data.map((item) => (
              <li key={item.date}>
                <strong>Date:</strong> {item.date} <br />
                <strong>Morning:</strong> {item.Morning} litres :{" "}
                <strong>Evening:</strong> {item.Evening} litres
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* <h1>Daily Milk Track</h1>
      <div>
        <strong>Date:</strong> {currentDate} <br />
        <label></label>
        <br />
        <label>
          Morning:{" "}
          <input
            type="number"
            value={input1}
            onChange={(e) => setInput1(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Evening:{" "}
          <input
            type="number"
            value={input2}
            onChange={(e) => setInput2(e.target.value)}
          />
        </label>
      </div>
      <button onClick={writeData}>Add Data</button>
      <h2>Milk Records</h2>
      <ul>
        {data.map((item) => (
          <li key={item.date}>
            <strong>Date:</strong> {item.date} <br />
            <strong>Morning:</strong> {item.Morning} litres :{" "}
            <strong>Evening:</strong> {item.Evening} litres
          </li>
        ))}
      </ul> */}
    </div>
  );
};

export default App;
