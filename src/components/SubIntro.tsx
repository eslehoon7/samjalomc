import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface CleanLoadImageProps {
  src: string;
  alt: string;
  className?: string;
}

function CleanLoadImage({ src, alt, className = "" }: CleanLoadImageProps) {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
  }, [src]);

  return (
    <div className="relative w-full h-full bg-white flex items-center justify-center overflow-hidden">
      {loading && (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-10 w-full h-full">
          <div className="w-6 h-6 border-2 border-slate-100 border-t-[#0F2C59] rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          loading ? "opacity-0 scale-95" : "opacity-100"
        }`}
        referrerPolicy="no-referrer"
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
    </div>
  );
}

interface SubIntroProps {
  subTab: string;
  setSubTab: (tab: string) => void;
  setActiveTab: (tab: string) => void;
}

const defaultActivities = [
  {
    id: "default-activity-1",
    year: "2024",
    title: "2024 파리 올림픽",
    subtitle: "패럴림픽 국가대표팀 주치의",
    desc: "2016년 리우, 2018년 평창, 2020년 도쿄, 2024년 파리 올림픽에서 패럴림픽 국가대표팀 주치의 역할을 수행했습니다.",
    image: "https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/site-images%2Factivities%2F%EB%8C%80%EC%99%B8%ED%99%9C%EB%8F%992_24%ED%8C%8C%EB%A6%AC%EC%98%AC%EB%A6%BC%ED%94%BD.jpg?alt=media&token=335fe4df-c4f8-4d23-9acf-3295afae1954",
    order: 2,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "default-activity-2",
    year: "2018",
    title: "2018 항저우 아시안게임",
    subtitle: "패럴림픽 국가대표팀 주치의",
    desc: "2009년 광저우, 2018년 항저우 아시안게임에서 패럴림픽 국가대표팀<br /> 주치의 역할을 수행했습니다.",
    image: "https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/site-images%2Factivities%2F%EB%8C%80%EC%99%B8%ED%99%9C%EB%8F%991_18%ED%95%AD%EC%A0%80%EC%9A%B0.jpg?alt=media&token=bf765b57-952c-4c67-9d8a-6257ddf27652",
    order: 1,
    createdAt: "2020-01-01T00:00:00.000Z"
  }
];

export default function SubIntro({ subTab, setSubTab, setActiveTab }: SubIntroProps) {
  const [activities, setActivities] = useState<any[]>(defaultActivities);
  const [kimPhoto, setKimPhoto] = useState<string>("/images/researcher_portrait_1780500341416.png");
  const [introImages, setIntroImages] = useState<Record<string, string>>({
    philosophy_main: "/images/clinic_interior_modern_1780495390125.png",
    suseung_hwagang: "/images/clinic_interior_modern_1780495390125.png",
    wisubae_annyeong: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EC%9C%84%EC%88%98%EB%B0%B0%EC%95%88%EB%85%95.png?alt=media&token=446f64d8-09f6-4b0c-a6f3-5e98feb70702",
    wisubae_essential: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EC%97%90%EC%84%BC%EC%85%9C%20%EC%B2%98%EB%B0%A93_%EC%A2%85%ED%95%A9%EB%AA%A8%EC%9D%8C.png?alt=media&token=15c1de98-5013-4773-9519-927c5dbd9013",
    daegwanjeol_donggichim: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EB%8C%80%EA%B4%80%EC%A0%88%20%EB%8F%99%EA%B8%B0%EC%B9%A8%EB%B2%95.jpg?alt=media&token=5c1a4aa2-b614-49e8-b4e0-034a1d115b97"
  });

  useEffect(() => {
    setActivities(defaultActivities);
  }, []);

  useEffect(() => {
    // 실시간 의료진 프로필 동기화
    const unsubscribe = onSnapshot(collection(db, "profile_images"), (snap) => {
      snap.forEach(d => {
        if (d.id === "kim_yujung") {
          const val = d.data();
          if (val && val.image) {
            setKimPhoto(val.image);
          }
        }
      });
    }, (err) => {
      console.warn("프로필 데이터 실시간 동기화 오프라인 폴백:", err);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // 실시간 소개/치료 이미지 동기화
    const unsubscribe = onSnapshot(collection(db, "intro_images"), (snap) => {
      const updated = {
        philosophy_main: "/images/clinic_interior_modern_1780495390125.png",
        suseung_hwagang: "/images/clinic_interior_modern_1780495390125.png",
        wisubae_annyeong: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EC%9C%84%EC%88%98%EB%B0%B0%EC%95%88%EB%85%95.png?alt=media&token=446f64d8-09f6-4b0c-a6f3-5e98feb70702",
        wisubae_essential: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EC%97%90%EC%84%BC%EC%85%9C%20%EC%B2%98%EB%B0%A93_%EC%A2%85%ED%95%A9%EB%AA%A8%EC%9D%8C.png?alt=media&token=15c1de98-5013-4773-9519-927c5dbd9013",
        daegwanjeol_donggichim: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EB%8C%80%EA%B4%80%EC%A0%88%20%EB%8F%99%EA%B8%B0%EC%B9%A8%EB%B2%95.jpg?alt=media&token=5c1a4aa2-b614-49e8-b4e0-034a1d115b97"
      };
      snap.forEach(d => {
        if (d.id && d.data().image) {
          let imgUrl = d.data().image;
          if (d.id === "daegwanjeol_donggichim") {
            if (imgUrl.includes("samjal-oriental-clinic.firebasestorage.app") || imgUrl.includes("%EB%8C%80%EA%B4%80%EC%A0%88") || imgUrl.includes("%EB%8F%99%EA%B8%B0")) {
              imgUrl = "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EB%8C%80%EA%B4%80%EC%A0%88%20%EB%8F%99%EA%B8%B0%EC%B9%A8%EB%B2%95.jpg?alt=media&token=5c1a4aa2-b614-49e8-b4e0-034a1d115b97";
            }
          }
          if (d.id === "wisubae_annyeong") {
            if (!imgUrl.includes("%EC%9C%84%EC%88%98%EB%B0%B0%EC%95%88%EB%85%95") && !imgUrl.startsWith("data:image")) {
              imgUrl = "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EC%9C%84%EC%88%98%EB%B0%B0%EC%95%88%EB%85%95.png?alt=media&token=446f64d8-09f6-4b0c-a6f3-5e98feb70702";
            }
          }
          if (d.id === "wisubae_essential") {
            if (!imgUrl.includes("%EC%97%90%EC%84%BC%EC%85%9C%20%EC%B2%98%EB%B0%A93") && !imgUrl.startsWith("data:image")) {
              imgUrl = "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EC%97%90%EC%84%BC%EC%85%9C%20%EC%B2%98%EB%B0%A93_%EC%A2%85%ED%95%A9%EB%AA%A8%EC%9D%8C.png?alt=media&token=15c1de98-5013-4773-9519-927c5dbd9013";
            }
          }
          updated[d.id as keyof typeof updated] = imgUrl;
        }
      });
      setIntroImages(updated);
    }, (err) => {
      console.warn("소개 이미지 실시간 동기화 오프라인 폴백:", err);
    });
    return () => unsubscribe();
  }, []);
  
  const subTabs = [
    { id: "philosophy", label: "진료철학" },
    { id: "treatments", label: "고유치료법" },
    { id: "doctors", label: "Research&Clinical Partners" },
    { id: "activities", label: "대외활동" },
  ];

  return (
    <div id="intro-content-view" className="bg-white min-h-screen">
      
      {/* 서브 메인 비주얼 배너 섹션 */}
      <div className="relative w-full h-[380px] sm:h-[480px] bg-[#0F172A] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-white">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 to-[#0F2C59]/45 mix-blend-multiply z-10" />
          <CleanLoadImage
            src="https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%EA%B5%AC%EB%A6%AC%EC%A0%902.jpg?alt=media&token=ff779945-f325-4a23-8c2a-07fa15e97b23"
            alt="삼잘한의원 소개 배경"
            className="w-full h-full object-cover object-[50%_55%] blur-[5px]"
          />
        </div>

        <div className="relative z-20 text-center space-y-3 px-4 animate-fadeIn pt-16">
          <span className="text-sky-400 text-xs sm:text-sm font-sans tracking-widest uppercase font-bold flex items-center justify-center gap-1.5">
            About Samjal Clinic
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans text-white font-extrabold tracking-tight">
            삼잘한의원 소개
          </h1>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* 정통 스타일 서브 탭 바 */}
        <div className="flex justify-center border-b border-slate-200 mb-16 max-w-3xl mx-auto">
          <div className="flex justify-between items-center w-full -mb-px">
            {subTabs.map((ts) => (
              <button
                key={ts.id}
                onClick={() => setSubTab(ts.id)}
                className={`py-3 px-1 sm:px-4 md:px-6 text-center text-[10px] min-[360px]:text-xs sm:text-sm md:text-base font-sans tracking-wide transition-all duration-300 border-b-2 cursor-pointer whitespace-nowrap -mb-px flex-1 ${
                  subTab === ts.id
                    ? "border-[#0F2C59] text-[#0F2C59] font-semibold"
                    : "border-transparent text-slate-500 hover:text-[#0F2C59]"
                }`}
              >
                {ts.id === "doctors" ? (
                  <>
                    <span className="inline md:hidden">연구·임상</span>
                    <span className="hidden md:inline">{ts.label}</span>
                  </>
                ) : (
                  ts.label
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 탭내용 구성 */}
        <div className="space-y-16">
          
          {/* 1. 진료철학 */}
          {subTab === "philosophy" && (
            <div className="space-y-12 animate-fadeIn">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <span className="text-xs font-sans text-[#0F2C59] uppercase tracking-widest block font-semibold">
                  Our Vision & Philosophy
                </span>
                <h3 className="text-2xl sm:text-3xl font-sans text-[#0F172A] font-bold leading-tight">
                  결과만 치료하지 않습니다.<br />과정도 함께 치료합니다.
                </h3>
                <div className="w-12 h-1 bg-[#0F2C59] mx-auto" />
                <p className="text-base sm:text-lg font-sans text-slate-700 leading-relaxed font-normal mx-auto max-w-2xl">
                  손가락만한 구멍을 내버려두면 점점 커져서 댐이 무너지게 됩니다.<br />
                  우리의 건강도 마찬가지입니다. 사소한 기능적 문제를 방치하면 <br />
                  오랜 시간에 걸쳐 누적되어 어느 순간 우리의 눈에 띌 정도로 체감됩니다.
                </p>
                <p className="text-xs sm:text-sm font-sans text-slate-500 leading-relaxed font-light mx-auto max-w-3xl">
                  삼잘한의원에서는 눈앞의 증상에 치중하기보다 다시 기본으로 돌아가 현재의 증상에 이르게 된 그 이면의 과정을 진단하고<br className="hidden md:block" />
                  우리 몸의 자생력을 길러 본래의 건강한 일상을 되찾는 것을 목표로 진료하고 있습니다.<br className="hidden md:block" />
                  이러한 진료철학을 실천해 우리 한의원에 머무르는 모든 이들의 건강과 행복에 기여할 수 있도록 최선을 다하겠습니다.
                </p>
              </div>


            </div>
          )}

          {/* 2. 고유치료법 */}
          {subTab === "treatments" && (
            <div className="space-y-12 animate-fadeIn text-left">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <span className="text-xs font-sans text-[#0F2C59] uppercase tracking-widest block font-semibold">
                    Exclusive Therapeutics
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-sans text-[#0F172A] font-bold">
                    오직 삼잘한의원에서만 경험하고 체감할 수 있는<br />삼잘한의원 고유의 치료법
                  </h3>
                  <div className="w-12 h-1 bg-[#0F2C59]" />
                  
                  <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <h4 className="text-lg sm:text-xl font-sans font-bold text-[#0F172A] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                        심부 안정화 대관절 침법(고유의 침술)
                      </h4>
                      <p className="text-sm font-sans text-slate-600 leading-relaxed pl-4">
                        경희대병원 출신 한의학 박사이자 패럴림픽 국가대표팀 주치의까지 역임한 제정진 원장이 30년이 넘는 임상경험을 통해서 창안하고 검증한 고유의 침법입니다. 자세분석과 부하검사를 통해 저활성 근육을 진단하고, 장침을 활용해 체간 및 주요 관절부위의 속근육을 활성화하는 효과가 있습니다. 결과적으로 신진대사가 원활해지고 관절의 안정성이 향상되어 통증질환 뿐 아니라 내과질환에도 효과적입니다.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-lg sm:text-xl font-sans font-bold text-[#0F172A] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                        삼잘에센셜(고유의 치료제 라인)
                      </h4>
                      <p className="text-sm font-sans text-slate-600 leading-relaxed pl-4">
                        패럴림픽 국가대표팀 주치의를 역임한 제정진 박사, 경희대병원 출신의 한방재활의학 전문의 전준영 원장, 천연물과학 전문가이자 팜힐연구소 대표 김유정 박사. 전문가 3인이 공동연구해 창안한 삼잘한의원 고유의 치료제입니다. 질환에 따라 가장 효과적인 약재 선별부터 원산지와 품질관리, 성분에 따른 최적의 추출법 적용, 생체이용률 향상을 위한 첨단 제약기술인 SEDDS적용까지 세심하게 설계하고 정성껏 조제하였습니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 shadow-md">
                    <CleanLoadImage
                      src="https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EB%8C%80%EA%B4%80%EC%A0%88%20%EB%8F%99%EA%B8%B0%EC%B9%A8%EB%B2%95.jpg?alt=media&token=5c1a4aa2-b614-49e8-b4e0-034a1d115b97"
                      alt="심부 안정화 대관절 침법 치료 정경"
                      className="w-full h-full object-cover hover:scale-105"
                    />
                  </div>
                  <div className="aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 shadow-md">
                    <CleanLoadImage
                      src={introImages.wisubae_essential}
                      alt="에센셜 프리미엄 한약재"
                      className="w-full h-full object-cover object-[center_80%] hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. 의료진소개 */}
          {subTab === "doctors" && (
            <div className="space-y-12 animate-fadeIn">
              {/* Research & Clinical Partners 연구자문 섹션 */}
              <div className="space-y-10 text-left">
                <div className="text-center space-y-6">
                  <span className="text-[10px] sm:text-xs font-sans text-[#0F2C59] uppercase tracking-widest font-bold block">
                    Research & Clinical Partners
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-sans text-[#0F172A] font-bold tracking-tight">
                    삼잘에센셜 연구 자문진 및<br className="block sm:hidden" /> 임상 파트너
                  </h2>
                </div>

                {/* 위아래 구분을 위한 정갈한 가로 구분선 */}
                <div className="w-full max-w-5xl mx-auto h-[1px] bg-slate-200" />

                <div className="bg-transparent p-0 max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center">
                  <div className="w-full md:w-1/2 aspect-[3/4] rounded-2xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-sm">
                    <CleanLoadImage 
                      src={kimPhoto} 
                      alt="김유정 박사 팜힐 천연물 제형 연구소" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="w-full md:w-1/2 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-sans text-[#0F2C59] font-bold tracking-widest uppercase">
                          Research Partner
                        </span>
                      </div>
                      <h4 className="text-3xl sm:text-4xl font-sans font-bold text-[#0F172A]">
                        김유정 박사
                      </h4>
                      <p className="text-base sm:text-lg font-sans text-[#0F2C59] leading-relaxed italic font-medium pt-1">
                        &ldquo;약재 성분 추출 최적화와 제형 연구를 통해<br className="block sm:hidden" /> 처방의 생체 <br className="hidden sm:block" /> 이용률을 높이는 천연물 과학 전문가&rdquo;
                      </p>
                    </div>

                    <div className="pt-3 bg-[#F8FAFC] p-4 rounded-xl border border-slate-200">
                      <p className="text-sm sm:text-base font-sans text-[#0F2C59] font-semibold">
                        삼잘에센셜 처방 천연물 제형 과학 자문위원 <br /> (Natural Product Formulation Advisor)
                      </p>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-100">
                      <div className="relative pl-10">
                        <div className="absolute left-0 top-[3px] w-6 h-6 rounded-full bg-[#0F2C59] flex items-center justify-center shadow-md border border-white ring-2 ring-[#0F2C59]/20 z-10 transition-all hover:scale-110 duration-200 text-white text-xs font-sans font-bold">
                          1
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-sans font-bold text-[#0F172A]">
                            서울대학교 대학원 이학박사 <span className="text-[#0F2C59] font-normal text-xs sm:text-sm">(천연물과학 전공)</span>
                          </p>
                        </div>
                      </div>

                      <div className="relative pl-10">
                        <div className="absolute left-0 top-[3px] w-6 h-6 rounded-full bg-[#0F2C59] flex items-center justify-center shadow-md border border-white ring-2 ring-[#0F2C59]/20 z-10 transition-all hover:scale-110 duration-200 text-white text-xs font-sans font-bold">
                          2
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-sans font-bold text-[#0F172A]">
                            팜힐 연구소 대표
                          </p>
                        </div>
                      </div>

                      <div className="relative pl-10">
                        <div className="absolute left-0 top-[3px] w-6 h-6 rounded-full bg-[#0F2C59] flex items-center justify-center shadow-md border border-white ring-2 ring-[#0F2C59]/20 z-10 transition-all hover:scale-110 duration-200 text-white text-xs font-sans font-bold">
                          3
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-sans font-bold text-[#0F172A]">
                            전문 아로마테라피스트 & 아로마 임상 자문
                          </p>
                        </div>
                      </div>

                      <div className="relative pl-10">
                        <div className="absolute left-0 top-[3px] w-6 h-6 rounded-full bg-[#0F2C59] flex items-center justify-center shadow-md border border-white ring-2 ring-[#0F2C59]/20 z-10 transition-all hover:scale-110 duration-200 text-white text-xs font-sans font-bold">
                          4
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-sans font-bold text-[#0F172A]">
                            대표 저서: 《아로마테라피 클래스》 <span className="block sm:inline-block mt-1 sm:mt-0 sm:ml-2 text-[#0F2C59] text-xs font-normal border border-[#0F2C59]/30 px-1.5 py-0.5 rounded bg-slate-100 w-fit">(중앙대학교 출판사)</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단 단축 유도 슬롯 */}
              <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-4">
                <p className="text-lg font-sans text-[#0F2C59] font-semibold">
                  &ldquo;진료받을지 고민된다면 먼저 친절히 상담해 보세요&rdquo;
                </p>
                <div className="flex justify-center flex-wrap gap-4">
                  <button
                    onClick={() => {
                      setActiveTab("reservation");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-6 py-2.5 bg-[#0F2C59] text-white font-sans hover:bg-[#0F172A] rounded-lg text-sm font-bold tracking-wider transition-all cursor-pointer"
                  >
                    온라인 예약하기 &rarr;
                  </button>
                  <a
                    href="tel:02-6952-4067"
                    className="px-6 py-2.5 bg-white border border-slate-200 font-sans text-slate-700 hover:bg-slate-50 rounded-lg text-sm tracking-wider transition-all flex items-center justify-center cursor-pointer"
                  >
                    대표번호 상담전화
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 4. 대외활동 */}
          {subTab === "activities" && (
            <div className="space-y-16 animate-fadeIn text-left">
              <div className="text-center space-y-6">
                <span className="text-xs font-sans text-[#0F2C59] uppercase tracking-widest block font-bold">
                  National Team Doctor Activities
                </span>
                <h3 className="text-2xl sm:text-3xl font-sans text-[#0F172A] font-bold">
                  태극전사들이 믿고 의지한<br className="block sm:hidden" /> 삼잘의 치료 손길
                </h3>
              </div>
              
              {/* 대외활동 타임라인 레이아웃 */}
              <div className="relative max-w-5xl mx-auto py-12 px-4">
                {/* 세로 중앙 관통선 */}
                <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[1px] bg-slate-200 -translate-x-1/2 z-0" />
                
                <div className="space-y-24 relative z-10">
                  
                  {activities.map((act, index) => {
                    const isEven = index % 2 === 0;
                    return (
                      <div key={act.id || index} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center relative">
                        {isEven ? (
                          <>
                            {/* 이미지 카드 (왼쪽) */}
                            <div className="flex md:justify-end order-1 pl-12 md:pl-0 w-full">
                              <div className="w-full max-w-lg aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 shadow-md">
                                <CleanLoadImage
                                  src={act.image || "/images/clinic_interior_modern_1780495390125.png"}
                                  alt={act.title}
                                  className="w-full h-full object-cover object-top"
                                />
                              </div>
                            </div>
                            
                            {/* 중앙 타임라인 도트 (PC 전용) */}
                            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center z-20">
                              <div className="w-5 h-5 rounded-full border border-[#0F2C59]/40 bg-white flex items-center justify-center shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                              </div>
                            </div>
                            
                            {/* 텍스트 컨텐츠 (오른쪽) */}
                            <div className="space-y-2.5 order-2 pl-12 md:pl-0 relative">
                              {/* 모바일 타임라인 도트 (h4 기준 가로중심 정렬) */}
                              <div className="md:hidden absolute left-2 top-4 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20">
                                <div className="w-5 h-5 rounded-full border border-[#0F2C59]/40 bg-white flex items-center justify-center shadow-sm">
                                  <div className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                                </div>
                              </div>

                              <h4 className="text-2xl sm:text-3xl font-sans text-[#0F2C59] font-semibold leading-tight">
                                {act.title}
                              </h4>
                              <p className="text-slate-500 font-sans text-sm sm:text-base tracking-wide">
                                {act.subtitle}
                              </p>
                              <p 
                                className="text-sm font-sans text-slate-600 leading-relaxed max-w-md pt-2 text-left"
                                dangerouslySetInnerHTML={{ __html: act.desc }}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            {/* 텍스트 컨텐츠 (왼쪽) */}
                            <div className="space-y-2.5 order-2 md:order-1 text-left md:text-right pl-12 md:pl-0 relative">
                              {/* 모바일 타임라인 도트 (h4 기준 가로중심 정렬) */}
                              <div className="md:hidden absolute left-2 top-4 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20">
                                <div className="w-5 h-5 rounded-full border border-[#0F2C59]/40 bg-white flex items-center justify-center shadow-sm">
                                  <div className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                                </div>
                              </div>

                              <h4 className="text-2xl sm:text-3xl font-sans text-[#0F2C59] font-semibold leading-tight">
                                {act.title}
                              </h4>
                              <p className="text-slate-500 font-sans text-sm sm:text-base tracking-wide">
                                {act.subtitle}
                              </p>
                              <p 
                                className="text-sm font-sans text-slate-600 leading-relaxed max-w-md md:ml-auto pt-2 text-left md:text-right"
                                dangerouslySetInnerHTML={{ __html: act.desc }}
                              />
                            </div>
                            
                            {/* 중앙 타임라인 도트 (PC 전용) */}
                            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center z-20">
                              <div className="w-5 h-5 rounded-full border border-[#0F2C59]/40 bg-white flex items-center justify-center shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-[#0F2C59]" />
                              </div>
                            </div>
                            
                            {/* 이미지 카드 (오른쪽) */}
                            <div className="flex md:justify-start order-1 md:order-2 pl-12 md:pl-0 w-full">
                              <div className="w-full max-w-lg aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 shadow-md">
                                <CleanLoadImage
                                  src={act.image || "/images/samjal_crew_professional_1780495405627.png"}
                                  alt={act.title}
                                  className="w-full h-full object-cover object-[center_30%]"
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
