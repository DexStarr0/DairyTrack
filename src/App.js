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

  const generateRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  // List of month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  // Get the current date
  const CurrDate = new Date();

  // Extract year, month, and day
  const year = CurrDate.getFullYear();
  const month = monthNames[CurrDate.getMonth()]; // Months are 0-based, so adding 1
  const day = String(CurrDate.getDate()).padStart(2, "0");

  const today =
    dataCollName === "Dairy"
      ? day
      : `${String(generateRandomNumber(1, 30)).padStart(2, "0")}`;

  // Format the date as "YYYY-MM-DD"
  const currentDate = `${today}-${month}-${year}`;
  const dataWriteDir = `${dataCollName}/${year}/${month}/${today}`;
  const datafetchDir = `${dataCollName}/${year}/${month}`;
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
    const dairyRef = ref(database, datafetchDir);

    const unsubscribe = onValue(dairyRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log(snapshot.val());
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
  }, [datafetchDir]);

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

    const dateRef = ref(database, dataWriteDir);

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
              setInput3("");
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
          <h2 className="title">Daily Dairy Tracker</h2>
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
              type="password"
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
          <h2 className="title">Records -:- {month}</h2>
          <ul>
            {data
              .slice()
              .reverse()
              .map((item) => (
                <li key={item.date}>
                  <strong>Date:-</strong>
                  {item.date}-{month} -:-<strong> Total:</strong>{" "}
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
