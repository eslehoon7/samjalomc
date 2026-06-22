import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MainVisual from "./components/MainVisual";
import SamjalValue from "./components/SamjalValue";
import SignatureTreatment from "./components/SignatureTreatment";
import SubIntro from "./components/SubIntro";
import SubSubject from "./components/SubSubject";
import SubLocation from "./components/SubLocation";
import SubNotice from "./components/SubNotice";
import SubReservation from "./components/SubReservation";
import SubAdmin from "./components/SubAdmin";
export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [introSubTab, setIntroSubTab] = useState("philosophy");

  // 메뉴 변경 시 화면 최상단으로 부드럽게 스크롤 (모바일 및 전 기기 적용)
  useEffect(() => {
    // 즉시 최상단 스크롤
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    document.documentElement.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    // 모바일 드로어가 닫히면서 레이아웃 높이가 순간 변화하거나, 애니메이션 중일 때 스크롤이 끊기지 않도록
    // 단계별(50ms, 150ms, 350ms)로 다시 한번 최상단 정렬을 잡아줍니다.
    const t1 = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);

    const t2 = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    }, 200);

    const t3 = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    }, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeTab]);

  // 모달 예약 지원
  const openReservationModal = () => {
    setActiveTab("reservation");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div id="samjal-app-frame" className="min-h-screen bg-[#FDFBF7] text-[#2A2826] selection:bg-[#C5A059]/30 flex flex-col justify-between">
      
      {/* 상단 통합 명가 헤더 */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        openReservationModal={openReservationModal} 
      />

      {/* 본문 동적 라우팅 스폿 */}
      <main className="flex-1">
        {activeTab === "home" ? (
          <div className="animate-fadeIn">
            
            {/* 1. 홈 캐러셀 슬라이더 */}
            <MainVisual 
              setActiveTab={setActiveTab} 
              setIntroSubTab={setIntroSubTab} 
            />

            {/* 2. 삼잘 수면/식이/배변 3대 철학 스토리 (사용자 시안 정밀 매치) */}
            <SamjalValue />

            {/* 3. 명품 고유치료 3성단 카드 (사용자 시안 침/한약/의료진 매치) */}
            <SignatureTreatment 
              setActiveTab={setActiveTab} 
              setIntroSubTab={setIntroSubTab} 
            />



          </div>
        ) : activeTab === "intro" ? (
          <SubIntro 
            subTab={introSubTab} 
            setSubTab={setIntroSubTab} 
            setActiveTab={setActiveTab} 
          />
        ) : activeTab === "subject" ? (
          <SubSubject 
            setActiveTab={setActiveTab} 
          />
        ) : activeTab === "location" ? (
          <SubLocation />
        ) : activeTab === "notice" ? (
          <SubNotice />
        ) : activeTab === "reservation" ? (
          <SubReservation />
        ) : activeTab === "admin" ? (
          <SubAdmin />
        ) : null}
      </main>

      {/* 하단 노원/구리 지점주소 및 통합 풋터 */}
      <Footer setActiveTab={setActiveTab} />

    </div>
  );
}
