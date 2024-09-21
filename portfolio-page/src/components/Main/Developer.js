// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import "../../scss/developer.scss";

// function Developer() {
//   const [image, setImage] = useState(null);
//   const [name, setName] = useState("");
//   const [issuingBody, setIssuingBody] = useState("");
//   const [dateEarned, setDateEarned] = useState("");
//   const [certifications, setCertifications] = useState([]);
//   const [editingId, setEditingId] = useState(null);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
  
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetch(`${process.env.REACT_APP_BACKEND_CALL}/api/Certifications`)
//       .then((response) => response.json())
//       .then((data) => setCertifications(data))
//       .catch((error) => console.error("Error fetching certifications:", error));
//   }, []);

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setImage(file);
//     }
//   };

//   const handleUpload = () => {
//     if (!name || !issuingBody || !dateEarned || !image) {
//       setErrorMessage("All fields, including the image, are required.");
//       return;
//     }

//     setErrorMessage("");

//     const formData = new FormData();
//     formData.append("name", name);
//     formData.append("issuingBody", issuingBody);
//     formData.append("dateEarned", dateEarned);
//     if (image) formData.append("file", image);

//     fetch(`${process.env.REACT_APP_BACKEND_CALL}/api/Certifications`, {
//       method: "POST",
//       body: formData,
//     })
//       .then((response) => response.json())
//       .then((newCert) => {
//         setCertifications([...certifications, newCert]);
//         setName("");
//         setIssuingBody("");
//         setDateEarned("");
//         setImage(null);
//       })
//       .catch((error) => console.error("Error uploading certification:", error));
//   };

//   const handleDelete = (id) => {
//     const isConfirmed = window.confirm(
//       "Are you sure you want to delete this certification?"
//     );

//     if (isConfirmed) {
//       fetch(`${process.env.REACT_APP_BACKEND_CALL}/api/Certifications/${id}`, {
//         method: "DELETE",
//       })
//         .then(() => {
//           setCertifications(certifications.filter((cert) => cert.id !== id));
//         })
//         .catch((error) =>
//           console.error("Error deleting certification:", error)
//         );
//     }
//   };

//   const handleEdit = (cert) => {
//     setEditingId(cert.id);
//     setName(cert.name);
//     setIssuingBody(cert.issuingBody);
//     setDateEarned(cert.dateEarned);
//     setImage(null);
//   };

//   const handleUpdate = () => {
//     const formData = new FormData();
//     formData.append("name", name);
//     formData.append("issuingBody", issuingBody);
//     formData.append("dateEarned", dateEarned);
//     if (image) formData.append("file", image);

//     fetch(`${process.env.REACT_APP_BACKEND_CALL}/api/Certifications/${editingId}`, {
//       method: "PUT",
//       body: formData,
//     })
//       .then(() => {
//         setCertifications(
//           certifications.map((cert) =>
//             cert.id === editingId
//               ? { ...cert, name, issuingBody, dateEarned }
//               : cert
//           )
//         );
//         setEditingId(null);
//         setName("");
//         setIssuingBody("");
//         setDateEarned("");
//         setImage(null);
//       })
//       .catch((error) => console.error("Error updating certification:", error));
//   };

//   const filteredCertifications = certifications.filter(
//     (cert) =>
//       cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       cert.issuingBody.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       cert.dateEarned.includes(searchTerm)
//   );

//   const generateReport = () => {
//     const csvRows = [];
//     const headers = ["Certification Name", "Issuing Body", "Date Earned"];
//     csvRows.push(headers.join(","));

//     filteredCertifications.forEach((cert) => {
//       const values = [
//         cert.name,
//         cert.issuingBody,
//         new Date(cert.dateEarned).toLocaleDateString(),
//       ];
//       csvRows.push(values.join(","));
//     });

//     const csvContent = csvRows.join("\n");
//     const blob = new Blob([csvContent], { type: "text/csv" });
//     const url = window.URL.createObjectURL(blob);

//     const a = document.createElement("a");
//     a.setAttribute("href", url);
//     a.setAttribute(
//       "download",
//       `certifications_report_${new Date().toISOString()}.csv`
//     );
//     a.click();
//   };

//   return (
//     <div className="Developer-Content">
//       <button className="back-button" onClick={() => navigate("/")}>
//         ← Back
//       </button>

//       <button className="report-button" onClick={generateReport}>
//         Generate Cert Report
//       </button>

//       <h1>Developer Page</h1>
//       <p>Add new certifications with image and text data.</p>
//       {errorMessage && <p className="error-message">{errorMessage}</p>}

//       <form>
//         <input
//           type="text"
//           placeholder="Certification Name"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//         />
//         <input
//           type="text"
//           placeholder="Issuing Body"
//           value={issuingBody}
//           onChange={(e) => setIssuingBody(e.target.value)}
//         />
//         <input
//           type="date"
//           value={dateEarned}
//           onChange={(e) => setDateEarned(e.target.value)}
//         />
//         <input type="file" onChange={handleImageChange} />
//         {editingId ? (
//           <button type="button" onClick={handleUpdate}>
//             Update Certification
//           </button>
//         ) : (
//           <button type="button" onClick={handleUpload}>
//             Upload Certification
//           </button>
//         )}
//       </form>

//       <div className="search-report-container">
//         <div className="search-bar">
//           <input
//             type="text"
//             placeholder="Search certifications..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>
//       </div>

//       <div className="certifications-list">
//         <h3>Existing Certifications</h3>
//         {filteredCertifications.length === 0 ? (
//           <p>No certifications match your search</p>
//         ) : (
//           <div className="certification-grid">
//             {filteredCertifications.map((cert) => (
//               <div key={cert.id} className="cert-item">
//                 <h4>{cert.name}</h4>
//                 <p>{cert.issuingBody}</p>
//                 <p>{new Date(cert.dateEarned).toLocaleDateString()}</p>
//                 <div className="button-group">
//                   <button onClick={() => handleDelete(cert.id)}>Delete</button>
//                   <button onClick={() => handleEdit(cert)}>Edit</button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default Developer;
