import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { Loader2, FileText, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, Plus, ShieldCheck, Wallet, Eye, Mail, MapPin, Briefcase, Download } from "lucide-react";

import Header from "@/components/Header";
import OfficialLicense from "@/components/OfficialLicense";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants";

interface MyLicense {
  id: number; businessName: string; regNumber: string; email: string; address: string; 
  description: string; sector: string; type: string; status: "Pending" | "Approved" | "Rejected" | "Revoked";
  issueDate: string; expiryDate: string; ipfsHash: string;
}

const UserDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const certRef = useRef<HTMLDivElement>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [myApps, setMyApps] = useState<MyLicense[]>([]);

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) { setCurrentAddress(accounts[0]); setIsConnected(true); } 
        else { setIsConnected(false); setMyApps([]); }
      });
    }
  }, []);

  useEffect(() => { if (isConnected && currentAddress) fetchMyLicenses(currentAddress); }, [isConnected, currentAddress]);

  const checkConnection = async () => {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) { setCurrentAddress(accounts[0].address); setIsConnected(true); }
  };

  const fetchMyLicenses = async (userAddr: string) => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const count = Number(await contract.licenseCount());
      const apps: MyLicense[] = [];
      for (let i = 1; i <= count; i++) {
        const lic = await contract.getLicense(i);
        if (lic[9].toLowerCase() === userAddr.toLowerCase()) {
          apps.push({
            id: Number(lic[0]), businessName: lic[1], regNumber: lic[2], email: lic[3],
            address: lic[4], description: lic[5], type: lic[6], sector: lic[7], ipfsHash: lic[8],
            issueDate: Number(lic[10]) > 0 ? new Date(Number(lic[10]) * 1000).toLocaleDateString() : "-",
            expiryDate: Number(lic[11]) > 0 ? new Date(Number(lic[11]) * 1000).toLocaleDateString() : "-",
            status: lic[12] as any
          });
        }
      }
      setMyApps(apps.reverse());
    } finally { setLoading(false); }
  };

  const downloadDoc = async (name: string) => {
    if (certRef.current) {
      await new Promise(r => setTimeout(r, 100)); // Ensure render
      const canvas = await html2canvas(certRef.current, { scale: 3, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `License_${name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Downloaded", description: "Official license saved." });
    }
  };

  if (!isConnected) return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-xl border-t-4 border-blue-600">
          <CardHeader className="text-center">
            <Wallet className="h-10 w-10 text-blue-600 mx-auto mb-2" />
            <CardTitle>User Dashboard</CardTitle>
            <CardDescription>Connect wallet to manage licenses.</CardDescription>
          </CardHeader>
          <CardContent><Button className="w-full bg-blue-600" onClick={() => window.ethereum.request({ method: 'eth_requestAccounts' })}>Connect Wallet</Button></CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">User Dashboard</h1>
          <Button variant="outline" onClick={() => fetchMyLicenses(currentAddress)} className="bg-white">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <Button onClick={() => navigate("/apply")} className="bg-slate-900 h-14 text-lg px-8 mb-10 shadow-md"><Plus className="mr-2 h-5 w-5" /> New Application</Button>

        <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-slate-400" /> My Applications</h2>
        
        <div className="grid gap-4">
          {myApps.map((app) => (
            <Card key={app.id} className="border-l-4" style={{ borderLeftColor: app.status === "Approved" ? "#16a34a" : app.status === "Rejected" ? "#dc2626" : "#3b82f6" }}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${app.status === "Approved" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>
                    {app.status === "Approved" ? <CheckCircle /> : <Clock />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{app.businessName}</h3>
                    <p className="text-sm text-slate-500">#{app.id} • {app.regNumber} • {app.sector}</p>
                    <Dialog>
                      <DialogTrigger asChild><button className="text-blue-600 text-sm hover:underline mt-2 flex items-center gap-1 font-medium"><Eye className="h-3 w-3" /> View Details</button></DialogTrigger>
                      <DialogContent className="max-w-2xl p-8">
                        <DialogHeader><DialogTitle className="text-2xl font-bold border-b pb-2">Application Details</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                          <div><p className="font-bold text-slate-400 uppercase text-[10px]">Business Name</p><p className="font-semibold text-lg">{app.businessName}</p></div>
                          <div><p className="font-bold text-slate-400 uppercase text-[10px]">Status</p><Badge className={app.status === "Approved" ? "bg-green-600" : "bg-blue-600"}>{app.status}</Badge></div>
                          <div><p className="font-bold text-slate-400 uppercase text-[10px]">Registration No.</p><p className="font-mono">{app.regNumber}</p></div>
                          <div><p className="font-bold text-slate-400 uppercase text-[10px]">Type / Sector</p><p>{app.type} / {app.sector}</p></div>
                          <div><p className="font-bold text-slate-400 uppercase text-[10px]">Email</p><p>{app.email}</p></div>
                          <div><p className="font-bold text-slate-400 uppercase text-[10px]">Applied Date</p><p>{app.issueDate}</p></div>
                        </div>
                        <div className="mt-4 pt-4 border-t"><p className="font-bold text-slate-400 uppercase text-[10px]">Address</p><p className="text-sm">{app.address}</p></div>
                        <div className="mt-4 bg-slate-50 p-3 rounded italic text-sm border font-medium">"{app.description}"</div>
                        <div className="mt-6 flex gap-4">
                          {app.ipfsHash && <a href={app.ipfsHash} target="_blank" className="flex-1 border text-center py-2 rounded text-sm font-bold bg-white hover:bg-slate-50 flex items-center justify-center gap-2"><ExternalLink className="h-4 w-4"/> KYC Doc</a>}
                          {app.status === "Approved" && <Button onClick={() => downloadDoc(app.businessName)} className="flex-1 bg-green-600 hover:bg-green-700"><Download className="h-4 w-4 mr-2"/> Download License</Button>}
                        </div>
                        {/* OFF-SCREEN RENDER FOR DOWNLOAD */}
<div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
  <OfficialLicense ref={certRef} data={app} contractAddress={CONTRACT_ADDRESS} />
</div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <Badge className={app.status === "Approved" ? "bg-green-600" : "bg-blue-600"}>{app.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;