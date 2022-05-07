import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useFirebase } from "../Context/FirebaseContext";
import { useAuth } from "../Context/AuthContext";

function LoginPage() {
  //   const { auth } = useFirebase();
  const { login } = useAuth();
  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!IsInputValid()) {
      alert("invalid input");
    } else {
      login(user.email, user.password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          console.log("login successful" + user.uid);
          // ...
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log("login fail" + error);
        });
    }
  };

  const IsInputValid = () => {
    if (!user.email) {
      return false;
    }
    if (!user.password) {
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

        <button type="submit">Login</button>
      </form>
    </>
  );
}

export default LoginPage;
