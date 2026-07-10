import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";

interface SubSubjectProps {
  setActiveTab: (tab: string) => void;
}

const defaultSubjectImages: Record<string, string[]> = {
  spine: [
    "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EB%8C%80%EA%B4%80%EC%A0%88%20%EB%8F%99%EA%B8%B0%EC%B9%A8%EB%B2%95.jpg?alt=media&token=5c1a4aa2-b614-49e8-b4e0-034a1d115b97",
    "/images/professional_clean_acupuncture_1780497559621.png",
    "/images/clinic_interior_1779805270752.png",
    "/images/samjal_crew_professional_1780495405627.png"
  ],
  internal: [
    "/images/hygienic_premium_hanbang_herbal_1780497683155.png",
    "/images/samjal_crew_1779805249409.png",
    "/images/professional_clean_acupuncture_1780497559621.png",
    "/images/clinic_interior_1779805270752.png"
  ],
  allergy: [
    "/images/clinic_interior_1779805270752.png",
    "/images/hygienic_premium_hanbang_herbal_1780497683155.png",
    "/images/samjal_crew_1779805249409.png",
    "/images/professional_clean_acupuncture_1780497559621.png"
  ],
  cancer: [
    "/images/samjal_crew_1779805249409.png",
    "/images/samjal_crew_professional_1780495405627.png",
    "/images/clinic_interior_1779805270752.png",
    "/images/hygienic_premium_hanbang_herbal_1780497683155.png"
  ],
  detox: [
    "/images/samjal_crew_1779805249409.png",
    "/images/samjal_crew_professional_1780495405627.png"
  ]
};

const subjectImageNames: Record<string, string[]> = {
  spine: [
    "심부 안정화 대관절 침법",
    "정밀 약침치료",
    "쾌적한 원내환경",
    "척추/관절 전담진"
  ],
  internal: [
    "체질 해독 한약",
    "소화기 임상진",
    "정밀 약침치료",
    "쾌적한 원내환경"
  ],
  allergy: [
    "쾌적한 원내환경",
    "체질 해독 한약",
    "소화기 임상진",
    "정밀 약침치료"
  ],
  cancer: [
    "한양방 통합진료",
    "면역 암 전담팀",
    "쾌적한 조력환경",
    "체질 해독 한약"
  ],
  detox: [
    "정정 해독 요법",
    "생체 재생 연구팀"
  ]
};

function ImageWithLoader({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-5 h-5 border-2 border-slate-100 border-t-[#0F2C59] rounded-full animate-spin" />
            <span className="text-[9px] text-slate-400 font-sans tracking-wide">불러오는 중...</span>
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`${className} ${
          isLoaded ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as any
    }
  }
};

export default function SubSubject({ setActiveTab }: SubSubjectProps) {
  const [activeSubTab, setActiveSubTab] = useState("spine");
  const [subjectImages, setSubjectImages] = useState<Record<string, string[]>>(defaultSubjectImages);
  const [subjectLabels, setSubjectLabels] = useState<Record<string, string[]>>(subjectImageNames);

  useEffect(() => {
    // 실시간 진료과목 서브 이미지 및 명칭 동기화
    const unsubscribe = onSnapshot(collection(db, "subject_images"), (snap) => {
      const updatedImages = { ...defaultSubjectImages };
      const updatedLabels = { ...subjectImageNames };
      snap.forEach(d => {
        const data = d.data();
        if (d.id !== "config" && d.id) {
          if (data.images && Array.isArray(data.images)) {
            updatedImages[d.id] = data.images;
          }
          if (data.labels && Array.isArray(data.labels)) {
            updatedLabels[d.id] = data.labels;
          }
        }
      });

      // Filter out deleted detox images (remove 01 and 04 roll files if 4 are loaded)
      if (updatedImages["detox"]) {
        let finalImages = [...updatedImages["detox"]];
        let finalLabels = [...(updatedLabels["detox"] || [])];
        if (finalImages.length === 4) {
          finalImages = [finalImages[1], finalImages[2]];
          finalLabels = [finalLabels[1], finalLabels[2]];
        } else if (finalImages.length > 2) {
          finalImages = finalImages.slice(0, 2);
          finalLabels = finalLabels.slice(0, 2);
        }
        updatedImages["detox"] = finalImages;
        updatedLabels["detox"] = finalLabels;
      }

      setSubjectImages(updatedImages);
      setSubjectLabels(updatedLabels);
    }, (err) => {
      console.warn("진료과목 이미지 및 명칭 실시간 동기화 오프라인 폴백:", err);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // 모든 주요 이미지를 백그라운드 캐시에 사전 로딩(Preload)하여 탭 클릭 시 즉각 표시되도록 처리
    const urlsToPreload = new Set<string>();
    
    Object.values(defaultSubjectImages).forEach((urls: any) => {
      (urls as string[]).forEach(url => {
        if (url) urlsToPreload.add(url);
      });
    });
    
    Object.values(subjectImages).forEach((urls: any) => {
      (urls as string[]).forEach(url => {
        if (url) urlsToPreload.add(url);
      });
    });
    
    urlsToPreload.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, [subjectImages]);

  const subTabs = [
    { id: "spine", label: "통증/관절/척추질환" },
    { id: "internal", label: "내과질환" },
    { id: "allergy", label: "알레르기" },
    { id: "cancer", label: "통합암관리" },
    { id: "detox", label: "항노화/해독" },
  ];

  const contents = {
    spine: {
      title: "통증/관절/척추질환 클리닉",
      subtitle: "골반 관절 및 비대칭의 즉각적 교정",
      desc: "통증을 없애는 것도 중요하지만 해당 증상이 일어나게 된 과정을 함께 치료합니다.\n만성적 문제를 유발하는 자세이상을 교정하고 관절의 심부근육 활성도를 높입니다.",
      diseases: "무릎관절염, 어깨질환: 오십견/회전근개 손상, 척추(협착증/디스크), 외상(스포츠, 교통사고)",
      diseasesList: [
        "무릎관절염",
        "어깨질환 (오십견/회전근개 손상)",
        "척추 (협착증/디스크)",
        "외상 (스포츠, 교통사고)"
      ],
      benefits: [
        "통증: 두통, 통풍, 자세이상(거북목, 굽은 등), 섬유근육통, 만성 통증",
        "관절: 어깨(오십견, 회전근개 파열), 팔꿈치(테니스엘보, 관절염), 고관절, 무릎(퇴행성 관절염), 발목, 손가락/발가락",
        "척추: 목/허리 디스크, 척추 협착증, 전방전위증, 자세이상"
      ],
      image: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EB%8C%80%EA%B4%80%EC%A0%88%20%EB%8F%99%EA%B8%B0%EC%B9%A8%EB%B2%95.jpg?alt=media&token=5c1a4aa2-b614-49e8-b4e0-034a1d115b97"
    },
    internal: {
      title: "내과질환 클리닉",
      subtitle: "잘 먹고, 잘 통하는 행복한 소화기",
      desc: "소화기계, 호흡기계, 순환기계, 내분비계, 비뇨생식기계, 자율신경계의 문제를 각자 분리해서 보지 않고 통합적인 관점에서 살피고 치료합니다.",
      diseases: "저체중/과체중, 소화기, 대사질환(고혈압, 고지혈증, 당뇨), 불면증",
      diseasesList: [
        "저체중 / 과체중",
        "소화기 질환",
        "대사질환 (고혈압, 고지혈증, 당뇨)",
        "불면증"
      ],
      benefits: [
        "소화기계: 만성소화불량, 저체중, 변비, 과민성장증후군, 역류성 위식도질환",
        "호흡기계: 만성기침, 알레르기(비염, 천식)",
        "순환기계: 가슴 두근거림, 고혈압, 울혈성 심부전, 부종",
        "내분비계: 과체중, 당뇨, 고지혈증, 만성피로",
        "자율신경계: 자율신경 실조증, 미주신경성 실신, 이석증, 공황장애"
      ],
      image: "/images/hygienic_premium_hanbang_herbal_1780497683155.png"
    },
    allergy: {
      title: "알레르기 클리닉",
      subtitle: "무너진 면역 장벽의 자생 강화",
      desc: "결과로서의 증상 뿐 아니라 그 이면의 선행과정들을 함께 다스리는 것을 목표로 합니다.",
      diseases: "비염, 결막염, 두드러기, 아토피/천식",
      diseasesList: [
        "비염 및 결막염",
        "두드러기",
        "아토피 / 천식"
      ],
      benefits: [
        "알레르기성 비염",
        "알레르기성 결막염",
        "만성 두드러기",
        "아토피/천식"
      ],
      image: "/images/clinic_interior_1779805270752.png"
    },
    cancer: {
      title: "통합 암관리",
      subtitle: "항암 부작용 완화 및 종양 미세환경 정화",
      desc: "표준 항암치료와 병행 가능한 과학적이고 무해한 천연화합물 요법을 지향합니다. 재발 및 전이 가능성을 낮추고 항암부작용을 줄입니다. 암종과 병기에 따라 다른 치료법을 적용합니다.",
      diseases: "재발 및 전이 관리, 항암부작용 관리, 암종과 병기에 따라 다른 치료법 적용",
      diseasesList: [
        "재발 및 전이 관리",
        "항암 부작용 관리",
        "암종과 병기 맞춤 치료"
      ],
      benefits: [
        "재발 및 전이 관리",
        "항암 부작용 관리",
        "암종과 병기 맞춤 치료",
        "암환자 식이요법"
      ],
      image: "/images/samjal_crew_1779805249409.png"
    },
    detox: {
      title: "항노화/해독",
      subtitle: "세포의 시간을 되돌리는 생물학적 안티에이징 포뮬러",
      desc: "노화는 피할 수 없는 자연 현상이 아니라, 세포내 유전자 손상과 대사기능의 저하로 인해 발생하는 ‘관리가능한 생물학적 프로세스’입니다.\n본원만의 독자적인 추출 공정으로 완성한 ‘셀리뉴얼’을 통해, 노화의 근본 원인인 세포시계를 늦추고 젊음의 대사 스위치를 다시 켭니다.",
      diseases: "텔로머레이즈 활성화, SIRT1 & AMPK 타겟팅, 초강력 항산화 네트워크",
      diseasesList: [
        "생물학적 세포 시계의 복원 (텔로머레이즈 활성화)",
        "장수 유전자 및 대사 스위치 ON (SIRT1 & AMPK 타겟팅)",
        "세포 산화 및 녹슮 방지 (초강력 항산화 네트워크)"
      ],
      benefits: [
        "생물학적 세포 시계의 복원 (텔로머레이즈 활성화)",
        "장수 유전자 및 대사 스위치 ON (SIRT1 & AMPK 타겟팅)",
        "세포 산화 및 녹슮 방지 (초강력 항산화 네트워크)"
      ],
      image: "/images/hygienic_premium_hanbang_herbal_1780497683155.png"
    }
  };

  const current = contents[activeSubTab as keyof typeof contents];

  return (
    <div className="bg-white min-h-screen animate-fadeIn">
      
      {/* 서브 메인 비주얼 배너 섹션 (Main Section) */}
      <div className="relative w-full h-[380px] sm:h-[480px] bg-[#0F172A] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 to-[#0F2C59]/45 mix-blend-multiply z-10" />
          <img
            src="https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%EB%85%B8%EC%9B%90%EC%A0%903.jpg?alt=media&token=424af5d4-63d4-4bd6-9106-b4938ff4edcd"
            alt="진료과목 배경"
            className="w-full h-full object-cover blur-[5px]"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-20 text-center space-y-3 px-4 animate-fadeIn pt-16">
          <span className="text-sky-400 text-xs sm:text-sm font-sans tracking-widest uppercase font-bold flex items-center justify-center gap-1.5">
            Specialized Medical Departments
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans text-white font-extrabold tracking-tight">
            정밀 진료과목
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* 탭 네비게이션 */}
        <div className="flex justify-center border-b border-slate-200 mb-16 max-w-3xl mx-auto">
          <div className="flex justify-between items-center w-full -mb-px">
            {subTabs.map((ts) => (
              <button
                key={ts.id}
                onClick={() => setActiveSubTab(ts.id)}
                className={`py-3 px-0.5 sm:px-4 md:px-6 text-center text-[10px] min-[360px]:text-[11px] min-[400px]:text-xs sm:text-sm md:text-base font-sans tracking-tight sm:tracking-wide transition-all duration-300 border-b-2 cursor-pointer whitespace-nowrap -mb-px flex-1 ${
                  activeSubTab === ts.id
                    ? "border-[#0F2C59] text-[#0F2C59] font-semibold"
                    : "border-transparent text-slate-500 hover:text-[#0F2C59]"
                }`}
              >
                {ts.id === "spine" ? (
                  <>
                    <span className="inline md:hidden">통증/척추</span>
                    <span className="hidden md:inline">{ts.label}</span>
                  </>
                ) : ts.id === "cancer" ? (
                  <>
                    <span className="inline md:hidden">통합암</span>
                    <span className="hidden md:inline">{ts.label}</span>
                  </>
                ) : ts.id === "detox" ? (
                  <>
                    <span className="inline md:hidden">해독/노화</span>
                    <span className="hidden md:inline">{ts.label}</span>
                  </>
                ) : (
                  ts.label
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 내용 분할 슬롯 */}
        <motion.div
          key={activeSubTab}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch"
        >
          
          {/* 왼쪽 텍스트 정보 */}
          <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col justify-between space-y-6 text-left">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-sans text-[#0F172A] font-bold leading-tight">
                  {current.title === "통증/관절/척추질환 클리닉" ? (
                    <>
                      <span className="inline sm:hidden">통증/관절/<br />척추질환 클리닉</span>
                      <span className="hidden sm:inline">통증/관절/척추질환 클리닉</span>
                    </>
                  ) : current.title === "내과질환 클리닉" ? (
                    <>
                      <span className="inline sm:hidden">내과질환 클리닉</span>
                      <span className="hidden sm:inline">내과질환 클리닉</span>
                    </>
                  ) : (
                    current.title
                  )}
                </h3>
              </div>
              <div className="w-12 h-1 bg-[#0F2C59]" />
              <p className="text-sm sm:text-base font-sans text-slate-600 leading-relaxed whitespace-pre-line">
                {current.desc}
              </p>



              <div className="space-y-3 pt-4 border-t border-slate-100">
                <ul className="space-y-2.5">
                  {current.benefits.map((bf, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-sans text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F2C59]/80 shrink-0 mt-2" />
                      <span className="leading-relaxed">{bf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 바로 예약 하러가기 단축 행동 버튼 */}
            <div className="pt-4">
              <button
                onClick={() => {
                  setActiveTab("reservation");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="uiverse-btn inline-flex items-center justify-center gap-2 font-sans font-semibold"
              >
                <span>온라인 예약</span>
                <ArrowRight className="w-4 h-4 text-current" />
              </button>
            </div>
          </motion.div>

          {/* 오른쪽 시각적 고품질 생성 이미지 결합부 - 2x2 밀접 그리드 배열 */}
          <motion.div variants={itemVariants} className="lg:col-span-5 rounded-2xl overflow-hidden flex flex-col relative justify-center">
            <div className="grid grid-cols-2 gap-1.5">
              {(() => {
                const list = subjectImages[activeSubTab] || defaultSubjectImages[activeSubTab];
                const labelsList = subjectLabels[activeSubTab] || subjectImageNames[activeSubTab] || [];
                
                if (activeSubTab === "detox") {
                  return [
                    { url: "", label: "" },
                    { url: list[0] || "", label: labelsList[0] || "" },
                    { url: list[1] || "", label: labelsList[1] || "" },
                    { url: "", label: "" }
                  ].map((item, idx) => {
                    if (!item.url) {
                      return (
                        <div key={idx} className="relative aspect-square rounded-xl bg-transparent pointer-events-none" />
                      );
                    }
                    return (
                      <div key={idx} className="relative aspect-square w-full rounded-xl overflow-hidden border border-slate-100 shadow-sm group">
                        <ImageWithLoader
                          src={item.url}
                          alt={item.label || `${current.title} 이미지 ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    );
                  });
                }

                return list.map((imgUrl, idx) => {
                  const label = labelsList[idx] || "";
                  return (
                    <div key={idx} className="relative aspect-square w-full rounded-xl overflow-hidden border border-slate-100 shadow-sm group">
                      <ImageWithLoader
                        src={imgUrl}
                        alt={label || `${current.title} 이미지 ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      {label && (
                        <div className="absolute bottom-0 left-0 right-0 h-7 sm:h-8 bg-slate-900/75 backdrop-blur-[1px] flex items-center justify-center px-2 text-center">
                          <span className="text-[10px] sm:text-xs text-white font-sans font-medium tracking-wide leading-none">
                            {label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </motion.div>

        </motion.div>

        {/* Feather Step Efficacy Analysis Section */}
        {activeSubTab === "spine" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 pt-16 border-t border-slate-100"
          >
            <div className="w-full space-y-10 text-left">
              
              {/* 헤더 */}
              <div className="space-y-3 text-center max-w-3xl mx-auto">
                <span className="text-sm sm:text-base font-sans text-[#0F2C59] uppercase tracking-widest font-bold block mb-1">
                  SJ ESSENTIAL LINEUP
                </span>
                <h4 className="text-2xl sm:text-3xl font-sans text-[#0F172A] font-bold leading-tight">
                  Feather step <span className="text-slate-500 font-normal text-lg sm:text-xl">페더스텝</span>
                </h4>
                <p className="text-xs sm:text-sm font-sans text-slate-500 leading-relaxed">
                  증상 호전과 함께 관절연골을 동시에 보호하는 관절내 염증 치료제
                </p>
                <p className="text-sm sm:text-base font-sans text-slate-600 leading-relaxed">
                  다수의 SCI급 논문과 메타분석 및 체계적 문헌고찰을 통해 검증된 원료성분의 관절염 치료효과
                </p>
              </div>

              {/* 1. 표준처방과의 효과비교 (우측 카드 배치, 그래프 제거) */}
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 pt-4 items-stretch text-left">
                <div className="bg-slate-50/80 p-6 sm:p-8 rounded-2xl border border-slate-100 space-y-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-5">
                    <div className="space-y-4">
                      <h5 className="font-sans font-bold text-[#0F2C59] text-xl sm:text-2xl leading-tight tracking-tight">
                        관절염 표준처방
                        <br />
                        과의 효과비교
                      </h5>
                      <div className="w-10 h-1 bg-[#0F2C59] rounded-full" />
                    </div>
                    
                    <p className="font-sans text-sm sm:text-base md:text-lg text-slate-700 font-semibold leading-relaxed max-w-xl">
                      전체적으로 표준 소염진통제와 대등한 수준의 진통효과를 보이며
                      <br />
                      관절염의 통증이 심한 사람일수록 A성분의 효과가 더 크게 나타났습니다.
                    </p>
                  </div>

                  <p className="font-sans text-xs sm:text-sm text-slate-500 leading-relaxed border-t border-slate-200/60 pt-5">
                    단일 경로만 강제로 차단하여 속쓰림 부작용이 잦고 진통 위주의 효과를 지니는 기존 진통제와 달리,
                    <br />
                    본 처방은 염증의 다중 경로를 부드럽게 통제하여 관절을 보호하고 장기 복용에도 속이 편안한 근본적인
                    <br />
                    관절 케어를 제공합니다.
                  </p>
                </div>

                {/* 우측 카드 */}
                <div className="relative w-full bg-slate-50/60 rounded-2xl p-5 border border-slate-100 flex flex-col justify-center min-h-[120px] shadow-sm">
                  <div className="space-y-4">
                    {/* Image supplied by user */}
                    <div className="flex items-center justify-center overflow-hidden">
                      <img 
                        src="https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%ED%86%B5%EC%A6%9D-%EA%B4%80%EC%A0%88-%EC%B2%99%EC%B6%94%EC%A7%88%ED%99%98.png?alt=media&token=763b0123-213b-4a00-afe3-6c642785a3a0" 
                        alt="통증/관절/척추질환 효과비교 그래프" 
                        className="w-[85%] max-w-full h-auto rounded-lg object-contain hover:scale-[1.01] transition-transform duration-300 mix-blend-multiply contrast-[1.08] brightness-[1.08]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Goyo Efficacy Analysis Section for Internal Medicine */}
        {activeSubTab === "internal" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 pt-16 border-t border-slate-100"
          >
            <div className="w-full space-y-10 text-left">
              
              {/* 헤더 */}
              <div className="space-y-3 text-center max-w-3xl mx-auto">
                <span className="text-sm sm:text-base font-sans text-[#0F2C59] uppercase tracking-widest font-bold block mb-1">
                  SJ ESSENTIAL LINEUP
                </span>
                <h4 className="text-2xl sm:text-3xl font-sans text-[#0F172A] font-bold leading-tight">
                  Goyo <span className="text-slate-500 font-normal text-lg sm:text-xl">고요</span>
                </h4>
                <p className="text-xs sm:text-sm font-sans text-slate-500 leading-relaxed">
                  자연스러운 입면을 유도하는 수면 보조제
                </p>
              </div>

              {/* 기전 및 효과 레이아웃 */}
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 pt-4 items-stretch text-left">
                {/* 왼쪽: 효과 및 기전 텍스트 카드들 */}
                <div className="bg-slate-50/80 p-6 sm:p-8 rounded-2xl border border-slate-100 space-y-8 shadow-sm flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h5 className="font-sans font-bold text-[#0F2C59] text-xl sm:text-2xl leading-tight tracking-tight">
                        효과 및 기전
                      </h5>
                      <div className="w-10 h-1 bg-[#0F2C59] rounded-full" />
                    </div>

                    <div className="space-y-6">
                      {/* 기전 1 */}
                      <div className="space-y-2">
                        <h6 className="font-sans font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                          수면 유도 스위치 ON <span className="text-xs text-slate-400 font-normal">(GABA & H1 수용체 이중 작용)</span>
                        </h6>
                        <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed pl-4">
                          <span className="font-semibold text-[#0F2C59]">[주성분 I]</span>는 뇌의 억제성 신경전달물질인 GABAa 수용체에 결합합니다. 동시에 H1 수용체를 안정화시켜,
                          <br />
                          강제적인 마취 느낌 없이 아주 부드럽고 자연스럽게 깊은 잠에 빠져들게 합니다.
                        </p>
                      </div>

                      {/* 기전 2 */}
                      <div className="space-y-2">
                        <h6 className="font-sans font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                          멈추지 않는 생각의 스위치 OFF <span className="text-xs text-slate-400 font-normal">(NMDA 수용체 차단)</span>
                        </h6>
                        <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed pl-4">
                          몸은 피곤한데 머릿속이 복잡해 잠 못 이루는 이유는 흥분성 신경전달물질인 글루타메이트가 과활성화되었기 때문입니다. <span className="font-semibold text-[#0F2C59]">[성분 J와 K]</span>가 NMDA 수용체에 작용해 뇌의 과각성 상태를 진정시키고 잡념이 이어지지 않도록 돕습니다.
                        </p>
                      </div>

                      {/* 기전 3 */}
                      <div className="space-y-2">
                        <h6 className="font-sans font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                          건강한 수면 사이클의 복원 <span className="text-xs text-slate-400 font-normal">(세로토닌 & 멜라토닌 네트워크)</span>
                        </h6>
                        <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed pl-4">
                          단기적인 입면을 넘어, 스스로 잠들 수 있는 생체 리듬을 복원합니다. <span className="font-semibold text-[#0F2C59]">[L성분]</span>이 수면의 질을 결정하는 세로토닌 수용체를 활성화하고, <span className="font-semibold text-[#0F2C59]">[M성분]</span>은 사지의 혈관확장을 유도해 심부체온의 하강과 함께 수면호르몬인 멜라토닌 분비를 촉진하여 안정적인 수면구조를 완성합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 우측: 수면 효과 및 기전 이미지 */}
                <div className="bg-slate-50/60 rounded-2xl p-6 sm:p-8 border border-slate-100 flex items-center justify-center shadow-sm">
                  <div className="w-full flex items-center justify-center">
                    <img 
                      src="https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%EA%B3%A0%EC%9A%94.png?alt=media&token=58aaf19a-81f9-4972-8a4a-ab607244dbbd" 
                      alt="고요(Goyo) 수면 기전" 
                      className="w-[95%] max-w-full h-auto rounded-lg object-contain hover:scale-[1.01] transition-transform duration-300 mix-blend-multiply contrast-[1.08] brightness-[1.08]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Allergy-control Efficacy Analysis Section for Allergy */}
        {activeSubTab === "allergy" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 pt-16 border-t border-slate-100"
          >
            <div className="w-full space-y-10 text-left">
              
              {/* 헤더 */}
              <div className="space-y-3 text-center max-w-3xl mx-auto">
                <span className="text-sm sm:text-base font-sans text-[#0F2C59] uppercase tracking-widest font-bold block mb-1">
                  SJ ESSENTIAL LINEUP
                </span>
                <h4 className="text-2xl sm:text-3xl font-sans text-[#0F172A] font-bold leading-tight">
                  Allergy-control <span className="text-slate-500 font-normal text-lg sm:text-xl">알레르기컨트롤</span>
                </h4>
                <p className="text-xs sm:text-sm font-sans text-slate-500 leading-relaxed">
                  복합기전을 통해 알레르기를 종합적으로 억제하는 알레르기 치료제
                </p>
              </div>

              {/* 기전 및 효과 레이아웃 (고요와 100% 대칭) */}
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 pt-4 items-stretch text-left">
                {/* 왼쪽: 효과 및 기전 텍스트 카드들 */}
                <div className="bg-slate-50/80 p-6 sm:p-8 rounded-2xl border border-slate-100 space-y-8 shadow-sm flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h5 className="font-sans font-bold text-[#0F2C59] text-xl sm:text-2xl leading-tight tracking-tight">
                        효과 및 기전
                      </h5>
                      <div className="w-10 h-1 bg-[#0F2C59] rounded-full" />
                    </div>

                    <div className="space-y-6">
                      {/* 기전 1 */}
                      <div className="space-y-2">
                        <h6 className="font-sans font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                          다중 항염 및 항산화 네트워크 <span className="text-xs text-slate-400 font-normal">(NF-κB, COX, LOX 다중 차단)</span>
                        </h6>
                        <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed pl-4">
                          알레르기가 만성화되는 이유는 체내 염증 수치가 지속적으로 높게 유지되기 때문입니다. 본 처방은 전신을 순환하며 과민해진 면역 체계를 진정시키고(Th1/Th2 밸런스 정상화), 호흡기와 피부 점막을 공격하는 활성산소를 제거합니다. 강력한 항염·항산화 네트워크를 형성하는 세 가지 핵심성분이 점막의 염증성 사이토카인 발생을 다중(NF-κB, COX, LOX)으로 차단하여, 자극에도 쉽게 반응하지 않는 튼튼한 면역 환경을 조성합니다.
                        </p>
                      </div>

                      {/* 치료 기전 이미지 */}
                      <div className="pt-2 flex items-center justify-center">
                        <img 
                          src="https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%EC%95%8C%EB%A0%88%EB%A5%B4%EA%B8%B0.png?alt=media&token=5749d6ca-82d1-4fc0-b612-75a8d4dbde4c" 
                          alt="알레르기 치료 기전" 
                          className="w-full max-w-full h-auto rounded-xl object-contain hover:scale-[1.01] transition-transform duration-300 mix-blend-multiply contrast-[1.08] brightness-[1.08]"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 우측: 알레르기컨트롤 제품 패키지 이미지 */}
                <div className="bg-slate-50/60 rounded-2xl p-6 sm:p-8 border border-slate-100 flex items-center justify-center shadow-sm">
                  <div className="w-full flex items-center justify-center">
                    <img 
                      src="https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%EC%97%90%EC%84%BC%EC%85%9C%20%EC%B2%98%EB%B0%A93_%EC%A2%85%ED%95%A9%EB%AA%A8%EC%9D%8C.png?alt=media&token=6996a5f6-a2fd-4e77-b6ad-33e58d6bfdd0" 
                      alt="알레르기컨트롤 약제 상자 및 팩 패키지" 
                      className="w-[95%] max-w-full h-auto rounded-lg object-contain hover:scale-[1.01] transition-transform duration-300 mix-blend-multiply contrast-[1.08] brightness-[1.08]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Wisu-bae-annyeong Efficacy Analysis Section for Cancer */}
        {activeSubTab === "cancer" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 pt-16 border-t border-slate-100"
          >
            <div className="w-full space-y-10 text-left">
              
              {/* 헤더 */}
              <div className="space-y-3 text-center max-w-3xl mx-auto">
                <span className="text-sm sm:text-base font-sans text-[#0F2C59] uppercase tracking-widest font-bold block mb-1">
                  SJ ESSENTIAL LINEUP
                </span>
                <h4 className="text-2xl sm:text-3xl font-sans text-[#0F172A] font-bold leading-tight">
                  수원단(粹源丹) 캡슐
                </h4>
                <p className="text-xs sm:text-sm font-sans text-slate-500 leading-relaxed">
                  근원부터 정화하는 세포해독제
                </p>
              </div>

              {/* 기전 및 효과 레이아웃 (알레르기와 100% 대칭) */}
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 pt-4 items-stretch text-left">
                {/* 왼쪽: 효과 및 기전 텍스트 카드들 */}
                <div className="bg-slate-50/80 p-6 sm:p-8 rounded-2xl border border-slate-100 space-y-8 shadow-sm flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h5 className="font-sans font-bold text-[#0F2C59] text-xl sm:text-2xl leading-tight tracking-tight">
                        효과 및 기전
                      </h5>
                      <div className="w-10 h-1 bg-[#0F2C59] rounded-full" />
                    </div>

                    <div className="space-y-6 divide-y divide-slate-200">
                      {/* 기전 1 */}
                      <div className="space-y-2 pb-6">
                        <h6 className="font-sans font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                          위산으로 인한 성분파괴를 최소화
                        </h6>
                        <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed pl-4">
                          아무리 뛰어난 성분도 위산에 파괴되면 의미가 없습니다. 수원단은 철저하게 계산된 장용성 캡슐을 적용했습니다. 장에 도달해 녹는 순간, 캡슐 내부에 담긴 핵심성분과 효소가 반응하여, 강력한 항염·항산화 대사체인 [D성분]으로 폭발적으로 전환됩니다. 성분의 손실 없이 흡수율을 극한으로 끌어올린 첨단 설계입니다.
                        </p>
                      </div>

                      {/* 기전 2 */}
                      <div className="space-y-2 pt-6 pb-6">
                        <h6 className="font-sans font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                          발암 물질과 독소의 근본적 배출 (Phase II 해독 효소 활성화)
                        </h6>
                        <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed pl-4">
                          진정한 해독은 간과 세포에서 독소를 수용성으로 바꿔 몸 밖으로 배출하는 과정입니다. 장에서 합성된 [D성분]은 세포 내 해독의 마스터 스위치인 Nrf2 경로를 강력하게 자극합니다. 이를 통해 체내에 축적된 유해 물질과 활성산소를 스스로 중화하고 배출하는 전신 정화 시스템을 가동합니다.
                        </p>
                      </div>

                      {/* 기전 3 */}
                      <div className="space-y-2 pt-6">
                        <h6 className="font-sans font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                          비정상 세포 정화 및 강력한 전신 항산화 네트워크 활성화
                        </h6>
                        <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed pl-4">
                          염증이 만성화되면 세포는 DNA 손상을 입고 비정상적인 변이를 일으킬 수 있습니다. 수원단의 타겟 대사체 [D성분]은 이러한 손상된 비정상 세포의 자연스러운 사멸(Apoptosis)을 유도하여 세포 생태계를 깨끗하게 유지합니다. 동시에 전신에 걸친 촘촘한 항산화·항염 네트워크를 형성하여 노화와 만성 질환의 연결 고리를 끊어냅니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 우측: 수원단 제품 이미지 */}
                <div className="bg-slate-50/60 rounded-2xl p-6 sm:p-8 border border-slate-100 flex items-center justify-center shadow-sm">
                  <div className="w-full flex items-center justify-center">
                    <img 
                      src="https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%EC%97%90%EC%84%BC%EC%85%9C%20%EC%B2%98%EB%B0%A91_%EC%88%98%EC%9B%90%EB%8B%A8.png?alt=media&token=9617779b-d2e3-4f90-b089-26c3fd436d1a" 
                      alt="수원단 에센셜 처방 제품" 
                      className="w-[95%] max-w-full h-auto rounded-lg object-contain hover:scale-[1.01] transition-transform duration-300 mix-blend-multiply contrast-[1.08] brightness-[1.08]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Suseung-hwagang Efficacy Analysis Section for Detox */}
        {activeSubTab === "detox" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 pt-16 border-t border-slate-100"
          >
            <div className="w-full space-y-10 text-left">
              
              {/* 헤더 */}
              <div className="space-y-3 text-center max-w-3xl mx-auto">
                <span className="text-sm sm:text-base font-sans text-[#0F2C59] uppercase tracking-widest font-bold block mb-1">
                  SJ ESSENTIAL LINEUP
                </span>
                <h4 className="text-2xl sm:text-3xl font-sans text-[#0F172A] font-bold leading-tight">
                  Cell renewal <span className="text-slate-500 font-normal text-lg sm:text-xl">셀리뉴얼</span>
                </h4>
                <p className="text-xs sm:text-sm font-sans text-slate-500 leading-relaxed">
                  세포의 시간을 되돌리는 생물학적 안티에이징 포뮬러
                </p>
              </div>

              {/* 기전 및 효과 레이아웃 (알레르기와 100% 대칭) */}
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 pt-4 items-stretch text-left">
                {/* 왼쪽: 효과 및 기전 텍스트 카드들 */}
                <div className="bg-slate-50/80 p-6 sm:p-8 rounded-2xl border border-slate-100 space-y-8 shadow-sm flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h5 className="font-sans font-bold text-[#0F2C59] text-xl sm:text-2xl leading-tight tracking-tight">
                        효과 및 기전
                      </h5>
                      <div className="w-10 h-1 bg-[#0F2C59] rounded-full" />
                    </div>

                    <div className="space-y-6 divide-y divide-slate-200">
                      {/* 기전 1 */}
                      <div className="space-y-2 pb-6">
                        <h6 className="font-sans font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                          생물학적 세포 시계의 복원 (텔로머레이즈 활성화)
                        </h6>
                        <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed pl-4">
                          염색체 끝단에서 DNA를 보호하는 '텔로미어'는 세포가 분열할 때마다 짧아지며 노화를 유발합니다. 본원의 독자적인 특수추출 [복합물E]는 텔로미어의 길이를 연장하고 보호하는 효소인 텔로머레이즈를 직접적으로 활성화하여, 세포의 수명 한계를 연장하고 근본적인 세포 재생력을 극대화합니다.
                        </p>
                      </div>

                      {/* 기전 2 */}
                      <div className="space-y-2 pt-6 pb-6">
                        <h6 className="font-sans font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                          장수 유전자 및 대사 스위치 ON (SIRT1 & AMPK 타겟팅)
                        </h6>
                        <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed pl-4">
                          젊고 활력 있는 신체를 유지하기 위해서는 세포 내 에너지 대사가 필수적입니다. 본 포뮬러에 배합된 [핵심 활성성분 F 및 G]는 노화 방지와 수명 연장의 핵심 열쇠로 불리는 SIRT1(장수 유전자)의 발현을 촉진합니다. 이와 동시에 세포의 에너지 센서인 AMPK 경로를 강력하게 활성화하여, 축적된 노폐물을 청소하고 전신 대사 효율을 20대 수준으로 끌어올립니다.
                        </p>
                      </div>

                      {/* 기전 3 */}
                      <div className="space-y-2 pt-6">
                        <h6 className="font-sans font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                          세포 산화 및 녹슮 방지 (초강력 항산화 네트워크)
                        </h6>
                        <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed pl-4">
                          활성산소(ROS)는 세포막과 DNA를 공격하여 신체를 병들고 늙게 만드는 주범입니다. [고순도 항산화 복합물 H]가 전신을 순환하며 강력한 항산화 네트워크를 구축, 외부 스트레스와 노화로 인한 세포의 '녹슮(Oxidative stress)'을 빈틈없이 방어합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 우측: 셀리뉴얼 제품 패키지 이미지 */}
                <div className="bg-slate-50/60 rounded-2xl p-6 sm:p-8 border border-slate-100 flex items-center justify-center shadow-sm">
                  <div className="w-full flex items-center justify-center">
                    <img 
                      src="https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%EC%97%90%EC%84%BC%EC%85%9C%20%EC%B2%98%EB%B0%A93_%EC%A2%85%ED%95%A9%EB%AA%A8%EC%9D%8C.png?alt=media&token=6996a5f6-a2fd-4e77-b6ad-33e58d6bfdd0" 
                      alt="셀리뉴얼 약제 패키지" 
                      className="w-[95%] max-w-full h-auto rounded-lg object-contain hover:scale-[1.01] transition-transform duration-300 mix-blend-multiply contrast-[1.08] brightness-[1.08]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
