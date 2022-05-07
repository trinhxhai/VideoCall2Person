import React, { useState } from "react";

import { doc, setDoc } from "firebase/firestore";
import { useFirebase } from "../Context/FirebaseContext";
import { useAuth } from "../Context/AuthContext";

function RegisterPage() {
  const { db } = useFirebase();
  const { signUp } = useAuth();
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    repassword: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!IsInputValid()) {
      alert("invalid input");
    } else {
      signUp(user.email, user.password)
        .then((userCredential) => {
          // Signed in
          const userAuth = userCredential.user;

          // Add a new document in collection "cities"

          setDoc(doc(db, "users", userAuth.uid), {
            name: user.name,
          }).then((e) => {
            console.log("resgister successful " + userCredential);
          });
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(error);
          // ..
        });
    }
  };

  const IsInputValid = () => {
    if (!user.name) {
      return false;
    }
    if (!user.email) {
      return false;
    }
    if (!user.password) {
      return false;
    }
    if (!user.repassword) {
      return false;
    }

    if (user.password !== user.repassword) {
      return false;
    }

    return true;
  };

  const handleInputChange = (e) => {
    // console.log(e.target);
    const name = e.target.name;
    const value = e.target.value;
    setUser({ ...user, [name]: value });
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">name</label>
          <input
            type="text"
            name="name"
            id="name"
            value={user.name}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="email">email</label>
          <input
            type="text"
            name="email"
            id="email"
            value={user.email}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            value={user.password}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="repassword">Repassword</label>
          <input
            type="password"
            name="repassword"
            id="repassword"
            value={user.repassword}
            onChange={handleInputChange}
          />
        </div>

        <button type="submit">Login</button>
      </form>
    </>
  );
}

export default RegisterPage;
