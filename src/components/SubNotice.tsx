import { useState, useEffect } from "react";
import { Notice } from "../types";
import { Eye, Clock, FileText, X } from "lucide-react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, increment } from "firebase/firestore";

let noticesCache: Notice[] | null = null;

export default function SubNotice() {
  const [notices, setNotices] = useState<Notice[]>(() => {
    if (noticesCache) return noticesCache;
    try {
      const persisted = sessionStorage.getItem("samjal_notices_cache");
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (Array.isArray(parsed)) {
          noticesCache = parsed;
          return parsed;
        }
      }
    } catch (_) {}
    return [];
  });

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(() => !noticesCache);
  const [error, setError] = useState("");

  useEffect(() => {
    if (noticesCache && noticesCache.length > 0) {
      setNotices(noticesCache);
      setLoading(false);
      fetchNotices(true);
    } else {
      fetchNotices(false);
    }
  }, []);

  const fetchNotices = async (isRevalidating = false) => {
    if (!isRevalidating) setLoading(true);
    setError("");
    try {
      // 1. Kick off Firestore and Express API in parallel
      const fsNoticesPromise = getDocs(collection(db, "notices")).catch(fErr => {
        console.warn("Firestore fetch notices failed, using local fallback:", fErr);
        return null;
      });
      const expressNoticesPromise = fetch("/api/notices").then(r => r.ok ? r.json() : []).catch(err => {
        console.warn("Express API fetch notices failed:", err);
        return [];
      });

      const [fsSnap, apiNotices] = await Promise.all([fsNoticesPromise, expressNoticesPromise]);

      // 2. Parse notices
      let noticesList: Notice[] = [];
      if (fsSnap) {
        noticesList = fsSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            title: data.title || "",
            content: data.content || "",
            date: data.date || "",
            isPinned: !!data.isPinned,
            views: data.views || 0,
          };
        });
      }

      // Merge with Express notices API
      if (apiNotices && Array.isArray(apiNotices)) {
        apiNotices.forEach((an: Notice) => {
          const exists = noticesList.some(n => String(n.id) === String(an.id));
          if (!exists) {
            noticesList.push({
              id: String(an.id),
              title: an.title || "",
              content: an.content || "",
              date: an.date || "",
              isPinned: !!an.isPinned,
              views: an.views || 0
            });
          }
        });
      }

      noticesList.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.date.localeCompare(a.date);
      });

      setNotices(noticesList);
      noticesCache = noticesList;
      try {
        sessionStorage.setItem("samjal_notices_cache", JSON.stringify(noticesList));
      } catch (_) {}
    } catch (err: any) {
      if (!isRevalidating) {
        setError("공지사항 소식을 읽어오는 중 문제가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNoticeClick = async (notId: string) => {
    const cached = notices.find((n) => n.id === notId);
    if (!cached) return;

    const detail: Notice = { ...cached, views: cached.views + 1 };
    setSelectedNotice(detail);

    setNotices((prev) => {
      const updated = prev.map((n) => (n.id === notId ? { ...n, views: n.views + 1 } : n));
      noticesCache = updated;
      try {
        sessionStorage.setItem("samjal_notices_cache", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    try {
      const snapshot = await getDocs(collection(db, "notices"));
      const targetDoc = snapshot.docs.find((d) => String(d.data().id) === notId);
      if (targetDoc) {
        await updateDoc(doc(db, "notices", targetDoc.id), { views: increment(1) });
      }
    } catch (_) {}
  };

  return (
    <div className="bg-white min-h-screen animate-fadeIn">
      <div className="relative w-full h-[380px] sm:h-[480px] bg-[#0F172A] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 to-[#0F2C59]/45 mix-blend-multiply z-10" />
          <img
            src="https://firebasestorage.googleapis.com/v0/b/samjal-oriental-clinic.firebasestorage.app/o/image%2F%EC%97%90%EC%84%BC%EC%85%9C%20%EC%B2%98%EB%B0%A93_%EC%A2%85%ED%95%A9%EB%AA%A8%EC%9D%8C.png?alt=media&token=6996a5f6-a2fd-4e77-b6ad-33e58d6bfdd0"
            alt="공지사항 배경"
            className="w-full h-full object-cover blur-[5px]"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-20 text-center space-y-3 px-4 animate-fadeIn pt-16">
          <span className="text-sky-400 text-xs sm:text-sm font-sans tracking-widest uppercase font-bold flex items-center justify-center gap-1.5">
            Samjal Notice Desk
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans text-white font-extrabold tracking-tight">
            알림마당 / 공지사항
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-[#0F2C59] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-sans text-slate-500">소식을 빠르고 정밀하게 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-xl max-w-lg mx-auto p-8 shadow-sm">
            <p className="text-sm font-sans text-red-600 font-bold mb-4">{error}</p>
            <button
              onClick={() => fetchNotices(false)}
              className="px-4 py-2 bg-[#0F2C59] rounded-lg text-xs font-sans text-white font-bold cursor-pointer transition-colors hover:bg-indigo-900"
            >
              다시 가져오기
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 bg-[#0F172A] text-slate-300 px-6 py-4 text-xs font-sans uppercase tracking-widest font-bold rounded-t-lg">
              <span className="col-span-1 text-center font-semibold">번호</span>
              <span className="col-span-7 pl-4 font-semibold">제목</span>
              <span className="col-span-2 text-center font-semibold">등록일</span>
              <span className="col-span-2 text-center font-semibold text-center">조회수</span>
            </div>
            <div className="divide-y divide-slate-100 border-b border-slate-200">
              {(notices || []).map((n, idx) => (
                <div
                  key={n.id}
                  onClick={() => handleNoticeClick(n.id)}
                  className="grid grid-cols-1 sm:grid-cols-12 px-6 py-5 sm:py-6 text-slate-700 hover:bg-slate-50 transition-colors duration-300 items-center cursor-pointer group"
                >
                  <span className="col-span-1 text-center hidden sm:block font-sans text-sm text-slate-400">
                    {idx + 1}
                  </span>
                  <div className="col-span-1 sm:col-span-7 pl-0 sm:pl-4 space-y-1.5 flex flex-col items-start">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                      <h3 className="text-sm sm:text-base font-sans font-bold text-slate-800 group-hover:text-[#0F2C59] transition-all text-left">
                        {n.title}
                      </h3>
                      {n.isPinned && (
                        <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold rounded">
                          공지
                        </span>
                      )}
                    </div>
                    <div className="flex sm:hidden items-center gap-3 text-[11px] text-slate-400 font-sans">
                      <span>{n.date}</span>
                      <span>&bull;</span>
                      <span>조회수 {n.views}</span>
                    </div>
                  </div>
                  <span className="col-span-2 text-center hidden sm:block font-sans text-xs text-slate-400">
                    {n.date}
                  </span>
                  <span className="col-span-2 text-center hidden sm:block font-sans text-xs text-slate-400 group-hover:text-slate-900">
                    {n.views}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border border-slate-200 max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden animate-scaleUp">
              <div className="bg-[#0F172A] text-slate-100 px-6 py-5 flex justify-between items-center border-b border-slate-800">
                <span className="text-xs sm:text-sm tracking-wider font-sans text-slate-300">삼잘 메디컬 소식 공고</span>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="p-1 rounded-full text-slate-400 hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-3 pb-4 border-b border-slate-200">
                  <h3 className="text-xl sm:text-2xl font-sans text-[#0F172A] font-bold text-left leading-relaxed">
                    {selectedNotice.title}
                  </h3>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-sans">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      등록일: {selectedNotice.date}
                    </span>
                    <span className="flex items-center gap-1 font-sans">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      조회수: {selectedNotice.views}
                    </span>
                  </div>
                </div>
                <div className="text-slate-700 font-sans text-sm sm:text-base leading-relaxed text-left whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-2">
                  {selectedNotice.content}
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="px-6 py-2 bg-[#0F172A] text-white hover:bg-[#0F2C59] text-xs font-sans tracking-wider rounded-lg transition-colors duration-300 cursor-pointer"
                >
                  소식 닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
