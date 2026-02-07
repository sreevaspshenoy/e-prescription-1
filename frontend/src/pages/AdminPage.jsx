import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, removeToken } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Switch } from "@/components/ui/switch";
import {
  Stethoscope,
  Plus,
  LogOut,
  Users,
  Edit,
  Trash2,
  FileText,
  Shield,
  MapPin,
} from "lucide-react";

const AdminPage = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [formData, setFormData] = useState({
    name: "",
    qualifications: "",
    role: "Consultant Rheumatologist",
    kmc_no: "",
    location: "",
    username: "",
    password: "",
    is_active: true,
  });

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/doctors`);
      setDoctors(response.data.doctors);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("Admin access required");
        navigate("/");
      } else {
        toast.error("Failed to fetch doctors");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        // Update existing doctor
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if empty
        }
        await axios.put(`${API}/admin/doctors/${editingDoctor.id}`, updateData);
        toast.success("Doctor updated successfully");
      } else {
        // Create new doctor
        await axios.post(`${API}/admin/doctors`, formData);
        toast.success("Doctor created successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Operation failed");
    }
  };

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      qualifications: doctor.qualifications || "",
      role: doctor.role || "Consultant Rheumatologist",
      kmc_no: doctor.kmc_no || "",
      location: doctor.location || "",
      username: doctor.username,
      password: "", // Don't show existing password
      is_active: doctor.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/admin/doctors/${id}`);
      toast.success("Doctor deleted successfully");
      setDeleteDialog({ open: false, id: null, name: '' });
      fetchDoctors();
    } catch (error) {
      toast.error("Failed to delete doctor");
    }
  };

  const resetForm = () => {
    setEditingDoctor(null);
    setFormData({
      name: "",
      qualifications: "",
      role: "Consultant Rheumatologist",
      kmc_no: "",
      location: "",
      username: "",
      password: "",
      is_active: true,
    });
  };

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("rheumacare_user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-page">
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
                  <Shield className="w-3 h-3" /> Admin Panel
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                data-testid="view-history-btn"
                onClick={() => navigate("/history")}
              >
                <FileText className="w-4 h-4 mr-2" />
                All Prescriptions
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
                <Users className="w-5 h-5 text-[#6B9A9A]" />
                Doctor Management
              </CardTitle>
              <Button
                data-testid="add-doctor-btn"
                className="bg-[#6B9A9A] hover:bg-[#5A8888] text-white"
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Doctor
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9A9A]"></div>
              </div>
            ) : doctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Users className="w-12 h-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium">No doctors found</p>
                <p className="text-sm">Add your first doctor to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">Name</TableHead>
                      <TableHead className="font-semibold text-slate-700">Username</TableHead>
                      <TableHead className="font-semibold text-slate-700">Location</TableHead>
                      <TableHead className="font-semibold text-slate-700">Qualifications</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors.map((doctor) => (
                      <TableRow key={doctor.id} data-testid={`doctor-row-${doctor.id}`}>
                        <TableCell className="font-medium text-slate-800">
                          {doctor.name}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {doctor.username}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {doctor.location || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-[200px] truncate">
                          {doctor.qualifications || "N/A"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            doctor.is_active 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {doctor.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`edit-doctor-btn-${doctor.id}`}
                              className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                              onClick={() => handleEdit(doctor)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`delete-doctor-btn-${doctor.id}`}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteDialog({ 
                                open: true, 
                                id: doctor.id, 
                                name: doctor.name 
                              })}
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

        {/* Login Credentials Info */}
        <Card className="mt-6 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Login Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 space-y-2">
              <p><strong>Admin Login:</strong> username: <code className="bg-slate-100 px-1 rounded">admin</code></p>
              <p className="text-slate-500">Each doctor can login with their username and password to see only their prescriptions.</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Add/Edit Doctor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
            </DialogTitle>
            <DialogDescription>
              {editingDoctor 
                ? "Update doctor details. Leave password empty to keep existing." 
                : "Enter doctor details and login credentials."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    data-testid="doctor-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Dr. John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    data-testid="doctor-location-input"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Bangalore"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    data-testid="doctor-username-input"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="johndoe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password {editingDoctor ? "(leave empty to keep)" : "*"}
                  </Label>
                  <Input
                    id="password"
                    data-testid="doctor-password-input"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required={!editingDoctor}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualifications">Qualifications</Label>
                <Input
                  id="qualifications"
                  data-testid="doctor-qualifications-input"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  placeholder="MD, DM (Rheumatology)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Consultant Rheumatologist"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kmc_no">Registration No.</Label>
                  <Input
                    id="kmc_no"
                    value={formData.kmc_no}
                    onChange={(e) => setFormData({ ...formData, kmc_no: e.target.value })}
                    placeholder="KMC No. 12345"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (can login)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#6B9A9A] hover:bg-[#5A8888]">
                {editingDoctor ? "Update" : "Create"} Doctor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Doctor?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteDialog.name}? 
              This action cannot be undone. Their prescriptions will remain but they will not be able to login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => handleDelete(deleteDialog.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPage;
