import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, removeToken } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Trash2,
  History,
  LogOut,
  FileText,
  Pill,
  Download,
  Eye,
  Calendar,
  AlertCircle,
  Edit,
} from "lucide-react";
import { format } from "date-fns";

const FREQUENCY_OPTIONS = ["0-0-1", "1-0-0", "1-1-1", "1-0-1"];
const DURATION_UNITS = ["Days", "Weeks", "Months"];

const emptyDrug = {
  drug_name: "",
  dosage: "",
  frequency: "1-0-1",
  duration: "",
  duration_unit: "Days",
  comments: "",
};

const PrescriptionForm = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams(); // For edit mode
  const isEditMode = Boolean(editId);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [drugList, setDrugList] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    op_no: "",
    patient_name: "",
    sex: "",
    age: "",
    icd_code: "",
    weight: "",
    height: "",
    bp: "",
    spo2: "",
    diagnosis: "",
    clinical_history: "",
    drugs: [{ ...emptyDrug }],
    review_after: "",
    advice: "",
    lab_tests: "",
    doctor_id: "dr_prakashini",
  });
  const [searchTerms, setSearchTerms] = useState([""]);
  const [showDropdowns, setShowDropdowns] = useState([false]);
  const [customFreqDialog, setCustomFreqDialog] = useState({ open: false, index: null });
  const [customFreq, setCustomFreq] = useState("");
  
  // OP No lookup state
  const [existingPrescriptions, setExistingPrescriptions] = useState([]);
  const [showExistingDialog, setShowExistingDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, id: null, opNo: '' });
  const opNoTimeoutRef = useRef(null);

  useEffect(() => {
    fetchDrugList();
    fetchDoctors();
  }, []);

  const fetchPrescriptionForEdit = useCallback(async (prescriptionId) => {
    setInitialLoading(true);
    try {
      const response = await axios.get(`${API}/prescriptions/${prescriptionId}`);
      const prescription = response.data;
      
      // Set form data
      setFormData({
        op_no: prescription.op_no || "",
        patient_name: prescription.patient_name || "",
        sex: prescription.sex || prescription.gender || "",
        age: prescription.age || "",
        icd_code: prescription.icd_code || "",
        weight: prescription.weight || "",
        height: prescription.height || "",
        bp: prescription.bp || "",
        spo2: prescription.spo2 || "",
        diagnosis: prescription.diagnosis || "",
        clinical_history: prescription.clinical_history || "",
        drugs: prescription.drugs?.length > 0 ? prescription.drugs.map(drug => ({
          drug_name: drug.drug_name || "",
          dosage: drug.dosage || "",
          frequency: drug.frequency || "1-0-1",
          duration: drug.duration || "",
          duration_unit: drug.duration_unit || "Days",
          comments: drug.comments || "",
        })) : [{ ...emptyDrug }],
        review_after: prescription.review_after || "",
        advice: prescription.advice || "",
        lab_tests: prescription.lab_tests || "",
        doctor_id: prescription.doctor_id || "dr_prakashini",
      });
      
      // Set search terms for drug autocomplete
      if (prescription.drugs?.length > 0) {
        setSearchTerms(prescription.drugs.map(d => d.drug_name || ""));
        setShowDropdowns(prescription.drugs.map(() => false));
      }
      
      toast.success("Prescription loaded for editing");
    } catch (error) {
      console.error("Error fetching prescription:", error);
      toast.error("Failed to load prescription for editing");
      navigate("/");
    } finally {
      setInitialLoading(false);
    }
  }, [navigate]);

  // Fetch prescription data if in edit mode
  useEffect(() => {
    if (isEditMode && editId) {
      fetchPrescriptionForEdit(editId);
    }
  }, [isEditMode, editId, fetchPrescriptionForEdit]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API}/doctors`);
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchDrugList = async (search = "") => {
    try {
      const response = await axios.get(`${API}/drugs`, { params: { search } });
      setDrugList(response.data.drugs);
    } catch (error) {
      console.error("Error fetching drugs:", error);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  const handleExportExcel = async () => {
    try {
      const response = await axios.get(`${API}/prescriptions/export/excel`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `prescriptions_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Excel exported successfully!");
    } catch (error) {
      toast.error("Failed to export Excel");
    }
  };

  // Check for existing prescriptions when OP No changes
  const checkExistingPrescriptions = useCallback(async (opNo) => {
    if (!opNo || opNo.length < 2) {
      setExistingPrescriptions([]);
      return;
    }
    
    try {
      const response = await axios.get(`${API}/prescriptions/by-op/${encodeURIComponent(opNo)}`);
      if (response.data.prescriptions && response.data.prescriptions.length > 0) {
        setExistingPrescriptions(response.data.prescriptions);
        setShowExistingDialog(true);
      } else {
        setExistingPrescriptions([]);
      }
    } catch (error) {
      console.error("Error checking existing prescriptions:", error);
    }
  }, []);

  const handleOpNoChange = (value) => {
    setFormData({ ...formData, op_no: value });
    
    // Clear previous timeout
    if (opNoTimeoutRef.current) {
      clearTimeout(opNoTimeoutRef.current);
    }
    
    // Debounce the lookup
    opNoTimeoutRef.current = setTimeout(() => {
      checkExistingPrescriptions(value);
    }, 800);
  };

  const handleDeletePrescription = async (id) => {
    try {
      await axios.delete(`${API}/prescriptions/${id}`);
      toast.success("Prescription deleted successfully");
      setDeleteConfirmDialog({ open: false, id: null, opNo: '' });
      // Refresh existing prescriptions list
      if (formData.op_no) {
        checkExistingPrescriptions(formData.op_no);
      }
    } catch (error) {
      toast.error("Failed to delete prescription");
    }
  };

  const loadExistingPrescription = (prescription, loadDrugs = false) => {
    // Pre-fill form with existing patient data
    const updatedFormData = {
      ...formData,
      patient_name: prescription.patient_name || "",
      sex: prescription.sex || prescription.gender || "",
      age: prescription.age || "",
      icd_code: prescription.icd_code || "",
      weight: prescription.weight || "",
      height: prescription.height || "",
      bp: prescription.bp || "",
      spo2: prescription.spo2 || "",
    };

    // Optionally load drugs as well
    if (loadDrugs && prescription.drugs && prescription.drugs.length > 0) {
      updatedFormData.drugs = prescription.drugs.map(drug => ({
        drug_name: drug.drug_name || "",
        dosage: drug.dosage || "",
        frequency: drug.frequency || "1-0-1",
        duration: drug.duration || "",
        duration_unit: drug.duration_unit || "Days",
        comments: drug.comments || "",
      }));
      updatedFormData.diagnosis = prescription.diagnosis || "";
      updatedFormData.clinical_history = prescription.clinical_history || "";
      updatedFormData.review_after = prescription.review_after || "";
      updatedFormData.advice = prescription.advice || "";
      updatedFormData.lab_tests = prescription.lab_tests || "";
      updatedFormData.doctor_id = prescription.doctor_id || "dr_prakashini";
      
      // Update search terms for drug autocomplete
      setSearchTerms(prescription.drugs.map(d => d.drug_name || ""));
      setShowDropdowns(prescription.drugs.map(() => false));
      
      toast.success("Full prescription loaded. You can modify and save as new.");
    } else {
      toast.info("Patient info loaded. Add new prescription details.");
    }

    setFormData(updatedFormData);
    setShowExistingDialog(false);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
    } catch {
      return dateString;
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'op_no') {
      handleOpNoChange(value);
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleDrugChange = (index, field, value) => {
    const newDrugs = [...formData.drugs];
    newDrugs[index] = { ...newDrugs[index], [field]: value };
    setFormData({ ...formData, drugs: newDrugs });
  };

  const handleDrugSearch = async (index, value) => {
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = value;
    setSearchTerms(newSearchTerms);

    handleDrugChange(index, "drug_name", value);

    if (value.length >= 2) {
      await fetchDrugList(value);
      const newShowDropdowns = [...showDropdowns];
      newShowDropdowns[index] = true;
      setShowDropdowns(newShowDropdowns);
    } else {
      const newShowDropdowns = [...showDropdowns];
      newShowDropdowns[index] = false;
      setShowDropdowns(newShowDropdowns);
    }
  };

  const selectDrug = (index, drugName) => {
    handleDrugChange(index, "drug_name", drugName);
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = drugName;
    setSearchTerms(newSearchTerms);
    const newShowDropdowns = [...showDropdowns];
    newShowDropdowns[index] = false;
    setShowDropdowns(newShowDropdowns);
  };

  const addDrug = () => {
    setFormData({ ...formData, drugs: [...formData.drugs, { ...emptyDrug }] });
    setSearchTerms([...searchTerms, ""]);
    setShowDropdowns([...showDropdowns, false]);
  };

  const removeDrug = (index) => {
    if (formData.drugs.length === 1) return;
    const newDrugs = formData.drugs.filter((_, i) => i !== index);
    const newSearchTerms = searchTerms.filter((_, i) => i !== index);
    const newShowDropdowns = showDropdowns.filter((_, i) => i !== index);
    setFormData({ ...formData, drugs: newDrugs });
    setSearchTerms(newSearchTerms);
    setShowDropdowns(newShowDropdowns);
  };

  const handleFrequencyChange = (index, value) => {
    if (value === "custom") {
      setCustomFreqDialog({ open: true, index });
      setCustomFreq("");
    } else {
      handleDrugChange(index, "frequency", value);
    }
  };

  const saveCustomFrequency = () => {
    if (customFreq.trim() && customFreqDialog.index !== null) {
      const index = customFreqDialog.index;
      const newDrugs = [...formData.drugs];
      newDrugs[index] = { ...newDrugs[index], frequency: customFreq.trim() };
      setFormData({ ...formData, drugs: newDrugs });
    }
    setCustomFreqDialog({ open: false, index: null });
    setCustomFreq("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.op_no || !formData.patient_name || !formData.diagnosis) {
      toast.error("Please fill in all required fields");
      return;
    }

    const validDrugs = formData.drugs.filter(
      (d) => d.drug_name && d.dosage && d.duration
    );
    if (validDrugs.length === 0) {
      toast.error("Please add at least one drug with all details");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        // Update existing prescription
        const response = await axios.put(`${API}/prescriptions/${editId}`, {
          ...formData,
          drugs: validDrugs,
        });
        toast.success("Prescription updated successfully!");
        navigate(`/prescription/${editId}`);
      } else {
        // Create new prescription
        const response = await axios.post(`${API}/prescriptions`, {
          ...formData,
          drugs: validDrugs,
        });
        toast.success("Prescription created successfully!");
        navigate(`/prescription/${response.data.id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} prescription`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      op_no: "",
      patient_name: "",
      sex: "",
      age: "",
      icd_code: "",
      weight: "",
      height: "",
      bp: "",
      spo2: "",
      diagnosis: "",
      clinical_history: "",
      drugs: [{ ...emptyDrug }],
      review_after: "",
      advice: "",
      lab_tests: "",
      doctor_id: "dr_prakashini",
    });
    setSearchTerms([""]);
    setShowDropdowns([false]);
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="prescription-form-page">
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
                <p className="text-xs text-slate-500">E-Prescription Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                data-testid="export-excel-btn"
                className="text-slate-600 border-slate-200"
                onClick={handleExportExcel}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button
                variant="ghost"
                data-testid="history-btn"
                className="text-slate-600 hover:text-[#6B9A9A] hover:bg-[#6B9A9A]/5"
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {initialLoading ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9A9A] mx-auto"></div>
              <p className="mt-4 text-slate-500">Loading prescription...</p>
            </CardContent>
          </Card>
        ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              {isEditMode ? (
                <>
                  <Edit className="w-5 h-5 text-[#6B9A9A]" />
                  Edit Prescription
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 text-[#6B9A9A]" />
                  New Prescription
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Doctor Selection */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  Select Doctor <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.doctor_id}
                  onValueChange={(value) => handleInputChange("doctor_id", value)}
                >
                  <SelectTrigger 
                    className="h-11 bg-white border-slate-200"
                    data-testid="doctor-select"
                  >
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.qualifications}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Patient Info - New Layout */}
              {/* Row 1: Patient Name on left, OP No on right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name" className="text-slate-700 font-medium">
                    Patient Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="patient_name"
                    data-testid="patient-name-input"
                    placeholder="Enter Patient Name"
                    className="h-11 bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                    value={formData.patient_name}
                    onChange={(e) => handleInputChange("patient_name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="op_no" className="text-slate-700 font-medium">
                    OP No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="op_no"
                    data-testid="op-no-input"
                    placeholder="Enter OP Number"
                    className="h-11 bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                    value={formData.op_no}
                    onChange={(e) => handleInputChange("op_no", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Row 2: ICD Code on left, Sex and Age on right */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icd_code" className="text-slate-700 font-medium">
                    ICD Code
                  </Label>
                  <Input
                    id="icd_code"
                    data-testid="icd-code-input"
                    placeholder="Enter ICD Code"
                    className="h-11 bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                    value={formData.icd_code}
                    onChange={(e) => handleInputChange("icd_code", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sex" className="text-slate-700 font-medium">
                    Sex
                  </Label>
                  <Input
                    id="sex"
                    data-testid="sex-input"
                    placeholder="M / F"
                    className="h-11 bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                    value={formData.sex}
                    onChange={(e) => handleInputChange("sex", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-slate-700 font-medium">
                    Age
                  </Label>
                  <Input
                    id="age"
                    data-testid="age-input"
                    placeholder="Years"
                    className="h-11 bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                  />
                </div>
              </div>

              {/* Vitals - Individual Fields */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  Vitals
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="weight" className="text-xs text-slate-500">Weight (kg)</Label>
                    <Input
                      id="weight"
                      data-testid="weight-input"
                      placeholder="e.g., 65"
                      className="h-10 bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="height" className="text-xs text-slate-500">Height (cm)</Label>
                    <Input
                      id="height"
                      data-testid="height-input"
                      placeholder="e.g., 170"
                      className="h-10 bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                      value={formData.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bp" className="text-xs text-slate-500">BP (mmHg)</Label>
                    <Input
                      id="bp"
                      data-testid="bp-input"
                      placeholder="e.g., 120/80"
                      className="h-10 bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                      value={formData.bp}
                      onChange={(e) => handleInputChange("bp", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="spo2" className="text-xs text-slate-500">SpO2 (%)</Label>
                    <Input
                      id="spo2"
                      data-testid="spo2-input"
                      placeholder="e.g., 98"
                      className="h-10 bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                      value={formData.spo2}
                      onChange={(e) => handleInputChange("spo2", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="space-y-2">
                <Label htmlFor="diagnosis" className="text-slate-700 font-medium">
                  Diagnosis <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="diagnosis"
                  data-testid="diagnosis-input"
                  placeholder="Enter diagnosis"
                  className="min-h-[80px] bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                  value={formData.diagnosis}
                  onChange={(e) => handleInputChange("diagnosis", e.target.value)}
                  required
                />
              </div>

              {/* Clinical History */}
              <div className="space-y-2">
                <Label htmlFor="clinical_history" className="text-slate-700 font-medium">
                  Clinical History
                </Label>
                <Textarea
                  id="clinical_history"
                  data-testid="clinical-history-input"
                  placeholder="Enter clinical history"
                  className="min-h-[80px] bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                  value={formData.clinical_history}
                  onChange={(e) => handleInputChange("clinical_history", e.target.value)}
                />
              </div>

              {/* Rx Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-[#6B9A9A]" />
                  <span className="text-lg font-semibold text-[#6B9A9A]" style={{ fontFamily: 'Times New Roman, serif' }}>
                    Rx :
                  </span>
                </div>

                <div className="space-y-3">
                  {formData.drugs.map((drug, index) => (
                    <div
                      key={index}
                      className="drug-row-enter bg-slate-50 p-4 rounded-lg border border-slate-200"
                      data-testid={`drug-row-${index}`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Drug Name with Autocomplete */}
                        <div className="md:col-span-3 relative">
                          <Label className="text-xs text-slate-500 mb-1 block">Drug Name</Label>
                          <Input
                            data-testid={`drug-name-input-${index}`}
                            placeholder="Search drug..."
                            className="h-10 bg-white"
                            value={searchTerms[index] || drug.drug_name}
                            onChange={(e) => handleDrugSearch(index, e.target.value)}
                            onFocus={() => {
                              if (searchTerms[index]?.length >= 2) {
                                const newShowDropdowns = [...showDropdowns];
                                newShowDropdowns[index] = true;
                                setShowDropdowns(newShowDropdowns);
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                const newShowDropdowns = [...showDropdowns];
                                newShowDropdowns[index] = false;
                                setShowDropdowns(newShowDropdowns);
                              }, 200);
                            }}
                          />
                          {showDropdowns[index] && drugList.length > 0 && (
                            <div className="autocomplete-dropdown" data-testid={`drug-dropdown-${index}`}>
                              {drugList
                                .filter((d) =>
                                  d.toLowerCase().includes(searchTerms[index]?.toLowerCase() || "")
                                )
                                .slice(0, 10)
                                .map((drugName, i) => (
                                  <div
                                    key={i}
                                    className="autocomplete-item"
                                    onMouseDown={() => selectDrug(index, drugName)}
                                  >
                                    {drugName}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Dosage */}
                        <div className="md:col-span-1">
                          <Label className="text-xs text-slate-500 mb-1 block">Dosage</Label>
                          <Input
                            data-testid={`dosage-input-${index}`}
                            placeholder="e.g., 10mg"
                            className="h-10 bg-white"
                            value={drug.dosage}
                            onChange={(e) => handleDrugChange(index, "dosage", e.target.value)}
                          />
                        </div>

                        {/* Frequency */}
                        <div className="md:col-span-2">
                          <Label className="text-xs text-slate-500 mb-1 block">Frequency</Label>
                          <Select
                            key={`freq-${index}-${drug.frequency}`}
                            value={drug.frequency}
                            onValueChange={(value) => handleFrequencyChange(index, value)}
                          >
                            <SelectTrigger 
                              className="h-10 bg-white"
                              data-testid={`frequency-select-${index}`}
                            >
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              {FREQUENCY_OPTIONS.map((freq) => (
                                <SelectItem key={freq} value={freq}>
                                  {freq}
                                </SelectItem>
                              ))}
                              {drug.frequency && !FREQUENCY_OPTIONS.includes(drug.frequency) && drug.frequency !== "custom" && (
                                <SelectItem key={drug.frequency} value={drug.frequency}>
                                  {drug.frequency}
                                </SelectItem>
                              )}
                              <SelectItem value="custom">
                                <span className="text-[#6B9A9A]">+ Custom</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Duration */}
                        <div className="md:col-span-1">
                          <Label className="text-xs text-slate-500 mb-1 block">Duration</Label>
                          <Input
                            data-testid={`duration-input-${index}`}
                            type="number"
                            placeholder="e.g., 7"
                            className="h-10 bg-white"
                            value={drug.duration}
                            onChange={(e) => handleDrugChange(index, "duration", e.target.value)}
                          />
                        </div>

                        {/* Duration Unit */}
                        <div className="md:col-span-1">
                          <Label className="text-xs text-slate-500 mb-1 block">Unit</Label>
                          <Select
                            value={drug.duration_unit}
                            onValueChange={(value) => handleDrugChange(index, "duration_unit", value)}
                          >
                            <SelectTrigger 
                              className="h-10 bg-white"
                              data-testid={`duration-unit-select-${index}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DURATION_UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Comments */}
                        <div className="md:col-span-3">
                          <Label className="text-xs text-slate-500 mb-1 block">Comments</Label>
                          <Input
                            data-testid={`comments-input-${index}`}
                            placeholder="e.g., After food"
                            className="h-10 bg-white"
                            value={drug.comments}
                            onChange={(e) => handleDrugChange(index, "comments", e.target.value)}
                          />
                        </div>

                        {/* Delete Button */}
                        <div className="md:col-span-1 flex items-end">
                          {formData.drugs.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              data-testid={`remove-drug-btn-${index}`}
                              className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeDrug(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  data-testid="add-drug-btn"
                  className="w-full border-dashed border-[#6B9A9A] text-[#6B9A9A] hover:bg-[#6B9A9A]/5"
                  onClick={addDrug}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Drug
                </Button>
              </div>

              {/* Review After */}
              <div className="space-y-2">
                <Label htmlFor="review_after" className="text-slate-700 font-medium">
                  Review After
                </Label>
                <Input
                  id="review_after"
                  data-testid="review-after-input"
                  placeholder="e.g., 2 weeks"
                  className="h-11 bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20 max-w-xs"
                  value={formData.review_after}
                  onChange={(e) => handleInputChange("review_after", e.target.value)}
                />
              </div>

              {/* Advice / Instructions */}
              <div className="space-y-2">
                <Label htmlFor="advice" className="text-slate-700 font-medium">
                  Advice / Instructions
                </Label>
                <Textarea
                  id="advice"
                  data-testid="advice-input"
                  placeholder="e.g., Meet physiotherapist, Do regular exercises, Avoid cold water..."
                  className="min-h-[80px] bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                  value={formData.advice}
                  onChange={(e) => handleInputChange("advice", e.target.value)}
                />
              </div>

              {/* Lab Tests Advised */}
              <div className="space-y-2">
                <Label htmlFor="lab_tests" className="text-slate-700 font-medium">
                  Lab Tests Advised (for next visit)
                </Label>
                <Textarea
                  id="lab_tests"
                  data-testid="lab-tests-input"
                  placeholder="e.g., CBC, ESR, CRP, Uric Acid, LFT, RFT..."
                  className="min-h-[80px] bg-white border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                  value={formData.lab_tests}
                  onChange={(e) => handleInputChange("lab_tests", e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  data-testid="submit-prescription-btn"
                  className="bg-[#6B9A9A] hover:bg-[#5A8888] text-white px-8"
                  disabled={loading}
                >
                  {loading 
                    ? (isEditMode ? "Updating..." : "Creating...") 
                    : (isEditMode ? "Update Prescription" : "Create Prescription")
                  }
                </Button>
                {isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-slate-600"
                    onClick={() => navigate(`/prescription/${editId}`)}
                  >
                    Cancel
                  </Button>
                )}
                {!isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  data-testid="reset-form-btn"
                  className="text-slate-600"
                  onClick={resetForm}
                >
                  Reset
                </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        )}
      </main>

      {/* Custom Frequency Dialog */}
      <Dialog open={customFreqDialog.open} onOpenChange={(open) => setCustomFreqDialog({ ...customFreqDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Frequency</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="custom_freq" className="text-slate-700">
              Enter frequency (e.g., 1-1-0, BD, TDS, SOS, After food)
            </Label>
            <Input
              id="custom_freq"
              data-testid="custom-frequency-input"
              type="text"
              placeholder="e.g., BD, TDS, 1-1-0, SOS"
              className="mt-2"
              value={customFreq}
              onChange={(e) => setCustomFreq(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomFreqDialog({ open: false, index: null })}
            >
              Cancel
            </Button>
            <Button
              data-testid="save-custom-frequency-btn"
              className="bg-[#6B9A9A] hover:bg-[#5A8888]"
              onClick={saveCustomFrequency}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Existing Prescriptions Dialog */}
      <Dialog open={showExistingDialog} onOpenChange={setShowExistingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#6B9A9A]" />
              Existing Prescriptions Found
            </DialogTitle>
            <DialogDescription>
              Found {existingPrescriptions.length} prescription(s) for OP No: {formData.op_no}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-3">
              {existingPrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-[#6B9A9A]/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-medium text-slate-800">
                          {prescription.patient_name}
                        </span>
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(prescription.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        <span className="font-medium">Diagnosis:</span> {prescription.diagnosis}
                      </p>
                      <p className="text-sm text-slate-500">
                        <span className="font-medium">Drugs:</span>{" "}
                        {prescription.drugs?.map(d => d.drug_name).join(", ") || "None"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#6B9A9A] border-[#6B9A9A]/30 hover:bg-[#6B9A9A]/5"
                        onClick={() => loadExistingPrescription(prescription, true)}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Load All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-600 border-slate-200 hover:bg-slate-50"
                        onClick={() => navigate(`/prescription/${prescription.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteConfirmDialog({ 
                          open: true, 
                          id: prescription.id, 
                          opNo: prescription.op_no 
                        })}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (existingPrescriptions.length > 0) {
                  loadExistingPrescription(existingPrescriptions[0], false);
                }
              }}
            >
              Load Patient Info Only
            </Button>
            <Button
              className="bg-[#6B9A9A] hover:bg-[#5A8888]"
              onClick={() => setShowExistingDialog(false)}
            >
              Start Fresh Prescription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteConfirmDialog.open} 
        onOpenChange={(open) => setDeleteConfirmDialog({ ...deleteConfirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prescription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prescription for OP No: {deleteConfirmDialog.opNo}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => handleDeletePrescription(deleteConfirmDialog.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PrescriptionForm;
