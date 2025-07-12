import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ref, onValue, get, update } from "firebase/database";
import { database } from "./firebase-config";
import "./App.css";
import { toast, ToastContainer } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";

const AuthStatus = {
  PRIME: "prime",
  NON_PRIME: "nonPrime",
  INVALID: "false",
};

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

const App = () => {
  const dataCollName = "Dairy";
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize date-related values

  const { currentDate, currentDate_name, datafetchDir } = useMemo(() => {
    const currDate = new Date();
    const currentYear = currDate.getFullYear();
    const currentMonth = currDate.getMonth();
    const currentDay = String(currDate.getDate()).padStart(2, "0");

    // For currentDate_name (always today's date)
    const currentMonthName = monthNames[currentMonth];
    const todayDateName = `${currentDay}-${currentMonthName}-${currentYear}`;

    // For form date and data directory (uses selectedMonth)
    const selectedMonthName = monthNames[selectedMonth];
    const formDateYear = currDate.getFullYear();
    const formDate = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${currentDay}`;

    return {
      currentDate: formDate,
      currentDate_name: todayDateName,
      datafetchDir: `${dataCollName}/${formDateYear}/${selectedMonthName}`,
    };
  }, [selectedMonth]); // Only re-calculate when selectedMonth changes
  // console.log(currentDate);
  const [formState, setFormState] = useState({
    Morning: "",
    Evening: "",
    date: currentDate,
    passkey: "Family123",
    isValid: AuthStatus.INVALID,
  });

  const [data, setData] = useState([]);

  // Calculate total milk production for the selected month
  const totalMilkProduction = useMemo(() => {
    return data.reduce((total, item) => {
      const morning = Number(item.Morning ?? 0);
      const evening = Number(item.Evening ?? 0);
      return total + morning + evening;
    }, 0);
  }, [data]);

  const validateUser = useCallback(async () => {
    try {
      if (formState.passkey === "") {
        throw new Error("पासवर्ड बॉक्स खाली है");
      }

      const dairyRef = ref(database, "valildUser");
      const snapshot = await get(dairyRef);

      if (snapshot.exists()) {
        const { prime, nonPrime } = snapshot.val();
        let authState = AuthStatus.INVALID;

        if (prime === formState.passkey) {
          authState = AuthStatus.PRIME;
        } else if (nonPrime === formState.passkey) {
          authState = AuthStatus.NON_PRIME;
        }

        setFormState((prev) => ({
          ...prev,
          isValid: authState,
          passkey: authState !== AuthStatus.INVALID ? "" : prev.passkey,
        }));

        if (authState === AuthStatus.PRIME) {
          toast.success("Hello Boss 😎");
        } else if (authState === AuthStatus.NON_PRIME) {
          toast.success("Hello family 💖");
        } else {
          toast.error("पासवर्ड गलत है।");
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, [formState.passkey]);

  const fetchData = useCallback(() => {
    const dairyRef = ref(database, datafetchDir);
    return onValue(
      dairyRef,
      (snapshot) => {
        const fetchedData = snapshot.exists()
          ? Object.entries(snapshot.val())
              .map(([date, values]) => ({
                date,
                ...values,
              }))
              .reverse()
          : [];
        setData(fetchedData);
      },
      (error) => {
        toast.error("डेटा प्राप्त करने में त्रुटि है।");
      }
    );
  }, [datafetchDir]);

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => unsubscribe();
  }, [fetchData]);

  const handleChange = ({ target: { name, value } }) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(Number(event.target.value));
  };

  const writeData = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Require at least one field
      if (!formState.Morning && !formState.Evening) {
        throw new Error("दोनों फील्ड खाली हैं। कम से कम एक फील्ड भरें।");
      }

      const date = new Date(formState.date);
      const dataWriteDir = `${dataCollName}/${date.getFullYear()}/${
        monthNames[date.getMonth()]
      }/${date.getDate()}`;
      const dateRef = ref(database, dataWriteDir);
      const snapshot = await get(dateRef);
      const existing = snapshot.exists() ? snapshot.val() : {};

      // Prepare only the keys the user has entered
      const updates = {};

      if (formState.Morning) {
        if (
          existing.Morning != null &&
          formState.isValid !== AuthStatus.PRIME
        ) {
          throw new Error(
            "Morning डेटा पहले से मौजूद है - prime access required"
          );
        }
        updates.Morning = formState.Morning;
      }

      if (formState.Evening) {
        if (
          existing.Evening != null &&
          formState.isValid !== AuthStatus.PRIME
        ) {
          throw new Error(
            "Evening डेटा पहले से मौजूद है - prime access required"
          );
        }
        updates.Evening = formState.Evening;
      }

      // Apply the update (or save)
      const performUpdate = async () => {
        await update(dateRef, updates);
        toast.success(
          snapshot.exists()
            ? "Data updated successfully!"
            : "Data saved successfully!"
        );
        setFormState((prev) => ({
          ...prev,
          Morning: "",
          Evening: "",
          date: currentDate,
        }));
      };

      // If data already existed, and user is prime, confirm before updating
      if (snapshot.exists() && formState.isValid === AuthStatus.PRIME) {
        confirmAlert({
          title: "Confirm Partial Update",
          message:
            "कुछ डेटा पहले से मौजूद है—क्या आप इसे अपडेट करना चाहते हैं?",
          buttons: [
            { label: "Yes", onClick: performUpdate },
            {
              label: "No",
              onClick: () => toast.info("Update canceled by user."),
            },
          ],
        });
      } else {
        await performUpdate();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAuthenticated = formState.isValid !== AuthStatus.INVALID;

  return (
    <div className="container">
      <div className="form">
        <h1>Daily Dairy Tracker</h1>
        <div>
          <strong>Date:</strong> {currentDate_name}
        </div>

        {!isAuthenticated ? (
          <>
            <div className="input-field">
              <i className="bi bi-shield-lock-fill"></i>
              <input
                name="passkey"
                type="password"
                value={formState.passkey}
                placeholder="PassKey"
                onChange={handleChange}
              />
            </div>
            <button className="learn-more" onClick={validateUser}>
              Validate
            </button>
          </>
        ) : (
          <>
            <div className="input-field">
              <i className="bi bi-droplet-half"></i>
              <input
                type="number"
                name="Morning"
                value={formState.Morning}
                placeholder="Morning"
                onChange={handleChange}
              />
            </div>
            <div className="input-field">
              <i className="bi bi-droplet-half"></i>
              <input
                type="number"
                name="Evening"
                value={formState.Evening}
                placeholder="Evening"
                onChange={handleChange}
              />
            </div>
            {formState.isValid === AuthStatus.PRIME && (
              <div className="input-field">
                <i className="bi bi-calendar-event"></i>
                <input
                  type="date"
                  name="date"
                  value={formState.date}
                  onChange={handleChange}
                  max={currentDate}
                />
              </div>
            )}
            <button
              className="learn-more"
              onClick={writeData}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Add Details"}
            </button>
          </>
        )}
        <section className="records">
          Records -
          <span>
            <select value={selectedMonth} onChange={handleMonthChange}>
              {monthNames.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </span>
        </section>
        <div>
          <strong>
            Total Milk Produced
            {/* for {monthNames[selectedMonth]} */} :-
          </strong>{" "}
          {totalMilkProduction} L
        </div>
        <ul>
          {data.map((item) => (
            <li key={item.date}>
              <strong>Date:</strong> {item.date}-{monthNames[selectedMonth]} -{" "}
              <strong>Total:</strong>
              {Number(item.Evening ?? 0) + Number(item.Morning ?? 0)}L
              <br />
              <strong>Morning:</strong> {item.Morning ?? 0}L -
              <strong>Evening:</strong> {item.Evening ?? 0}L
            </li>
          ))}
        </ul>
      </div>
      <ToastContainer />
    </div>
  );
};

export default App;
