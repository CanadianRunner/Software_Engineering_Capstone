import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReact } from "@fortawesome/free-brands-svg-icons";
import "../scss/navbar.scss";
import FaviconMyLogo from "../assets/FaviconMyLogo.png";
import NavItem from "./Main/NavItem";
import { Link } from "react-router-dom";
import LoginModal from "./LoginModal";

const navItems = {
  homeId: null,
  aboutMe: null,
  skillsId: null,
  educationId: null,
  projectsId: null,
  contactCard: null,
};

function Navbar() {
  const [activeItem, setActiveItem] = useState("homeId");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleDeveloperClick = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    } else {
      window.location.href = "/developer";
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginModal(false);
    window.location.href = "/developer";
  };

  const menuList = Object.keys(navItems).map((e, i) => (
    <NavItem
      itemName={e}
      key={`navitem_${i}`}
      active={e === activeItem ? true : false}
      index={i}
    />
  ));

  return (
    <div className="navbar">
      <Link to="/"> 
        <img
          className="navbar__logo"
          src={FaviconMyLogo}
          alt="a logo of the pnw mountain range"
        />
      </Link>

      <nav className="navbar__link-group">{menuList}</nav>

      <div className="navbar__developer" onClick={handleDeveloperClick}>
        <FontAwesomeIcon
          icon={faReact}
          color="#A5C9CA"
          size="2x"
          alt="Link to Developer Page"
        />
      </div>

      {showLoginModal && (
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default Navbar;
