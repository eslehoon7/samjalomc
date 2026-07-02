import { Phone, Clock, MapPin, ShieldAlert, Heart } from "lucide-react";

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export default function Footer({ setActiveTab }: FooterProps) {
  const handleQuickLink = (tabId: string) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#0F172A] text-slate-300 pt-16 pb-12 border-t-4 border-[#0F2C59]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start text-left border-b border-slate-800 pb-12 w-full gap-6">
          
          {/* 브랜드 및 연락처 */}
          <div className="flex flex-col items-start">
            <div 
              className="flex items-center gap-3 cursor-pointer group pb-1"
              onClick={() => handleQuickLink("home")}
            >
              <div className="w-[52px] h-[52px] flex items-center justify-center">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EC%82%BC%EC%9E%98%ED%95%9C%EC%9D%98%EC%9B%90%20%EB%A1%9C%EA%B3%A0-1.png?alt=media&token=92d02b25-8829-4069-8682-67340635f30a"
                  alt="삼잘한의원 로고"
                  className="w-full h-full object-contain brightness-0 invert"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-white tracking-widest leading-none">
                  삼잘한의원
                </h2>
                <p className="text-[10px] sm:text-xs font-sans tracking-widest mt-1.5 uppercase text-white font-medium">
                  SAMJAL KMED CLINIC
                </p>
              </div>
            </div>
          </div>

          {/* 지점 정보 */}
          <div className="space-y-2 text-xs sm:text-[13px] text-slate-400 font-light leading-relaxed max-w-4xl">
            <p>
              <span className="font-medium text-white mr-1.5">노원점</span> 서울시 노원구 노해로 482, 7층(상계동, 덕영빌딩) <span className="text-slate-600 px-0.5">l</span> 02.6952.4067 <span className="text-slate-600 px-0.5">l</span> 대표: 전준영 <span className="text-slate-600 px-0.5">l</span> 사업자번호: 288-35-01504
            </p>
            <p>
              <span className="font-medium text-white mr-1.5">구리점</span> 경기도 구리시 체육관로 28, 3층(수택동, 고덕프라자) <span className="text-slate-600 px-0.5">l</span> 031.555.3555 <span className="text-slate-600 px-0.5">l</span> 대표: 제정진 <span className="text-slate-600 px-0.5">l</span> 사업자번호: 132-96-06338
            </p>
            <p className="!mt-4 text-sm sm:text-[14px]">
              <span className="font-medium text-white mr-1.5">대표상담문의</span> 02-6952-4067 <span className="text-slate-600 px-0.5">l</span> <span className="font-medium text-white mr-1.5">노원점</span> 02-6952-4067 <span className="text-slate-600 px-0.5">l</span> <span className="font-medium text-white mr-1.5">구리점</span> 031-555-3555 <span className="text-slate-600 px-0.5">l</span> <span className="font-medium text-white mr-1.5">이메일</span> jjy4667@naver.com
            </p>
          </div>

        </div>

        {/* 카피라이트 및 법적 고지 */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© 2026 Samjal Clinic. All Rights Reserved. Designed for scientific & hygienic care.</p>
          <div className="flex gap-4 flex-wrap justify-center sm:justify-start">
            <a href="#" className="hover:text-slate-300 transition-colors">개인정보처리방침</a>
            <span>|</span>
            <a href="#" className="hover:text-slate-300 transition-colors">의료광고심의준수</a>
            <span>|</span>
            <a 
              href="https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/%EA%B3%B5%EC%A7%80%EC%82%AC%ED%95%AD_%EB%B9%84%EA%B8%89%EC%97%AC%EA%B0%80%EA%B2%A9_%EB%85%B8%EC%9B%90.pdf?alt=media&token=5b931263-4aac-4b6a-bded-33de3ad2cd2c" 
              target="_blank" 
              rel="noopener noreferrer" 
              download="공지사항_비급여가격_노원.pdf"
              className="hover:text-slate-300 transition-colors"
            >
              비급여비용안내
            </a>
            <span>|</span>
            <button 
              onClick={() => handleQuickLink("admin")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              관리자페이지
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
