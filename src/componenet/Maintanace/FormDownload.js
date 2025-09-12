////latest one 






import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../Maintanace/FormDownload.css";
import Img from "../../image/mutkehostel.png";
import RuleImg from "../../assets/rulebook.jpg";

const FormDownload = ({ formData }) => {
  const handleDownload = async () => {
    const formPage = document.getElementById("form-page");
    const rulePage = document.getElementById("rule-page");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();

    // --- Page 1: Admission form
    const canvas1 = await html2canvas(formPage, { scale: 2 });
    const imgData1 = canvas1.toDataURL("image/png");
    const imgHeight1 = (canvas1.height * pdfWidth) / canvas1.width;
    pdf.addImage(imgData1, "PNG", 0, 0, pdfWidth, imgHeight1);

    // --- Page 2: Rules page
    const canvas2 = await html2canvas(rulePage, { scale: 2 });
    const imgData2 = canvas2.toDataURL("image/png");
    const imgHeight2 = (canvas2.height * pdfWidth) / canvas2.width;
    pdf.addPage();
    pdf.addImage(imgData2, "PNG", 0, 0, pdfWidth, imgHeight2);

    pdf.save("Admission_Form.pdf");
  };

  return (
    <div>
      {/* PAGE 1 - Form */}
      <div id="form-page" className="form-container">
        {/* Header */}
        <header className="form-header">
          <img src={Img} alt="Logo" className="form-logo" />
          <div className="form-title">
            <div className="form-no">
              <span>Form No:</span>
              <div className="form-box"></div>
            </div>
            <p
              style={{
                marginLeft: "-118px",
                marginTop: "4px",
                fontSize: "12px",
              }}
            >
              New Admission Form
            </p>
          </div>
          <div className="form-photo-box"></div>
        </header>

        {/* Body */}
        <div className="form-body">
          <p>
            <strong>Name Of Occupant:</strong>{" "}
            {formData?.name || "_______________________________"}
          </p>
          <p>
            <strong>Address:</strong>{" "}
            {formData?.address || "_______________________________"}
          </p>
          <p>
            <strong>
              Address Of Relative:
              <br />
              1)
            </strong>{" "}
            {formData?.relativeAddress1 || "_______________________________"}{" "}
            <br />
            <strong>2)</strong>{" "}
            {formData?.relativeAddress2 || "_______________________________"}
          </p>
          <p>
            <strong>Hostel Joining Date:</strong>{" "}
            {formData?.joiningDate
              ? new Date(formData.joiningDate).toLocaleDateString()
              : "______________________________"}
          </p>
          <p>
            <strong>Flat No:</strong> {formData?.roomNo || "_________"} &nbsp;
            &nbsp; &nbsp;
            <strong>Floor No:</strong> {formData?.floorNo || "_________"} &nbsp;
            &nbsp; &nbsp;
            <strong>Bed No:</strong> {formData?.bedNo || "_________"}
          </p>
          <hr />
          <p>
            <strong>
              Name & Address of Company/College/Institute/Other:
            </strong>
            <br />{" "}
            {formData?.companyAddress ||
              "________________________________"}
          </p>
          <p>
            <strong>Date Of Joining:</strong>{" "}
            {formData?.joiningDate
              ? new Date(formData.joiningDate).toLocaleDateString()
              : "______________________________"}{" "}
            &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
            <strong>Date Of Birth:</strong>{" "}
            {formData?.dob
              ? new Date(formData.dob).toLocaleDateString()
              : "______________________________"}{" "}
          </p>
          <p>
            <strong>
              Has Occupant Givin Rules & Regulation Copy To Read & Understand:
            </strong>{" "}
            {formData?.rulesProvided || "Yes/No"}
          </p>
        </div>

        {/* Footer */}
        <footer className="form-footer">
          <div className="signature" style={{ fontSize: "10px" }}>
            <p>Sign of Warden:</p>
            <span>_____</span>
          </div>
          <div className="signature" style={{ fontSize: "10px" }}>
            <p>Sign of Occupant:</p>
            <span>_____</span>
          </div>
          <div className="signature" style={{ fontSize: "10px" }}>
            <p>Sign of Guardian:</p>
            <span>_____</span>
          </div>
        </footer>

        <h6>Regards MUTKE HOSTEL</h6>
      </div>

      {/* PAGE 2 - Rules */}
      <div id="rule-page" className="form-container">
        <img src={RuleImg} alt="rules" style={{ width: "100%" }} />
      </div>

      {/* Download Button */}
      <button onClick={handleDownload} className="download-button">
        Download as PDF
      </button>
    </div>
  );
};

export default FormDownload;
