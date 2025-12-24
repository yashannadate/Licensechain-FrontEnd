import { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { 
  FileText, CheckCircle, XCircle, RefreshCw, Search, 
  Loader2, Lock, Eye, ExternalLink, ShieldCheck, 
  Mail, MapPin, User, Building2, CreditCard, PhoneCall 
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CONTRACT_ADDRESS, CONTRACT_ABI, ADMIN_WALLET_ADDRESS } from "@/constants";

interface Application {
  id: number; businessName: string; regNumber: string; email: string;
  address: string; description: string; type: string; sector: string;
  applicant: string; date: string; status: "Pending" | "Approved" | "Rejected" | "Revoked";
  ipfsHash: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [viewState, setViewState] = useState<"DISCONNECTED" | "UNAUTHORIZED" | "AUTHORIZED">("DISCONNECTED");
  const [currentAddress, setCurrentAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const maskAddress = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  useEffect(() => {
    checkWalletStatus();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) { setViewState("DISCONNECTED"); setCurrentAddress(""); }
        else validateAdmin(accounts[0]);
      });
    }
  }, []);

  useEffect(() => {
    if (viewState === "AUTHORIZED") fetchBlockchainData();
  }, [viewState]);

  const checkWalletStatus = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) validateAdmin(accounts[0].address);
      else setViewState("DISCONNECTED");
    } catch (err) { console.error(err); }
  };

  const validateAdmin = (address: string) => {
    setCurrentAddress(address);
    if (address.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) setViewState("AUTHORIZED");
    else setViewState("UNAUTHORIZED");
  };

  const fetchBlockchainData = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const count = Number(await contract.licenseCount());
      const data: Application[] = [];

      for (let i = count; i >= 1; i--) {
        const lic = await contract.getLicense(i);
        const status = lic[12];
        
        // Filter out revoked applications
        if (status === "Revoked") continue;

        data.push({
          id: Number(lic[0]),
          businessName: lic[1],
          regNumber: lic[2],
          email: lic[3],
          address: lic[4],
          description: lic[5],
          type: lic[6],
          sector: lic[7],
          ipfsHash: lic[8],
          applicant: lic[9],
          // FIX: Always show a date string. If timestamp is 0, use current date.
          date: Number(lic[10]) > 0 
            ? new Date(Number(lic[10]) * 1000).toLocaleDateString() 
            : new Date().toLocaleDateString(),
          status: status as any
        });
      }
      setApplications(data);
    } finally { setLoading(false); }
  };
 

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesStatus = filterStatus === "All" || app.status === filterStatus;
      const matchesSearch = app.businessName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            app.regNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [applications, filterStatus, searchQuery]);

  const stats = useMemo(() => [
    { label: "Pending", count: applications.filter(a => a.status === "Pending").length, filter: "Pending", color: "text-blue-600" },
    { label: "Approved", count: applications.filter(a => a.status === "Approved").length, filter: "Approved", color: "text-emerald-600" },
    { label: "Revoked", count: applications.filter(a => a.status === "Revoked").length, filter: "Revoked", color: "text-red-600" },
    { label: "Total", count: applications.length, filter: "All", color: "text-slate-600" },
  ], [applications]);

  const handleAction = async (id: number, action: "approve" | "reject" | "revoke") => {
    try {
      setProcessingId(id);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      let tx;
      if (action === "approve") tx = await contract.approveLicense(id);
      else if (action === "reject") tx = await contract.rejectLicense(id);
      else tx = await contract.revokeLicense(id);

      toast({ title: "Confirming Transaction", description: "Executing on blockchain..." });
      await tx.wait(); 
      toast({ title: "Success", description: `Record updated successfully.` });
      fetchBlockchainData();
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); } 
    finally { setProcessingId(null); }
  };

  if (viewState === "DISCONNECTED") return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header /><div className="flex-grow flex items-center justify-center p-4"><Card className="w-full max-w-sm shadow-xl border-t-4 border-slate-900"><CardHeader className="text-center"><Lock className="mx-auto h-8 w-8 mb-2 text-slate-400"/><CardTitle>Admin Portal</CardTitle><CardDescription>Connect wallet to authorize registry access.</CardDescription></CardHeader><CardContent><Button onClick={() => window.ethereum.request({ method: 'eth_requestAccounts' })} className="w-full bg-slate-900">Authorize Access</Button></CardContent></Card></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter flex items-center gap-3">
              Admin Dashboard <Badge className="bg-slate-900 text-white font-bold">S E C U R E</Badge>
            </h1>
            <p className="text-sm text-slate-500">Admin: <span className="font-mono bg-white px-2 rounded border">{maskAddress(currentAddress)}</span></p>
          </div>
          <Button variant="outline" onClick={fetchBlockchainData} className="bg-white border-slate-200">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* CLICKABLE STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <Card key={i} onClick={() => setFilterStatus(stat.filter)} className={`border-none shadow-sm transition-all cursor-pointer ${filterStatus === stat.filter ? 'ring-2 ring-slate-900 bg-white' : 'bg-white opacity-90 hover:opacity-100 hover:translate-y-[-2px]'}`}>
              <CardContent className="p-6">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${stat.color} mb-1`}>{stat.label}</p>
                <div className="flex justify-between items-end">
                   <h3 className="text-4xl font-extrabold text-slate-900">{stat.count}</h3>
                   <span className="text-[10px] font-bold text-slate-300">Filter</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-xl border-none overflow-hidden bg-white rounded-2xl">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-500"/> Applications ({filterStatus})</h2>
            <div className="relative w-full sm:w-80">
               <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
               <input placeholder="Search applicants..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 w-full rounded-xl border border-slate-100 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-inner" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="pl-8">Business Name</TableHead>
                  <TableHead>Applicant Details</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApps.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-24 text-slate-400 italic font-medium">No pending records found in this category.</TableCell></TableRow>
                ) : (
                  filteredApps.map((app) => (
                    <TableRow key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-8 font-semibold text-slate-900 uppercase tracking-tight">{app.businessName}</TableCell>
                      <TableCell>
                        <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 rounded border w-fit mb-1">{maskAddress(app.applicant)}</div>
                        <div className="text-[11px] font-bold text-slate-500 uppercase">{app.sector} • {app.type}</div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-600">{app.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border-none rounded-full px-3 py-0.5 text-[10px] font-bold ${app.status === "Approved" ? "text-emerald-700 bg-emerald-50" : app.status === "Pending" ? "text-blue-700 bg-blue-50" : "text-red-700 bg-red-50"}`}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-3 items-center">
                          <Dialog>
                            <DialogTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-slate-100"><Eye className="h-4 w-4 text-slate-400" /></Button></DialogTrigger>
                            <DialogContent className="max-w-2xl p-8 border-none shadow-2xl rounded-3xl">
                              <DialogHeader className="border-b pb-4 mb-6">
                                <DialogTitle className="flex items-center gap-2 text-xl font-bold uppercase tracking-tight text-slate-900">
                                  <ShieldCheck className="h-6 w-6 text-emerald-600"/> Registry Audit Record
                                </DialogTitle>
                              </DialogHeader>
                              
                              <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entity Name</p><p className="font-bold text-slate-900 uppercase text-lg">{app.businessName}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registry ID</p><p className="font-mono font-bold text-emerald-600 text-lg">{app.regNumber}</p></div>
                                
                                <div className="col-span-2 grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sector</p><p className="text-sm font-bold text-slate-700">{app.sector}</p></div>
                                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Business Class</p><p className="text-sm font-bold text-slate-700">{app.type}</p></div>
                                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Compliance Email</p><p className="text-sm font-bold text-slate-700">{app.email}</p></div>
                                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Submission Date</p><p className="text-sm font-bold text-slate-700">{app.date}</p></div>
                                </div>

                                <div className="col-span-2 space-y-4">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin className="h-3 w-3"/> Premise Address</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-dashed">{app.address}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Audit Trail (Owner/PAN/Loc)</p>
                                    <p className="text-[11px] text-slate-500 italic bg-white p-3 rounded-xl border border-slate-100 shadow-inner">{app.description}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-8 pt-6 border-t border-slate-50 flex gap-4">
                                <Button className="flex-1 bg-slate-900 hover:bg-slate-800 rounded-xl h-12 text-xs font-bold uppercase tracking-widest gap-2" onClick={() => window.open(app.ipfsHash)}>
                                  <ExternalLink className="h-4 w-4"/> Authenticate KYC Vault
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {app.status === "Pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 text-[11px] font-bold uppercase px-3 h-8" onClick={() => handleAction(app.id, "reject")} disabled={processingId === app.id}>Reject</Button>
                              <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase px-4 h-8 rounded-lg" onClick={() => handleAction(app.id, "approve")} disabled={processingId === app.id}>
                                {processingId === app.id ? <Loader2 className="h-3 w-3 animate-spin"/> : "Approve"}
                              </Button>
                            </div>
                          )}

                          {app.status === "Approved" && (
                            <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-50 text-[11px] font-bold uppercase px-4 h-8" onClick={() => handleAction(app.id, "revoke")} disabled={processingId === app.id}>
                               Revoke
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;