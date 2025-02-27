import React, { useEffect, useState } from "react";
import "../../scss/carousel.scss";

function Carousel() {
  const [certificates, setCertificates] = useState([]);
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  let timeOut = null;

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_CALL}/api/Certifications`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch certificates.");
        }
        return response.json();
      })
      .then((data) => {
        const certsWithImages = data.map((cert) => ({
          ...cert,
          image: `data:${cert.imageType};base64,${cert.imageData}`
        }));
        setCertificates(certsWithImages);
      })
      .catch((error) => {
        console.error("Error fetching certifications:", error);
      });
  }, []);

  useEffect(() => {
    timeOut = autoPlay && setTimeout(() => {
      slideRight();
    }, 3500);
    return () => clearTimeout(timeOut);
  }, [current, autoPlay]);

  const slideRight = () => {
    setCurrent((prev) => (prev === certificates.length - 1 ? 0 : prev + 1));
  };

  const slideLeft = () => {
    setCurrent((prev) => (prev === 0 ? certificates.length - 1 : prev - 1));
  };

  if (certificates.length === 0) return <div>Loading...</div>;

  return (
    <div
      className="carousel"
      onMouseEnter={() => {
        setAutoPlay(false);
        clearTimeout(timeOut);
      }}
      onMouseLeave={() => {
        setAutoPlay(true);
      }}
    >
      <div className="carousel_wrapper" id="carouselWrapper">
        {certificates.map((cert, index) => (
          <div
            key={cert.id || index}
            className={
              index === current
                ? "carousel_card carousel_card-active"
                : "carousel_card"
            }
          >
            <img
              className="card_image"
              src={cert.image}
              alt={cert.name || "Certificate Image"}
              loading="lazy"
            />
            <div className="card_overlay">
              <h2 className="card_title">{cert.name || "Unnamed Certificate"}</h2>
            </div>
          </div>
        ))}
        <div className="carousel_arrow_left" onClick={slideLeft}>
          &lsaquo;
        </div>
        <div className="carousel_arrow_right" onClick={slideRight}>
          &rsaquo;
        </div>
        <div className="carousel_pagination">
          {certificates.map((_, index) => (
            <div
              key={index}
              className={
                index === current
                  ? "pagination_dot pagination_dot-active"
                  : "pagination_dot"
              }
              onClick={() => setCurrent(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Carousel;