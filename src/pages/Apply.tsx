import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { ArrowLeft, Upload, Loader2, ShieldCheck, Lock, Info, FileCheck } from "lucide-react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants";
import { uploadToIPFS } from "../utils/uploadToIPFS";

const Apply = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    appName: "", designation: "Individual", pan: "",
    address: "", state: "", city: "", district: "",
    mobile: "", email: "", regNumber: ""
  });
  const [bizType, setBizType] = useState("");
  const [subType, setSubType] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [regFile, setRegFile] = useState<File | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (acc: any) => setWalletAddress(acc[0] || ""));
    }
  }, []);

  const handleInputChange = (e: any) => {
    let { name, value } = e.target;
    if (name === "regNumber" || name === "pan") value = value.toUpperCase().replace("_", "-");
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!walletAddress) return setShowAuthModal(true);
    if (!/^REG-\d{6}$/.test(formData.regNumber)) return toast({ title: "Format Error", description: "Use REG-XXXXXX", variant: "destructive" });

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      // Fraud Check: Duplicate Registry
      const count = Number(await contract.licenseCount());
      for (let i = 1; i <= count; i++) {
        const lic = await contract.getLicense(i);
        if (lic[2] === formData.regNumber) throw new Error("This Registration Number is already taken.");
      }

      setStatus("Syncing Docs...");
      const ipfsUrl = await uploadToIPFS(regFile!);
      const signer = await provider.getSigner();
      const contractSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const fullDetails = `Owner: ${formData.appName} | PAN: ${formData.pan} | Loc: ${formData.city}, ${formData.state} | Type: ${subType}`;
      
      const tx = await contractSigner.applyForLicense(
        formData.appName, formData.regNumber, formData.email, 
        `${formData.address}, ${formData.city}, ${formData.state}`, 
        fullDetails, subType, bizType, ipfsUrl
      );

      await tx.wait();
      toast({ title: "Vault Secured", description: "Application registered on Blockchain." });
      navigate("/user-dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); setStatus(""); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-10 max-w-4xl">
        <Button variant="ghost" className="mb-4 text-slate-400" onClick={() => navigate("/user-dashboard")}><ArrowLeft className="mr-2 h-4 w-4" /> Exit</Button>
        
        <Card className="border border-blue-100 shadow-2xl overflow-hidden rounded-2xl">
          {/* UPDATED HERO HEADER: Light Blue Gradient */}
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter text-slate-900">
              <ShieldCheck className="text-blue-500 h-6 w-6" /> LicenseChain Registry Portal
            </CardTitle>
          </CardHeader>

          <CardContent className="p-8 space-y-10 bg-white">
            <form onSubmit={handleSubmit} className="space-y-10">
              
              {/* SECTION: APPLICANT DETAILS */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b pb-2">01. Applicant Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-slate-500">Name of Applicant / Company</Label>
                    <Input name="appName" onChange={handleInputChange} required className="border-slate-100" />
                  </div>
                  <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-slate-500">Designation</Label>
                    <RadioGroup defaultValue="Individual" onValueChange={(v) => setFormData({...formData, designation: v})} className="flex gap-4 pt-2">
                      {["Individual", "Partner", "Proprietor"].map(d => (
                        <div key={d} className="flex items-center space-x-2"><RadioGroupItem value={d} id={d} className="border-blue-200 text-blue-600" /><Label htmlFor={d} className="text-xs text-slate-600">{d}</Label></div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
                <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-slate-500">Business PAN No. *</Label>
                  <Input name="pan" placeholder="ABCDE1234F" onChange={handleInputChange} required className="border-slate-100" />
                  <p className="text-[9px] text-slate-400 italic font-medium">* PAN is a business identity as decided by authority.</p>
                </div>
              </div>

              {/* SECTION: PREMISES ADDRESS */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b pb-2">02. Premises Location</h3>
                <div className="space-y-4">
                  <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-slate-500">Complete Address</Label>
                    <Textarea name="address" onChange={handleInputChange} required placeholder="Building No, Street..." className="border-slate-100" />
                    <p className="text-[9px] text-slate-400 italic">* Please type the address as per the Proof of Possession.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-slate-500">State</Label><Input name="state" onChange={handleInputChange} required className="border-slate-100" /></div>
                    <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-slate-500">City</Label><Input name="city" onChange={handleInputChange} required className="border-slate-100" /></div>
                    <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-slate-500">District/Region</Label><Input name="district" onChange={handleInputChange} required className="border-slate-100" /></div>
                  </div>
                </div>
              </div>

              {/* SECTION: NATURE OF BUSINESS */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b pb-2">03. Nature of Business</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-slate-500">Business Category</Label>
                    <Select onValueChange={setBizType} required>
                      <SelectTrigger className="border-slate-100"><SelectValue placeholder="Choose Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food Services">Food Services</SelectItem>
                        <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                        <SelectItem value="Trade/Retail">Trade & Retail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {bizType && (
                    <div className="space-y-2 font-bold animate-in fade-in duration-300"><Label className="text-[10px] uppercase font-bold text-slate-500">Specific Type</Label>
                      <Select onValueChange={setSubType} required>
                        <SelectTrigger className="border-slate-100"><SelectValue placeholder="Choose Type" /></SelectTrigger>
                        <SelectContent>
                          {bizType === "Food Services" && ["Canteen", "Caterer", "Cloud Kitchen", "Restaurant", "Cafe", "Snacks Shop"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          {bizType === "Manufacturer" && ["Exporter-Manufacturer", "Food Supplements", "Health Supplements"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          {bizType === "Trade/Retail" && ["Wholesaler", "Distributor", "Retailer"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: REGISTRATION & DOCUMENTS */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b pb-2">04. Authentication Vault</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><Label className="text-[10px] uppercase font-bold text-slate-500">Registration ID</Label>
                      <div className="group relative"><Info className="h-3 w-3 text-slate-300 cursor-help" />
                        <div className="absolute bottom-full mb-2 left-0 w-64 p-3 bg-slate-900 text-[10px] text-slate-200 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-slate-700">
                          Format: <span className="text-blue-400 font-mono">REG-XXXXXX</span>. Used as 2FA secret for verifiers.
                        </div>
                      </div>
                    </div>
                    <Input name="regNumber" placeholder="REG-123456" onChange={handleInputChange} required className="font-mono h-12 border-slate-100" />
                  </div>
                  <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-slate-500">Contact Number</Label><Input name="mobile" placeholder="+91" onChange={handleInputChange} required className="h-12 border-slate-100" /></div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-xl border-2 border-dashed relative text-center group hover:bg-white hover:border-emerald-500 transition-all">
                    <input type="file" onChange={(e:any) => setIdFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                    <Upload className="h-6 w-6 text-slate-300 mx-auto mb-2 group-hover:text-emerald-500" /><p className="text-[10px] font-bold text-slate-500 tracking-tight">{idFile ? idFile.name : "Personal ID"}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-xl border-2 border-dashed relative text-center group hover:bg-white hover:border-emerald-500 transition-all">
                    <input type="file" onChange={(e:any) => setRegFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                    <Upload className="h-6 w-6 text-slate-300 mx-auto mb-2 group-hover:text-emerald-500" /><p className="text-[10px] font-bold text-slate-500 tracking-tight">{regFile ? regFile.name : "Business Doc"}</p>
                  </div>
                </div>
              </div>

              {/* UPDATED ACTION BUTTON: Emerald Green */}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-16 text-sm font-black uppercase tracking-[0.3em] shadow-xl transition-all rounded-xl" disabled={loading}>
                {loading ? <><Loader2 className="animate-spin h-5 w-5 mr-3" /> {status}</> : <><FileCheck className="h-5 w-5 mr-2" /> Submit Application</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AUTH MODAL */}
        {showAuthModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-md">
            <Card className="w-full max-w-sm p-8 text-center space-y-6 shadow-2xl border-none rounded-3xl">
              <div className="mx-auto bg-emerald-50 p-5 rounded-full w-fit"><Lock className="h-10 w-10 text-emerald-600" /></div>
              <h3 className="font-black text-xl uppercase tracking-tighter">Security Authentication</h3>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest leading-relaxed">Connect Wallet to Sign Registry Entry and Commit to Blockchain Vault.</p>
              <Button onClick={() => window.ethereum.request({ method: 'eth_requestAccounts' })} className="w-full bg-slate-900 h-12 uppercase font-black text-xs tracking-widest rounded-xl">Authorize Access</Button>
              <Button variant="ghost" onClick={() => setShowAuthModal(false)} className="text-[10px] uppercase font-bold text-slate-400">Cancel</Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Apply;