import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";

const Header = () => {
  const location = useLocation();
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Apply", path: "/apply" },
    { name: "Verify", path: "/verify" },
    { name: "Dashboard", path: "/user-dashboard" },
    { name: "Admin", path: "/admin" },
  ];

  // 1. Check connection on load (Refresh sensitivity)
  useEffect(() => {
    checkConnection();
    
    // Listen for account changes (if user switches wallet)
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) setWallet(accounts[0]);
        else setWallet("");
      });
    }
  }, []);

  const checkConnection = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        setWallet(accounts[0].address);
      }
    } catch (err) {
      console.error("Silent connection check failed", err);
    }
  };

  // 2. Connect Function (Forces Popup)
  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask not found!");
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []); // Force popup
      setWallet(accounts[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-900 hover:opacity-80 transition-opacity">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          <span>LicenseChain</span>
        </Link>

        {/* NAV LINKS */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive(item.path) ? "text-slate-900 font-bold" : "text-slate-500"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* CONNECT BUTTON (The Only One) */}
        <div>
          {!wallet ? (
            <Button onClick={connectWallet} disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
              Connect
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm text-sm font-mono text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {wallet.slice(0,6)}...{wallet.slice(-4)}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;