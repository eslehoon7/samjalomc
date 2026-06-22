import React, { useState, useEffect, useRef } from "react";
import { MapPin, Phone, Clock, Navigation, Sparkles, Image, ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "../firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import L from "leaflet";

const defaultItems = [
  {
    id: "default-1",
    tag: "waiting",
    tagLabel: "대기실 & 접수데스크",
    title: "아늑하고 정갈한 대기 공간",
    desc: "환우분들이 긴장을 풀고 편안한 기흐름을 찾으실 수 있도록 엄선된 무독 친환경 목조 자재와 정밀 공기 조화 설비를 도입해 설계한 삼잘 시그니처 대기 라운지입니다.",
    image: "/images/clinic_interior_modern_1780495390125.png",
    branch: "both",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "default-2",
    tag: "treatment",
    tagLabel: "프라이빗 치료실",
    title: "1인 집중 치료실 (Sterile Room)",
    desc: "오직 환자 한 분만을 위한 아늑하고 멸균 처리된 치료 환경입니다. 심부 안정화 대관절 침법 및 심부 온열 요법에 한결 깊이 스며들 수 있도록 정밀하게 원내 고유 설계했습니다.",
    image: "/images/clinic_interior_1779805270752.png",
    branch: "both",
    createdAt: "2026-01-02T00:00:00.000Z"
  },
  {
    id: "default-3",
    tag: "clinic",
    tagLabel: "진료 및 상담실",
    title: "체질맥진 정밀 진단실",
    desc: "환우의 체외적 증상 이면의 자생력 상태 및 비위 맥박을 정량 분석하고 따뜻한 시선으로 마주하는 개별 일대일 맞춤 카운셀링 공간입니다.",
    image: "/images/samjal_crew_professional_1780495405627.png",
    branch: "both",
    createdAt: "2026-01-03T00:00:00.000Z"
  },
  {
    id: "default-4",
    tag: "dispensary",
    tagLabel: "청정 조제 탕전실",
    title: "특허 안심 청정 조제관",
    desc: "약제 보관 및 첨단 추출 제약 설비를 안전하고 까다롭게 구비하였습니다. 식약처 인증 최상위 등급 한약재들이 어떠한 성분 소실 없이 가공되는 핵심 기지입니다.",
    image: "/images/hygienic_premium_hanbang_herbal_1780497683155.png",
    branch: "both",
    createdAt: "2026-01-04T00:00:00.000Z"
  }
];

export default function SubLocation() {
  const [activeBranch, setActiveBranch] = useState("nowon");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Leaflet Map Refs & Coordinates
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const branchCoords: Record<string, [number, number]> = {
    nowon: [37.6543, 127.0609], // 노원역 6번 출구 덕영빌딩
    guri: [37.6019, 127.1424]   // 구리시 경춘로 186 삼잘빌딩
  };

  useEffect(() => {
    // Dynamically inject Leaflet CSS stylesheet if not present
    let link = document.getElementById("leaflet-css") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const coords = activeBranch === "nowon" ? branchCoords.nowon : branchCoords.guri;
    const branchName = activeBranch === "nowon" ? "삼잘한의원 노원점" : "삼잘한의원 구리본점";

    let map = mapInstanceRef.current;

    if (!map) {
      // Create fresh map instance
      map = L.map(mapContainerRef.current, {
        center: coords,
        zoom: 17,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB Positron maps styled like clean Naver maps
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        minZoom: 11
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      // Smoothly pan & fly to new location
      map.setView(coords, 17, { animate: true, duration: 0.8 });
    }

    // Reset current marker if exists
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // High fidelity custom NAVER elements styled marker pin
    const customIcon = L.divIcon({
      html: `
        <div class="flex flex-col items-center select-none pointer-events-none" style="transform: translate(-50%, -100%);">
          <!-- 기포 말풍선 (네이버 고유 핀 테마) -->
          <div class="bg-white border-2 border-[#03C75A] px-3.5 py-1.5 rounded-xl shadow-lg relative flex flex-col items-center min-w-[130px] animate-bounce">
            <span class="text-[11px] font-sans font-extrabold text-[#03C75A] tracking-tight leading-none">${branchName}</span>
            <span class="text-[8px] font-sans text-slate-400 mt-1 leading-none font-medium text-center">삼대째 잘하는 원칙</span>
            <!-- 말풍선 꼬리 -->
            <div class="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r-2 border-b-2 border-[#03C75A] transform rotate-45"></div>
          </div>
          <!-- 핀 포인트 -->
          <div class="relative mt-2">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#03C75A]/25 rounded-full animate-ping duration-1000"></div>
            <div class="w-7 h-7 rounded-full bg-[#03C75A] shadow-md flex items-center justify-center border-2 border-white">
              <div class="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
        </div>
      `,
      className: "custom-naver-marker-wrapper",
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    const newMarker = L.marker(coords, { icon: customIcon }).addTo(map);
    markerRef.current = newMarker;

    // Fast container bounds update
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

  }, [activeBranch]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleRecenter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mapInstanceRef.current) {
      const coords = activeBranch === "nowon" ? branchCoords.nowon : branchCoords.guri;
      mapInstanceRef.current.setView(coords, 17, { animate: true, duration: 0.6 });
    }
  };

  // Profiles State
  const [profiles, setProfiles] = useState<Record<string, string>>({
    jeon_junyoung: "/images/samjal_crew_professional_1780495405627.png",
    je_jengjin: "/images/samjal_crew_professional_1780495405627.png",
    je_hyunyoung: "/images/samjal_characters_expert_1780495449389.jpg"
  });

  useEffect(() => {
    // 실시간 의료진 프로필 동기화
    const unsubscribe = onSnapshot(collection(db, "profile_images"), (snap) => {
      const updated = {
        jeon_junyoung: "/images/samjal_crew_professional_1780495405627.png",
        je_jengjin: "/images/samjal_crew_professional_1780495405627.png",
        je_hyunyoung: "/images/samjal_characters_expert_1780495449389.jpg"
      };
      snap.forEach(d => {
        if (d.id && d.data().image) {
          updated[d.id as keyof typeof updated] = d.data().image;
        }
      });
      setProfiles(updated);
    }, (err) => {
      console.warn("의료진 프로필 데이터 실시간 동기화 오프라인 폴백:", err);
    });
    return () => unsubscribe();
  }, []);

  // Gallery states for Interior Tour with localStorage sync
  const [galleryItems, setGalleryItems] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("samjal_gallery_items");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return defaultItems;
    } catch (_) {
      return defaultItems;
    }
  });

  // Real-time Firestore sync
  useEffect(() => {
    const q = query(collection(db, "galleryPhotos"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setGalleryItems(defaultItems);
        localStorage.setItem("samjal_gallery_items", JSON.stringify(defaultItems));
        return;
      }
      
      const fetched = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          tag: d.tag || "hospital-added",
          tagLabel: d.tagLabel || "원내 인증 전경",
          title: d.title || "",
          desc: d.desc || "",
          image: d.image || "",
          storagePath: d.storagePath || "",
          branch: d.branch || "both",
          createdAt: d.createdAt || new Date().toISOString()
        };
      });

      // Sort: custom photos on top, default items appended or combined
      const sortedFetched = fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Merge: show custom ones first, then default ones that don't overlap in image URL
      const customUrls = new Set(sortedFetched.map(item => item.image));
      const filteredDefaults = defaultItems.filter(item => !customUrls.has(item.image));
      const combined = [...sortedFetched, ...filteredDefaults];

      setGalleryItems(combined);
      localStorage.setItem("samjal_gallery_items", JSON.stringify(combined));
    }, (err) => {
      console.warn("Firestore onSnapshot error, utilizing offline fallback:", err);
    });

    return () => unsubscribe();
  }, []);

  const [lightboxItem, setLightboxItem] = useState<any | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft } = scrollContainerRef.current;
      const scrollAmount = window.innerWidth < 640 ? 314 : 404; // card width + gap
      const scrollTo = direction === "left" 
        ? scrollLeft - scrollAmount 
        : scrollLeft + scrollAmount;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  // Filter gallery items relative to active branch selection
  const filteredGalleryItems = galleryItems.filter((item: any) => {
    if (!item.branch || item.branch === "both") return true;
    return item.branch === activeBranch;
  });


  const branches = {
    nowon: {
      name: "삼잘한의원 노원점 (대표원장 전준영)",
      address: "서울시 노원구 노해로 482, 7층 (덕영빌딩)",
      phone: "02-6952-4067",
      subway: "노원역 6번 출구 바로 앞 도보 1분 (신한은행 건물 7층)",
      hours: [
        { label: "월·화·목·금요일", val: "10:00 - 19:00" },
        { label: "수요일", val: "10:00 - 17:00" },
        { label: "토요일", val: "10:00 - 16:00", note: "점심시간 없이 논스톱 진료" },
        { label: "일요일", val: "정기 휴진" },
        { label: "점심시간", val: "13:00 - 14:00 (1시간)" }
      ],
      greeting: {
        quote: "“몸의 자생력을 일깨워 건강함을 되찾아 드립니다”",
        lines: [
          "안녕하세요, 삼잘한의원 노원점 전준영 원장입니다.",
          "경희대병원 전문의의 꼼꼼하고 수준높은 진료와 함께,",
          "삼잘한의원 고유의 기술력이 담긴 치료시스템으로 근본적인 변화를 약속드립니다."
        ]
      },
      doctor: {
        name: "전준영 원장",
        role: "삼잘한의원 노원점 대표원장",
        image: profiles.jeon_junyoung,
        credentials: [
          "경희대 한의대 학사",
          "경희대 한의대 임상한의학 석사",
          "경희대 한방병원 인턴/레지던트 과정 수료",
          "경희대 한방병원 척추관절센터/뇌졸중센터 재직",
          "한방재활의학과 전문의",
          "한방비만학회 연구자문위원"
        ],
        research: [
          "삼잘에센셜 처방 수석 연구원(Head Developer of formulation)",
          "De-tox캡슐 수원단 연구개발",
          "Anti-inflammatory formula 프라이머 오일 연구개발",
          "관절염 솔루션: Feather-step 연구개발",
          "알레르기 솔루션: Allergy-control 연구개발",
          "불면증 솔루션: Goyo 연구개발",
          "항노화 포뮬러: Cell-renewal 연구개발"
        ],
        papers: [
          "만성 긴장성 두통에 대한 양측 완골과 풍지혈 전침 치료의 효과, 한방재활의학과학회지",
          "교통사고로 인한 편타손상의 침 치료에 대한 임상연구의 국내외 동향, 한방재활의학과학회지",
          "상지의 단일신경병증에 대한 수기치료의 국내외 동향, 한방재활의학과학회지",
          "AGREE II 를 이용한 턱관절 장애의 국내외 기개발임상진료지침의 평가, 한방재활의학과학회지",
          "근골격계 질환에서 도구를 이용한 수기요법의 연구동향 고찰, 한방재활의학과학회지"
        ]
      },
      features: [
        "체질맥진 자율신경계 디지털 정밀 분석 장비 완비",
        "집중 치유를 위한 프라이빗 개인 치료실(Sterile Room) 운영",
        "직장인을 위한 평일 야간진료 프로그램 개설",
        "최첨단 에어 샤워 및 쾌적한 전용 메디컬 라운지 구비"
      ],
      image: "/images/clinic_interior_modern_1780495390125.png",
      naverMapUrl: "https://naver.me/xtNNu5e6"
    },
    guri: {
      name: "삼잘한의원 구리본점 (대표원장 제정진)",
      address: "경기도 구리시 경춘로 186, 3층 (삼잘빌딩)",
      phone: "031-555-3555",
      subway: "경의중앙선 구리역 1번 출구 도보 5분 현대아울렛 사거리 중앙",
      hours: [
        { label: "월·수·금요일", val: "09:00 - 19:00" },
        { label: "화요일", val: "09:00 - 13:00", note: "점심시간 없이 논스톱 진료" },
        { label: "토요일", val: "09:00 - 15:00", note: "점심시간 없이 논스톱 진료" },
        { label: "목·일요일", val: "정기 휴진" },
        { label: "점심시간", val: "13:00 - 14:00 (1시간)" }
      ],
      greeting: {
        quote: "“기본부터 탄탄하게, 여러분의 건강을 지키겠습니다”",
        lines: [
          "안녕하세요, 삼잘한의원 구리점 제정진 원장입니다.",
          "증상이라는 결과보다 그것에 이르게 된 과정에 집중해 진료하고 있습니다."
        ]
      },
      doctor: {
        name: "제정진 원장",
        role: "삼잘한의원 구리점 대표원장",
        image: profiles.je_jengjin,
        credentials: [
          "경희대 한의대 학사",
          "경희대 한의대 임상한의학 박사",
          "한체대 대학원 체육학 박사",
          "경희대학교 한방병원 한방내과 레지던트 이수",
          "2016년 리우, 2018년 평창, 2020년 도쿄, 2024년 파리 올림픽에서 패럴림픽 국가대표팀 주치의 역할을 수행했습니다",
          "삼잘에센셜 처방 개발 고문",
          "전)상지대 한의대 교수",
          "전)대한스포츠한의학회 회장"
        ],
        research: [
          "삼잘에센셜 처방 임상 연구 고문(Clinical Research Advisor)"
        ],
        papers: [
          "2015 한약의 도핑관리, 대한스포츠한의학회지",
          "혈부축어탕이 Adjuvant유발 관절염에 미치는 영향[dissertation], 경희대 박사학위",
          "중풍으로 인한 견비통의 초음파를 이용한 온경락요법 치료효과, 한방재활의학과학회지",
          "골다공증 검진 방법에 대한 소고, 한방재활의학과학회지",
          "용골, 모려, 구판, 별갑, 아교가 골다공증에 미치는 영향에 대한 문헌적 고찰, 한방재활의학과학회지",
          "허비증에 대한 문헌적 고찰, 한방재활의학과학회지",
          "치료용 레이저에 대한 소고, 대한한의학회지"
        ]
      },
      features: [
        "정밀 자동 추출 설비 및 원내 무독 청정 안심 탕전 시스템",
        "소아 성장 종합 정밀 진단 및 척추 관절 견인 순환 치료 베드",
        "구리점 차량 전용 자주식 파킹 서비스 완비 (무료 주차 제공)",
        "경희대 내과 전문 원장단의 오장육부 소화기 밀착 클리닉 운영"
      ],
      image: "/images/samjal_crew_professional_1780495405627.png",
      naverMapUrl: "https://map.naver.com/v5/search/%EA%B2%BD%EA%B8%B0%EB%8F%84%20%EA%B5%AC%EB%A6%AC%EC%8B%9C%20%EA%B2%BD%EC%B6%98%EB%A1%9C%20186"
    }
  };

  const current = branches[activeBranch as keyof typeof branches];

  return (
    <div className="bg-white min-h-screen animate-fadeIn">
      
      {/* 서브 메인 비주얼 배너 섹션 (Main Section) */}
      <div className="relative w-full h-[380px] sm:h-[480px] bg-[#0F172A] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 to-[#0F2C59]/45 mix-blend-multiply z-10" />
          <img
            src="https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%EA%B5%AC%EB%A6%AC%EC%A0%901.jpg?alt=media&token=72bf4426-d021-461a-9672-c311b15f9a0c"
            alt="지점안내 배경"
            className="w-full h-full object-cover blur-[5px]"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-20 text-center space-y-3 px-4 animate-fadeIn pt-16">
          <span className="text-sky-400 text-xs sm:text-sm font-sans tracking-widest uppercase font-bold flex items-center justify-center gap-1.5">
            Branch Locations
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans text-white font-extrabold tracking-tight">
            지점안내 & 오시는길
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* 노원점 vs 구리점 대형 트리거 디자인 */}
        <div className="flex justify-center gap-4 mb-10 max-w-md mx-auto">
          <button
            onClick={() => setActiveBranch("nowon")}
            className={`flex-1 py-3 sm:py-4 text-center font-sans text-sm sm:text-base tracking-tight sm:tracking-widest rounded-xl border transition-all duration-300 cursor-pointer ${
              activeBranch === "nowon"
                ? "bg-[#0F2C59] border-[#0F2C59] text-white font-bold shadow-md"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            노원점<br className="block sm:hidden" />(전준영 대표원장)
          </button>
          <button
            onClick={() => setActiveBranch("guri")}
            className={`flex-1 py-3 sm:py-4 text-center font-sans text-sm sm:text-base tracking-tight sm:tracking-widest rounded-xl border transition-all duration-300 cursor-pointer ${
              activeBranch === "guri"
                ? "bg-[#0F2C59] border-[#0F2C59] text-white font-bold shadow-md"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            구리점<br className="block sm:hidden" /> (제정진 대표원장)
          </button>
        </div>

        {/* 지점 원장 대표의 따뜻한 인사말 & 학술 프로필 통합 섹션 (Section 1) */}
        <div className="mb-12 relative overflow-hidden space-y-10 py-6">
          <div className="absolute top-0 right-0 w-28 h-28 bg-slate-50 rounded-bl-full pointer-events-none" />
          <div className="absolute top-0 left-0 w-28 h-28 bg-slate-50 rounded-br-full pointer-events-none" />

          {/* 인트로: 중앙 정렬된 가로 인사말 */}
          <div className="flex flex-col items-center gap-5 text-center relative z-10 max-w-3xl mx-auto">
            <h3 className="text-base sm:text-lg font-sans text-[#0F2C59] font-extrabold leading-relaxed text-center">
              {activeBranch === "nowon" ? (
                <>
                  “몸의 자생력을 일깨워<br className="block sm:hidden" /> 건강함을 되찾아 드립니다”
                </>
              ) : (
                <>
                  “기본부터 탄탄하게,<br className="block sm:hidden" /> 여러분의 건강을 지키겠습니다”
                </>
              )}
            </h3>
            <div className="h-[1px] w-12 bg-slate-200 mx-auto" />
            <div className="space-y-2.5 text-center">
              {current.greeting.lines.map((line: string, index: number) => (
                <p key={index} className="text-xs sm:text-sm font-sans text-slate-500 leading-relaxed break-keep">
                  {line}
                </p>
              ))}
            </div>
          </div>



          {/* 연구 분야 및 원장 약력 2단 그리드 (사용자 시안 정밀 매칭) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-4 relative z-10 max-w-5xl mx-auto w-full">
            {/* 좌측 영역: 원장 프로필 이미지 (lg:col-span-5) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full aspect-[4/5] rounded-[24px] overflow-hidden select-none relative flex items-center justify-center bg-slate-50 border border-slate-200">
                <img
                  key={current.doctor.image}
                  src={current.doctor.image}
                  alt={current.doctor.name}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500 animate-fadeIn"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* 우측 영역: 약력 및 연구 분야 정보 통합 (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-8 flex flex-col justify-start text-left">
              {/* [우측 상단] 대표원장 이름, 직함 및 상세 약력 */}
              <div className="space-y-4 lg:translate-x-3 translate-x-1">
                <div className="flex items-center gap-3.5">
                  <h4 className="text-xl sm:text-2xl font-sans font-extrabold text-[#0F172A] tracking-wide">
                    {current.doctor.name}
                  </h4>
                  <div className="h-[1px] w-8 bg-slate-300" />
                  <p className="text-xs sm:text-sm font-sans text-[#0F2C59] font-bold tracking-wider">
                    {current.doctor.role}
                  </p>
                </div>
                
                {/* 한의대 약력 list */}
                <ul className="space-y-2.5 text-sm sm:text-[15px] font-sans text-slate-500 leading-relaxed font-medium">
                  {current.doctor.credentials.map((cred: string, idx: number) => {
                    if (cred.includes("<br>")) {
                      return (
                        <li key={idx} className="break-keep">
                          {cred.split("<br>").map((line, lidx) => (
                            <span key={lidx}>
                              {line}
                              {lidx < cred.split("<br>").length - 1 && <br />}
                            </span>
                          ))}
                        </li>
                      );
                    }
                    return (
                      <li key={idx} className="break-keep">{cred}</li>
                    );
                  })}
                </ul>
              </div>

              {/* 구분선 */}
              <div className="h-[1px] bg-slate-200 w-full" />

              {/* [우측 하단] 연구개발 분야 및 논문 리스트 */}
              <div className="space-y-6">
                {/* 연구개발 분야 */}
                <div className="space-y-3.5 lg:translate-x-3 translate-x-1">
                  {current.doctor.research.map((res: string, idx: number) => {
                    if (res.includes("(") && (res.includes("formulation") || res.includes("Advisor") || res.includes("Research"))) {
                      const openParenIdx = res.indexOf("(");
                      const mainPart = res.slice(0, openParenIdx).trim();
                      const headPart = res.slice(openParenIdx).trim();
                      return (
                        <div key={idx} className="text-sm sm:text-base md:text-[17px] font-sans text-[#0F172A] leading-relaxed pb-3 border-b border-slate-200 mb-3 flex flex-wrap items-baseline gap-1">
                          <strong className="text-[#0F2C59] font-extrabold text-base sm:text-lg md:text-xl">
                            {mainPart}
                          </strong>
                          <span className="text-xs sm:text-sm text-slate-400 font-sans font-medium">
                            {headPart}
                          </span>
                        </div>
                      );
                    }

                    if (res.includes(":")) {
                      const [label, val] = res.split(":");
                      return (
                        <div key={idx} className="text-sm sm:text-base md:text-[17px] font-sans text-slate-700 leading-relaxed flex items-start gap-2">
                          <span className="text-slate-500 font-bold shrink-0">{label.trim()}:</span>
                          <span className="text-[#0F172A] font-medium">{val.trim()}</span>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="text-sm sm:text-base md:text-[17px] font-sans text-slate-700 leading-relaxed font-semibold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0F2C59]/70 shrink-0" />
                        <span>{res}</span>
                      </div>
                    );
                  })}
                </div>

                {/* 논문 리스트 */}
                {current.doctor.papers && current.doctor.papers.length > 0 && (
                  <div className="flex gap-4 items-stretch pt-4 lg:translate-x-3 translate-x-1">
                    <div className="w-[1.5px] bg-[#0F2C59]/40 shrink-0 self-stretch my-1" />
                    <div className="space-y-2">
                      <span className="text-xs sm:text-sm font-sans font-bold text-[#0F172A] block tracking-wide">
                        논문
                      </span>
                      <ul className="space-y-2.5 text-xs font-sans text-slate-400 leading-relaxed break-keep">
                        {current.doctor.papers.map((paper: string, idx: number) => (
                          <li key={idx} className="relative pl-3.5">
                            <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-[#0F2C59]/70" />
                            {paper}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 구리점일 경우 선택한 프로필 div를 밑에 하나 더 복사 */}
          {activeBranch === "guri" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-12 relative z-10 border-t border-slate-200 mt-12 animate-fadeIn max-w-5xl mx-auto w-full">
              {/* 좌측 영역: 원장 프로필 이미지 (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full aspect-[4/5] rounded-[24px] overflow-hidden select-none relative flex items-center justify-center bg-slate-50 border border-slate-200">
                  <img
                    src={profiles.je_hyunyoung}
                    alt="제현영 원장"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* 우측 영역: 약력 및 연구 분야 정보 통합 (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-8 flex flex-col justify-start text-left">
                {/* [우측 상단] 대표원장 이름, 직함 및 상세 약력 */}
                <div className="space-y-4 lg:translate-x-3 translate-x-1">
                  <div className="flex items-center gap-3.5">
                    <h4 className="text-xl sm:text-2xl font-sans font-extrabold text-[#0F172A] tracking-wide">
                      제현영 원장
                    </h4>
                    <div className="h-[1px] w-8 bg-slate-300" />
                    <p className="text-xs sm:text-sm font-sans text-[#0F2C59] font-bold tracking-wider">
                      삼잘한의원 구리점 원장
                    </p>
                  </div>
                  
                  {/* 한의대 약력 list */}
                  <ul className="space-y-2.5 text-sm sm:text-[15px] font-sans text-slate-500 leading-relaxed font-medium">
                    <li className="break-keep">상지대 한의대 졸업</li>
                    <li className="break-keep">체육학 석사(한체대 대학원)</li>
                    <li className="break-keep">동수원 한방병원 인턴 과정 수료(일반수련 수료의)</li>
                    <li className="break-keep">동수원 한방병원 응급진료실 재직</li>
                    <li className="break-keep">전)한의약진흥원 연구원</li>
                  </ul>
                </div>

                {/* 구분선 */}
                <div className="h-[1px] bg-slate-200 w-full" />

                {/* [우측 하단] 중점진료영역 및 논문 리스트 */}
                <div className="space-y-6">
                  {/* 중점진료영역 */}
                  <div className="space-y-3.5 lg:translate-x-3 translate-x-1">
                    <div className="text-sm sm:text-base md:text-[17px] font-sans text-[#0F172A] leading-relaxed pb-3 border-b border-slate-200 mb-3 flex flex-wrap items-baseline gap-1">
                      <strong className="text-[#0F2C59] font-extrabold text-base sm:text-lg md:text-xl">
                        중점진료영역
                      </strong>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        "여성질환",
                        "다이어트",
                        "척추/관절/통증 질환",
                        "외상성 질환(교통사고, 스포츠)",
                        "Foreigner Clinic"
                      ].map((item, idx) => (
                        <div key={idx} className="text-sm sm:text-base md:text-[17px] font-sans text-slate-700 leading-relaxed font-semibold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0F2C59]/70 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 논문 리스트 */}
                  <div className="flex gap-4 items-stretch pt-4 border-t border-slate-200 lg:translate-x-3 translate-x-1">
                    <div className="w-[1.5px] bg-[#0F2C59]/40 shrink-0 self-stretch my-1" />
                    <div className="space-y-2">
                      <span className="text-xs sm:text-sm font-sans font-bold text-[#0F172A] block tracking-wide">
                        논문
                      </span>
                      <ul className="space-y-2.5 text-xs font-sans text-slate-400 leading-relaxed break-keep">
                        <li className="relative pl-3.5">
                          <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-[#0F2C59]/70" />
                          코어근육에 적용한 동작침법이 남자 대학 골프선수의 관절 가동성, 근 파워 및 드라이버 수행력에 미치는 급성효과, 2024
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 삼잘 원내 시설 둘러보기 및 사진 등록 섹션 */}
        <div id="samjal-interior-tour" className="mb-16 pt-10 pb-12 border-t border-b border-slate-200/80 animate-fadeIn text-left relative overflow-hidden">
          {/* Custom Slider CSS Injection */}
          <style dangerouslySetInnerHTML={{ __html: `
            .interior-card {
              transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .interior-card:hover {
              transform: scale(1.03) translateY(-4px);
              z-index: 40 !important;
            }
          `}} />

          <div className="space-y-4 mb-4 px-4 sm:px-6">
            <span className="text-xs font-sans text-[#0F2C59] tracking-widest uppercase block font-bold text-center sm:text-left">
              Interior & Environment Tour
            </span>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-2xl sm:text-3xl font-sans font-bold text-[#0F172A] tracking-tight">
                  삼잘한의원 원내 둘러보기
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-500 leading-relaxed">
                  마우스 드래그/스와이프나 좌우 화살표 단추를 통해 원내 시설 한 점도 남김없이 자세히 관람하실 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 일절 중복 출력 없는 프리미엄 슬라이더 컨테이너 */}
          <div className="relative w-full group/track py-6">
            {/* 좌우 사이드 그라데이션 페이드 효과 */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-20 bg-gradient-to-r from-white via-white/10 to-transparent z-20" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-20 bg-gradient-to-l from-white via-white/10 to-transparent z-20" />

            {/* 좌우 이동 방향 제어 버튼 */}
            <button 
              onClick={() => scroll("left")}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#0F2C59] border border-slate-200 shadow-md flex items-center justify-center opacity-50 md:opacity-0 md:group-hover/track:opacity-50 hover:!opacity-100 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="이전 사진 보기"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button 
              onClick={() => scroll("right")}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#0F2C59] border border-slate-200 shadow-md flex items-center justify-center opacity-50 md:opacity-0 md:group-hover/track:opacity-50 hover:!opacity-100 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="다음 사진 보기"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* 실제 스크롤 트랙 (No wrap-duplications) */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-none px-6 sm:px-12 py-2"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {filteredGalleryItems.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  onClick={() => setLightboxItem(item)}
                  style={{ scrollSnapAlign: "start" }}
                  className="interior-card w-[290px] sm:w-[380px] shrink-0 bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl cursor-pointer relative group flex flex-col z-10"
                >
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-all duration-700 brightness-95 opacity-85 saturate-[0.85] group-hover:brightness-100 group-hover:opacity-100 group-hover:saturate-100"
                      referrerPolicy="no-referrer"
                    />
                    {/* 상단 노출 지점 지시 전용 태그 */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-2.5 py-1 bg-slate-950/70 backdrop-blur-md border border-white/20 text-[10px] font-sans font-bold tracking-wider text-white uppercase rounded-md text-left">
                        {item.tagLabel}
                      </span>
                    </div>

                    {/* 지점별 표시 꼬리표 추가 */}
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-2 py-0.5 bg-[#0F2C59] border border-[#0F2C59]/10 text-[9px] font-sans font-bold text-white uppercase rounded shadow-sm">
                        {item.branch === "nowon" ? "노원점" : item.branch === "guri" ? "구리점" : "공통"}
                      </span>
                    </div>
                  </div>
                  
                  {/* 설명 구역 */}
                  <div className="p-5 text-left border-t border-slate-50 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-base sm:text-lg font-sans font-extrabold text-slate-800 tracking-tight group-hover:text-[#0F2C59] transition-colors mb-2">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm font-sans text-slate-500 leading-relaxed font-light break-keep">
                        {item.desc}
                      </p>
                    </div>
                    
                    {/* 하단 화살표 힌트 */}
                    <div className="flex items-center gap-1.5 pt-3 text-[11px] sm:text-xs font-sans text-[#0F2C59] font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>자세히 보기 (확대)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[11px] sm:text-xs font-sans text-slate-400 mt-2">
            ※ 원하시는 전경을 클릭하시면 정밀 상세 확대 뷰가 제공됩니다.
          </p>
        </div>

        {/* 라이트박스 세부 레이어 팝업 */}
        {lightboxItem && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 transition-all duration-300 animate-fadeIn" onClick={() => setLightboxItem(null)}>
            <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full border border-slate-100 shadow-2xl animate-scaleUp text-left" onClick={(e) => e.stopPropagation()}>
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                <img
                  src={lightboxItem.image}
                  alt={lightboxItem.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setLightboxItem(null)}
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-slate-950/60 hover:bg-slate-950/90 hover:scale-105 border border-white/20 rounded-full text-white text-lg font-bold transition-all cursor-pointer shadow-md"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 sm:p-8 space-y-4">
                <span className="inline-block px-2.5 py-1 bg-[#FAF9F5] text-[#0F2C59] text-xs font-sans font-extrabold tracking-wider border border-[#0F2C59]/10 uppercase rounded">
                  {lightboxItem.tagLabel}
                </span>
                <h3 className="text-xl sm:text-2xl font-sans text-slate-800 font-extrabold tracking-tight">
                  {lightboxItem.title}
                </h3>
                <p className="text-sm font-sans text-slate-600 leading-relaxed font-normal break-keep">
                  {lightboxItem.desc}
                </p>
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setLightboxItem(null)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-sans font-bold cursor-pointer transition-all shadow-md active:scale-95"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 안내 섹션 헤더 가이드 */}
        <div className="text-center pt-6 pb-14">
          <h3 className="text-2xl sm:text-3xl font-sans font-extrabold text-[#0F172A] tracking-wide">
            오시는 길
          </h3>
        </div>

        {/* 상세 레이아웃 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* 지점 상세 특장점 및 운영시간 */}
          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="space-y-2">
              <span className="text-xs font-sans text-[#0F2C59] tracking-widest uppercase block font-semibold">
                branch information
              </span>
              <h3 className="text-xl sm:text-2xl font-sans text-[#0F172A] font-bold">
                {current.name}
              </h3>
            </div>
            
            <div className="space-y-4 border-t border-b border-slate-200 py-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-sans font-bold text-[#0F172A]">주소 및 오시는길</h4>
                  <p className="text-xs sm:text-sm font-sans text-slate-700 mt-0.5">{current.address}</p>
                  <p className="text-xs font-sans text-slate-400 mt-1 italic">{current.subway}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-sans font-bold text-[#0F172A]">진료 안내 전화</h4>
                  <p className="text-sm sm:text-base font-sans text-[#0F2C59] mt-0.5 font-bold tracking-widest">
                    {current.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* 정밀 시간표 */}
            <div className="space-y-3">
              <h4 className="text-sm font-sans font-bold text-[#0F172A] flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-500" />
                진료 시간표
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 divide-y divide-slate-200/60">
                {current.hours.map((hr: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-3 text-xs sm:text-sm font-sans text-slate-700 items-center">
                    <span className="font-semibold text-[#0F172A]">{hr.label}</span>
                    <div className="text-right flex flex-col items-end justify-center">
                      <span className="text-slate-500">{hr.val}</span>
                      {hr.note ? (
                        <span className="text-[10px] text-sky-500 mt-0.5 font-sans font-medium">
                          ({hr.note})
                        </span>
                      ) : (
                        <span className="text-[10px] text-transparent select-none mt-0.5 font-sans font-medium">
                          &nbsp;
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 지점 사진 및 가상 약도 기와 타일 디자인 */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-6">
            {/* 실질적으로 보이는 네이버 지도 렌더러 영역 */}
            <div className="aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative bg-[#F4F4F2] group transition-all duration-300 hover:border-[#03C75A]/60 select-none">
              {/* 실제 Leaflet 지도가 채워지는 DIV */}
              <div 
                ref={mapContainerRef} 
                className="absolute inset-0 w-full h-full z-0" 
              />
              
              {/* 네이버 지도 인터랙션 UI 레이아웃 소스 */}
              {/* 우측 수직 컨트롤 피들 (대형 줌 및 홈 버튼 추가) */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-lg shadow-md flex flex-col divide-y divide-slate-100 z-10 w-8 overflow-hidden">
                <button 
                  onClick={handleZoomIn}
                  className="h-8 flex items-center justify-center text-slate-800 font-bold hover:bg-slate-50 transition-colors text-sm font-mono cursor-pointer active:bg-slate-100"
                  title="확대"
                >
                  +
                </button>
                <button 
                  onClick={handleZoomOut}
                  className="h-8 flex items-center justify-center text-slate-800 font-bold hover:bg-slate-50 transition-colors text-sm font-mono cursor-pointer active:bg-slate-100"
                  title="축소"
                >
                  -
                </button>
                <button 
                  onClick={handleRecenter}
                  className="h-8 flex items-center justify-center text-[#03C75A] hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100"
                  title="지점 위치로 이동"
                >
                  <Navigation className="w-3.5 h-3.5 fill-[#03C75A] transform rotate-45 -translate-x-[0.5px] translate-y-[0.5px]" />
                </button>
              </div>

              {/* 좌상단 로고 테두리 */}
              <div 
                onClick={() => window.open(current.naverMapUrl, "_blank")}
                className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-lg px-3 py-1.5 shadow-sm flex items-center gap-2 z-10 font-sans cursor-pointer hover:bg-slate-50 active:scale-95 transition-all animate-pulse"
              >
                <div className="w-4 h-4 rounded-sm bg-[#03C75A] flex items-center justify-center text-white font-extrabold text-[9px] font-sans">
                  N
                </div>
                <div className="text-left flex items-center gap-1.5">
                  <p className="text-[10px] font-sans font-extrabold text-slate-800 leading-none">NAVER 지도</p>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <p className="text-[9px] font-sans text-[#03C75A] font-bold leading-none">크게보기</p>
                </div>
              </div>

              {/* 하단 작가 정보 및 Naver 저작권 표기 */}
              <div className="absolute bottom-1.5 left-3 text-[9px] font-sans text-slate-400 font-medium z-10 pointer-events-none select-none backdrop-blur-[1px] bg-white/40 px-1 rounded-xs">
                <span className="text-[#03C75A] font-extrabold tracking-wider mr-1.5">NAVER</span>
                <span>© NAVER Corp.</span>
              </div>

              {/* 우측 하단 200m 축척선 및 200:1 (1:200) 비율 표시 */}
              <div className="absolute bottom-1.5 right-3 flex flex-col items-end z-10 pointer-events-none select-none font-sans backdrop-blur-[1px] bg-white/40 px-1 rounded-xs">
                <span className="text-[8px] text-slate-500 font-bold leading-none mb-0.5">200m</span>
                <div className="flex items-center">
                  <div className="w-[1px] h-1.5 bg-slate-400" />
                  <div className="w-12 h-[1px] bg-slate-400" />
                  <div className="w-[1px] h-1.5 bg-slate-400" />
                </div>
                <span className="text-[7.5px] text-slate-400 mt-0.5 leading-none">1:200</span>
              </div>

            </div>

            {/* 지점 특성 칩 그리드 */}
            <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-6 text-left space-y-3">
              <h4 className="text-xs sm:text-sm font-sans font-bold text-[#0F2C59] uppercase tracking-widest">
                지점 진료 특장점
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans text-slate-600">
                {current.features.map((ft, index) => (
                  <div key={index} className="flex items-center gap-2 border-b border-slate-100 pb-2 min-w-0">
                    <span className="text-[#0F2C59] font-bold flex-shrink-0">✓</span>
                    <span className="text-[11px] sm:text-xs leading-tight tracking-tight whitespace-nowrap sm:whitespace-normal overflow-hidden text-ellipsis">{ft}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 가상 주차 및 예약 지원 */}
            <div className="flex gap-4">
              <a
                href={`tel:${current.phone}`}
                className="flex-1 text-center py-3.5 bg-[#0F2C59] hover:bg-indigo-900 transition-all text-white rounded-lg text-sm font-sans font-semibold tracking-wider flex items-center justify-center cursor-pointer"
              >
                지점 상담전화연결
              </a>
              <button
                onClick={() => {
                  window.open(current.naverMapUrl, "_blank");
                }}
                className="flex-1 text-center py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-sm font-sans tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-[#03C75A]" />
                네이버지도 길찾기
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
