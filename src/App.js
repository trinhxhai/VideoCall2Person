import { Routes, Route, BrowserRouter } from "react-router-dom";
import PrivateWrapper from "./components/PrivateWrapper";

import { useAuth } from "./Context/AuthContext";
import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import Room from "./Pages/Room";
function App() {
  const { logOut } = useAuth();
  return (
    <BrowserRouter>
      <button
        onClick={() => {
          logOut();
        }}
      >
        Logout
      </button>
      <br />
      <Routes>
        <Route
          exact
          path="/"
          element={
            <PrivateWrapper>
              <HomePage />
            </PrivateWrapper>
          }
        />
        <Route
          exact
          path="/room/:roomKey"
          element={
            <PrivateWrapper>
              <Room />
            </PrivateWrapper>
          }
        />
        <Route exact path="/login" element={<LoginPage />} />
        <Route exact path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
