import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, removeToken, getUserInfo, isAdmin } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Stethoscope,
  Plus,
  LogOut,
  Search,
  FileText,
  Eye,
  Calendar,
  Trash2,
  Edit,
  Shield,
  MapPin,
  Download,
} from "lucide-react";
import { format } from "date-fns";

const PrescriptionHistory = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, opNo: '' });
  const userInfo = getUserInfo();
  const admin = isAdmin();

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get(`${API}/prescriptions`);
      setPrescriptions(response.data);
    } catch (error) {
      toast.error("Failed to fetch prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrescription = async (id) => {
    try {
      await axios.delete(`${API}/prescriptions/${id}`);
      toast.success("Prescription deleted successfully");
      setDeleteDialog({ open: false, id: null, opNo: '' });
      fetchPrescriptions(); // Refresh the list
    } catch (error) {
      toast.error("Failed to delete prescription");
    }
  };

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("rheumacare_user");
    navigate("/login");
  };

  const handleExportExcel = async () => {
    try {
      const response = await axios.get(`${API}/prescriptions/export/excel`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescriptions_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel exported successfully");
    } catch (error) {
      toast.error("Failed to export Excel");
    }
  };

  const filteredPrescriptions = prescriptions.filter(
    (p) =>
      p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.op_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="prescription-history-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6B9A9A]/10 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-[#6B9A9A]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Rheuma<span className="text-[#6B9A9A]">CARE</span>
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  {admin ? (
                    <><Shield className="w-3 h-3" /> Admin View - All Prescriptions</>
                  ) : (
                    <>E-Prescription Portal</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                data-testid="export-excel-btn"
                onClick={handleExportExcel}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              {admin && (
                <Button
                  variant="outline"
                  data-testid="admin-panel-btn"
                  onClick={() => navigate("/admin")}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}
              <Button
                data-testid="new-prescription-btn"
                className="bg-[#6B9A9A] hover:bg-[#5A8888] text-white"
                onClick={() => navigate("/")}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Prescription
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 text-[#6B9A9A]" />
                Prescription History
              </CardTitle>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  data-testid="search-input"
                  placeholder="Search by patient, OP No, or diagnosis..."
                  className="pl-10 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9A9A]"></div>
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <FileText className="w-12 h-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium">No prescriptions found</p>
                <p className="text-sm">
                  {searchTerm
                    ? "Try adjusting your search"
                    : "Create your first prescription"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">OP No.</TableHead>
                      <TableHead className="font-semibold text-slate-700">Patient Name</TableHead>
                      <TableHead className="font-semibold text-slate-700">Diagnosis</TableHead>
                      <TableHead className="font-semibold text-slate-700">Doctor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Location</TableHead>
                      <TableHead className="font-semibold text-slate-700">Drugs</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrescriptions.map((prescription) => (
                      <TableRow
                        key={prescription.id}
                        className="hover:bg-slate-50 cursor-pointer"
                        data-testid={`prescription-row-${prescription.id}`}
                        onClick={() => navigate(`/prescription/${prescription.id}`)}
                      >
                        <TableCell className="text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm">{formatDate(prescription.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          {prescription.op_no}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {prescription.patient_name}
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-[200px] truncate">
                          {prescription.diagnosis}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {prescription.doctor_id === 'dr_prakashini' ? 'Dr. Prakashini' :
                           prescription.doctor_id === 'dr_dharmanand' ? 'Dr. Dharmanand' :
                           prescription.doctor_id === 'dr_ramesh' ? 'Dr. Ramesh' : 
                           prescription.doctor_id || 'Dr. Prakashini'}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {prescription.location || 'Bangalore'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#6B9A9A]/10 text-[#6B9A9A]">
                            {prescription.drugs?.length || 0} drugs
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`view-prescription-btn-${prescription.id}`}
                              className="text-[#6B9A9A] hover:text-[#5A8888] hover:bg-[#6B9A9A]/5"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/prescription/${prescription.id}`);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`edit-prescription-btn-${prescription.id}`}
                              className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/prescription/${prescription.id}/edit`);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`delete-prescription-btn-${prescription.id}`}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDialog({ 
                                  open: true, 
                                  id: prescription.id, 
                                  opNo: prescription.op_no 
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prescription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the prescription for OP No: {deleteDialog.opNo}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => handleDeletePrescription(deleteDialog.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PrescriptionHistory;
