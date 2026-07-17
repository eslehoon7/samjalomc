import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

interface MainVisualProps {
  setActiveTab: (tab: string) => void;
  setIntroSubTab?: (subTab: string) => void;
  setSubjectSubTab?: (subTab: string) => void;
  setLocationBranch?: (branch: string) => void;
}

const DEFAULT_SLIDES = [
  {
    id: "default_1",
    image: "https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%ED%95%9C%EC%9D%98%EC%82%AC%EB%8B%98%20%EB%8B%A8%EC%B2%B4%EC%82%AC%EC%A7%84.png?alt=media&token=1170e9aa-2a6b-4373-9316-ef249cc40392",
    title: "건강의 기본기 잘하기, 잘먹기, 잘내보내기",
    subtitle: "",
    desc: "기본을 다시 생각하는 공간, 삼잘한의원입니다.",
    linkTab: "intro",
    subTab: "philosophy",
    positionClass: "object-center"
  },
  {
    id: "default_2",
    image: "https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%EC%97%90%EC%84%BC%EC%85%9C%20%EC%B2%98%EB%B0%A91_%EC%88%98%EC%9B%90%EB%8B%A8.png?alt=media&token=9617779b-d2e3-4f90-b089-26c3fd436d1a",
    title: "프리미엄 에센셜 처방",
    subtitle: "",
    desc: "한약과 현대과학적 추출법, 첨단 제약기술이 만나 빚어진 삼잘한의원 고유의 치료제",
    linkTab: "intro",
    subTab: "treatments",
    positionClass: "object-[70%_80%]"
  },
  {
    id: "default_3",
    image: "https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%EB%8C%80%EC%99%B8%ED%99%9C%EB%8F%991_18%ED%95%AD%EC%A0%80%EC%9A%B0.jpg?alt=media&token=6c8894f2-6aa3-48a6-a7c1-bdbfd6aee6ba",
    title: "경력으로 검증된 전문성",
    subtitle: "",
    desc: "",
    linkTab: "intro",
    subTab: "activities",
    positionClass: "object-[center_30%]"
  }
];

export default function MainVisual({ 
  setActiveTab, 
  setIntroSubTab,
  setSubjectSubTab,
  setLocationBranch
}: MainVisualProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<any[]>(DEFAULT_SLIDES);

  useEffect(() => {
    const q = query(collection(db, "main_visuals"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const dbSlides: any[] = [];
      snap.forEach((doc) => {
        dbSlides.push({ id: doc.id, ...doc.data() });
      });
      if (dbSlides.length > 0) {
        setSlides(dbSlides);
      } else {
        setSlides(DEFAULT_SLIDES);
      }
    }, (error) => {
      console.warn("메인 비주얼 실시간 연동 에러 (기본 오프라인 폴백):", error);
      setSlides(DEFAULT_SLIDES);
    });

    return () => unsubscribe();
  }, []);

  // 4초마다 자동 슬라이딩 (사용자 조건 만족)
  useEffect(() => {
    if (slides.length <= 1) {
      setCurrentIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleSlideClick = (slide: any) => {
    if (!slide.linkTab) return;
    setActiveTab(slide.linkTab);
    if (slide.linkTab === "intro" && setIntroSubTab && slide.subTab) {
      setIntroSubTab(slide.subTab);
    } else if (slide.linkTab === "subject" && setSubjectSubTab && slide.subTab) {
      setSubjectSubTab(slide.subTab);
    } else if (slide.linkTab === "location" && setLocationBranch && slide.subTab) {
      setLocationBranch(slide.subTab);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  return (
    <div className="relative bg-[#F8FAFC]">
      {/* 슬라이더 영역 */}
      <div className="relative h-screen min-h-[600px] w-full overflow-hidden border-b border-slate-200">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {/* 배경 이미지 비칠 때 겹치는 다크/네이비 그라데이션 필터 (위생적인 분위기) */}
            <div 
              onClick={() => handleSlideClick(slide)}
              className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 to-[#0F2C59]/40 mix-blend-multiply z-10 cursor-pointer" 
            />
            <img
              onClick={() => handleSlideClick(slide)}
              src={slide.image}
              alt={slide.title}
              className={`w-full h-full object-cover transition-transform duration-[4000ms] ease-out cursor-pointer ${idx === currentIndex ? "animate-mobile-pan" : ""}`}
              style={{ 
                transform: idx === currentIndex ? "scale(1.05)" : "scale(1)",
                objectPosition: slide.objectPosition || (slide.positionClass === "object-top" ? "50% 0%" : slide.positionClass === "object-bottom" ? "50% 100%" : slide.positionClass === "object-left" ? "0% 50%" : slide.positionClass === "object-right" ? "100% 50%" : "50% 50%")
              }}
              referrerPolicy="no-referrer"
            />
            {/* 정교한 서예 및 타이포그래피 콘텐츠 */}
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <AnimatePresence mode="wait">
                  {idx === currentIndex && (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="max-w-2xl space-y-4 sm:space-y-6 transform translate-y-[50px] sm:translate-y-0"
                    >
                      {slide.subtitle && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.5 }}
                          className="inline-flex items-center px-3 py-1 bg-[#0F2C59]/30 border border-[#0F2C59]/60 rounded-full text-slate-100 text-xs"
                        >
                          <span className="font-sans tracking-widest">{slide.subtitle}</span>
                        </motion.div>
                      )}

                      <motion.h2 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.22, duration: 0.6 }}
                        className="text-xl sm:text-3xl md:text-[44px] lg:text-5xl font-sans text-white font-bold tracking-tight drop-shadow-md whitespace-nowrap"
                      >
                        {slide.title}
                      </motion.h2>

                      {slide.desc && (
                        <motion.p 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.34, duration: 0.6 }}
                          className="text-sm sm:text-base text-slate-200 font-sans leading-relaxed font-light drop-shadow whitespace-pre-line"
                        >
                          {slide.desc}
                        </motion.p>
                      )}

                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.46, duration: 0.6 }}
                        className="pt-16 sm:pt-10 flex flex-wrap gap-4"
                      >
                        <button
                          onClick={() => handleSlideClick(slide)}
                          className="px-6 py-3 bg-[#0F2C59] hover:bg-[#1E40AF] text-white transition-all duration-300 rounded-lg text-sm font-sans font-semibold tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
                        >
                          자세히 알아보기
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ))}

        {/* 좌우 이동 화살표 */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-[calc(50%+50px)] sm:top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/15 hover:bg-white/35 text-white transition-colors"
              aria-label="이전 슬라이드"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-[calc(50%+50px)] sm:top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/15 hover:bg-white/35 text-white transition-colors"
              aria-label="다음 슬라이드"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </>
        )}

        {/* 인디케이터 도트 */}
        {slides.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "bg-[#0F2C59] w-6" : "bg-white/40 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
