import React, { useState, useEffect, useCallback } from "react";
import { ref, onValue, get, update } from "firebase/database";
import { database } from "./firebase-config"; // Import your Firebase configuration

const App = () => {
  // State for user inputs
  const dataCollName = "Dairy";
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");
  const [input3, setInput3] = useState("");
  const [validationKey, setvalidationKey] = useState("");
  const [data, setData] = useState([]); // To store fetched data
  // const currentDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  const generateRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // const currentDate = `2025-01-${String(generateRandomNumber(1, 30)).padStart(
  //   2,
  //   "0"
  // )}`;
  // Conditionally set the current date based on dataCollName
  const currentDate =
    dataCollName === "Dairy"
      ? new Date().toISOString().split("T")[0] // "YYYY-MM-DD"
      : `2025-01-${String(generateRandomNumber(1, 30)).padStart(2, "0")}`;

  // Function to write data to Realtime Database
  const fetchValkey = useCallback(() => {
    const dairyRef = ref(database, "validation");

    const unsubscribe = onValue(dairyRef, (snapshot) => {
      if (snapshot.exists()) {
        setvalidationKey(snapshot.val());
      } else {
        setvalidationKey("");
      }
    });

    return () => unsubscribe(); // Clean up listener
  }, []);

  const fetchData = useCallback(() => {
    const dairyRef = ref(database, dataCollName);

    const unsubscribe = onValue(dairyRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedData = Object.entries(snapshot.val()).map(
          ([date, records]) => ({
            date,
            ...records,
          })
        );
        setData(fetchedData);
      } else {
        setData([]);
      }
    });

    return () => unsubscribe(); // Clean up listener
  }, []);

  useEffect(() => {
    fetchValkey();
    fetchData();
  }, [fetchValkey, fetchData]);

  const writeData = () => {
    if (input1 === "" || input2 === "") {
      alert("Please fill in both inputs.");
      return;
    } else if (validationKey !== input3) {
      alert("You are not authorized ");
      return;
    }

    const dateRef = ref(database, `${dataCollName}/${currentDate}`);

    get(dateRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          alert("Data already exists for the given date.");
        } else {
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
    console.log(validationKey);
  };
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
            <i className="bi bi-droplet-half"></i>
            <input
              type="number"
              value={input1}
              placeholder="Morning"
              onChange={(e) => setInput1(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="input-field">
            <i className="bi bi-droplet-half"></i>
            <input
              type="number"
              value={input2}
              placeholder="Evening"
              onChange={(e) => setInput2(e.target.value)}
            />
          </div>
          <div className="input-field">
            <i className="bi bi-shield-lock-fill"></i>
            <input
              type="text"
              value={input3}
              placeholder="PassKey"
              onChange={(e) => setInput3(e.target.value)}
            />
          </div>
          <button className="form-btn btn  " onClick={writeData}>
            <span>
              Add
              <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
            </span>
          </button>
          <h2 className="title">Milk Records</h2>
          <ul>
            {data
              .slice()
              .reverse()
              .map((item) => (
                <li key={item.date}>
                  <strong>Date:</strong> {item.date} -:-<strong> Total:</strong>{" "}
                  {Number(item.Evening) + Number(item.Morning)} L
                  <br />
                  <strong>Morning:</strong> {item.Morning} L -:-{" "}
                  <strong>Evening:</strong> {item.Evening} L
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
