import React, { useState, useEffect, useRef } from "react";
import SplashPage from "./SplashPage";
import About from "./About";
import Skills from "./Skills";
import Projects from "./Projects";
import Contact from "./Contact";
import Carousel from "../../components/Main/Carousel";
import Education from "./Education";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

function Home() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const screenSizeAlertShown = useRef(false);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const showScreenSizeAlert = () => {
    if (!screenSizeAlertShown.current) {
      screenSizeAlertShown.current = true;
      toast.info(
        "This site is best viewed on a desktop or laptop computer. Mobile styling is currently under construction.",
        {
          position: toast.POSITION.TOP_CENTER,
          autoClose: 10000,
        }
      );
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      showScreenSizeAlert();
    }
  }, [isMobile]);

  const fetchCertifications = async () => {
    console.log("🔍 Fetching certs from:", process.env.REACT_APP_BACKEND_CALL + "/api/Certifications");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_CALL}/api/Certifications?timestamp=${Date.now()}`, {
        headers: {
          "Cache-Control": "no-cache"
        }
      });
      // console.log("🔧 Fetch URL:", `https://localhost:5001/api/Certifications?timestamp=${Date.now()}`);

      // const response = await fetch(`https://localhost:5001/api/Certifications?timestamp=${Date.now()}`, {
      //   headers: { "Cache-Control": "no-cache" }
      // });

      if (!response.ok) {
        throw new Error("Failed to fetch certifications");
      }

      const data = await response.json();
      
      const formattedData = data.map(cert => ({
        image: `data:image/png;base64,${cert.imageData}`,
        title: cert.name
      }));

      setCertifications(formattedData);
    } catch (err) {
      console.error("Error fetching certifications:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, []);

  return (
    <div className="home" id="homeId">
      <SplashPage />
      <About />
      <Skills />

      {/* Show loading, error, or the carousel */}
      {loading ? (
        <p>Loading certifications...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <Carousel images={certifications} />
      )}

      <Education />
      <Projects />
      <Contact />

      {/* Debugging: Manual Refresh Button */}
      {/* <button onClick={fetchCertifications} style={{ marginTop: "20px", padding: "10px", cursor: "pointer" }}>
        Refresh Certifications
      </button> */}
    </div>
  );
}

export default Home;
