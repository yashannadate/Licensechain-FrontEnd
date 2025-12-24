import { forwardRef } from "react";
import { Award, ShieldCheck, Globe } from "lucide-react";

const OfficialLicense = forwardRef<HTMLDivElement, { data: any, contractAddress: string }>(
  ({ data, contractAddress }, ref) => {
    return (
      <div 
        ref={ref} 
        className="w-[850px] p-20 bg-white border-[2px] border-slate-900 text-slate-900 font-serif shadow-2xl relative overflow-hidden"
      >
        {/* Authority Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-12">
          <ShieldCheck className="w-[600px] h-[600px]" />
        </div>

        {/* Outer Frame */}
        <div className="absolute inset-4 border border-slate-200 pointer-events-none"></div>

        {/* 1. Header Section */}
        <div className="text-center relative z-10 mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="bg-slate-900 p-2 rounded-lg">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic">
              LICENSE<span className="text-slate-500 font-light">CHAIN</span>
            </h1>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-slate-400 mb-2">
            Global Decentralized Registry Authority
          </p>
          <div className="h-1 w-24 bg-slate-900 mx-auto rounded-full"></div>
        </div>
        
        {/* 2. Main Title */}
        <div className="text-center mb-10 space-y-4">
          <h2 className="text-3xl font-bold uppercase tracking-widest text-slate-800">
            Certificate of Operational License
          </h2>
          <p className="text-sm font-sans text-slate-500 max-w-lg mx-auto leading-relaxed">
            This document serves as formal verification that the entity mentioned below is legally registered and authorized under the blockchain-secured protocols of the LicenseChain system.
          </p>
        </div>

        {/* 3. Entity Information */}
        <div className="space-y-12 mb-12 relative z-10">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2 tracking-widest">Registered Entity Name</span>
            <h3 className="text-5xl font-black text-slate-900 uppercase border-b-2 border-slate-100 inline-block px-12 pb-2">
              {data.businessName}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-16 px-10">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Registration Number</label>
                <p className="text-lg font-mono font-bold text-slate-800">{data.regNumber}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Business Classification</label>
                <p className="text-lg font-bold">{data.type} — {data.sector}</p>
              </div>
            </div>
            <div className="space-y-6 text-right">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">License Identity Number</label>
                <p className="text-lg font-mono font-bold text-slate-800">LC-{data.id}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Registered Address</label>
                <p className="text-sm font-medium leading-tight">{data.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Validity Footer */}
        <div className="bg-slate-50 p-8 rounded-sm border border-slate-100 grid grid-cols-3 gap-8 items-center relative z-10">
          <div>
            <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Date of Issue</p>
            <p className="text-sm font-bold">{data.issueDate}</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-[10px] font-bold text-slate-700">ACTIVE STATUS</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Expiration Date</p>
            <p className="text-sm font-bold text-green-700">{data.expiryDate}</p>
          </div>
        </div>

        {/* 5. Authority & Signature */}
        <div className="flex justify-between items-end mt-16 px-4">
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                <Globe className="h-3 w-3" /> VERIFIED GLOBAL ASSET
             </div>
             <p className="text-[8px] font-mono text-slate-300 max-w-[250px] break-all leading-none">
               CONTRACT: {contractAddress}
             </p>
          </div>
          
          <div className="text-center flex flex-col items-center">
            <Award className="h-16 w-16 text-slate-200 mb-2" />
            <div className="w-40 h-[1px] bg-slate-400 mb-2"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 leading-none">
              System Registrar
            </p>
            <p className="text-[8px] text-slate-400 uppercase font-bold mt-1">LicenseChain Protocol</p>
          </div>
        </div>
      </div>
    );
  }
);

OfficialLicense.displayName = "OfficialLicense";
export default OfficialLicense;