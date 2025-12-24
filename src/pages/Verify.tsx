import { useState } from "react";
import { ethers } from "ethers";
import { 
  Search, Loader2, ShieldCheck, CheckCircle2, 
  XCircle, FileText, Info, Mail, MapPin 
} from "lucide-react";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants";

const Verify = () => {
  const [licenseId, setLicenseId] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  // STRICT VALIDATION: REG- followed by exactly 6 digits
  const isValidRegFormat = (val: string) => /^REG-\d{6}$/.test(val);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    // SANITIZATION:
    // 1. Trim whitespace
    // 2. Force Uppercase
    // 3. Auto-fix: Convert underscores (_) back to hyphens (-) for consistency
    const formattedReg = regNumber.trim().toUpperCase().replace("_", "-");

    // 1. Frontend Validation Checks
    if (!licenseId) return setError("License Identity Number is required.");
    if (!formattedReg) return setError("Registration Number is required.");
    
    if (!isValidRegFormat(formattedReg)) {
      return setError("Invalid Format. Use: REG-123456 (Must be 'REG-' followed by 6 digits).");
    }
    
    setLoading(true);

    try {
      if (!window.ethereum) throw new Error("MetaMask not detected.");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // 2. Fetch Blockchain Data
      const data = await contract.getLicense(licenseId);

      // 3. Check if Identity ID actually exists
      if (Number(data[0]) === 0) {
        throw new Error("License Identity Number not found on the blockchain.");
      }

      // 4. THE TWO-FACTOR CHECK:
      // Normalize both sides to hyphens to ensure a perfect match
      const blockchainReg = data[2].trim().toUpperCase().replace("_", "-");

      if (blockchainReg !== formattedReg) {
        throw new Error(`Security Mismatch: The provided Registration Number does not match ID #${licenseId}.`);
      }

      const expiry = Number(data[11]);
      const now = Math.floor(Date.now() / 1000);
      const isExpired = expiry > 0 && now > expiry;
      const isActive = data[12] === "Approved" && !isExpired;

      setResult({
        id: data[0].toString(),
        businessName: data[1],
        regNumber: data[2], // Original display
        email: data[3],
        address: data[4],
        type: data[6],
        sector: data[7],
        ipfsHash: data[8],
        issueDate: Number(data[10]) > 0 ? new Date(Number(data[10]) * 1000).toLocaleDateString() : "-",
        expiryDate: Number(data[11]) > 0 ? new Date(Number(data[11]) * 1000).toLocaleDateString() : "-",
        isActive: isActive,
        status: data[12]
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
            <ShieldCheck className="h-8 w-8 text-blue-600" /> License Verification Portal
          </h1>
          <p className="text-slate-500 mt-2">Required: Identity Number + Official Registration Credential.</p>
        </div>

        <Card className="w-full max-w-md shadow-xl border-t-4 border-slate-900 bg-white">
          <CardContent className="pt-8 space-y-5">
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">License Identity Number</label>
                <Input 
                  placeholder="e.g. 4" 
                  value={licenseId} 
                  onChange={(e) => setLicenseId(e.target.value)}
                  className="h-12 text-lg font-mono border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Registration Number (REG-XXXXXX)</label>
                <Input 
                  placeholder="REG-123456" 
                  value={regNumber} 
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="h-12 text-lg font-mono border-slate-200 uppercase"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 bg-slate-900 text-white font-bold tracking-widest hover:bg-slate-800 transition-all">
                {loading ? <Loader2 className="animate-spin" /> : "VERIFY CRYPTOGRAPHIC RECORD"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
            <div className="mt-6 w-full max-w-md p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <XCircle className="h-5 w-5 shrink-0" /> <span className="font-medium">{error}</span>
            </div>
        )}

        {result && (
          <Card className="w-full max-w-lg mt-8 shadow-2xl border-2 border-slate-900 bg-white overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  <span className="text-white font-black text-xs tracking-widest uppercase">LicenseChain Authenticated</span>
                </div>
                {result.isActive ? (
                    <Badge className="bg-green-500 text-white border-none px-3">VALID</Badge>
                ) : (
                    <Badge className="bg-red-500 text-white border-none px-3">{result.status}</Badge>
                )}
            </div>
            
            <CardContent className="p-8 space-y-8">
                <div className="border-b pb-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registered Entity</p>
                    <h2 className="text-3xl font-black text-slate-900 uppercase leading-none">{result.businessName}</h2>
                </div>

                <div className="grid grid-cols-2 gap-y-8 gap-x-12 text-sm">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Identity ID</p>
                        <p className="font-mono font-black text-lg text-slate-800">#{result.id}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Registry Code</p>
                        <p className="font-mono font-black text-lg text-slate-800">{result.regNumber}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Sector / Type</p>
                        <p className="font-bold text-slate-700 uppercase">{result.sector} • {result.type}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Expiration</p>
                        <p className={result.isActive ? "text-green-600 font-black" : "text-red-600 font-black"}>
                          {result.expiryDate}
                        </p>
                    </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                   <div className="flex gap-4 text-sm">
                      <Mail className="h-4 w-4 text-slate-400" /> 
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Contact</p>
                        <p className="text-slate-700 font-medium">{result.email}</p>
                      </div>
                   </div>
                   <div className="flex gap-4 text-sm">
                      <MapPin className="h-4 w-4 text-slate-400" /> 
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Location</p>
                        <p className="text-slate-700 font-medium">{result.address}</p>
                      </div>
                   </div>
                </div>

                {result.ipfsHash && (
                    <a href={result.ipfsHash} target="_blank" className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-4 rounded-lg hover:bg-slate-800 transition-all font-black text-[10px] tracking-[0.2em] uppercase">
                        <FileText className="h-4 w-4"/> View Legal Documents
                    </a>
                )}
            </CardContent>
          </Card>
        )}

        <div className="mt-12 flex items-center gap-2 text-slate-400">
           <Info className="h-4 w-4" />
           <p className="text-[10px] font-bold uppercase tracking-[0.2em]">High Authority Verification Active</p>
        </div>
      </main>
    </div>
  );
};

export default Verify;