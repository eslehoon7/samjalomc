import React, { useState, FormEvent } from "react";
import { Sparkles, CalendarCheck, SearchCheck, PhoneCall, Gift } from "lucide-react";

export default function SubReservation() {
  
  // 1. 온라인 진료 예약 관련 상태
  const [resForm, setResForm] = useState({
    name: "",
    phone: "",
    branch: "구리본점",
    subject: "통증/관절/척추질환",
    date: "",
    time: "10:00",
    memo: ""
  });
  const [resSuccess, setResSuccess] = useState(false);
  const [resLoading, setResLoading] = useState(false);

  // 2. AI 삼잘 자가건강진단 관련 상태
  const [diagForm, setDiagForm] = useState({
    sleep: "잠이 들기 어렵고 새벽에 자주 깹니다 (불안 수면)",
    eat: "식후 속이 더부룩하고 가스가 많이 찹니다 (식체 발생)",
    poop: "변비 경향이 있고 아랫배가 늘 묵직합니다 (담독 누적)",
    age: "40대",
    gender: "여성",
    symptoms: "만성적인 어깨 결림과 요통이 번갈아 찾아오고 쉽게 지칩니다."
  });
  const [diagResult, setDiagResult] = useState("");
  const [diagLoading, setDiagLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  // 3. 자가진단 기록 및 원장 소견 조회 상태
  const [showLookup, setShowLookup] = useState(false);
  const [lookupForm, setLookupForm] = useState({
    age: "40대",
    gender: "여성",
    idSlice: ""
  });
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError("");
    setLookupResult(null);
    setLookupLoading(true);

    try {
      // 1. Kick off both Firestore and Express fetch in parallel
      const fsPromise = (async () => {
        try {
          const { db } = await import("../firebase");
          const { collection, getDocs } = await import("firebase/firestore");
          const diagSnapshot = await getDocs(collection(db, "diagnoses"));
          return diagSnapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: String(data.id || d.id),
              sleep: data.sleep || "",
              eat: data.eat || "",
              poop: data.poop || "",
              age: data.age || "",
              gender: data.gender || "",
              symptoms: data.symptoms || "",
              createdAt: data.createdAt || "",
              analysis: data.analysis || "",
              doctorNotes: data.doctorNotes || ""
            };
          });
        } catch (fErr) {
          console.warn("Firestore lookup fetch failed:", fErr);
          return [];
        }
      })();

      const expressPromise = fetch("/api/diagnoses")
        .then(r => r.ok ? r.json() : [])
        .catch(err => {
          console.warn("Express lookup fetch failed:", err);
          return [];
        });

      // Await concurrently
      const [fsList, apiList] = await Promise.all([fsPromise, expressPromise]);

      let list = [...fsList];

      // Merge results
      if (apiList && Array.isArray(apiList)) {
        apiList.forEach((ad: any) => {
          const exists = list.some(item => String(item.id) === String(ad.id));
          if (!exists) {
            list.push({
              id: String(ad.id),
              sleep: ad.sleep || "",
              eat: ad.eat || "",
              poop: ad.poop || "",
              age: ad.age || "",
              gender: ad.gender || "",
              symptoms: ad.symptoms || "",
              createdAt: ad.createdAt || "",
              analysis: ad.analysis || "",
              doctorNotes: ad.doctorNotes || ""
            });
          }
        });
      }

      // 가장 최근 진단 내역을 찾기 위함
      const found = list.find((item: any) => {
        const matchesAge = item.age === lookupForm.age;
        const matchesGender = item.gender === lookupForm.gender;
        const matchesId = lookupForm.idSlice ? item.id.endsWith(lookupForm.idSlice) : true;
        return matchesAge && matchesGender && matchesId;
      });

      if (found) {
        setLookupResult(found);
      } else {
        setLookupError("입력하신 연령대, 성별 및 기록번호(고유주소)와 매칭되는 진단서를 찾을 수 없습니다. 원장실 등록 여부를 확인해 주십시오.");
      }
    } catch (err) {
      console.error(err);
      setLookupError("원내 전산실 서버 수신 중 오류가 발생했습니다.");
    } finally {
      setLookupLoading(false);
    }
  };

  // 예약 신청 핸들러
  const handleReservation = async (e: FormEvent) => {
    e.preventDefault();
    if (!resForm.name || !resForm.phone || !resForm.date) {
      alert("성함, 연락처, 예약 희망일은 필수 입력 사항입니다.");
      return;
    }
    setResLoading(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: resForm.name,
          phone: resForm.phone,
          branch: resForm.branch,
          subject: resForm.subject,
          date: resForm.date,
          time: resForm.time,
          memo: resForm.memo
        })
      });
      if (response.ok) {
        setResSuccess(true);
        setResForm({
          name: "",
          phone: "",
          branch: "구리본점",
          subject: "통증/관절/척추질환",
          date: "",
          time: "10:00",
          memo: ""
        });
      } else {
        const err = await response.json();
        alert(err.error || "예약 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("예약 서버 통신 중 오류가 발생했습니다.");
    } finally {
      setResLoading(false);
    }
  };

  // AI 자가검진 신청 핸들러
  const handleDiagnose = async () => {
    setDiagLoading(true);
    setDiagResult("");
    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diagForm)
      });
      if (response.ok) {
        const data = await response.json();
        setDiagResult(data.analysis);
        setIsDemo(!!data.isDemo);

        // Firestore 동기화 추가를 통해 어드민이 완벽 연동하여 볼 수 있게 보장
        if (data.diagnosis) {
          try {
            const { db } = await import("../firebase");
            const { doc, setDoc } = await import("firebase/firestore");
            await setDoc(doc(db, "diagnoses", String(data.diagnosis.id)), {
              id: String(data.diagnosis.id),
              sleep: data.diagnosis.sleep || "",
              eat: data.diagnosis.eat || "",
              poop: data.diagnosis.poop || "",
              age: data.diagnosis.age || "",
              gender: data.diagnosis.gender || "",
              symptoms: data.diagnosis.symptoms || "",
              createdAt: data.diagnosis.createdAt || new Date().toISOString(),
              analysis: data.diagnosis.analysis || "",
              doctorNotes: data.diagnosis.doctorNotes || ""
            });
          } catch (fErr) {
            console.warn("Firestore diagnosis sync failed on client side:", fErr);
          }
        }
      } else {
        alert("자가 진단을 진행하기 위해 API 통신을 하는 데 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 연결에 실패했습니다.");
    } finally {
      setDiagLoading(false);
    }
  };

  // 마크다운을 정규식을 거쳐 예쁜 HTML로 가볍게 파싱하는 컴포넌트 내부 헬퍼
  const renderParsedMarkdown = (rawText: string) => {
    if (!rawText) return null;
    return rawText.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return <h3 key={idx} className="text-lg sm:text-xl font-serif font-bold text-[#2A2826] border-b border-[#C5A059]/30 pb-2 mt-6 mb-3">{trimmed.replace("###", "").trim()}</h3>;
      }
      if (trimmed.startsWith("####")) {
        return <h4 key={idx} className="text-sm sm:text-base font-serif font-bold text-[#C5A059] mt-5 mb-2">{trimmed.replace("####", "").trim()}</h4>;
      }
      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        return <p key={idx} className="font-serif font-semibold text-[#2A2826] mt-3">{trimmed.replace(/\*\*/g, "").trim()}</p>;
      }
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        let clean = trimmed.substring(1).trim();
        // 내부 볼드체 처리 (**텍스트**)
        const parts = clean.split("**");
        return (
          <li key={idx} className="list-none pl-4 relative text-xs sm:text-sm font-serif text-[#5C6351] my-2 leading-relaxed">
            <span className="absolute left-0 text-[#C5A059]">&bull;</span>
            {parts.map((p, pIdx) => (pIdx % 2 === 1 ? <strong key={pIdx} className="text-[#2A2826] font-bold">{p}</strong> : p))}
          </li>
        );
      }
      if (trimmed.startsWith(">")) {
        return (
          <blockquote key={idx} className="border-l-4 border-[#C5A059] pl-4 py-2 italic font-serif text-[#5C6351] bg-[#DFD5C6]/15 rounded-r my-4">
            {trimmed.replace(">", "").trim()}
          </blockquote>
        );
      }
      if (trimmed === "---") {
        return <hr key={idx} className="my-6 border-t border-[#DFD5C6]/50" />;
      }
      // 일반 단락
      return <p key={idx} className="text-xs sm:text-sm font-serif text-[#5C6351] leading-relaxed my-2">{trimmed}</p>;
    });
  };

  return (
    <div className="bg-[#FDFBF7] min-h-screen pt-28 sm:pt-32 pb-16 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 설명 상부 가이드 */}
        <div className="text-center space-y-3 mb-16">
          <p className="text-xs sm:text-sm text-[#C5A059] tracking-widest font-serif uppercase font-bold">
            Reservations & AI Consulting
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#2A2826] font-bold">
            예약신청 / AI 자가건강진단
          </h2>
          <div className="w-10 h-0.5 bg-[#C5A059] mx-auto mt-3" />
          <p className="text-sm font-serif text-[#5C6351] max-w-lg mx-auto leading-relaxed pt-2">
            직접 지점을 방문하시기 전 삼잘(수면, 식사, 장배변) 건강 상태를 AI 한방 시스템으로 예측 진맥받거나 즉시 방문 스케줄을 확정지을 수 있는 통합 창구입니다.
          </p>
        </div>

        {/* 2컬럼 레이아웃: 왼쪽 실시간 예약신청서 / 오른쪽 정밀 건강진단 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* 영역 1: 품격 있는 온라인 예약신청서 */}
          <div className="bg-white border border-[#DFD5C6]/50 rounded-2xl p-6 sm:p-10 shadow-md space-y-8 flex flex-col justify-between text-left relative">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#2A2826] rounded-t-2xl" />
            
            <div className="space-y-2">
              <span className="text-xs font-serif text-[#C5A059] uppercase tracking-wider block font-semibold">
                online appointment reservation
              </span>
              <h3 className="text-xl sm:text-2xl font-serif text-[#2A2826] font-bold">
                지점 방문 예약신청
              </h3>
              <p className="text-xs font-serif text-[#5C6351]">
                내원하시면 당일 정밀 진맥과 심부 안정화 대관절 침법 통증 회복 클리닉을 전수받으실 수 있습니다.
              </p>
            </div>

            {resSuccess ? (
              <div className="p-8 bg-[#DFD5C6]/15 border border-[#C5A059]/40 rounded-xl text-center space-y-4 my-auto animate-scaleUp">
                <span className="w-12 h-12 rounded-full bg-[#C5A059]/10 border border-[#C5A059] flex items-center justify-center mx-auto text-xl font-bold font-serif text-[#C5A059]">參</span>
                <h4 className="text-lg font-serif font-bold text-[#2A2826]">예약 서신 접수 완료</h4>
                <p className="text-xs sm:text-sm font-serif text-[#2A2826]/85 leading-relaxed">
                  삼잘한의원에 보낸 방문 안내 예약이 정상 승인되었습니다. <br />
                  진료 일정 확인을 위해 원장실 관리자가 신속히 기입해주신 연락처로 전화를 드리겠습니다. 감사합니다.
                </p>
                <button
                  onClick={() => setResSuccess(false)}
                  className="px-6 py-2 bg-[#2A2826] hover:bg-[#C5A059] hover:text-[#2A2826] text-[#DFD5C6] font-serif rounded-lg text-xs cursor-pointer font-bold"
                >
                  새로운 예약하기
                </button>
              </div>
            ) : (
              <form onSubmit={handleReservation} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-serif text-[#2A2826] font-bold mb-1">환자 성함 *</label>
                    <input
                      type="text"
                      required
                      placeholder="김삼잘"
                      value={resForm.name}
                      onChange={(e) => setResForm({ ...resForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#DFD5C6] rounded-lg text-stone-800 text-sm focus:outline-none focus:border-[#C5A059] font-serif"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-serif text-[#2A2826] font-bold mb-1">휴대폰 번호 *</label>
                    <input
                      type="tel"
                      required
                      placeholder="010-0000-0000"
                      value={resForm.phone}
                      onChange={(e) => setResForm({ ...resForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#DFD5C6] rounded-lg text-stone-800 text-sm focus:outline-none focus:border-[#C5A059] font-serif"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-serif text-[#2A2826] font-bold mb-1">진료 희망 지점 *</label>
                    <select
                      value={resForm.branch}
                      onChange={(e) => setResForm({ ...resForm, branch: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#DFD5C6] rounded-lg text-stone-800 text-xs sm:text-sm focus:outline-none focus:border-[#C5A059] font-serif"
                    >
                      <option value="구리본점">구리본점 (대표 제정진 원장)</option>
                      <option value="노원점">노원점 (대표 전준영 원장)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-serif text-[#2A2826] font-bold mb-1">희망 진료 과목 *</label>
                    <select
                      value={resForm.subject}
                      onChange={(e) => setResForm({ ...resForm, subject: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#DFD5C6] rounded-lg text-stone-800 text-xs sm:text-sm focus:outline-none focus:border-[#C5A059] font-serif"
                    >
                      <option value="통증/관절/척추질환">통증 / 관절 / 척추질환</option>
                      <option value="내과질환">위장병 / 소화비위 대사내과</option>
                      <option value="알레르기">아토피 / 만성 비염 알레르기</option>
                      <option value="통합암관리">한양방 통합 암 요양케어</option>
                      <option value="항노화/해독">체내 염증 해독 / 공진 보강</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-serif text-[#2A2826] font-bold mb-1">예약 희망 일자 *</label>
                    <input
                      type="date"
                      required
                      value={resForm.date}
                      onChange={(e) => setResForm({ ...resForm, date: e.target.value })}
                      className="w-full px-4 py-2 bg-[#FDFBF7] border border-[#DFD5C6] rounded-lg text-stone-800 text-sm focus:outline-none focus:border-[#C5A059] font-serif"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-serif text-[#2A2826] font-bold mb-1">예약 시간 *</label>
                    <select
                      value={resForm.time}
                      onChange={(e) => setResForm({ ...resForm, time: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#DFD5C6] rounded-lg text-stone-800 text-xs sm:text-sm focus:outline-none focus:border-[#C5A059] font-serif"
                    >
                      <option value="09:30">09:30</option>
                      <option value="10:00">10:00</option>
                      <option value="10:30">10:30</option>
                      <option value="11:00">11:00</option>
                      <option value="11:30">11:30</option>
                      <option value="12:00">12:00</option>
                      <option value="14:00">14:00</option>
                      <option value="14:30">14:30</option>
                      <option value="15:00">15:00</option>
                      <option value="15:30">15:30</option>
                      <option value="16:00">16:00</option>
                      <option value="16:30">16:30</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-serif text-[#2A2826] font-bold mb-1">원장님께 드리는 특별 메모</label>
                  <textarea
                    rows={3}
                    placeholder="최근 나타나기 시작한 구체적인 증세나 요청 사안을 적어주시면 사전 파악에 큰 도움이 됩니다."
                    value={resForm.memo}
                    onChange={(e) => setResForm({ ...resForm, memo: e.target.value })}
                    className="w-full px-4 py-2 bg-[#FDFBF7] border border-[#DFD5C6] rounded-lg text-stone-800 text-xs sm:text-sm focus:outline-none focus:border-[#C5A059] font-serif"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={resLoading}
                    className="w-full py-4 bg-[#2A2826] hover:bg-[#C5A059] text-[#DFD5C6] hover:text-[#2A2826] transition-all duration-300 rounded-xl text-sm font-serif font-bold tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <CalendarCheck className="w-5 h-5" />
                    {resLoading ? "정갈히 승인 중..." : "동양 정통 한방예약 신청 접수"}
                  </button>
                </div>
              </form>
            )}
            
            {/* 하단 전화 상담 단축번호 조치 */}
            <div className="flex gap-4 border-t border-[#DFD5C6]/40 pt-6 mt-4 justify-between items-center text-xs font-serif text-[#5C6351]">
              <span className="flex items-center gap-1">
                <PhoneCall className="w-4 h-4 text-[#C5A059]" />
                구리: 031-555-3555 / 노원: 02-6952-4067
              </span>
              <span>당일 진료 예약은 전화를 주시면 더 신속합니다.</span>
            </div>
          </div>

          {/* 영역 2: 신비로운 AI 삼잘 건강 자가진단 (Gemini API 기반) */}
          <div className="bg-[#2A2826] text-[#DFD5C6] border border-[#C5A059]/40 rounded-2xl p-6 sm:p-10 shadow-lg space-y-6 flex flex-col justify-between text-left relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#C5A059]" />
            
            <div className="space-y-2">
              <span className="text-xs font-serif text-[#C5A059] uppercase tracking-wider block flex items-center gap-1 font-bold">
                ai oriental healthcare consulting
              </span>
              <h3 className="text-xl sm:text-2xl font-serif text-white font-bold">
                삼잘(三잘) 실시간 한방 자가진단
              </h3>
              <p className="text-xs text-[#A89A8D]">
                수면, 식이, 배변 상태를 선택하십시오. 전문가 3인의 전문지식으로 대형 인공지능이 귀하의 기혈 순환을 정밀 진맥하여 고유 한방 비책을 무상 서신으로 보냅니다.
              </p>
            </div>

            {/* 입력 폼 필드 */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-serif text-[#C5A059] font-bold mb-1">수면 (잘자기) *</label>
                  <select
                    value={diagForm.sleep}
                    onChange={(e) => setDiagForm({ ...diagForm, sleep: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-[#DFD5C6]/30 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059] font-serif"
                  >
                    <option className="bg-[#2A2826]" value="잠이 들기 어렵고 새벽에 자주 깹니다 (불안 수면)">불안 수면 (불안/새벽 잦은 깸)</option>
                    <option className="bg-[#2A2826]" value="아침에 일어나도 몸이 천근만근이고 졸립니다 (피로 축적)">피로 축적 (일어나도 극심 피로)</option>
                    <option className="bg-[#2A2826]" value="꿈을 머리가 지끈거리도록 많이 꾸고 뒤척입니다 (다몽/열독)">다몽성/뒤척임 (치솟는 뇌파)</option>
                    <option className="bg-[#2A2826]" value="다소 양호한 편이나 수면 시간이 아주 부족합니다">시간 부족 (양호하나 불충분)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-serif text-[#C5A059] font-bold mb-1">식이 (잘먹기) *</label>
                  <select
                    value={diagForm.eat}
                    onChange={(e) => setDiagForm({ ...diagForm, eat: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-[#DFD5C6]/30 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059] font-serif"
                  >
                    <option className="bg-[#2A2826]" value="식후 속이 더부룩하고 가스가 많이 찹니다 (식체 발생)">식체/가스창만 (가스가 치밈)</option>
                    <option className="bg-[#2A2826]" value="공복 시 위산이 역류해 신 트림이 돌고 속이 쓰립니다">위속 쓰림 / 위산 역류</option>
                    <option className="bg-[#2A2826]" value="식욕 자체가 없고 음식을 넘기기 어렵습니다 (중초 허한)">위장 무력 (식욕 결핍)</option>
                    <option className="bg-[#2A2826]" value="소화는 매우 빠르나 가끔 급한 소화 경향이 있습니다">정상 흡수 (과체 경향 있음)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-serif text-[#C5A059] font-bold mb-1">배변 (잘보내기) *</label>
                  <select
                    value={diagForm.poop}
                    onChange={(e) => setDiagForm({ ...diagForm, poop: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-[#DFD5C6]/30 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059] font-serif"
                  >
                    <option className="bg-[#2A2826]" value="변비 경향이 있고 아랫배가 늘 묵직합니다 (담독 누적)">만성 변비 (아랫배 묵직함)</option>
                    <option className="bg-[#2A2826]" value="평소 기름진 것만 접하면 즉시 설사 경향이 있습니다">민감성 유출 (무른변/설사)</option>
                    <option className="bg-[#2A2826]" value="배가 평소 꼬이듯 아프며 불규칙한 주기를 가집니다">불규칙 주기 (복통 동반)</option>
                    <option className="bg-[#2A2826]" value="정상적인 형태를 띠오나 시원하게 통하지는 않습니다">보통 수준 (잔변감 잔존)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-serif text-[#C5A059] font-bold mb-1">연령대</label>
                    <select
                      value={diagForm.age}
                      onChange={(e) => setDiagForm({ ...diagForm, age: e.target.value })}
                      className="w-full px-2 py-2 bg-white/5 border border-[#DFD5C6]/30 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059] font-serif"
                    >
                      <option className="bg-[#2A2826]" value="20대">20대</option>
                      <option className="bg-[#2A2826]" value="30대">30대</option>
                      <option className="bg-[#2A2826]" value="40대">40대</option>
                      <option className="bg-[#2A2826]" value="50대">50대</option>
                      <option className="bg-[#2A2826]" value="60대 이상">60대 이상</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-serif text-[#C5A059] font-bold mb-1">성별</label>
                    <select
                      value={diagForm.gender}
                      onChange={(e) => setDiagForm({ ...diagForm, gender: e.target.value })}
                      className="w-full px-2 py-2 bg-white/5 border border-[#DFD5C6]/30 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059] font-serif"
                    >
                      <option className="bg-[#2A2826]" value="여성">여성</option>
                      <option className="bg-[#2A2826]" value="남성">남성</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-serif text-[#C5A059] font-bold mb-1">현재 가장 고생 중인 신체 이상 증상</label>
                <input
                  type="text"
                  placeholder="예: 어깨 뭉침, 허리 극심 통증, 불면증, 위염 등"
                  value={diagForm.symptoms}
                  onChange={(e) => setDiagForm({ ...diagForm, symptoms: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[#DFD5C6]/30 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A059] font-serif"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDiagnose}
                  disabled={diagLoading}
                  className="w-full py-3.5 bg-[#C5A059] hover:bg-[#A67C52] text-[#2A2826] hover:text-white transition-all duration-300 rounded-xl text-xs sm:text-sm font-serif font-bold tracking-widest flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <SearchCheck className="w-4 h-4" />
                  {diagLoading ? "AI 한방 진찰 진단하는 중..." : "AI 삼잘 한방 자가진단 실행"}
                </button>
              </div>
            </div>

            {/* AI 정밀 보고서 영역 */}
            {diagResult && (
              <div className="mt-6 border border-[#C5A059]/50 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto bg-[#FDFBF7] text-[#2A2826] p-6 shadow-md animate-scaleUp">
                <div className="flex justify-between items-center pb-3 border-b border-[#DFD5C6]/60 mb-4 sticky top-0 bg-[#FDFBF7] z-10 font-sans">
                  <span className="text-[11px] text-[#C5A059] font-bold tracking-wider flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" />
                    삼잘한의원 비법 전수 진단서
                  </span>
                  {isDemo ? (
                    <span className="px-1.5 py-0.5 bg-[#C5A059]/15 border border-[#C5A059]/30 text-[9px] text-[#C5A059] rounded font-bold">
                      Demo Mode
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-[9px] text-emerald-600 rounded font-bold">
                      1차 간이 AI 분석완료
                    </span>
                  )}
                </div>
                <div className="text-left font-serif space-y-4">
                  {renderParsedMarkdown(diagResult)}
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed border-t border-slate-100 pt-2.5">
                    ※ 원장님이 관리자센터 전산실에서 진술기록을 검토하고 처방/소견 문서를 기입하면 아래의 실시간 조회 창을 통해 통합 합성된 최종 의료 가이드가 자동으로 귀하에게 전속 서비스됩니다.
                  </p>
                </div>
              </div>
            )}

            {/* 자가진단 기록 및 원장 소견 통합 조회 도구 (고객용) */}
            <div className="mt-4 pt-4 border-t border-[#DFD5C6]/20 font-sans">
              <button
                type="button"
                onClick={() => setShowLookup(!showLookup)}
                className="w-full text-center py-2.5 border border-[#C5A059]/40 hover:bg-white/5 text-[#C5A059] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{showLookup ? "▲ 이전 자가진단 소견 조회창 접기" : "▼ 나의 자가진단 종합 기록 & 원장 처방 조회"}</span>
              </button>

              {showLookup && (
                <div className="mt-4 p-5 bg-white/5 border border-[#DFD5C6]/25 rounded-xl text-left space-y-4 animate-slideDown">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#C5A059] uppercase tracking-widest font-bold block">Consolidated Health Report Lookup</span>
                    <h4 className="text-sm text-white font-bold">자가진단 및 주치의 종합 대응서 검색</h4>
                    <p className="text-[10.5px] text-[#A89A8D] leading-normal">
                      자가진단을 작성하셨던 연령대, 성별을 토대로 원장단이 가미해주신 최종 조치 소견 문서를 실시간 합성하여 답변합니다.
                    </p>
                  </div>

                  <form onSubmit={handleLookup} className="space-y-3 font-sans text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-[#C5A059] font-bold mb-1">진단 당시 연령군</label>
                        <select
                          value={lookupForm.age}
                          onChange={(e) => setLookupForm({ ...lookupForm, age: e.target.value })}
                          className="w-full px-3 py-1.5 bg-[#2A2826] border border-[#DFD5C6]/30 rounded-lg text-white"
                        >
                          <option value="20대">20대</option>
                          <option value="30대">30대</option>
                          <option value="40대">40대</option>
                          <option value="50대">50대</option>
                          <option value="60대 이상">60대 이상</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#C5A059] font-bold mb-1">성별</label>
                        <select
                          value={lookupForm.gender}
                          onChange={(e) => setLookupForm({ ...lookupForm, gender: e.target.value })}
                          className="w-full px-3 py-1.5 bg-[#2A2826] border border-[#DFD5C6]/30 rounded-lg text-white"
                        >
                          <option value="여성">여성</option>
                          <option value="남성">남성</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#C5A059] font-bold mb-1">기록번호 끝 6자리 (보안 확인코드 - 생략가능)</label>
                      <input
                        type="text"
                        placeholder="공란으로 기입 시 가장 최근 진단을 우선 매칭합니다."
                        value={lookupForm.idSlice}
                        onChange={(e) => setLookupForm({ ...lookupForm, idSlice: e.target.value })}
                        className="w-full px-3 py-2 bg-[#2A2826] border border-[#DFD5C6]/30 rounded-lg text-white focus:outline-none focus:border-[#C5A059] text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={lookupLoading}
                      className="w-full py-2.5 bg-[#C5A059] hover:bg-[#A67C52] text-[#2A2826] hover:text-white rounded-lg text-xs font-bold transition-all text-center cursor-pointer"
                    >
                      {lookupLoading ? "보안 데이터 동기화 중..." : "나의 종합 진단서 및 주치의 처방 실시간 확인"}
                    </button>
                  </form>

                  {lookupError && (
                    <p className="text-rose-400 text-[10.5px] leading-relaxed font-semibold text-center">
                      ⚠ {lookupError}
                    </p>
                  )}

                  {lookupResult && (
                    <div className="mt-4 p-4.5 bg-amber-50/5 border border-[#C5A059]/40 rounded-xl space-y-3.5 text-left">
                      <div className="flex items-center justify-between pb-2 border-b border-[#DFD5C6]/20">
                        <span className="text-xs font-serif text-white font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                          실시간 임상 기록 및 처방 합성결과 ({lookupResult.id.slice(-6)})
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(lookupResult.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs leading-relaxed font-serif">
                        <div>
                          <span className="text-[10px] text-[#C5A059] block font-sans font-bold mb-0.5">• 환우 기재 증상</span>
                          <p className="text-slate-300 italic pl-1 font-light font-serif">"{lookupResult.symptoms}"</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#C5A059] block font-sans font-bold mb-0.5">• 주치의 진술 및 원장단 처방 (통합 소견)</span>
                          {lookupResult.doctorNotes ? (
                            <p className="bg-[#C5A059]/10 text-white p-3 rounded-lg border border-[#C5A059]/30 font-serif leading-relaxed text-xs">
                              {lookupResult.doctorNotes}
                            </p>
                          ) : (
                            <p className="text-amber-500/80 italic p-3 bg-white/5 rounded-lg border border-white/5 leading-relaxed text-[11px] font-serif">
                              원장실에서 문서를 보완 중입니다. 진단이 완료되는 대로 본 조회 페이지에서 완벽한 명세서가 전속 처리됩니다.
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] text-[#C5A059] block font-sans font-bold mb-0.5">• 공전 인공지능 보조 해설서</span>
                          <div className="text-slate-300 pl-1 max-h-[140px] overflow-y-auto text-[11.5px] leading-relaxed bg-black/10 p-2.5 rounded-lg border border-white/5 font-serif">
                            {renderParsedMarkdown(lookupResult.analysis)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
