import { Calendar, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openReservationModal: () => void;
}

export default function Header({ activeTab, setActiveTab, openReservationModal }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check in case they are already scrolled
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { id: "intro", label: "삼잘한의원 소개" },
    { id: "subject", label: "진료과목" },
    { id: "location", label: "지점소개" },
    { id: "notice", label: "공지사항" },
  ];

  const handleMenuClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Determine translucent style vs overlay transparent style
  // We use transparent mode when on pages with hero backgrounds at the top,
  // and when the user hasn't scrolled more than 20px, and mobile drawer is closed.
  const isHeroTab = activeTab === "home" || activeTab === "intro" || activeTab === "subject" || activeTab === "location" || activeTab === "notice";
  const isTransparentMode = isHeroTab && !isScrolled && !isOpen;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isTransparentMode
        ? "bg-transparent border-b border-white/10 shadow-none text-white"
        : "bg-white/65 backdrop-blur-md border-b border-slate-200/85 shadow-[0_2px_15px_-3px_rgba(15,23,42,0.05)] text-[#0F172A]"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center transition-all duration-300 ${isTransparentMode ? "h-24" : "h-20"}`}>
          {/* 로고 영역 */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleMenuClick("home")}
          >
            <div className="w-[52px] h-[52px] flex items-center justify-center transition-all duration-300">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EC%82%BC%EC%9E%98%ED%95%9C%EC%9D%98%EC%9B%90%20%EB%A1%9C%EA%B3%A0-1.png?alt=media&token=92d02b25-8829-4069-8682-67340635f30a"
                alt="삼잘한의원 로고"
                className={`w-full h-full object-contain transition-all duration-300 ${
                  isTransparentMode ? "brightness-0 invert" : "brightness-0"
                }`}
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl font-sans font-bold tracking-widest leading-none transition-colors duration-300 ${isTransparentMode ? "text-white" : "text-[#0F172A]"}`}>
                삼잘한의원
              </h1>
              <p className={`text-[10px] sm:text-xs font-sans tracking-widest mt-1 uppercase transition-colors duration-300 ${isTransparentMode ? "text-slate-300" : "text-[#64748B]"}`}>
                SAMJAL KMED CLINIC
              </p>
            </div>
          </div>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-10">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`relative py-2 text-[15px] font-sans tracking-wider transition-colors duration-300 cursor-pointer ${
                  activeTab === item.id
                    ? isTransparentMode
                      ? "text-white font-semibold"
                      : "text-[#0F2C59] font-bold"
                    : isTransparentMode
                    ? "text-white/80 hover:text-white"
                    : "text-[#0F172A]/80 hover:text-[#0F2C59]"
                }`}
              >
                {item.label}
                {activeTab === item.id && (
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 transition-colors duration-300 ${isTransparentMode ? "bg-white" : "bg-[#0F2C59]"}`} />
                )}
              </button>
            ))}
          </nav>

          {/* 실시간 온라인 예약 버튼 */}
          <div className="hidden md:flex items-center">
            <button
              onClick={() => {
                setActiveTab("reservation");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 transition-all duration-300 text-sm font-sans tracking-wider cursor-pointer ${
                activeTab === "reservation"
                  ? "bg-[#0F2C59] border-[#0F2C59] text-white shadow-md font-semibold"
                  : isTransparentMode
                  ? "border-white/35 text-white hover:bg-white/10"
                  : "border-[#0F2C59]/45 text-[#0F172A] hover:bg-[#0F2C59] hover:border-[#0F2C59] hover:text-white"
              }`}
            >
              <Calendar className={`w-4 h-4 transition-colors duration-300 ${
                activeTab === "reservation"
                  ? "text-white"
                  : isTransparentMode
                  ? "text-white/90"
                  : "text-[#0F2C59] group-hover:text-white"
              }`} />
              예약하기
            </button>
          </div>

          {/* 모바일 메뉴 트리거 */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-md transition-colors duration-300 ${
                isTransparentMode ? "text-white hover:text-white/80" : "text-[#0F172A] hover:text-[#0F2C59]"
              }`}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 전체 화면 드롭다운 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-white/70 backdrop-blur-md border-t border-slate-200/50 overflow-hidden shadow-inner"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`block w-full text-left px-4 py-3 rounded-lg text-base font-sans tracking-wider transition-colors cursor-pointer ${
                    activeTab === item.id
                      ? "bg-[#0F2C59]/30 text-[#0F2C59] font-semibold"
                      : "text-[#0F172A]/80 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4">
                <button
                  onClick={() => {
                    setActiveTab("reservation");
                    setIsOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#0F2C59] text-white py-3 rounded-lg text-sm font-sans tracking-wider shadow cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  예약하기
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
