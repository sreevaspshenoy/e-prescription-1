import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { API, removeToken } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Stethoscope,
  ArrowLeft,
  LogOut,
  Printer,
  Download,
  History,
  Edit,
} from "lucide-react";
import { format } from "date-fns";

// Print styles for proper A4 page margins
// Setting @page margin to 0 removes browser's default headers/footers (URL, date, page numbers)
// The 50mm margins are applied via padding on the content itself
const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 0 !important;
    }
    
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .print-content {
      margin: 0 !important;
      padding: 50mm 15mm !important;
      box-sizing: border-box;
    }
    
    .no-print {
      display: none !important;
    }
    
    .print-table {
      page-break-inside: auto;
    }
    
    .print-table tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    
    .print-table thead {
      display: table-header-group;
    }
    
    .print-section {
      page-break-inside: avoid;
    }
    
    /* Hide any browser chrome */
    header, footer, nav, .no-print {
      display: none !important;
    }
  }
`;

const PrescriptionView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const printRef = useRef();
  const [prescription, setPrescription] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const fetchPrescription = async () => {
    try {
      const response = await axios.get(`${API}/prescriptions/${id}`);
      setPrescription(response.data);
      // Fetch doctor info
      const doctorId = response.data.doctor_id || 'dr_prakashini';
      const doctorResponse = await axios.get(`${API}/doctors/${doctorId}`);
      setDoctorInfo(doctorResponse.data);
    } catch (error) {
      toast.error("Failed to fetch prescription");
      navigate("/history");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Prescription_${prescription?.op_no}_${prescription?.patient_name}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0 !important;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-content {
          margin: 0 !important;
          padding: 50mm 15mm !important;
          box-sizing: border-box;
        }
        .print-table thead {
          display: table-header-group;
        }
        .print-table tr {
          page-break-inside: avoid;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(`${API}/prescriptions/${id}/pdf`, {
        responseType: "blob",
      });
      
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `prescription_${prescription?.op_no}_${format(new Date(prescription?.created_at), "dd-MM-yyyy")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd-MM-yyyy");
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9A9A]"></div>
      </div>
    );
  }

  if (!prescription) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="prescription-view-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                data-testid="back-btn"
                className="text-slate-600"
                onClick={() => navigate("/history")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 bg-[#6B9A9A]/10 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-[#6B9A9A]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Rheuma<span className="text-[#6B9A9A]">CARE</span>
                </h1>
                <p className="text-xs text-slate-500">E-Prescription Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                data-testid="edit-btn"
                className="text-[#6B9A9A] border-[#6B9A9A]/30 hover:bg-[#6B9A9A]/5"
                onClick={() => navigate(`/prescription/${id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                data-testid="print-btn"
                className="text-slate-600 border-slate-200"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                data-testid="download-pdf-btn"
                className="bg-[#6B9A9A] hover:bg-[#5A8888] text-white"
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading ? "Downloading..." : "Download PDF"}
              </Button>
              <Button
                variant="ghost"
                data-testid="history-nav-btn"
                className="text-slate-600 hover:text-[#6B9A9A]"
                onClick={() => navigate("/history")}
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button
                variant="ghost"
                data-testid="logout-btn"
                className="text-slate-600 hover:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 no-print-margin">
        {/* Inject print styles */}
        <style>{printStyles}</style>
        
        {/* Print View */}
        <Card className="border-slate-200 shadow-sm overflow-hidden no-print-border">
          <CardContent className="p-0">
            <div 
              ref={printRef} 
              className="bg-white print-content"
              style={{ 
                fontFamily: 'Crimson Text, Times New Roman, serif',
                width: '100%',
              }}
            >
              {/* Content - padding handled by CSS for print (50mm top/bottom, 15mm sides) */}
              {/* On screen: use p-8 for visual spacing */}
              <div className="p-8">
                
                {/* Row 1: Patient Name on left, Date and OP No on right */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-semibold text-slate-700 text-sm">Patient Name:</span>{" "}
                    <span className="text-slate-800 font-medium text-sm">{prescription.patient_name}</span>
                  </div>
                  <div className="text-right flex gap-6">
                    <div>
                      <span className="font-semibold text-slate-700 text-sm">Date:</span>{" "}
                      <span className="text-slate-800 text-sm">{formatDate(prescription.created_at)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 text-sm">OP No.:</span>{" "}
                      <span className="text-slate-800 text-sm">{prescription.op_no}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: ICD Code on left, Sex and Age on right */}
                {(prescription.sex || prescription.gender || prescription.age || prescription.icd_code) && (
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {prescription.icd_code && (
                        <>
                          <span className="font-semibold text-slate-700 text-sm">ICD Code:</span>{" "}
                          <span className="text-slate-800 text-sm">{prescription.icd_code}</span>
                        </>
                      )}
                    </div>
                    <div className="text-right flex gap-6">
                      {(prescription.sex || prescription.gender) && (
                        <div>
                          <span className="font-semibold text-slate-700 text-sm">Sex:</span>{" "}
                          <span className="text-slate-800 text-sm">{prescription.sex || prescription.gender}</span>
                        </div>
                      )}
                      {prescription.age && (
                        <div>
                          <span className="font-semibold text-slate-700 text-sm">Age:</span>{" "}
                          <span className="text-slate-800 text-sm">{prescription.age}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vitals - Individual fields formatted */}
                {(prescription.weight || prescription.height || prescription.bp || prescription.spo2 || prescription.vitals) && (
                  <div className="mb-6">
                    <span className="font-semibold text-slate-700 text-sm">Vitals:</span>{" "}
                    <span className="text-slate-800 text-sm">
                      {prescription.weight || prescription.height || prescription.bp || prescription.spo2 ? (
                        <>
                          {prescription.weight && <><b>Wt:</b> {prescription.weight}kg</>}
                          {prescription.weight && (prescription.height || prescription.bp || prescription.spo2) && " | "}
                          {prescription.height && <><b>Ht:</b> {prescription.height}cm</>}
                          {prescription.height && (prescription.bp || prescription.spo2) && " | "}
                          {prescription.bp && <><b>BP:</b> {prescription.bp}</>}
                          {prescription.bp && prescription.spo2 && " | "}
                          {prescription.spo2 && <><b>SpO2:</b> {prescription.spo2}%</>}
                        </>
                      ) : (
                        prescription.vitals
                      )}
                    </span>
                  </div>
                )}

                {/* Diagnosis */}
                <div className="mb-8">
                  <p className="font-semibold text-slate-700 text-sm mb-2">Diagnosis:</p>
                  <p className="text-slate-800 text-sm pl-4 leading-relaxed">{prescription.diagnosis}</p>
                </div>

                {/* Clinical History */}
                {prescription.clinical_history && (
                  <div className="mb-8">
                    <p className="font-semibold text-slate-700 text-sm mb-2">Clinical History:</p>
                    <p className="text-slate-800 text-sm pl-4 leading-relaxed">{prescription.clinical_history}</p>
                  </div>
                )}

                {/* Rx */}
                <div className="mb-8">
                  <p className="text-xl font-bold text-[#6B9A9A] mb-6" style={{ fontFamily: 'Times New Roman, serif' }}>
                    Rx :
                  </p>
                  <table className="w-full border-collapse print-table">
                    <thead>
                      <tr className="bg-[#6B9A9A] text-white" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                        <th className="border border-slate-300 px-2 py-2 text-left text-sm">S.No</th>
                        <th className="border border-slate-300 px-2 py-2 text-left text-sm">Drug Name</th>
                        <th className="border border-slate-300 px-2 py-2 text-left text-sm">Dosage</th>
                        <th className="border border-slate-300 px-2 py-2 text-left text-sm" style={{minWidth: '100px'}}>Frequency</th>
                        <th className="border border-slate-300 px-2 py-2 text-left text-sm">Duration</th>
                        <th className="border border-slate-300 px-2 py-2 text-left text-sm">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescription.drugs?.map((drug, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="border border-slate-200 px-2 py-2 text-sm align-top">{index + 1}</td>
                          <td className="border border-slate-200 px-2 py-2 text-sm font-medium align-top">{drug.drug_name}</td>
                          <td className="border border-slate-200 px-2 py-2 text-sm align-top">{drug.dosage}</td>
                          <td className="border border-slate-200 px-2 py-2 text-sm align-top" style={{minWidth: '100px'}}>{drug.frequency}</td>
                          <td className="border border-slate-200 px-2 py-2 text-sm align-top">
                            {drug.duration} {drug.duration_unit}
                          </td>
                          <td className="border border-slate-200 px-2 py-2 text-sm text-slate-600 align-top" style={{wordWrap: 'break-word', whiteSpace: 'pre-wrap', maxWidth: '150px'}}>{drug.comments || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Review After */}
                {prescription.review_after && (
                  <div className="mb-6 print-section">
                    <p className="text-slate-700">
                      <span className="font-semibold">Review After:</span> {prescription.review_after}
                    </p>
                  </div>
                )}

                {/* Advice / Instructions */}
                {prescription.advice && (
                  <div className="mb-6 print-section">
                    <p className="font-semibold text-slate-700 text-sm mb-2">Advice / Instructions:</p>
                    <p className="text-slate-800 text-sm pl-4 leading-relaxed whitespace-pre-line">{prescription.advice}</p>
                  </div>
                )}

                {/* Lab Tests Advised */}
                {prescription.lab_tests && (
                  <div className="mb-8 print-section">
                    <p className="font-semibold text-slate-700 text-sm mb-2">Lab Tests Advised (for next visit):</p>
                    <p className="text-slate-800 text-sm pl-4 leading-relaxed">{prescription.lab_tests}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Print Instructions Note */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg no-print">
          <p className="text-sm text-amber-800 mb-2">
            <strong>Print Tip:</strong> To remove URL/date from print header/footer:
          </p>
          <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
            <li>In print dialog, click <strong>"More settings"</strong></li>
            <li>Uncheck <strong>"Headers and footers"</strong></li>
            <li>Set margins to <strong>"None"</strong> or <strong>"Minimum"</strong></li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default PrescriptionView;
