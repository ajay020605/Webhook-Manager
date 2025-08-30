import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css"; 
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import AppManager from "./pages/AppManager"; 
import Layout from "./layouts/Layout";
import History from "./pages/History";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile"; // <-- new import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Signup page doesn't need layout */}
        <Route path="/" element={<Signup />} />

        {/* All pages inside Layout */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/app-manager/:appName" element={<AppManager />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} /> {/* <-- new route */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
