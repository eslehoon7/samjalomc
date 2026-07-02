import { useState, useEffect } from "react";
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
      subtitle: "맑은 혈액과 가볍고 활기찬 신체 리듬 치료",
      desc: "노화는 피할 수 없는 자연 현상이 아니라, 세포내 유전자 손상과 대사기능의 저하로 인해 발생하는 ‘관리가능한 생물학적 프로세스’입니다. 본원만의 독자적인 추출 공정으로 완성한 천연화합물 복합체를 통해, 노화의 근본 원인인 세포시계를 늦추고 젊음의 대사 스위치를 다시 켭니다.",
      diseases: "항노화유전자 활성화, 텔로머레이즈 활성화, 항산화시스템 활성화",
      diseasesList: [
        "항노화 유전자 활성화",
        "텔로머레이즈 활성화",
        "항산화 시스템 활성화"
      ],
      benefits: [
        "항노화 유전자 활성화",
        "텔로머레이즈 활성화",
        "항산화/해독 시스템 활성화"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* 왼쪽 텍스트 정보 */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6 text-left">
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
          </div>

          {/* 오른쪽 시각적 고품질 생성 이미지 결합부 - 2x2 밀접 그리드 배열 (통합암관리는 단일 이미지) */}
          <div key={activeSubTab} className="lg:col-span-5 rounded-2xl overflow-hidden flex flex-col relative justify-center animate-fadeIn">
            {activeSubTab === "cancer" ? (
              (() => {
                const imgList = subjectImages[activeSubTab] || defaultSubjectImages[activeSubTab];
                const labelsList = subjectLabels[activeSubTab] || subjectImageNames[activeSubTab] || [];
                const imgUrl = imgList[0];
                const label = labelsList[0] || "";
                return (
                  <div className="relative w-[250px] aspect-square mx-auto rounded-xl overflow-hidden border border-slate-100 shadow-sm group">
                    <ImageWithLoader
                      src={imgUrl}
                      alt={label || `${current.title} 이미지 1`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    {label && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-10 bg-slate-900/75 backdrop-blur-[2px] flex items-center justify-center px-3 text-center">
                        <span className="text-xs sm:text-sm text-white font-sans font-medium tracking-wide leading-none">
                          {label}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
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
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
