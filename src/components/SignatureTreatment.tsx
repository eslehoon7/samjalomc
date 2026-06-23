import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface SignatureTreatmentProps {
  setActiveTab: (tab: string) => void;
  setIntroSubTab?: (subTab: string) => void;
}

function TypingText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      setDisplayText(text.slice(0, currentIdx));
      if (currentIdx >= text.length) {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="relative">
      {displayText}
      {displayText.length < text.length && (
        <span className="inline-block w-[3px] h-[1.1em] bg-[#93C5FD] ml-1 animate-pulse align-middle" />
      )}
    </span>
  );
}

export default function SignatureTreatment({ setActiveTab, setIntroSubTab }: SignatureTreatmentProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const treatments = [
    {
      image: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EB%8C%80%EA%B4%80%EC%A0%88%20%EB%8F%99%EA%B8%B0%EC%B9%A8%EB%B2%95.jpg?alt=media&token=5c1a4aa2-b614-49e8-b4e0-034a1d115b97",
      category: "심부 안정화 대관절 침법",
      title: "대관절 동기침법",
      desc: "심부근육의 활성을 높이는 대관절 동기침법",
      detail: "국가대표 자궁 및 관절 스포츠 침술 기법을 현대적으로 승화시켜 깊숙한 핵심 유착을 관통 치료합니다.",
      targetSubTab: "treatments"
    },
    {
      image: "https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%EC%97%90%EC%84%BC%EC%85%9C%20%EC%B2%98%EB%B0%A93_%EC%A2%85%ED%95%A9%EB%AA%A8%EC%9D%8C.png?alt=media&token=6996a5f6-a2fd-4e77-b6ad-33e58d6bfdd0",
      category: "프리미엄 지상 조제",
      title: "프리미엄 에센셜 처방",
      desc: "전문가 3인의 협업으로 탄생한 프리미엄 치료제",
      detail: "식약처 정밀 무독성 잔류농약 검사를 마친 최상위 명품 탕재만을 사용하여 비위에 순한 기를 채웁니다.",
      targetSubTab: "treatments"
    },
    {
      image: "https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%ED%95%9C%EC%9D%98%EC%82%AC%EB%8B%98%20%EB%8B%A8%EC%B2%B4%EC%82%AC%EC%A7%84.png?alt=media&token=1170e9aa-2a6b-4373-9316-ef249cc40392",
      category: "국가대표 주치의 사단",
      title: "검증된 경력의 의료진 및 연구진",
      desc: "체계적인 연구와 진심어린 진료",
      detail: "의학 논문과 정밀 통계 임상을 기반으로 환자의 편안한 신체 회복을 위해 주 2회 학술 심포지엄을 개최합니다.",
      targetSubTab: "doctors"
    }
  ];

  const handleCardClick = (subTab: string) => {
    setActiveTab("intro");
    if (setIntroSubTab) {
      setIntroSubTab(subTab);
    }
    setTimeout(() => {
      const el = document.getElementById("intro-content-view");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  return (
    <section className="pt-0 pb-0 bg-white border-b border-slate-200 overflow-hidden">
      {/* 3대 비법 한페이지 가득 차는 와이드 패널 아코디언 쇼케이스 (Full Wide Immersive Showcase) */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-[850px] sm:h-[750px] md:h-[650px] flex flex-col md:flex-row overflow-hidden border-t border-b border-slate-200 bg-[#0F172A] select-none shadow-xl"
      >
        {treatments.map((tr, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            onHoverStart={() => setHoveredIdx(index)}
            onHoverEnd={() => setHoveredIdx(null)}
            className="relative flex-1 group hover:flex-[1.8] md:hover:flex-[2.5] transition-all duration-700 ease-in-out overflow-hidden cursor-default flex flex-col justify-end pt-16 pb-8 px-6 sm:p-12 border-b md:border-b-0 md:border-r last:border-r-0 border-white/10"
          >
            {/* 배경 이미지 및 오버레이 */}
            <div className="absolute inset-0 z-0">
              {/* 이미지 확대 효과 */}
              <img
                src={tr.image}
                alt={tr.title}
                className="w-full h-full object-cover group-hover:scale-[1.025] md:group-hover:scale-110 transition-transform duration-1000 ease-in-out"
                referrerPolicy="no-referrer"
              />
              {/* 기본적으로 어둠을 주어 텍스트 시인성을 확보하고, 호버시 더 선명하게 가로막 */}
              <div className="absolute inset-0 bg-slate-950/75 group-hover:bg-slate-950/65 transition-colors duration-700 z-10" />
              {/* 블루/네이비 피 필터 매직 조합 */}
              <div className="absolute inset-0 bg-[#0F2C59]/20 mix-blend-multiply group-hover:bg-transparent transition-all duration-700 z-10" />
            </div>

            {/* 본문 정보 영역 */}
            <div className="relative z-20 space-y-3 sm:space-y-4">

              {/* 제목 */}
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center text-[#93C5FD]">
                  <span className="text-xs font-sans font-bold tracking-widest uppercase">
                     {tr.title}
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-sans text-white font-bold leading-snug tracking-tight transition-all duration-300 md:group-hover:whitespace-nowrap pb-1">
                  <TypingText 
                    text={tr.desc} 
                  />
                </h3>
              </div>


            </div>

          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
