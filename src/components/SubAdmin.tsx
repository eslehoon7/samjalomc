import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { 
  Trash2, Megaphone, CheckCircle, Image, Send, Check,
  Activity, ChevronDown, ChevronUp, User, Sparkles, Pencil, X, Plus, Upload, LayoutGrid
} from "lucide-react";
import { Notice, DiagnoseItem } from "../types";
import { db, storage } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export default function SubAdmin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");

  const labelSaveTimeoutRef = useRef<Record<string, any>>({});

  const [activeSubTab, setActiveSubTab] = useState<"notices" | "photos" | "diagnoses" | "profiles" | "subject_images" | "intro_images">("notices");
  
  // Intro Images State
  const [introImagesMap, setIntroImagesMap] = useState<Record<string, string>>({
    philosophy_main: "/images/clinic_interior_modern_1780495390125.png",
    suseung_hwagang: "/images/clinic_interior_modern_1780495390125.png",
    wisubae_annyeong: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EC%9C%84%EC%88%98%EB%B0%B0%EC%95%88%EB%85%95.png?alt=media&token=446f64d8-09f6-4b0c-a6f3-5e98feb70702",
    wisubae_essential: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EC%97%90%EC%84%BC%EC%85%9C%20%EC%B2%98%EB%B0%A93_%EC%A2%85%ED%95%A9%EB%AA%A8%EC%9D%8C.png?alt=media&token=15c1de98-5013-4773-9519-927c5dbd9013",
    daegwanjeol_donggichim: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EB%8C%80%EA%B4%80%EC%A0%88%20%EB%8F%99%EA%B8%B0%EC%B9%A8%EB%B2%95.jpg?alt=media&token=5c1a4aa2-b614-49e8-b4e0-034a1d115b97",
  });
  const [introUploadingId, setIntroUploadingId] = useState<string | null>(null);
  const [introErrorMap, setIntroErrorMap] = useState<Record<string, string>>({});

  // Profiles State
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({
    kim_yujung: "/images/researcher_portrait_1780500341416.png",
    jeon_junyoung: "/images/samjal_crew_professional_1780495405627.png",
    je_jengjin: "/images/samjal_crew_professional_1780495405627.png",
    je_hyunyoung: "/images/samjal_characters_expert_1780495449389.jpg"
  });
  const [profileUploadingId, setProfileUploadingId] = useState<string | null>(null);
  const [profileErrorMap, setProfileErrorMap] = useState<Record<string, string>>({});

  interface ProfileInfo {
    id: string;
    name: string;
    role: string;
    desc: string;
    tag: string;
  }

  const DEFAULT_PROFILES: Record<string, ProfileInfo> = {
    kim_yujung: {
      id: "kim_yujung",
      name: "김유정 박사",
      role: "삼잘에센셜 처방 천연물 제형 과학 자문위원",
      desc: "약재 성분 추출 최적화와 제형 연구를 통해 처방의 생체 이용률을 높이는 천연물 과학 전문가",
      tag: "의뢰 파트너"
    },
    jeon_junyoung: {
      id: "jeon_junyoung",
      name: "전준영 원장",
      role: "한방재활의학과 전문의",
      desc: "경희대병원 출신의 한방재활의학 전문의로서 세심한 진료와 재활의학적 지식을 바탕으로 자생력 향상에 기여합니다.",
      tag: "노원점 대표"
    },
    je_jengjin: {
      id: "je_jengjin",
      name: "제정진 원장",
      role: "구리본점 대표원장",
      desc: "패럴림픽 국가대표팀 주치의 역임. 30년 임상 경력을 기반으로 대관절 심부안정화 침법을 정밀 시술합니다.",
      tag: "구리점 대표"
    },
    je_hyunyoung: {
      id: "je_hyunyoung",
      name: "제현영 원장",
      role: "구리본점 진료원장",
      desc: "침구의학 전문 자문과 꼼꼼한 약침 치료를 시행하여 환자의 빠른 쾌유와 신체 밸런스를 되찾아 드립니다.",
      tag: "구리점 원장"
    }
  };

  const [profilesInfoMap, setProfilesInfoMap] = useState<Record<string, ProfileInfo>>(DEFAULT_PROFILES);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editProfileName, setEditProfileName] = useState<string>("");
  const [editProfileRole, setEditProfileRole] = useState<string>("");
  const [editProfileDesc, setEditProfileDesc] = useState<string>("");
  const [editProfileTag, setEditProfileTag] = useState<string>("");

  // Subject Images State
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
    ],
    paralysis: [
      "/images/samjal_crew_professional_1780495405627.png",
      "/images/professional_clean_acupuncture_1780497559621.png",
      "/images/clinic_interior_1779805270752.png",
      "/images/hygienic_premium_hanbang_herbal_1780497683155.png"
    ]
  };
  const defaultSubjectLabels: Record<string, string[]> = {
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
    ],
    paralysis: [
      "안면마비",
      "정밀 약침치료",
      "쾌적한 힐링환경",
      "신경 활성 체질한약"
    ]
  };
  const [subjectImagesMap, setSubjectImagesMap] = useState<Record<string, string[]>>(defaultSubjectImages);
  const [subjectLabelsMap, setSubjectLabelsMap] = useState<Record<string, string[]>>(defaultSubjectLabels);
  const [subjectUploadingId, setSubjectUploadingId] = useState<string | null>(null);
  const [subjectErrorMap, setSubjectErrorMap] = useState<Record<string, string>>({});

  // iframe 및 가상 브라우저 차단 우회를 위한 토스트 상태 선언
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastMsg(msg);
    setToastType(type);
  };

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => {
        setToastMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const loadSubjectImages = async () => {
    try {
      const snap = await getDocs(collection(db, "subject_images"));
      const updatedMap = { ...defaultSubjectImages };
      const updatedLabelsMap = { ...defaultSubjectLabels };
      snap.forEach(d => {
        const data = d.data();
        if (d.id !== "config" && d.id) {
          if (data.images && Array.isArray(data.images)) {
            updatedMap[d.id] = data.images;
          }
          if (data.labels && Array.isArray(data.labels)) {
            updatedLabelsMap[d.id] = data.labels;
          }
        }
      });

      // Filter out deleted detox images (remove 01 and 04 roll files if 4 are loaded)
      if (updatedMap["detox"]) {
        let finalImages = [...updatedMap["detox"]];
        let finalLabels = [...(updatedLabelsMap["detox"] || [])];
        if (finalImages.length === 4) {
          finalImages = [finalImages[1], finalImages[2]];
          finalLabels = [finalLabels[1], finalLabels[2]];
          
          // Clean the firestore database so they are permanently removed
          try {
            setDoc(doc(db, "subject_images", "detox"), {
              id: "detox",
              images: finalImages,
              labels: finalLabels,
              updatedAt: new Date().toISOString()
            });
          } catch (dbErr) {
            console.warn("detox DB 복원 저장 실패:", dbErr);
          }
        } else if (finalImages.length > 2) {
          finalImages = finalImages.slice(0, 2);
          finalLabels = finalLabels.slice(0, 2);
        }
        
        updatedMap["detox"] = finalImages;
        updatedLabelsMap["detox"] = finalLabels;
      }

      setSubjectImagesMap(updatedMap);
      setSubjectLabelsMap(updatedLabelsMap);
    } catch (err) {
      console.warn("진료과목 이미지 및 명칭 로드 실패:", err);
    }
  };

  const handleSubjectLabelChange = (subjectId: string, imgIdx: number, newLabel: string) => {
    const dbIdx = imgIdx;
    const currentLabels = [...(subjectLabelsMap[subjectId] || defaultSubjectLabels[subjectId])];
    currentLabels[dbIdx] = newLabel;
    setSubjectLabelsMap(prev => ({
      ...prev,
      [subjectId]: currentLabels
    }));

    if (labelSaveTimeoutRef.current[subjectId]) {
      clearTimeout(labelSaveTimeoutRef.current[subjectId]);
    }

    labelSaveTimeoutRef.current[subjectId] = setTimeout(async () => {
      try {
        await setDoc(doc(db, "subject_images", subjectId), {
          id: subjectId,
          labels: currentLabels,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`Autosaved image label for ${subjectId} at index ${dbIdx}`);
      } catch (err) {
        console.error("Autosave failed:", err);
      }
    }, 450);
  };

  const handleSubjectPhotoChange = async (subjectId: string, imgIdx: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dbIdx = imgIdx;
    const uploadKey = `${subjectId}_${imgIdx}`;
    if (file.size > 10 * 1024 * 1024) {
      setSubjectErrorMap(prev => ({ ...prev, [uploadKey]: "이미지 크기는 최대 10MB까지 가능합니다." }));
      return;
    }

    setSubjectUploadingId(uploadKey);
    setSubjectErrorMap(prev => ({ ...prev, [uploadKey]: "" }));

    try {
      // 800px에 퀄리티 0.70으로 실시간 강력 압축하여 전송량을 4배 이상 경량화 (Firestore 1MB 한계 극복 및 초고속 업로드 보장)
      const compressedBase64 = await compressImageFile(file, 800, 800, 0.70);
      let imageUrl = "";
      let storagePath = "";

      try {
        const uploadResp = await fetchWithTimeout("/api/photos/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: compressedBase64,
            fileName: `subject_${uploadKey}_${file.name}`
          }),
          timeout: 8000
        });

        if (uploadResp.ok) {
          const uploadResult = await uploadResp.json();
          imageUrl = uploadResult.imageUrl;
          storagePath = uploadResult.storagePath;
        } else {
          throw new Error("Server upload route failure");
        }
      } catch (srvErr) {
        console.warn("서버 진료과목 업로드 실패, 브라우저 직접 업로드 폴백:", srvErr);
        try {
          const fileName = `subject_${uploadKey}_${Date.now()}_${file.name}`;
          const storageRef = ref(storage, `site-images/subjects/${fileName}`);
          const compressedBlob = base64ToBlob(compressedBase64);
          imageUrl = await clientUploadWithTimeout(storageRef, compressedBlob, 4500);
          storagePath = `site-images/subjects/${fileName}`;
        } catch (clientErr) {
          console.warn("직접 업로드 불가, Base64 직접 기입 폴백:", clientErr);
          imageUrl = compressedBase64;
          storagePath = "inline-fallback-base64";
        }
      }

      const currentImages = [...(subjectImagesMap[subjectId] || defaultSubjectImages[subjectId])];
      currentImages[dbIdx] = imageUrl;

      await setDoc(doc(db, "subject_images", subjectId), {
        id: subjectId,
        images: currentImages,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSubjectImagesMap(prev => ({
         ...prev,
         [subjectId]: currentImages
      }));
      showToast(`해당 치료법의 0${imgIdx + 1}번 사진이 성공적으로 업로드 및 반영되었습니다!`, "success");
    } catch (err: any) {
      console.error(err);
      setSubjectErrorMap(prev => ({ ...prev, [uploadKey]: `업로드 오류: ${err.message || err}` }));
    } finally {
      setSubjectUploadingId(null);
    }
  };

  const loadIntroImages = async () => {
    try {
      const snap = await getDocs(collection(db, "intro_images"));
      const updatedMap = {
        philosophy_main: "/images/clinic_interior_modern_1780495390125.png",
        suseung_hwagang: "/images/clinic_interior_modern_1780495390125.png",
        wisubae_annyeong: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EC%9C%84%EC%88%98%EB%B0%B0%EC%95%88%EB%85%95.png?alt=media&token=446f64d8-09f6-4b0c-a6f3-5e98feb70702",
        wisubae_essential: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EC%97%90%EC%84%BC%EC%85%9C%20%EC%B2%98%EB%B0%A93_%EC%A2%85%ED%95%A9%EB%AA%A8%EC%9D%8C.png?alt=media&token=15c1de98-5013-4773-9519-927c5dbd9013",
        daegwanjeol_donggichim: "https://firebasestorage.googleapis.com/v0/b/onbrandium.firebasestorage.app/o/samjal-images%2F%EB%8C%80%EA%B4%80%EC%A0%88%20%EB%8F%99%EA%B8%B0%EC%B9%A8%EB%B2%95.jpg?alt=media&token=5c1a4aa2-b614-49e8-b4e0-034a1d115b97",
      };
      snap.forEach(d => {
        const val = d.data();
        if (d.id && val.image) {
          let imgUrl = val.image;
          if (d.id === "daegwanjeol_donggichim") {
            if (imgUrl.includes("samjal-oriental-clinic.firebasestorage.app") || imgUrl.includes("%EB%8C%80%EA%B4%80%EC%A0%88") || imgUrl.includes("%EB%8F%99%EB%B8%B0")) {
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
          updatedMap[d.id as keyof typeof updatedMap] = imgUrl;
        }
      });
      setIntroImagesMap(updatedMap);
    } catch (err) {
      console.warn("원내 소개/치료 이미지 로드 실패:", err);
    }
  };

  const handleIntroPhotoChange = async (introId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setIntroErrorMap(prev => ({ ...prev, [introId]: "이미지 크기는 최대 10MB까지 가능합니다." }));
      return;
    }

    setIntroUploadingId(introId);
    setIntroErrorMap(prev => ({ ...prev, [introId]: "" }));

    try {
      // Compress the image to safe dimension before upload
      const compressedBase64 = await compressImageFile(file, 1000, 1000, 0.70);
      let imageUrl = "";
      let storagePath = "";

      try {
        const uploadResp = await fetchWithTimeout("/api/photos/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: compressedBase64,
            fileName: `intro_${introId}_${file.name}`
          }),
          timeout: 8000
        });

        if (uploadResp.ok) {
          const uploadResult = await uploadResp.json();
          imageUrl = uploadResult.imageUrl;
          storagePath = uploadResult.storagePath;
        } else {
          throw new Error("Server upload failure");
        }
      } catch (srvErr) {
        console.warn("서버 업로드 업로더 불가, 브라우저 직접 전송 폴백:", srvErr);
        try {
          const fileName = `intro_${introId}_${Date.now()}_${file.name}`;
          const storageRef = ref(storage, `site-images/intro/${fileName}`);
          const compressedBlob = base64ToBlob(compressedBase64);
          imageUrl = await clientUploadWithTimeout(storageRef, compressedBlob, 4500);
          storagePath = `site-images/intro/${fileName}`;
        } catch (clientErr) {
          console.warn("직접 업로드 불가, Base64 직접 기입 폴백:", clientErr);
          imageUrl = compressedBase64;
          storagePath = "inline-fallback-base64";
        }
      }

      await setDoc(doc(db, "intro_images", introId), {
        id: introId,
        image: imageUrl,
        storagePath: storagePath,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setIntroImagesMap(prev => ({ ...prev, [introId]: imageUrl }));
      showToast("소개 및 고유치료 이미지가 안전하고 완벽하게 반영되었습니다!", "success");
    } catch (err: any) {
      console.error(err);
      setIntroErrorMap(prev => ({ ...prev, [introId]: `업로드 중 에러 발생: ${err.message || err}` }));
    } finally {
      setIntroUploadingId(null);
    }
  };

  const loadProfiles = async () => {
    try {
      const snap = await getDocs(collection(db, "profile_images"));
      const updatedMap = {
        kim_yujung: "/images/researcher_portrait_1780500341416.png",
        jeon_junyoung: "/images/samjal_crew_professional_1780495405627.png",
        je_jengjin: "/images/samjal_crew_professional_1780495405627.png",
        je_hyunyoung: "/images/samjal_characters_expert_1780495449389.jpg"
      };
      const updatedInfoMap = { ...DEFAULT_PROFILES };

      snap.forEach(d => {
        const val = d.data();
        if (d.id) {
          if (val.image) {
            updatedMap[d.id as keyof typeof updatedMap] = val.image;
          }
          let descVal = val.desc || val.detail || "";
          // If Firestore descVal is completely empty but we have design default, fall back to default
          updatedInfoMap[d.id] = {
            id: d.id,
            name: val.name || DEFAULT_PROFILES[d.id]?.name || "",
            role: val.role || DEFAULT_PROFILES[d.id]?.role || "",
            desc: descVal || DEFAULT_PROFILES[d.id]?.desc || "",
            tag: val.tag || DEFAULT_PROFILES[d.id]?.tag || ""
          };
        }
      });
      setProfilesMap(updatedMap);
      setProfilesInfoMap(updatedInfoMap);
    } catch (err) {
      console.warn("의료진 프로필 로드 실패:", err);
    }
  };

  const handleStartEditProfile = (profileId: string) => {
    const info = profilesInfoMap[profileId] || DEFAULT_PROFILES[profileId];
    setEditingProfileId(profileId);
    setEditProfileName(info.name);
    setEditProfileRole(info.role);
    setEditProfileDesc(info.desc);
    setEditProfileTag(info.tag);
  };

  const handleSaveProfileInfo = async (profileId: string) => {
    try {
      setProfileUploadingId(profileId);
      setProfileErrorMap(prev => ({ ...prev, [profileId]: "" }));

      // Document save in Firestore
      await setDoc(doc(db, "profile_images", profileId), {
        id: profileId,
        name: editProfileName,
        role: editProfileRole,
        desc: editProfileDesc,
        tag: editProfileTag,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Synchronize in local states
      setProfilesInfoMap(prev => ({
        ...prev,
        [profileId]: {
          id: profileId,
          name: editProfileName,
          role: editProfileRole,
          desc: editProfileDesc,
          tag: editProfileTag
        }
      }));

      showToast("의료진의 정보가 성공적으로 반영되었습니다.", "success");
      setEditingProfileId(null);
    } catch (err: any) {
      console.error("Profile info save error:", err);
      setProfileErrorMap(prev => ({ ...prev, [profileId]: `저장 중 에러 발생: ${err.message || err}` }));
    } finally {
      setProfileUploadingId(null);
    }
  };

  const handleProfilePhotoChange = async (profileId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setProfileErrorMap(prev => ({ ...prev, [profileId]: "이미지 크기는 최대 10MB까지 가능합니다." }));
      return;
    }

    setProfileUploadingId(profileId);
    setProfileErrorMap(prev => ({ ...prev, [profileId]: "" }));

    try {
      // 800px에 퀄리티 0.70으로 압축률을 획기적으로 향상시켜 네트워크 병목 및 지연을 근본 차단합니다
      const compressedBase64 = await compressImageFile(file, 800, 800, 0.70);
      let imageUrl = "";
      let storagePath = "";

      try {
        const uploadResp = await fetchWithTimeout("/api/photos/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: compressedBase64,
            fileName: `${profileId}_${file.name}`
          }),
          timeout: 8000
        });

        if (uploadResp.ok) {
          const uploadResult = await uploadResp.json();
          imageUrl = uploadResult.imageUrl;
          storagePath = uploadResult.storagePath;
        } else {
          throw new Error("Server upload route failure");
        }
      } catch (srvErr) {
        console.warn("서버 프로필 업로드 실패, 브라우저 직접 업로드 폴백:", srvErr);
        try {
          const fileName = `profile_${profileId}_${Date.now()}_${file.name}`;
          const storageRef = ref(storage, `site-images/profiles/${fileName}`);
          const compressedBlob = base64ToBlob(compressedBase64);
          imageUrl = await clientUploadWithTimeout(storageRef, compressedBlob, 4500);
          storagePath = `site-images/profiles/${fileName}`;
        } catch (clientErr) {
          console.warn("직접 업로드 불가, Base64 직접 기입 폴백:", clientErr);
          imageUrl = compressedBase64;
          storagePath = "inline-fallback-base64";
        }
      }

      await setDoc(doc(db, "profile_images", profileId), {
        id: profileId,
        image: imageUrl,
        storagePath: storagePath,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setProfilesMap(prev => ({ ...prev, [profileId]: imageUrl }));
      showToast("의료진 프로필 사진이 안심하고 안전하게 업데이트되었습니다!", "success");
    } catch (err: any) {
      console.error(err);
      setProfileErrorMap(prev => ({ ...prev, [profileId]: `업로드 오류: ${err.message || err}` }));
    } finally {
      setProfileUploadingId(null);
    }
  };

  const handleDeleteProfilePhoto = async (profileId: string) => {
    if (!window.confirm("정말 이 프로필 사진을 삭제하시겠습니까? 기본 사진으로 리셋됩니다.")) return;
    try {
      setProfileUploadingId(profileId);
      setProfileErrorMap(prev => ({ ...prev, [profileId]: "" }));
      
      const defaultVal = {
        kim_yujung: "/images/researcher_portrait_1780500341416.png",
        jeon_junyoung: "/images/samjal_crew_professional_1780495405627.png",
        je_jengjin: "/images/samjal_crew_professional_1780495405627.png",
        je_hyunyoung: "/images/samjal_characters_expert_1780495449389.jpg"
      }[profileId] || "";

      await setDoc(doc(db, "profile_images", profileId), {
        id: profileId,
        image: defaultVal,
        storagePath: "",
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setProfilesMap(prev => ({ ...prev, [profileId]: defaultVal }));
      showToast("프로필 사진이 기본값으로 리셋되었습니다.", "success");
    } catch (err: any) {
      console.error("Delete profile photo error:", err);
      setProfileErrorMap(prev => ({ ...prev, [profileId]: `삭제 오류: ${err.message || err}` }));
    } finally {
      setProfileUploadingId(null);
    }
  };
  
  // States
  const [notices, setNotices] = useState<Notice[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnoseItem[]>([]);
  
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [expandedDiag, setExpandedDiag] = useState<Record<string, boolean>>({});
  
  // Notices Form
  const [newNotice, setNewNotice] = useState({ title: "", content: "", isPinned: false });
  const [noticeMessage, setNoticeMessage] = useState("");
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  // Activities States
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [activityEditTitle, setActivityEditTitle] = useState("");
  const [activityEditSubtitle, setActivityEditSubtitle] = useState("");
  const [activityEditDesc, setActivityEditDesc] = useState("");
  const [activityEditYear, setActivityEditYear] = useState("");
  const [activityEditOrder, setActivityEditOrder] = useState(1);

  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivitySubtitle, setNewActivitySubtitle] = useState("");
  const [newActivityDesc, setNewActivityDesc] = useState("");
  const [newActivityYear, setNewActivityYear] = useState("");
  const [newActivityOrder, setNewActivityOrder] = useState(1);
  const [newActivityFile, setNewActivityFile] = useState<File | null>(null);
  const [newActivityPreview, setNewActivityPreview] = useState("");
  const [activityAddError, setActivityAddError] = useState("");
  const [activityUploading, setActivityUploading] = useState(false);

  // Photos Edit Form
  const [photoToDelete, setPhotoToDelete] = useState<{ id: string; storagePath: string } | null>(null);
  const [noticeToDelete, setNoticeToDelete] = useState<number | null>(null);
  const [diagnosisToDelete, setDiagnosisToDelete] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<any | null>(null);
  const [photoEditTitle, setPhotoEditTitle] = useState("");
  const [photoEditDesc, setPhotoEditDesc] = useState("");
  const [photoEditBranch, setPhotoEditBranch] = useState("both");
  const [photoEditTagLabel, setPhotoEditTagLabel] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState("");

  // Photos Add Form — Firebase Storage 기반으로 변경
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [newPhotoTitle, setNewPhotoTitle] = useState("");
  const [newPhotoDesc, setNewPhotoDesc] = useState("");
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);       // ← File 객체로 변경
  const [newPhotoPreview, setNewPhotoPreview] = useState("");                // ← 미리보기용 별도 state
  const [newPhotoTagLabel, setNewPhotoTagLabel] = useState("원내 인증 전경");
  const [newPhotoBranch, setNewPhotoBranch] = useState("both");
  const [photoAddError, setPhotoAddError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);              // ← 업로드 중 상태 추가

  // 자가진단 기록 수동 추가 States
  const [isAddingDiagnose, setIsAddingDiagnose] = useState(false);
  const [addDiagAge, setAddDiagAge] = useState("40대");
  const [addDiagGender, setAddDiagGender] = useState("여성");
  const [addDiagSleep, setAddDiagSleep] = useState("자다가 자주 깸");
  const [addDiagEat, setAddDiagEat] = useState("가스가 차고 소화가 느림");
  const [addDiagPoop, setAddDiagPoop] = useState("시원치 못하고 잔변감 있음");
  const [addDiagSymptoms, setAddDiagSymptoms] = useState("피로 누적으로 어깨가 뻐근하고 머리가 무거우며 숙면이 어렵습니다.");
  const [addDiagDoctorNotes, setAddDiagDoctorNotes] = useState("");
  const [addDiagError, setAddDiagError] = useState("");
  const [addDiagLoading, setAddDiagLoading] = useState(false);

  // 자가진단 기록 개별 수정 States
  const [editingDiag, setEditingDiag] = useState<DiagnoseItem | null>(null);
  const [editDiagAge, setEditDiagAge] = useState("");
  const [editDiagGender, setEditDiagGender] = useState("");
  const [editDiagSleep, setEditDiagSleep] = useState("");
  const [editDiagEat, setEditDiagEat] = useState("");
  const [editDiagPoop, setEditDiagPoop] = useState("");
  const [editDiagSymptoms, setEditDiagSymptoms] = useState("");
  const [editDiagAnalysis, setEditDiagAnalysis] = useState("");
  const [editDiagDoctorNotes, setEditDiagDoctorNotes] = useState("");
  const [editDiagLoading, setEditDiagLoading] = useState(false);
  const [editDiagError, setEditDiagError] = useState("");

  // Doctor Notes State
  const [tempNotes, setTempNotes] = useState<Record<string, string>>({});
  const [saveNotesStatus, setSaveNotesStatus] = useState<Record<string, string>>({});

  const handleSaveNotes = async (id: string, notes: string) => {
    try {
      setSaveNotesStatus(prev => ({ ...prev, [id]: "저장 중..." }));
      
      try {
        // Try direct update by ID first (super fast)
        await updateDoc(doc(db, "diagnoses", id), { doctorNotes: notes }).catch(async () => {
          // Fallback if document ID is auto-generated (slow path for legacy data)
          const snapshot = await getDocs(collection(db, "diagnoses"));
          const targetDoc = snapshot.docs.find(d => d.id === id || String(d.data().id) === id);
          if (targetDoc && targetDoc.id !== id) {
            await updateDoc(doc(db, "diagnoses", targetDoc.id), { doctorNotes: notes });
          }
        });
      } catch (fErr) {
        console.warn("Firestore update issue, continuing via Express API:", fErr);
      }

      const response = await fetch(`/api/diagnoses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorNotes: notes })
      });
      if (response.ok) {
        setDiagnoses(prev => prev.map(item => item.id === id ? { ...item, doctorNotes: notes } : item));
        setSaveNotesStatus(prev => ({ ...prev, [id]: "소견이 성공적으로 귀속되었습니다!" }));
        setTimeout(() => {
          setSaveNotesStatus(prev => ({ ...prev, [id]: "" }));
        }, 3000);
      } else {
        setSaveNotesStatus(prev => ({ ...prev, [id]: "저장 실패" }));
      }
    } catch (err) {
      console.error(err);
      setSaveNotesStatus(prev => ({ ...prev, [id]: "오류 발생" }));
    }
  };

  // ──────────────────────────────────────────────
  // 사진 목록 Firestore에서 불러오기
  // ──────────────────────────────────────────────
  const loadPhotos = async () => {
    try {
      const snap = await getDocs(collection(db, "galleryPhotos"));
      const list = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      // 최신순 정렬
      list.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setPhotos(list);
    } catch (err) {
      console.error("갤러리 사진 로드 실패:", err);
    }
  };

  // ──────────────────────────────────────────────
  // 대외활동 목록 Firestore에서 불러오기
  // ──────────────────────────────────────────────
  const loadActivities = async () => {
    try {
      const snap = await getDocs(collection(db, "activities"));
      const list = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.order ?? 0) - (a.order ?? 0));
      setActivities(list);
    } catch (err) {
      console.warn("대외활동 로드 실패 (Firestore):", err);
    }
  };

  // Load Data
  const loadAllData = async () => {
    setNoticeLoading(true);
    setDiagLoading(true);
    try {
      const fsNoticesPromise = getDocs(collection(db, "notices")).catch(fErr => {
        console.warn("Firestore notices fetch failed:", fErr);
        return null;
      });
      const expressNoticesPromise = fetch("/api/notices").then(r => r.ok ? r.json() : []).catch(err => {
        console.warn("Express API notices fetch failed:", err);
        return [];
      });
      const fsDiagsPromise = getDocs(collection(db, "diagnoses")).catch(fErr => {
        console.warn("Firestore diagnoses fetch failed:", fErr);
        return null;
      });
      const expressDiagsPromise = fetch("/api/diagnoses").then(r => r.ok ? r.json() : []).catch(err => {
        console.warn("Express API diagnoses fetch failed:", err);
        return [];
      });
      const fsPhotosPromise = getDocs(collection(db, "galleryPhotos")).catch(fErr => {
        console.warn("Firestore gallery photos fetch failed:", fErr);
        return null;
      });

      const [fsNoticesSnap, apiNotices, fsDiagsSnap, apiDiags, fsPhotosSnap] = await Promise.all([
        fsNoticesPromise,
        expressNoticesPromise,
        fsDiagsPromise,
        expressDiagsPromise,
        fsPhotosPromise
      ]);

      // Notices
      let noticesList: Notice[] = [];
      if (fsNoticesSnap) {
        noticesList = fsNoticesSnap.docs.map((d) => {
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

      // Photos
      if (fsPhotosSnap) {
        const list = fsPhotosSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
        list.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setPhotos(list);
      } else {
        await loadPhotos();
      }

      // Activities
      await loadActivities();

      // Diagnoses
      let diagList: DiagnoseItem[] = [];
      if (fsDiagsSnap) {
        diagList = fsDiagsSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            age: data.age || "",
            gender: data.gender || "",
            sleep: data.sleep || "",
            eat: data.eat || "",
            poop: data.poop || "",
            symptoms: data.symptoms || "",
            createdAt: data.createdAt || "",
            analysis: data.analysis || "",
            doctorNotes: data.doctorNotes || "",
          };
        });
      }
      if (apiDiags && Array.isArray(apiDiags)) {
        apiDiags.forEach((ad: DiagnoseItem) => {
          const exists = diagList.some(d => String(d.id) === String(ad.id));
          if (!exists) {
            diagList.push({
              id: String(ad.id),
              age: ad.age || "",
              gender: ad.gender || "",
              sleep: ad.sleep || "",
              eat: ad.eat || "",
              poop: ad.poop || "",
              symptoms: ad.symptoms || "",
              createdAt: ad.createdAt || "",
              analysis: ad.analysis || "",
              doctorNotes: ad.doctorNotes || ""
            });
          }
        });
      }
      diagList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDiagnoses(diagList);

      // Profiles
      await loadProfiles();
      // Subject Images
      await loadSubjectImages();
      // Intro/Treatment Images
      await loadIntroImages();
    } catch (e) {
      console.error(e);
    } finally {
      setNoticeLoading(false);
      setDiagLoading(false);
    }
  };

  useEffect(() => {
    const logged = sessionStorage.getItem("samjal_admin_logged_in");
    if (logged === "true") {
      setIsLoggedIn(true);
      loadAllData();
    }
    return () => {
      sessionStorage.removeItem("samjal_admin_logged_in");
    };
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (loginId === "admin" && loginPw === "samjal") {
      setIsLoggedIn(true);
      sessionStorage.setItem("samjal_admin_logged_in", "true");
      setLoginError("");
      loadAllData();
    } else {
      setLoginError("아이디 또는 비밀번호가 삼잘 행정계정과 일치하지 않습니다.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("samjal_admin_logged_in");
    setLoginId("");
    setLoginPw("");
  };

  // Add Notice
  const handleAddNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.content) {
      alert("제목과 내용을 입력해 주십시오.");
      return;
    }
    setNoticeLoading(true);
    try {
      const resp = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotice)
      });
      if (resp.ok) {
        const added = await resp.json();
        try {
          await setDoc(doc(db, "notices", String(added.notice.id)), {
            id: String(added.notice.id),
            title: added.notice.title,
            content: added.notice.content,
            date: added.notice.date,
            isPinned: !!added.notice.isPinned,
            views: added.notice.views
          });
        } catch (fErr) {
          console.warn("Firestore notice write failed:", fErr);
        }
        setNotices(prev => [added.notice, ...prev]);
        setNewNotice({ title: "", content: "", isPinned: false });
        setNoticeMessage("공지 전달문이 정상적으로 원내 전산망에 등록되었습니다.");
        setTimeout(() => setNoticeMessage(""), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setNoticeLoading(false);
    }
  };

  const handleStartEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setNewNotice({ title: notice.title, content: notice.content, isPinned: !!notice.isPinned });
  };

  const handleUpdateNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;
    if (!newNotice.title || !newNotice.content) {
      alert("제목과 내용을 입력해 주십시오.");
      return;
    }
    setNoticeLoading(true);
    try {
      try {
        // Try direct update by ID first (fast path)
        await updateDoc(doc(db, "notices", String(editingNotice.id)), {
          title: newNotice.title,
          content: newNotice.content,
          isPinned: !!newNotice.isPinned
        }).catch(async () => {
          // Fallback if document ID is legacy random key (slow path)
          const snapshot = await getDocs(collection(db, "notices"));
          const targetDoc = snapshot.docs.find(d => String(d.id) === String(editingNotice.id) || String(d.data().id) === String(editingNotice.id));
          if (targetDoc && targetDoc.id !== String(editingNotice.id)) {
            await updateDoc(doc(db, "notices", targetDoc.id), {
              title: newNotice.title,
              content: newNotice.content,
              isPinned: !!newNotice.isPinned
            });
          }
        });
      } catch (fErr) {
        console.warn("Firestore notice update failed:", fErr);
      }
      const resp = await fetch(`/api/notices/${editingNotice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotice)
      });
      if (resp.ok) {
        const updated = await resp.json();
        setNotices(prev => prev.map(n => Number(n.id) === Number(editingNotice.id) ? updated.notice : n));
        setEditingNotice(null);
        setNewNotice({ title: "", content: "", isPinned: false });
        setNoticeMessage("공지 전달문이 성공적으로 수정 완료되었습니다.");
        setTimeout(() => setNoticeMessage(""), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setNoticeLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNotice(null);
    setNewNotice({ title: "", content: "", isPinned: false });
  };

  const handleDeleteNotice = (id: number) => {
    setNoticeToDelete(id);
  };

  const executeDeleteNotice = async (id: number) => {
    try {
      try {
        // Try direct delete by ID first (fast path)
        await deleteDoc(doc(db, "notices", String(id))).catch(async () => {
          // Fallback if document ID is legacy random key (slow path)
          const snapshot = await getDocs(collection(db, "notices"));
          const targetDoc = snapshot.docs.find(d => String(d.id) === String(id) || String(d.data().id) === String(id));
          if (targetDoc && targetDoc.id !== String(id)) {
            await deleteDoc(doc(db, "notices", targetDoc.id));
          }
        });
      } catch (fErr) {
        console.warn("Firestore notice delete failed:", fErr);
      }
      const resp = await fetch(`/api/notices/${id}`, { method: "DELETE" });
      if (resp.ok) {
        setNotices(prev => prev.filter(n => Number(n.id) !== id));
        setToastMsg("공지사항 게시글이 정상적으로 영구 삭제되었습니다.");
        setToastType("success");
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (e) {
      console.error(e);
      setToastMsg("공지사항 삭제에 실패했습니다.");
      setToastType("error");
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  // ──────────────────────────────────────────────
  // 사진 관련 — Firebase Storage + Firestore 기반
  // ──────────────────────────────────────────────

  // 파일 선택 시 File 객체 저장 + 미리보기 생성
  const handleNewPhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setPhotoAddError("이미지 크기는 최대 10MB까지 업로드 가능합니다.");
        return;
      }
      setPhotoAddError("");
      setNewPhotoFile(file);
      // 미리보기용 URL 생성
      const previewUrl = URL.createObjectURL(file);
      setNewPhotoPreview(previewUrl);
    }
  };

  // 타임아웃(기본 8초) 기능이 탑재된 fetch 헬퍼 (무한 로딩 및 행 정지 방지 장치)
  const fetchWithTimeout = async (resource: string, options: RequestInit & { timeout?: number }) => {
    const { timeout = 8000, ...rest } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resource, {
        ...rest,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  // 클라이언트 이미지 파일 압축 (최대 1000px 해상도, 고압축 JPEG 변환)
  const compressImageFile = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file); // 리스너 바인딩 이후 최종 트리거 실행
    });
  };

  // Base64 문자열을 바이너리 Blob으로 복구
  const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(";base64,");
    const contentType = parts[0].split(":")[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  // 클라이언트 업로드 타임아웃 헬퍼 (Direct Firebase Storage 업로드 차단/보류 현상 방지)
  const clientUploadWithTimeout = (storageRef: any, blob: Blob, timeoutMs = 4000): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      const id = setTimeout(() => {
        reject(new Error("Client Firebase Storage upload timed out"));
      }, timeoutMs);

      try {
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        clearTimeout(id);
        resolve(url);
      } catch (err) {
        clearTimeout(id);
        reject(err);
      }
    });
  };

  // 사진 추가 — Firebase Storage에 업로드 (서버 우선 시도 후 실패 시 클라이언트 폴백, 전체 불능 시 Base64 직접 탑재) 후 Firestore에 URL 저장
  const handleAddPhotoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPhotoFile) {
      setPhotoAddError("업로드할 원내 사진을 선택해 주십시오.");
      return;
    }
    if (!newPhotoTitle) {
      setPhotoAddError("제목을 채워주십시오.");
      return;
    }

    setPhotoUploading(true);
    setPhotoAddError("");

    try {
      // 1. 선택한 임시 파일을 1000px급 초경량 JPEG으로 실시간 압축
      const compressedBase64 = await compressImageFile(newPhotoFile, 1000, 1000, 0.8);
      
      let imageUrl = "";
      let storagePath = "";

      try {
        // 2. 서버 측 API를 활용해 Firebase Storage 업로드 우선 시도 (iframe 및 CORS 차단 우회, 타임아웃 적용)
        const uploadResp = await fetchWithTimeout("/api/photos/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: compressedBase64,
            fileName: newPhotoFile.name
          }),
          timeout: 8000 // 8초 타임아웃 제한
        });

        if (uploadResp.ok) {
          const uploadResult = await uploadResp.json();
          imageUrl = uploadResult.imageUrl;
          storagePath = uploadResult.storagePath;
        } else {
          throw new Error("Server storage upload route returned non-200 status");
        }
      } catch (srvErr) {
        console.warn("서버 파이프라인 업로드 실패, 브라우저 직접 업로드 폴백 진입:", srvErr);
        try {
          // 3. 브라우저 직접 Firebase Storage 업로드 시도 (폴백 장치, 타임아웃 4초 적용)
          const fileName = `${Date.now()}_${newPhotoFile.name}`;
          const storageRef = ref(storage, `site-images/gallery/${fileName}`);
          const compressedBlob = base64ToBlob(compressedBase64);
          imageUrl = await clientUploadWithTimeout(storageRef, compressedBlob, 4000);
          storagePath = `site-images/gallery/${fileName}`;
        } catch (clientErr) {
          console.warn("클라이언트 스토리지 업로드도 차단됨. 최종 수단인 인라인 Base64 기입으로 강제 전환합니다:", clientErr);
          // 4. 스토리지 업로드가 권한/네트워크 등으로 완전 차단되었을 때, 
          //    압축된 Base64 데이터를 그대로 Firestore 이미지 필드로 저장 (Firestore 1MB 한도 내로 완벽 호환!)
          imageUrl = compressedBase64;
          storagePath = "inline-fallback-base64";
        }
      }

      // 5. Firestore에 사진 정보 기입 (지점 정보 branch도 추가)
      const docRef = await addDoc(collection(db, "galleryPhotos"), {
        tag: "hospital-added",
        tagLabel: newPhotoTagLabel || "원내 인증 전경",
        title: newPhotoTitle,
        desc: newPhotoDesc,
        image: imageUrl,
        storagePath: storagePath,  // 삭제 시 사용
        branch: newPhotoBranch || "both",
        createdAt: new Date().toISOString(),
      });

      // 6. 로컬 state 업데이트
      const newItem = {
        firestoreId: docRef.id,
        tag: "hospital-added",
        tagLabel: newPhotoTagLabel || "원내 인증 전경",
        title: newPhotoTitle,
        desc: newPhotoDesc,
        image: imageUrl,
        storagePath: storagePath,
        branch: newPhotoBranch || "both",
        createdAt: new Date().toISOString(),
      };
      setPhotos(prev => [newItem, ...prev]);

      // 폼 초기화
      setNewPhotoTitle("");
      setNewPhotoDesc("");
      setNewPhotoFile(null);
      setNewPhotoPreview("");
      setNewPhotoTagLabel("원내 인증 전경");
      setPhotoAddError("");
      setIsAddPhotoOpen(false);
    } catch (err: any) {
      console.error("사진 업로드 실패:", err);
      setPhotoAddError(`사진 업로드 실패: ${err.message || err}`);
    } finally {
      setPhotoUploading(false);
    }
  };

  // 사진 삭제 — Storage + Firestore 동시 삭제
  const handleDeletePhoto = (firestoreId: string, storagePath: string) => {
    setPhotoToDelete({ id: firestoreId, storagePath });
  };

  const executeDeletePhoto = async (firestoreId: string, storagePath: string) => {
    try {
      // 1. Firestore 문서 삭제
      await deleteDoc(doc(db, "galleryPhotos", firestoreId));

      // 2. Storage 파일 삭제 (storagePath가 있는 경우)
      if (storagePath && storagePath !== "inline-fallback-base64") {
        try {
          const fileRef = ref(storage, storagePath);
          await deleteObject(fileRef);
        } catch (storageErr) {
          console.warn("Storage 파일 삭제 실패 (무시):", storageErr);
        }
      }

      // 3. 로컬 state 업데이트
      setPhotos(prev => prev.filter((p: any) => p.firestoreId !== firestoreId));
      setToastMsg("원내 전경 사진이 영구 삭제되었습니다.");
      setToastType("success");
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      console.error("사진 삭제 실패:", err);
      setToastMsg("사진 삭제에 실패했습니다.");
      setToastType("error");
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  // ──────────────────────────────────────────────
  // 대외활동 관련 — Firebase Storage + Firestore 기반
  // ──────────────────────────────────────────────

  const handleNewActivityUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setActivityAddError("이미지 크기는 최대 10MB까지 업로드 가능합니다.");
        return;
      }
      setActivityAddError("");
      setNewActivityFile(file);
      const previewUrl = URL.createObjectURL(file);
      setNewActivityPreview(previewUrl);
    }
  };

  const handleAddActivitySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle || !newActivityDesc || !newActivityYear) {
      setActivityAddError("연도, 제목, 설명을 모두 입력해 주십시오.");
      return;
    }

    setActivityUploading(true);
    setActivityAddError("");

    try {
      let imageUrl = "";
      let storagePath = "";

      if (newActivityFile) {
        const compressedBase64 = await compressImageFile(newActivityFile, 1000, 1000, 0.8);
        try {
          const uploadResp = await fetchWithTimeout("/api/photos/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileData: compressedBase64,
              fileName: newActivityFile.name
            }),
            timeout: 8000 // 8초 타임아웃 제한
          });

          if (uploadResp.ok) {
            const uploadResult = await uploadResp.json();
            imageUrl = uploadResult.imageUrl;
            storagePath = uploadResult.storagePath;
          } else {
            throw new Error("Server storage upload route failed");
          }
        } catch (srvErr) {
          console.warn("서버 업로드 실패, 브라우저 직접 업로드 시도:", srvErr);
          try {
            const fileName = `${Date.now()}_${newActivityFile.name}`;
            const storageRef = ref(storage, `site-images/activities/${fileName}`);
            const compressedBlob = base64ToBlob(compressedBase64);
            imageUrl = await clientUploadWithTimeout(storageRef, compressedBlob, 4000);
            storagePath = `site-images/activities/${fileName}`;
          } catch (clientErr) {
            console.warn("직접 업로드 실패, Base64 직접 탑재:", clientErr);
            imageUrl = compressedBase64;
            storagePath = "inline-fallback-base64";
          }
        }
      } else {
        imageUrl = "/images/clinic_interior_modern_1780495390125.png";
      }

      const docRef = await addDoc(collection(db, "activities"), {
        title: newActivityTitle,
        subtitle: newActivitySubtitle || "대표 주치의 활동",
        desc: newActivityDesc,
        year: newActivityYear,
        order: Number(newActivityOrder || 1),
        image: imageUrl,
        storagePath: storagePath,
        createdAt: new Date().toISOString()
      });

      const newItem = {
        firestoreId: docRef.id,
        title: newActivityTitle,
        subtitle: newActivitySubtitle || "대표 주치의 활동",
        desc: newActivityDesc,
        year: newActivityYear,
        order: Number(newActivityOrder || 1),
        image: imageUrl,
        storagePath: storagePath,
        createdAt: new Date().toISOString()
      };

      setActivities(prev => [newItem, ...prev].sort((a, b) => b.order - a.order));

      // Reset
      setNewActivityTitle("");
      setNewActivitySubtitle("");
      setNewActivityDesc("");
      setNewActivityYear("");
      setNewActivityOrder(1);
      setNewActivityFile(null);
      setNewActivityPreview("");
      setIsAddActivityOpen(false);
    } catch (err: any) {
      console.error("대외활동 업로드 실패:", err);
      setActivityAddError(`대외활동 업로드 실패: ${err.message || err}`);
    } finally {
      setActivityUploading(false);
    }
  };

  const handleUpdateActivitySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;
    if (!activityEditTitle || !activityEditDesc || !activityEditYear) {
      alert("연도, 제목, 설명을 모두 채워주십시오.");
      return;
    }

    try {
      await updateDoc(doc(db, "activities", editingActivity.firestoreId), {
        title: activityEditTitle,
        subtitle: activityEditSubtitle,
        desc: activityEditDesc,
        year: activityEditYear,
        order: Number(activityEditOrder || 1),
      });

      setActivities(prev => prev.map(act => act.firestoreId === editingActivity.firestoreId ? {
        ...act,
        title: activityEditTitle,
        subtitle: activityEditSubtitle,
        desc: activityEditDesc,
        year: activityEditYear,
        order: Number(activityEditOrder || 1),
      } : act).sort((a, b) => b.order - a.order));

      setEditingActivity(null);
    } catch (err) {
      console.error("대외활동 수정 실패:", err);
      alert("대외활동 수정에 실패했습니다.");
    }
  };

  const handleDeleteActivity = async (firestoreId: string, storagePath: string) => {
    if (!confirm("이 대외활동 기록을 정말 영구 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "activities", firestoreId));
      if (storagePath && storagePath !== "inline-fallback-base64") {
        try {
          const fileRef = ref(storage, storagePath);
          await deleteObject(fileRef);
        } catch (storageErr) {
          console.warn("Storage 파일 삭제 실패 (무시):", storageErr);
        }
      }
      setActivities(prev => prev.filter(a => a.firestoreId !== firestoreId));
    } catch (err) {
      console.error("대외활동 삭제 실패:", err);
      alert("삭제 실패했습니다.");
    }
  };

  // 사진 정보 편집 (제목/설명/지점 수정 — Firestore 업데이트)
  const handleEditPhoto = (photo: any) => {
    setEditingPhoto(photo);
    setPhotoEditTitle(photo.title);
    setPhotoEditDesc(photo.desc);
    setPhotoEditBranch(photo.branch || "both");
    setPhotoEditTagLabel(photo.tagLabel || "원내 인증 전경");
    setEditPhotoFile(null);
    setEditPhotoPreview("");
  };

  const handleSavePhotoDetails = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;
    setPhotoUploading(true);
    try {
      let imageUrl = editingPhoto.image;
      let storagePath = editingPhoto.storagePath || "";

      if (editPhotoFile) {
        // 1. 선택한 임시 파일을 1000px급 초경량 JPEG으로 실시간 압축
        const compressedBase64 = await compressImageFile(editPhotoFile, 1000, 1000, 0.8);
        try {
          // 2. 서버 측 API를 활용해 Firebase Storage 업로드 우선 시도
          const uploadResp = await fetchWithTimeout("/api/photos/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileData: compressedBase64,
              fileName: editPhotoFile.name
            }),
            timeout: 8000 // 8초 타임아웃 제한
          });

          if (uploadResp.ok) {
            const uploadResult = await uploadResp.json();
            imageUrl = uploadResult.imageUrl;
            storagePath = uploadResult.storagePath;
          } else {
            throw new Error("Server storage upload route returned non-200 status");
          }
        } catch (srvErr) {
          console.warn("서버 파이프라인 업로드 실패, 브라우저 직접 업로드 폴백 진입:", srvErr);
          try {
            // 3. 브라우저 직접 Firebase Storage 업로드 시도 (폴백 장치, 타임아웃 4초 적용)
            const fileName = `${Date.now()}_${editPhotoFile.name}`;
            const storageRef = ref(storage, `site-images/gallery/${fileName}`);
            const compressedBlob = base64ToBlob(compressedBase64);
            imageUrl = await clientUploadWithTimeout(storageRef, compressedBlob, 4000);
            storagePath = `site-images/gallery/${fileName}`;
          } catch (clientErr) {
            console.warn("클라이언트 스토리지 업로드도 차단됨. 최종 수단인 인라인 Base64 기입으로 강제 전환합니다:", clientErr);
            imageUrl = compressedBase64;
            storagePath = "inline-fallback-base64";
          }
        }
      }

      await updateDoc(doc(db, "galleryPhotos", editingPhoto.firestoreId), {
        title: photoEditTitle,
        desc: photoEditDesc,
        tagLabel: photoEditTagLabel,
        branch: photoEditBranch,
        image: imageUrl,
        storagePath: storagePath,
      });

      setPhotos(prev => prev.map((p: any) =>
        p.firestoreId === editingPhoto.firestoreId
          ? { ...p, title: photoEditTitle, desc: photoEditDesc, tagLabel: photoEditTagLabel, branch: photoEditBranch, image: imageUrl, storagePath: storagePath }
          : p
      ));

      setEditingPhoto(null);
      setEditPhotoFile(null);
      setEditPhotoPreview("");
    } catch (err) {
      console.error("사진 정보 수정 실패:", err);
      alert("수정에 실패했습니다.");
    } finally {
      setPhotoUploading(false);
    }
  };

  // ──────────────────────────────────────────────
  // 자가진단 관련 (기존과 동일)
  // ──────────────────────────────────────────────

  const handleDeleteDiagnose = (id: string) => {
    setDiagnosisToDelete(id);
  };

  const executeDeleteDiagnose = async (id: string) => {
    try {
      try {
        // Try direct delete by ID first (fast path)
        await deleteDoc(doc(db, "diagnoses", id)).catch(async () => {
          // Fallback if document ID is legacy random key (slow path)
          const snapshot = await getDocs(collection(db, "diagnoses"));
          const targetDoc = snapshot.docs.find(d => d.id === id || String(d.data().id) === id);
          if (targetDoc && targetDoc.id !== id) {
            await deleteDoc(doc(db, "diagnoses", targetDoc.id));
          }
        });
      } catch (fErr) {
        console.warn("Firestore delete issue:", fErr);
      }
      const resp = await fetch(`/api/diagnoses/${id}`, { method: "DELETE" });
      if (resp.ok) {
        setDiagnoses(prev => prev.filter(d => d.id !== id));
        setToastMsg("자가진단 기록이 안전하게 완전 삭제되었습니다.");
        setToastType("success");
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (e) {
      console.error(e);
      setToastMsg("자가진단 삭제에 실패했습니다.");
      setToastType("error");
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  const handleAddDiagnose = async (e: FormEvent) => {
    e.preventDefault();
    setAddDiagError("");
    setAddDiagLoading(true);
    try {
      const resp = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: addDiagAge, gender: addDiagGender, sleep: addDiagSleep,
          eat: addDiagEat, poop: addDiagPoop, symptoms: addDiagSymptoms,
          doctorNotes: addDiagDoctorNotes
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.diagnosis) {
          try {
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
            console.warn("Firestore diagnosis write failed:", fErr);
          }
          setDiagnoses(prev => [data.diagnosis, ...prev]);
        } else {
          loadAllData();
        }
        setIsAddingDiagnose(false);
        setAddDiagSleep("자다가 자주 깸");
        setAddDiagEat("가스가 차고 소화가 느림");
        setAddDiagPoop("시원치 못하고 잔변감 있음");
        setAddDiagSymptoms("피로 누적으로 어깨가 뻐근하고 머리가 무거우며 숙면이 어렵습니다.");
        setAddDiagDoctorNotes("");
      } else {
        const errData = await resp.json();
        setAddDiagError(errData.error || "자가진단 기록 추가 처리 중 오류가 발생했습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setAddDiagError("네트워크 서버 통신에 실패했습니다.");
    } finally {
      setAddDiagLoading(false);
    }
  };

  const handleStartEditDiag = (item: DiagnoseItem) => {
    setEditingDiag(item);
    setEditDiagAge(item.age || "40대");
    setEditDiagGender(item.gender || "여성");
    setEditDiagSleep(item.sleep || "");
    setEditDiagEat(item.eat || "");
    setEditDiagPoop(item.poop || "");
    setEditDiagSymptoms(item.symptoms || "");
    setEditDiagAnalysis(item.analysis || "");
    setEditDiagDoctorNotes(item.doctorNotes || "");
    setEditDiagError("");
  };

  const handleUpdateDiag = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDiag) return;
    setEditDiagError("");
    setEditDiagLoading(true);
    const updatedFields = {
      age: editDiagAge, gender: editDiagGender, sleep: editDiagSleep,
      eat: editDiagEat, poop: editDiagPoop, symptoms: editDiagSymptoms,
      analysis: editDiagAnalysis, doctorNotes: editDiagDoctorNotes
    };
    try {
      try {
        // Try direct update by ID first (fast path)
        await updateDoc(doc(db, "diagnoses", editingDiag.id), updatedFields).catch(async () => {
          // Fallback if document ID is legacy random key (slow path)
          const snapshot = await getDocs(collection(db, "diagnoses"));
          const targetDoc = snapshot.docs.find(d => d.id === editingDiag.id || String(d.data().id) === editingDiag.id);
          if (targetDoc && targetDoc.id !== editingDiag.id) {
            await updateDoc(doc(db, "diagnoses", targetDoc.id), updatedFields);
          }
        });
      } catch (fErr) {
        console.warn("Firestore update issue:", fErr);
      }
      const resp = await fetch(`/api/diagnoses/${editingDiag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });
      if (resp.ok) {
        setDiagnoses(prev => prev.map(item => item.id === editingDiag.id ? { ...item, ...updatedFields } : item));
        setEditingDiag(null);
      } else {
        const errData = await resp.json();
        setEditDiagError(errData.error || "자가진단 수정 저장에 실패했습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setEditDiagError("서버와의 통신 오류가 발생했습니다.");
    } finally {
      setEditDiagLoading(false);
    }
  };

  const toggleExpandDiag = (id: string) => {
    setExpandedDiag(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderParsedMarkdown = (rawText: string) => {
    if (!rawText) return null;
    return rawText.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return <h3 key={idx} className="text-sm sm:text-base font-serif font-bold text-[#2A2826] border-b border-amber-900/10 pb-2 mt-4 mb-2">{trimmed.replace("###", "").trim()}</h3>;
      }
      if (trimmed.startsWith("####")) {
        return <h4 key={idx} className="text-xs sm:text-sm font-serif font-bold text-[#C5A059] mt-3 mb-1">{trimmed.replace("####", "").trim()}</h4>;
      }
      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        return <p key={idx} className="font-serif font-semibold text-[#2A2826] mt-2 text-xs sm:text-sm">{trimmed.replace(/\*\*/g, "").trim()}</p>;
      }
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        let clean = trimmed.substring(1).trim();
        const parts = clean.split("**");
        return (
          <li key={idx} className="list-none pl-3 relative text-[11px] sm:text-xs font-serif text-[#5C6351] my-1 leading-relaxed text-left">
            <span className="absolute left-0 text-amber-600">&bull;</span>
            {parts.map((p, pIdx) => (pIdx % 2 === 1 ? <strong key={pIdx} className="text-[#2A2826] font-bold">{p}</strong> : p))}
          </li>
        );
      }
      if (trimmed.startsWith(">")) {
        return (
          <blockquote key={idx} className="border-l-2 border-amber-600 pl-3 py-1.5 italic font-serif text-[#5C6351] bg-[#DFD5C6]/15 rounded-r my-3 text-xs text-left">
            {trimmed.replace(">", "").trim()}
          </blockquote>
        );
      }
      if (trimmed === "---") {
        return <hr key={idx} className="my-4 border-t border-slate-100" />;
      }
      return <p key={idx} className="text-[11px] sm:text-xs font-serif text-[#5C6351] leading-relaxed my-1 text-left">{trimmed}</p>;
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-[#FAF9F5] min-h-screen pt-28 sm:pt-32 pb-16 flex items-center justify-center animate-fadeIn px-4">
        <div className="w-full max-w-md bg-white border border-[#DFD5C6]/60 rounded-2xl shadow-xl p-8 relative overflow-hidden text-left font-sans">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0F2C59]" />
          <div className="text-center space-y-2 mb-6">
            <span className="text-[10px] font-bold text-[#0F2C59] tracking-widest uppercase block">Administrative Security</span>
            <h2 className="text-2xl font-serif font-extrabold text-[#2A2826] tracking-tight">삼잘 원내 스마트 행정 센터</h2>
            <p className="text-xs text-slate-400">안전한 원무 및 환무 관리를 위해 로그인을 완료해 주십시오.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">행정 계정 ID</label>
              <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="ID를 입력하십시오" className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] tracking-wide placeholder-slate-300" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">보안 비밀번호 PASSWORD</label>
              <input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} placeholder="비밀번호를 입력하십시오" className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] tracking-wide placeholder-slate-300" required />
            </div>
            {loginError && <p className="text-rose-500 text-[11px] leading-relaxed font-semibold">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-[#0F2C59] hover:bg-opacity-90 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 shadow-md shadow-blue-950/10 cursor-pointer mt-2 text-center">보안 인증 로그인</button>
          </form>
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-mono">IP SECURE NETWORKS / SAMJAL KOREAN MEDICINE CLINIC</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] min-h-screen pt-28 sm:pt-32 pb-16 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-3 mb-10 relative">
          <div className="flex justify-end mb-4 sm:mb-0 sm:absolute sm:top-0 sm:right-0">
            <button onClick={handleLogout} className="px-3 py-1.5 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg text-xs font-sans transition-all cursor-pointer flex items-center gap-1">행정망 로그아웃</button>
          </div>
          <p className="text-xs sm:text-sm text-[#0F2C59] tracking-widest font-sans uppercase font-bold">Administrative Control Console</p>
          <h2 className="text-3xl sm:text-4xl font-sans text-slate-800 font-extrabold tracking-tight">삼잘 원내 스마트 행정 센터</h2>
          <div className="w-12 h-1 bg-[#0F2C59] mx-auto mt-3 rounded-full" />
          <p className="text-xs sm:text-sm font-sans text-slate-500 max-w-xl mx-auto leading-relaxed pt-2">원내 공지사항 게재 상황 및 청정 원내 전시 갤러리 롤링 이미지를 통합 관리하는 원장실 중앙 행정망입니다.</p>
        </div>

        <div className="flex border-b border-slate-200 mb-8 justify-center sm:justify-start gap-2 overflow-x-auto scroller-hidden">
          <button onClick={() => setActiveSubTab("notices")} className={`px-5 py-3 font-sans text-xs sm:text-sm font-extrabold tracking-tight border-b-2 transition-all shrink-0 cursor-pointer flex items-center gap-2 ${activeSubTab === "notices" ? "border-[#0F2C59] text-[#0F2C59]" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
            <Megaphone className="w-4 h-4" /><span>공지사항 게재 ({notices.length})</span>
          </button>
          <button onClick={() => setActiveSubTab("photos")} className={`px-5 py-3 font-sans text-xs sm:text-sm font-extrabold tracking-tight border-b-2 transition-all shrink-0 cursor-pointer flex items-center gap-2 ${activeSubTab === "photos" ? "border-[#0F2C59] text-[#0F2C59]" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
            <Image className="w-4 h-4" /><span>인테리어 롤링 관리 ({photos.length})</span>
          </button>
          <button onClick={() => setActiveSubTab("profiles")} className={`px-5 py-3 font-sans text-xs sm:text-sm font-extrabold tracking-tight border-b-2 transition-all shrink-0 cursor-pointer flex items-center gap-2 ${activeSubTab === "profiles" ? "border-[#0F2C59] text-[#0F2C59]" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
            <User className="w-4 h-4" /><span>의료진 프로필 관리 (4)</span>
          </button>
          <button onClick={() => setActiveSubTab("subject_images")} className={`px-5 py-3 font-sans text-xs sm:text-sm font-extrabold tracking-tight border-b-2 transition-all shrink-0 cursor-pointer flex items-center gap-2 ${activeSubTab === "subject_images" ? "border-[#0F2C59] text-[#0F2C59]" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
            <LayoutGrid className="w-4 h-4" /><span>진료과목 이미지 관리 (5×4)</span>
          </button>
          <button onClick={() => setActiveSubTab("intro_images")} className={`px-5 py-3 font-sans text-xs sm:text-sm font-extrabold tracking-tight border-b-2 transition-all shrink-0 cursor-pointer flex items-center gap-2 ${activeSubTab === "intro_images" ? "border-[#0F2C59] text-[#0F2C59]" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
            <Sparkles className="w-4 h-4" /><span>치료소개 이미지 관리 (4)</span>
          </button>
        </div>

        {/* 공지사항 탭 */}
        {activeSubTab === "notices" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm text-left relative">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0F2C59] rounded-t-2xl" />
              <div className="space-y-1.5 mb-5 pb-3 border-b border-slate-100">
                <span className="text-[10px] font-bold font-sans text-[#0F2C59] uppercase tracking-widest block">Notice Publication Draft</span>
                <h3 className="text-lg font-sans font-extrabold text-slate-800">{editingNotice ? "공지사항 수정" : "신규 공지사항 게재"}</h3>
                <p className="text-xs font-sans text-slate-400">{editingNotice ? "선택한 공지 전재의 제목과 본문 내용을 세부 조정하십시오." : "본 포탈에 게재되는 사항은 전 원내 게시망 및 대기실 텔레메트리에 즉시 공시됩니다."}</p>
              </div>
              {noticeMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-700 mb-4 animate-scaleUp">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" /><span>{noticeMessage}</span>
                </div>
              )}
              <form onSubmit={editingNotice ? handleUpdateNotice : handleAddNotice} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans text-slate-600 font-bold mb-1">공지 전달문 제목 *</label>
                  <input type="text" required placeholder="예: [안내] 2026년 하절기 원내 대체휴무 일정 알림" value={newNotice.title} onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#0F2C59] font-sans" />
                </div>
                <div>
                  <label className="block text-xs font-sans text-slate-600 font-bold mb-1">상세 전재 문안 *</label>
                  <textarea rows={6} required placeholder="환우분들께 정제되고 따뜻하게 다가갈 수 있는 어조와 꼼꼼한 약제 수급 정보, 운영 일시를 기재하십시오." value={newNotice.content} onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#0F2C59] font-sans leading-relaxed resize-none" />
                </div>
                <div className="flex items-center gap-2 py-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/40">
                  <input type="checkbox" id="isPinned" checked={newNotice.isPinned} onChange={(e) => setNewNotice({ ...newNotice, isPinned: e.target.checked })} className="w-4 h-4 text-[#0F2C59] border-slate-300 rounded focus:ring-[#0F2C59] cursor-pointer" />
                  <label htmlFor="isPinned" className="text-xs font-sans text-slate-600 font-extrabold cursor-pointer select-none">이 공지사항을 중요 공지(최상단 고정)로 설정</label>
                </div>
                <div className="space-y-2">
                  <button type="submit" disabled={noticeLoading} className="w-full py-2.5 bg-[#0F2C59] hover:bg-slate-800 text-white font-sans text-xs sm:text-sm font-bold tracking-tight rounded-xl cursor-pointer transition-all hover:shadow-md flex items-center justify-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /><span>{editingNotice ? "공지 수정 완료하기" : "원내 공지 게재하기"}</span>
                  </button>
                  {editingNotice && (
                    <button type="button" onClick={handleCancelEdit} className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-sans text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all text-center">수정 취소</button>
                  )}
                </div>
              </form>
            </div>
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm text-left">
              <span className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider block mb-1">Active Announcements</span>
              <h3 className="text-lg font-sans font-extrabold text-slate-800 mb-4 pb-2 border-b border-slate-100">게재 중인 공지 전산망 ({notices.length})</h3>
              {noticeLoading ? (
                <div className="text-center py-12 text-xs font-sans text-slate-400">공지 목록 데이터 갱신 중...</div>
              ) : notices.length === 0 ? (
                <div className="text-center py-12 text-xs font-sans text-slate-400">등록된 공지 일람이 비어 있습니다.</div>
              ) : (
                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                  {notices.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start gap-3 justify-between">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.isPinned && <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-sans font-extrabold rounded">필독고정</span>}
                          <h4 className="text-sm font-sans font-extrabold text-slate-800 truncate">{item.title}</h4>
                        </div>
                        <p className="text-[11px] font-sans text-slate-500 line-clamp-2 leading-relaxed">{item.content}</p>
                        <div className="flex items-center gap-4 text-[10px] text-slate-400">
                          <span>등록일: {item.date}</span><span>조회수: {item.views}회</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 self-center">
                        <button onClick={() => handleStartEdit(item)} className={`p-1.5 rounded-lg shrink-0 cursor-pointer transition-colors ${editingNotice?.id === item.id ? "bg-amber-100 text-amber-700" : "hover:bg-amber-50 text-amber-600"}`} title="공지 수정"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteNotice(Number(item.id))} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg shrink-0 cursor-pointer transition-colors" title="공지 삭제"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 사진 관리 탭 */}
        {activeSubTab === "photos" && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm text-left animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold font-sans text-[#0F2C59] uppercase tracking-wider block">Marquee Showcase Media Controller</span>
                <h3 className="text-lg font-sans font-extrabold text-slate-800">인테리어 둘러보기 롤링 이미지 관리</h3>
                <p className="text-xs font-sans text-slate-500 leading-relaxed">
                  현재 전면 마키(Marquee) 슬라이더에 반복 구동되고 있는 사진 목록입니다. <br />
                  설정하신 인테리어 전경들이 원내 안내 화면과 대기실 롤링 팝업창 등에 순차 전시됩니다.
                </p>
              </div>
              <button onClick={() => setIsAddPhotoOpen(true)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0F2C59] hover:bg-opacity-90 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-sans font-extrabold cursor-pointer transition-all shadow-sm shrink-0 self-start md:self-center">
                <Plus className="w-4 h-4" /><span>신규 전경 추가</span>
              </button>
            </div>

            {photos.length === 0 ? (
              <div className="text-center py-16 text-xs font-sans text-slate-400">등록된 사진이 없습니다. 신규 전경 추가 버튼을 눌러 사진을 업로드해 주십시오.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {photos.map((item: any, index: number) => (
                  <div key={item.firestoreId || index} className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group bg-slate-50 relative">
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        <span className="px-2 py-0.5 text-[9px] font-sans font-bold uppercase rounded-md text-slate-50 bg-indigo-600">{item.tagLabel}</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between text-left space-y-2">
                      <div>
                        {/* 제목 위의 소속 지점 표시 추가 */}
                        <div className="text-[10px] font-sans font-extrabold text-[#0F2C59] mb-1">
                          {item.branch === "nowon" ? "[노원점 단독]" : item.branch === "guri" ? "[구리점 단독]" : "[공통 (노원/구리)]"}
                        </div>
                        <h5 className="text-xs sm:text-sm font-sans font-extrabold text-slate-800 truncate">{item.title}</h5>
                        <p className="text-[11px] font-sans text-slate-500 line-clamp-2 leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 w-full">
                        <button onClick={() => handleEditPhoto(item)} className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 text-amber-700 rounded-lg text-xs font-sans font-bold cursor-pointer transition-all active:scale-95" title="사진 정보 편집">
                          <Pencil className="w-3 h-3" /><span>편집</span>
                        </button>
                        <button onClick={() => handleDeletePhoto(item.firestoreId, item.storagePath)} className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-rose-600 rounded-lg text-xs font-sans font-bold cursor-pointer transition-all active:scale-95" title="사진 삭제">
                          <Trash2 className="w-3 h-3" /><span>삭제</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-[10.5px] text-slate-400 mt-8">
              ※ 해당 전산망은 Firebase Cloud Storage와 실시간 동기화되어 있으며, 변경 즉시 홈페이지 전면에 반영됩니다.
            </p>
          </div>
        )}

        {/* 대외활동 관리 탭 (비활성화됨) */}
        {false && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm relative text-left">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0F2C59] rounded-t-2xl" />
              
              <div className="space-y-1 mb-6 pb-3 border-b border-slate-100 pr-16 sm:pr-24 relative">
                <div className="absolute top-1 right-1 sm:right-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddActivityOpen(!isAddActivityOpen);
                      setEditingActivity(null);
                    }}
                    className="px-3.5 py-1.5 bg-[#0F2C59] hover:bg-slate-800 text-white rounded-lg text-xs font-sans font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isAddActivityOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isAddActivityOpen ? "닫기" : "신규 추가"}</span>
                  </button>
                </div>
                <span className="text-[10px] font-bold font-sans text-[#0F2C59] uppercase tracking-wider block">External Activities & Timeline Management</span>
                <h3 className="text-lg font-sans font-extrabold text-slate-800">삼잘 대외활동 주치의 연혁 마스터</h3>
                <p className="text-xs font-sans text-slate-500 leading-relaxed">삼잘한의원 소개 페이지에 연출되는 국가대표 주치의 활동, 올림픽 지원 등 대외활동 이미지를 동적으로 등록하고 순서를 제어합니다.</p>
              </div>

              {/* 신규 대외활동 등록 슬라이드다운 폼 */}
              {isAddActivityOpen && (
                <div className="mb-6 p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl animate-slideDown">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
                    <h4 className="text-sm font-extrabold text-[#2A2826] font-sans flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#0F2C59]" />
                      <span>신규 대외활동 내역 게재</span>
                    </h4>
                  </div>
                  {activityAddError && (
                    <p className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-sans mb-4">{activityAddError}</p>
                  )}
                  <form onSubmit={handleAddActivitySubmit} className="space-y-4 font-sans text-xs sm:text-sm text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">연도 *</label>
                        <input
                          type="text"
                          required
                          placeholder="예: 2024"
                          value={newActivityYear}
                          onChange={(e) => setNewActivityYear(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">정렬 우선순위(Order) *</label>
                        <input
                          type="number"
                          required
                          placeholder="높을수록 최상단 노출 (예: 5)"
                          value={newActivityOrder}
                          onChange={(e) => setNewActivityOrder(Number(e.target.value))}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">지점 및 역할 문명 (제목 상단 표시) *</label>
                        <input
                          type="text"
                          required
                          placeholder="예: 노원점, 구리점 또는 대외활동 역할"
                          value={newActivitySubtitle}
                          onChange={(e) => setNewActivitySubtitle(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">대외활동 제목 *</label>
                      <input
                        type="text"
                        required
                        placeholder="예: 2024 파리 올림픽"
                        value={newActivityTitle}
                        onChange={(e) => setNewActivityTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">세부 활동 내역 설명 *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="국가대표 한방의학 지원단으로 임명되어 주치의로서 수행한 구체적인 치료 역할과 스토리를 품격있게 서술하십시오."
                        value={newActivityDesc}
                        onChange={(e) => setNewActivityDesc(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    {/* 사진 업로드 인터페이스 */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">대표 현장 사진 업로드</label>
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-full max-w-xs aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center relative">
                          {newActivityPreview ? (
                            <img src={newActivityPreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-4">
                              <Image className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                              <span className="text-[11px] text-slate-400 block font-bold">이미지 미리보기</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 w-full text-center sm:text-left">
                          <label className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-[#0F2C59] bg-white text-[#0F2C59] hover:bg-slate-50 text-xs font-semibold rounded-lg cursor-pointer transition-all">
                            <Upload className="w-3.5 h-3.5" />
                            <span>대외활동 사진 선택</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleNewActivityUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                            권장 규격: 16:10 비율 가로형 이미지, 최대 10MB까지 수용<br />
                            ※ 사진 미등록 시 기본 병원 현대식 원내 전경 이미지가 자동 배정됩니다.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={activityUploading}
                        className="px-6 py-2.5 bg-[#0F2C59] hover:bg-slate-800 disabled:bg-slate-300 text-white font-sans text-xs sm:text-sm font-bold tracking-tight rounded-xl cursor-pointer transition-all"
                      >
                        {activityUploading ? "업로드 및 저장 중..." : "대외활동 내역 저장하기"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 편집 폼 (인라인) */}
              {editingActivity && (
                <div className="mb-6 p-5 sm:p-6 bg-amber-50/50 border border-amber-200 rounded-2xl animate-scaleUp text-left">
                  <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 mb-4">
                    <h4 className="text-sm font-extrabold text-[#78350F] font-sans flex items-center gap-1.5">
                      <Pencil className="w-4 h-4" />
                      <span>대외활동 세부 조절 및 지점 문구 수정</span>
                    </h4>
                    <button type="button" onClick={() => setEditingActivity(null)} className="p-1 text-amber-500 hover:text-amber-700 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <form onSubmit={handleUpdateActivitySubmit} className="space-y-4 font-sans text-xs sm:text-sm text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-amber-800 mb-1">연도 *</label>
                        <input
                          type="text"
                          required
                          value={activityEditYear}
                          onChange={(e) => setActivityEditYear(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-800 mb-1">정렬 순위(Order) *</label>
                        <input
                          type="number"
                          required
                          value={activityEditOrder}
                          onChange={(e) => setActivityEditOrder(Number(e.target.value))}
                          className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-800 mb-1">지점 및 역할 문명 (제목 상단 표시) *</label>
                        <input
                          type="text"
                          required
                          value={activityEditSubtitle}
                          onChange={(e) => setActivityEditSubtitle(e.target.value)}
                          placeholder="예: 노원점, 구리점 또는 대외활동 역할"
                          className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-800 mb-1">대외활동 제목 *</label>
                      <input
                        type="text"
                        required
                        value={activityEditTitle}
                        onChange={(e) => setActivityEditTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-800 mb-1">세부 설명 문안 *</label>
                      <textarea
                        rows={3}
                        required
                        value={activityEditDesc}
                        onChange={(e) => setActivityEditDesc(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#0F2C59] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        신속 반영하기
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingActivity(null)}
                        className="px-5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        편집 보류
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 현재 활동 리스트 뷰 */}
              {activities.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 border border-slate-200/50 rounded-2xl">
                  <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-400 font-sans">대외활동 연혁이 기입되어 있지 않습니다.</p>
                  <p className="text-xs text-slate-400 mt-1">상단 [신규 추가]를 눌러 첫 올림픽 주치의 활동 등의 연혁을 등록해 주십시오.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activities.map((item: any) => (
                    <div
                      key={item.firestoreId}
                      className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="relative aspect-[16/10] bg-slate-100 border-b border-slate-150">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-[#0F2C59] text-white rounded-md text-[10px] font-sans font-extrabold tracking-wide">
                          구분: {item.year}년 (순위: {item.order || 1})
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between text-left">
                        <div className="space-y-1">
                          <span className="text-[11px] text-[#0F2C59] font-bold block">{item.subtitle}</span>
                          <h4 className="text-sm font-extrabold text-slate-800 leading-tight">{item.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed pt-1.5">{item.desc}</p>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-1.5 mt-4">
                          <button
                            onClick={() => {
                              setEditingActivity(item);
                              setActivityEditTitle(item.title);
                              setActivityEditSubtitle(item.subtitle);
                              setActivityEditDesc(item.desc);
                              setActivityEditYear(item.year);
                              setActivityEditOrder(item.order || 1);
                              setIsAddActivityOpen(false);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-lg text-xs font-sans font-bold cursor-pointer transition-all"
                            title="연혁 수정"
                          >
                            <Pencil className="w-3 h-3" /><span>수정</span>
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(item.firestoreId, item.storagePath)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-rose-600 rounded-lg text-xs font-sans font-bold cursor-pointer transition-all active:scale-95"
                            title="연혁 삭제"
                          >
                            <Trash2 className="w-3 h-3" /><span>삭제</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-center text-[10.5px] text-slate-400 mt-8">
                ※ 대외활동 관리 내용은 실시간으로 Firebase Cloud database와 동기화되며, &ldquo;삼잘한의원 소개&rdquo; &rarr; &ldquo;대외활동&rdquo; 탭 연혁 카드로 동적 갱신되어 반영됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 자가진단 탭 */}
        {activeSubTab === "diagnoses" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm text-left relative">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0F2C59] rounded-t-2xl" />
              <div className="space-y-1 mb-6 pb-3 border-b border-slate-100 pr-16 sm:pr-24">
                <div className="absolute top-6 right-5 sm:right-6">
                  <button type="button" onClick={() => setIsAddingDiagnose(!isAddingDiagnose)} className="px-3.5 py-1.5 border border-[#0F2C59]/30 text-[#0F2C59] hover:bg-[#0F2C59] hover:text-white rounded-lg text-xs font-sans font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <Plus className="w-3.5 h-3.5" /><span>추가</span>
                  </button>
                </div>
                <span className="text-[10px] font-bold font-sans text-[#0F2C59] uppercase tracking-wider block">AI Self-Diagnosis Logs</span>
                <h3 className="text-lg font-sans font-extrabold text-slate-800">AI 삼잘 자가 건강진단 기록 보관함</h3>
                <p className="text-xs font-sans text-slate-500 leading-relaxed">환우분들께서 작성하신 AI 삼잘 자가 건강 자가진단 기록 및 전산 자동 발송 보고서 내역입니다.</p>
              </div>

              {isAddingDiagnose && (
                <div className="mb-6 p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-4 animate-slideDown">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#0F2C59]" />
                      <h4 className="text-sm font-extrabold text-[#2A2826] font-sans">자가진단 및 원장 통합 소견 신규 추가</h4>
                    </div>
                    <button type="button" onClick={() => setIsAddingDiagnose(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <form onSubmit={handleAddDiagnose} className="space-y-4 font-sans text-xs text-[#2A2826]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">연령군 *</label>
                        <select value={addDiagAge} onChange={(e) => setAddDiagAge(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/10">
                          <option value="20대">20대</option><option value="30대">30대</option><option value="40대">40대</option><option value="50대">50대</option><option value="60대 이상">60대 이상</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">성별 구분 *</label>
                        <div className="flex gap-2">
                          {["여성", "남성"].map(g => (
                            <button key={g} type="button" onClick={() => setAddDiagGender(g)} className={`flex-1 py-2 text-center rounded-xl font-bold transition-all border text-xs cursor-pointer ${addDiagGender === g ? "bg-[#0F2C59] text-white border-[#0F2C59]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>{g}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div><label className="block text-[#475569] text-xs font-bold mb-1.5">수면상태 *</label><input type="text" required value={addDiagSleep} onChange={(e) => setAddDiagSleep(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs" /></div>
                      <div><label className="block text-[#475569] text-xs font-bold mb-1.5">식사상태 *</label><input type="text" required value={addDiagEat} onChange={(e) => setAddDiagEat(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs" /></div>
                      <div><label className="block text-[#475569] text-xs font-bold mb-1.5">배변상태 *</label><input type="text" required value={addDiagPoop} onChange={(e) => setAddDiagPoop(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs" /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-600 mb-1.5">주요 진술 증상 *</label><textarea required value={addDiagSymptoms} onChange={(e) => setAddDiagSymptoms(e.target.value)} rows={2} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs leading-relaxed resize-none" /></div>
                    <div><label className="block text-xs font-bold text-slate-600 mb-1.5">원장단 종합 처방 (옵션)</label><textarea value={addDiagDoctorNotes} onChange={(e) => setAddDiagDoctorNotes(e.target.value)} rows={3} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs leading-relaxed resize-none font-bold text-[#0F2C59]" /></div>
                    {addDiagError && <p className="text-rose-500 font-semibold text-xs">{addDiagError}</p>}
                    <div className="flex gap-2 justify-end pt-2">
                      <button type="button" onClick={() => setIsAddingDiagnose(false)} className="px-4 py-2 hover:bg-slate-200 text-slate-500 rounded-xl font-bold transition-all text-xs cursor-pointer">취소하기</button>
                      <button type="submit" disabled={addDiagLoading} className="px-5 py-2 bg-[#0F2C59] hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer text-xs">{addDiagLoading ? "등록 중..." : "진단기록 및 소견 즉시등록"}</button>
                    </div>
                  </form>
                </div>
              )}

              {diagLoading ? (
                <div className="text-center py-12 text-xs font-sans text-slate-400 animate-pulse">자가진단 기록 전산망 동기화 중...</div>
              ) : diagnoses.length === 0 ? (
                <div className="text-center py-12 text-xs font-sans text-slate-400">아직 축적된 자가 진단 내역이 없습니다.</div>
              ) : (
                <div className="space-y-4">
                  {diagnoses.map((item) => {
                    const isExpanded = !!expandedDiag[item.id];
                    const dateFormatted = new Date(item.createdAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:bg-slate-50/80 transition-all shadow-sm">
                        <div onClick={() => toggleExpandDiag(item.id)} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none font-sans">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-sans font-extrabold text-[#2A2826]">익명의 환우 ({item.gender || "미기재"}/{item.age || "미기재"}세)</span>
                                <span className="text-[10px] font-mono text-slate-400">기록번호: {item.id.slice(-6)}</span>
                              </div>
                              <p className="text-[11px] font-sans text-[#7A7571] mt-0.5 truncate max-w-sm sm:max-w-md">증상: <span className="font-bold text-slate-600">{item.symptoms || "특이사항 없음"}</span></p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0">
                            <span className="text-[10.5px] font-mono text-slate-400">{dateFormatted}</span>
                            <div className="flex items-center gap-2">
                              <button onClick={(e) => { e.stopPropagation(); toggleExpandDiag(item.id); }} className="p-1.5 px-3 bg-slate-200 hover:bg-[#0F2C59] hover:text-white text-slate-700 rounded-lg text-[10px] font-sans font-extrabold flex items-center gap-1 cursor-pointer transition-colors">{isExpanded ? "상세접기" : "진단서보기"}</button>
                              <button onClick={(e) => { e.stopPropagation(); handleStartEditDiag(item); }} className="p-1.5 hover:bg-amber-50 text-amber-500 hover:text-amber-600 border border-transparent hover:border-amber-100 rounded-lg cursor-pointer transition-colors" title="진단서 수동 편집"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteDiagnose(item.id); }} className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-lg cursor-pointer transition-colors" title="진단서 영구 폐기"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-200/60 bg-white animate-slideDown">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 mt-3 text-left">
                              <div className="p-3 bg-red-50/30 border border-slate-100 rounded-xl"><div className="flex items-center gap-1 mb-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /><span className="text-[10.5px] font-sans text-red-600 font-extrabold uppercase tracking-wide">잘자기 (수면 상태)</span></div><p className="text-xs font-serif text-[#5C6351] leading-relaxed pl-2.5">{item.sleep || "미기재"}</p></div>
                              <div className="p-3 bg-emerald-50/30 border border-slate-100 rounded-xl"><div className="flex items-center gap-1 mb-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-[10.5px] font-sans text-emerald-600 font-extrabold uppercase tracking-wide">잘먹기 (식사 상태)</span></div><p className="text-xs font-serif text-[#5C6351] leading-relaxed pl-2.5">{item.eat || "미기재"}</p></div>
                              <div className="p-3 bg-sky-50/30 border border-slate-100 rounded-xl"><div className="flex items-center gap-1 mb-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" /><span className="text-[10.5px] font-sans text-sky-600 font-extrabold uppercase tracking-wide">잘보내기 (배변 상태)</span></div><p className="text-xs font-serif text-[#5C6351] leading-relaxed pl-2.5">{item.poop || "미기재"}</p></div>
                            </div>
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/40 text-left mb-6"><span className="text-[10px] font-extrabold font-sans text-slate-400 block mb-1">환우가 직접 기재한 진술 증상</span><p className="text-xs font-serif text-[#2A2826] leading-relaxed font-light pl-1 italic">"{item.symptoms || "특별한 불편사항 없음"}"</p></div>
                            <div className="relative p-5 sm:p-6 bg-[#FAF9F5] border border-[#DFD5C6]/60 rounded-xl text-left shadow-inner"><div className="prose max-w-none space-y-1">{renderParsedMarkdown(item.analysis)}</div></div>
                            <div className="mt-5 p-5 bg-white border border-slate-200 rounded-xl text-left space-y-3 shadow-xs font-sans">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#0F2C59]" /><span className="text-xs sm:text-sm font-extrabold text-[#2A2826]">원장단 처방 소견 및 자동응답 기초자료 구축</span></div>
                                {item.doctorNotes ? <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold rounded">기본자료 구비 완료</span> : <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold rounded">소견 미등록 상태</span>}
                              </div>
                              <textarea value={tempNotes[item.id] !== undefined ? tempNotes[item.id] : (item.doctorNotes || "")} onChange={(e) => setTempNotes(prev => ({ ...prev, [item.id]: e.target.value }))} rows={3} className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59]/10 resize-none leading-relaxed text-[#2A2826]" />
                              <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-slate-100">
                                <span className="text-[10.5px] font-semibold text-[#0F2C59]">{saveNotesStatus[item.id] || ""}</span>
                                <button type="button" onClick={() => { const notesToSave = tempNotes[item.id] !== undefined ? tempNotes[item.id] : (item.doctorNotes || ""); handleSaveNotes(item.id, notesToSave); }} className="px-4 py-2 bg-[#0F2C59] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all active:scale-[0.97] cursor-pointer">소견 및 대응기준 저장하기</button>
                              </div>
                              {(item.doctorNotes || tempNotes[item.id]) && (
                                <div className="mt-4 p-3.5 bg-amber-50/20 border border-[#DFD5C6]/40 rounded-xl text-left">
                                  <span className="text-[10.5px] font-extrabold text-amber-800 block mb-1">[통합 합성본] 고객 문의 시 자동응답용 기초 시뮬레이션</span>
                                  <div className="text-[11.5px] font-serif text-[#5C6351] space-y-1 pl-1 leading-relaxed">
                                    <p><strong>• 1차 AI 분석:</strong> 위 숙면 부족 혹은 비위 소화 습정체에 대한 천연 식품 가이드 제공 완료.</p>
                                    <p><strong>• 주치의 조치:</strong> {tempNotes[item.id] !== undefined ? tempNotes[item.id] : item.doctorNotes}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 의료진 프로필 관리 탭 */}
        {activeSubTab === "profiles" && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm text-left relative animate-fadeIn">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0F2C59] rounded-t-2xl" />
            <div className="space-y-1.5 mb-8 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold font-sans text-[#0F2C59] uppercase tracking-widest block">Medical Staff Profiles</span>
                <h3 className="text-xl font-sans font-extrabold text-[#0F2C59]">의료진 및 연구 파트너 프로필 관리</h3>
                <p className="text-xs font-sans text-slate-400">삼잘한의원 소개 및 지점소개 란에 송출되는 대표 의료진 4인의 프로필 얼굴 사진을 실시간 업데이트합니다.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1: 김유정 박사 */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 bg-[#0F2C59]/10 text-[#0F2C59] font-sans text-[11px] font-bold rounded-lg">의뢰 파트너</span>
                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      <button onClick={() => handleStartEditProfile("kim_yujung")} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 text-amber-700 rounded-lg text-[10px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs" title="프로필 수정">
                        <Pencil className="w-2.5 h-2.5" /><span>편집</span>
                      </button>
                      <button onClick={() => handleDeleteProfilePhoto("kim_yujung")} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-rose-600 rounded-lg text-[10px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs" title="프로필 삭제">
                        <Trash2 className="w-2.5 h-2.5" /><span>삭제</span>
                      </button>
                    </div>
                  </div>

                  {editingProfileId === "kim_yujung" ? (
                    <div className="space-y-4 mt-1 bg-white p-4 rounded-xl border border-slate-200/65 font-sans shadow-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans">의료진 이름 *</label>
                        <input type="text" value={editProfileName} onChange={(e) => setEditProfileName(e.target.value)} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white font-sans" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans">담당업무 *</label>
                        <input type="text" value={editProfileRole} onChange={(e) => setEditProfileRole(e.target.value)} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white font-sans" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans">상세내용 *</label>
                        <textarea value={editProfileDesc} onChange={(e) => setEditProfileDesc(e.target.value)} rows={3} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white resize-none leading-relaxed font-sans" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans">태그 *</label>
                        <input type="text" value={editProfileTag} onChange={(e) => setEditProfileTag(e.target.value)} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white font-sans" required />
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-100 font-sans">
                        <button type="button" onClick={() => handleSaveProfileInfo("kim_yujung")} className="flex-1 py-1.5 bg-[#0F2C59] text-white hover:bg-slate-800 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all">저장 완료</button>
                        <button type="button" onClick={() => setEditingProfileId(null)} className="py-1.5 px-3 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all">취소</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 font-sans">
                        {profilesInfoMap.kim_yujung?.name || DEFAULT_PROFILES.kim_yujung.name}
                        <span className="text-xs text-slate-400 font-medium font-sans">{profilesInfoMap.kim_yujung?.role || DEFAULT_PROFILES.kim_yujung.role}</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-2.5 mb-4 leading-relaxed font-sans">{profilesInfoMap.kim_yujung?.desc || DEFAULT_PROFILES.kim_yujung.desc}</p>
                      
                      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-100">
                        <div className="w-20 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-sm relative group">
                          <img src={profilesMap.kim_yujung} alt="김유정 박사" className="w-full h-full object-cover font-sans" referrerPolicy="no-referrer" />
                          <label className="absolute inset-0 bg-black/40 text-white text-[9px] font-sans font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                            사진 수정
                            <input id="profile-input-kim_yujung" type="file" accept="image/*" className="hidden" onChange={(e) => handleProfilePhotoChange("kim_yujung", e)} />
                          </label>
                        </div>
                        <div className="space-y-1 flex-1 font-sans">
                          <button onClick={() => document.getElementById("profile-input-kim_yujung")?.click()} className="px-2.5 py-1 bg-[#0F2C59] hover:bg-slate-800 text-white rounded-lg text-[10.5px] font-sans font-bold cursor-pointer transition-all shadow-xs">
                            사진 교체
                          </button>
                          {profileUploadingId === "kim_yujung" && <p className="text-[11px] text-[#0F2C59] font-bold animate-pulse font-sans">업로드 진행중...</p>}
                          {profileErrorMap.kim_yujung && <p className="text-[11px] text-red-500 font-bold font-sans">{profileErrorMap.kim_yujung}</p>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card 2: 전준영 원장 */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 bg-amber-600/10 text-amber-700 font-sans text-[11px] font-bold rounded-lg">노원점 대표</span>
                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      <button onClick={() => handleStartEditProfile("jeon_junyoung")} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 text-amber-700 rounded-lg text-[10px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs" title="프로필 수정">
                        <Pencil className="w-2.5 h-2.5" /><span>편집</span>
                      </button>
                      <button onClick={() => handleDeleteProfilePhoto("jeon_junyoung")} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-rose-600 rounded-lg text-[10px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs" title="프로필 삭제">
                        <Trash2 className="w-2.5 h-2.5" /><span>삭제</span>
                      </button>
                    </div>
                  </div>

                  {editingProfileId === "jeon_junyoung" ? (
                    <div className="space-y-4 mt-1 bg-white p-4 rounded-xl border border-slate-200/65 font-sans shadow-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans font-sans">의료진 이름 *</label>
                        <input type="text" value={editProfileName} onChange={(e) => setEditProfileName(e.target.value)} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white font-sans" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans font-sans">담당업무 *</label>
                        <input type="text" value={editProfileRole} onChange={(e) => setEditProfileRole(e.target.value)} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white font-sans" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans font-sans">상세내용 *</label>
                        <textarea value={editProfileDesc} onChange={(e) => setEditProfileDesc(e.target.value)} rows={3} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white resize-none leading-relaxed font-sans" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans font-sans">태그 *</label>
                        <input type="text" value={editProfileTag} onChange={(e) => setEditProfileTag(e.target.value)} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white font-sans" required />
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-100 font-sans">
                        <button type="button" onClick={() => handleSaveProfileInfo("jeon_junyoung")} className="flex-1 py-1.5 bg-[#0F2C59] text-white hover:bg-slate-800 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all">저장 완료</button>
                        <button type="button" onClick={() => setEditingProfileId(null)} className="py-1.5 px-3 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all">취소</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 font-sans">
                        {profilesInfoMap.jeon_junyoung?.name || DEFAULT_PROFILES.jeon_junyoung.name}
                        <span className="text-xs text-slate-400 font-medium font-sans">{profilesInfoMap.jeon_junyoung?.role || DEFAULT_PROFILES.jeon_junyoung.role}</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-2.5 mb-4 leading-relaxed font-sans">{profilesInfoMap.jeon_junyoung?.desc || DEFAULT_PROFILES.jeon_junyoung.desc}</p>
                      
                      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-100">
                        <div className="w-20 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-sm relative group">
                          <img src={profilesMap.jeon_junyoung} alt="전준영 원장" className="w-full h-full object-cover font-sans" referrerPolicy="no-referrer" />
                          <label className="absolute inset-0 bg-black/40 text-white text-[9px] font-sans font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                            사진 수정
                            <input id="profile-input-jeon_junyoung" type="file" accept="image/*" className="hidden" onChange={(e) => handleProfilePhotoChange("jeon_junyoung", e)} />
                          </label>
                        </div>
                        <div className="space-y-1 flex-1 font-sans">
                          <button onClick={() => document.getElementById("profile-input-jeon_junyoung")?.click()} className="px-2.5 py-1 bg-[#0F2C59] hover:bg-slate-800 text-white rounded-lg text-[10.5px] font-sans font-bold cursor-pointer transition-all shadow-xs">
                            사진 교체
                          </button>
                          {profileUploadingId === "jeon_junyoung" && <p className="text-[11px] text-[#0F2C59] font-bold animate-pulse font-sans">업로드 진행중...</p>}
                          {profileErrorMap.jeon_junyoung && <p className="text-[11px] text-red-500 font-bold font-sans">{profileErrorMap.jeon_junyoung}</p>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card 3: 제정진 원장 */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 bg-amber-600/10 text-amber-700 font-sans text-[11px] font-bold rounded-lg">구리점 대표</span>
                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      <button onClick={() => handleStartEditProfile("je_jengjin")} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 text-amber-700 rounded-lg text-[10px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs font-sans" title="프로필 수정">
                        <Pencil className="w-2.5 h-2.5" /><span>편집</span>
                      </button>
                      <button onClick={() => handleDeleteProfilePhoto("je_jengjin")} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-rose-600 rounded-lg text-[10px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs font-sans" title="프로필 삭제">
                        <Trash2 className="w-2.5 h-2.5" /><span>삭제</span>
                      </button>
                    </div>
                  </div>

                  {editingProfileId === "je_jengjin" ? (
                    <div className="space-y-4 mt-1 bg-white p-4 rounded-xl border border-slate-200/65 font-sans shadow-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans">의료진 이름 *</label>
                        <input type="text" value={editProfileName} onChange={(e) => setEditProfileName(e.target.value)} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white font-sans" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans">담당업무 *</label>
                        <input type="text" value={editProfileRole} onChange={(e) => setEditProfileRole(e.target.value)} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white font-sans" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans">상세내용 *</label>
                        <textarea value={editProfileDesc} onChange={(e) => setEditProfileDesc(e.target.value)} rows={3} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white resize-none leading-relaxed font-sans" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans">태그 *</label>
                        <input type="text" value={editProfileTag} onChange={(e) => setEditProfileTag(e.target.value)} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white font-sans" required />
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-100 font-sans">
                        <button type="button" onClick={() => handleSaveProfileInfo("je_jengjin")} className="flex-1 py-1.5 bg-[#0F2C59] text-white hover:bg-slate-800 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all">저장 완료</button>
                        <button type="button" onClick={() => setEditingProfileId(null)} className="py-1.5 px-3 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all">취소</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 font-sans">
                        {profilesInfoMap.je_jengjin?.name || DEFAULT_PROFILES.je_jengjin.name}
                        <span className="text-xs text-slate-400 font-medium">{profilesInfoMap.je_jengjin?.role || DEFAULT_PROFILES.je_jengjin.role}</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-2.5 mb-4 leading-relaxed font-sans">{profilesInfoMap.je_jengjin?.desc || DEFAULT_PROFILES.je_jengjin.desc}</p>
                      
                      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-100">
                        <div className="w-20 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-sm relative group">
                          <img src={profilesMap.je_jengjin} alt="제정진 원장" className="w-full h-full object-cover font-sans" referrerPolicy="no-referrer" />
                          <label className="absolute inset-0 bg-black/40 text-white text-[9px] font-sans font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                            사진 수정
                            <input id="profile-input-je_jengjin" type="file" accept="image/*" className="hidden" onChange={(e) => handleProfilePhotoChange("je_jengjin", e)} />
                          </label>
                        </div>
                        <div className="space-y-1 flex-1 font-sans">
                          <button onClick={() => document.getElementById("profile-input-je_jengjin")?.click()} className="px-2.5 py-1 bg-[#0F2C59] hover:bg-slate-800 text-white rounded-lg text-[10.5px] font-sans font-bold cursor-pointer transition-all shadow-xs">
                            사진 교체
                          </button>
                          {profileUploadingId === "je_jengjin" && <p className="text-[11px] text-[#0F2C59] font-bold animate-pulse font-sans">업로드 진행중...</p>}
                          {profileErrorMap.je_jengjin && <p className="text-[11px] text-red-500 font-bold font-sans">{profileErrorMap.je_jengjin}</p>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card 4: 제현영 원장 */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 bg-amber-600/10 text-amber-700 font-sans text-[11px] font-bold rounded-lg font-sans">구리점 원장</span>
                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      <button onClick={() => handleStartEditProfile("je_hyunyoung")} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 text-amber-700 rounded-lg text-[10px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs font-sans" title="프로필 수정">
                        <Pencil className="w-2.5 h-2.5" /><span>편집</span>
                      </button>
                      <button onClick={() => handleDeleteProfilePhoto("je_hyunyoung")} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-rose-600 rounded-lg text-[10px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs font-sans" title="프로필 삭제">
                        <Trash2 className="w-2.5 h-2.5" /><span>삭제</span>
                      </button>
                    </div>
                  </div>

                  {editingProfileId === "je_hyunyoung" ? (
                    <div className="space-y-4 mt-1 bg-white p-4 rounded-xl border border-slate-200/65 font-sans shadow-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans">의료진 이름 *</label>
                        <input type="text" value={editProfileName} onChange={(e) => setEditProfileName(e.target.value)} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white font-sans" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans">담당업무 *</label>
                        <input type="text" value={editProfileRole} onChange={(e) => setEditProfileRole(e.target.value)} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white font-sans" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans">상세내용 *</label>
                        <textarea value={editProfileDesc} onChange={(e) => setEditProfileDesc(e.target.value)} rows={3} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white resize-none leading-relaxed font-sans" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#0F2C59] font-sans">태그 *</label>
                        <input type="text" value={editProfileTag} onChange={(e) => setEditProfileTag(e.target.value)} className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F2C59] focus:bg-white font-sans" required />
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-100 font-sans">
                        <button type="button" onClick={() => handleSaveProfileInfo("je_hyunyoung")} className="flex-1 py-1.5 bg-[#0F2C59] text-white hover:bg-slate-800 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all">저장 완료</button>
                        <button type="button" onClick={() => setEditingProfileId(null)} className="py-1.5 px-3 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all">취소</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 font-sans">
                        {profilesInfoMap.je_hyunyoung?.name || DEFAULT_PROFILES.je_hyunyoung.name}
                        <span className="text-xs text-slate-400 font-medium font-sans">{profilesInfoMap.je_hyunyoung?.role || DEFAULT_PROFILES.je_hyunyoung.role}</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-2.5 mb-4 leading-relaxed font-sans">{profilesInfoMap.je_hyunyoung?.desc || DEFAULT_PROFILES.je_hyunyoung.desc}</p>
                      
                      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-100">
                        <div className="w-20 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-sm relative group">
                          <img src={profilesMap.je_hyunyoung} alt="제현영 원장" className="w-full h-full object-cover font-sans" referrerPolicy="no-referrer" />
                          <label className="absolute inset-0 bg-black/40 text-white text-[9px] font-sans font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                            사진 수정
                            <input id="profile-input-je_hyunyoung" type="file" accept="image/*" className="hidden" onChange={(e) => handleProfilePhotoChange("je_hyunyoung", e)} />
                          </label>
                        </div>
                        <div className="space-y-1 flex-1 font-sans">
                          <button onClick={() => document.getElementById("profile-input-je_hyunyoung")?.click()} className="px-2.5 py-1 bg-[#0F2C59] hover:bg-slate-800 text-white rounded-lg text-[10.5px] font-sans font-bold cursor-pointer transition-all shadow-xs">
                            사진 교체
                          </button>
                          {profileUploadingId === "je_hyunyoung" && <p className="text-[11px] text-[#0F2C59] font-bold animate-pulse font-sans">업로드 진행중...</p>}
                          {profileErrorMap.je_hyunyoung && <p className="text-[11px] text-red-500 font-bold font-sans font-sans">{profileErrorMap.je_hyunyoung}</p>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 진료과목 이미지 관리 탭 */}
        {activeSubTab === "subject_images" && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm text-left relative animate-fadeIn">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0F2C59] rounded-t-2xl" />
            <div className="space-y-1.5 mb-8 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold font-sans text-[#0F2C59] uppercase tracking-widest block">Clinical Subject Images Manager</span>
                <h3 className="text-xl font-sans font-extrabold text-[#0F2C59]">정밀 진료과목별 전용 이미지 관리 (2×2 그리드)</h3>
                <p className="text-xs font-sans text-slate-400">각 진료과목 상세 란에 노출되는 4개 분할 사진(2x2 배열)을 실시간으로 교체/관리합니다.</p>
              </div>
            </div>

            <div className="space-y-12">
              {[
                { id: "spine", name: "통증 / 관절 / 척추질환" },
                { id: "internal", name: "내과질환" },
                { id: "allergy", name: "알레르기 및 면역질환" },
                { id: "cancer", name: "한양방 통합 암관리 클리닉" },
                { id: "detox", name: "항노화 및 생체 디톡스 해독" },
                { id: "paralysis", name: "안면신경 마비재생 센터" }
              ].map((subject) => {
                const baseImgList = subjectImagesMap[subject.id] || defaultSubjectImages[subject.id];
                let imgList = (subject.id === "cancer" || subject.id === "paralysis") ? [baseImgList[0]] : baseImgList;
                return (
                  <div key={subject.id} className="border border-slate-200/80 rounded-2xl p-5 sm:p-6 bg-slate-50/30">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <h4 className="text-base font-extrabold text-[#0F2C59] font-sans flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0F2C59]" />
                        {subject.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">ID: {subject.id}</span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {imgList.map((url, idx) => {
                        const uploadKey = `${subject.id}_${idx}`;
                        const labelList = subjectLabelsMap[subject.id] || defaultSubjectLabels[subject.id] || [];
                        let currentLabel = labelList[idx] || "";
                        
                        let locationLabel = `0${idx + 1}번 롤 파일`;
                        if (subject.id === "detox") {
                          if (idx === 0) locationLabel = "02번 위치 (항노화)";
                          else if (idx === 1) locationLabel = "03번 위치 (해독)";
                        }

                        return (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:shadow-sm transition-all">
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold bg-slate-100 text-[#0F2C59] px-2 py-0.5 rounded-md font-sans">{locationLabel}</span>
                                {subjectUploadingId === uploadKey && <span className="text-[9px] text-[#0F2C59] font-bold animate-pulse">업로드중...</span>}
                              </div>
                              <div className="aspect-square w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                <img src={url} alt={`${subject.name} ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>

                              {/* 명칭 관리 인풋 필드 */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 font-sans">사진 명칭 ({subject.id === "detox" ? (idx === 0 ? "항노화" : "해독") : `0${idx + 1}`})</label>
                                <input 
                                  type="text" 
                                  value={currentLabel} 
                                  onChange={(e) => handleSubjectLabelChange(subject.id, idx, e.target.value)}
                                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg font-sans focus:outline-none focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59]/10 bg-slate-50/50"
                                  placeholder="명칭 작성"
                                />
                              </div>
                            </div>

                            <div className="mt-3.5 space-y-1.5">
                              <label className="block w-full text-center py-1.5 bg-[#0F2C59] hover:bg-slate-800 text-white rounded-lg text-xs font-bold font-sans transition-all cursor-pointer shadow-sm">
                                사진 교체하기
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSubjectPhotoChange(subject.id, idx, e)} />
                              </label>
                              {subjectErrorMap[uploadKey] && (
                                <p className="text-[9px] text-red-500 font-bold leading-tight mt-1">{subjectErrorMap[uploadKey]}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 원내 소개 및 고유치료법 이미지 관리 탭 */}
        {activeSubTab === "intro_images" && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm text-left relative animate-fadeIn">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0F2C59] rounded-t-2xl" />
            <div className="space-y-1.5 mb-8 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold font-sans text-[#0F2C59] uppercase tracking-widest block">Clinic Introduction Images Manager</span>
                <h3 className="text-xl font-sans font-extrabold text-[#0F2C59]">원내 소개 및 3대 고유 치료 소개 이미지 관리</h3>
                <p className="text-xs font-sans text-slate-400">진료철학 및 특권 치료 안내에 즉시 노출되는 4대 이미지를 안전하게 관리 및 교체합니다.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {[
                { id: "philosophy_main", tag: "진료철학", name: "진료철학 메인 소개 사진", desc: "진료철학 소개 란 우측 하단 메인 이미지" },
                { id: "suseung_hwagang", tag: "특권 치료", name: "수승화강 기류 환경 사진", desc: "고유 치료 1열 '수승화강' 전면 이미지" },
                { id: "wisubae_annyeong", tag: "특권 치료", name: "위수배 안녕 한약 치료 사진", desc: "고유 치료 2열 '위수배 안녕' 전면 이미지" },
                { id: "wisubae_essential", tag: "고유치료", name: "삼잘에센셜 한약재 사진", desc: "고유치료법 탭 '삼잘에센셜' 소개 이미지" },
                { id: "daegwanjeol_donggichim", tag: "특권 치료", name: "심부 안정화 대관절 침법 침술 치료 사진", desc: "고유 치료 3열 '심부 안정화 대관절 침법' 전면 이미지" }
              ].map((item) => {
                const currentImg = introImagesMap[item.id];
                return (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold bg-[#0F2C59]/10 text-[#0F2C59] px-2 py-0.5 rounded-md font-sans">{item.tag}</span>
                        {introUploadingId === item.id && (
                          <span className="text-[9px] text-[#0F2C59] font-bold animate-pulse">업로드 중...</span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-[#2F2D2B] font-sans tracking-tight">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
                      
                      <div className="aspect-[4/3] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative">
                        <img 
                          src={currentImg} 
                          alt={item.name} 
                          className={`w-full h-full object-cover ${item.id === 'wisubae_annyeong' ? 'object-[center_70%]' : item.id === 'wisubae_essential' ? 'object-[center_80%]' : ''}`} 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <label className="block w-full text-center py-2 bg-[#0F2C59] hover:bg-slate-800 text-white rounded-lg text-xs font-bold font-sans transition-all cursor-pointer shadow-sm">
                        사진 변경하기
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleIntroPhotoChange(item.id, e)} 
                        />
                      </label>
                      {introErrorMap[item.id] && (
                        <p className="text-[10px] text-red-500 font-bold leading-tight mt-1">{introErrorMap[item.id]}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 사진 정보 편집 모달 */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-[#DFD5C6]/60 rounded-2xl shadow-2xl p-6 sm:p-8 relative text-left font-sans">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0F2C59] rounded-t-2xl" />
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#0F2C59] uppercase tracking-widest block">Media Editor</span>
                <h3 className="text-lg font-extrabold text-slate-800">원내 전경 사진 정보 편집</h3>
              </div>
              <button onClick={() => setEditingPhoto(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-all"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSavePhotoDetails} className="space-y-5">
              <div className="relative group border border-slate-100 rounded-xl overflow-hidden aspect-[16/9] bg-slate-50 mb-4">
                <img src={editPhotoPreview || editingPhoto.image} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-start justify-end p-2.5">
                  <button
                    type="button"
                    onClick={() => document.getElementById("edit-photo-file-input")?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2C59] hover:bg-slate-800 text-white font-sans font-bold text-xs rounded-lg shadow-lg cursor-pointer transition-all active:scale-95"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>편집</span>
                  </button>
                </div>
                <input
                  id="edit-photo-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditPhotoFile(file);
                      setEditPhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">노출 지점 선택 *</label>
                <select 
                  value={photoEditBranch} 
                  onChange={(e) => setPhotoEditBranch(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] font-sans font-bold"
                >
                  <option value="both">공통 (노원/구리 전체)</option>
                  <option value="nowon">노원점 단독</option>
                  <option value="guri">구리점 단독</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1.5">구분 꼬리표 (Tag) *</label>
                <input 
                  type="text" 
                  required 
                  value={photoEditTagLabel} 
                  onChange={(e) => setPhotoEditTagLabel(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] font-sans font-bold" 
                  placeholder="예: 대기실 & 접수데스크, 치료실 등" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">사진 제목 *</label>
                <input type="text" required value={photoEditTitle} onChange={(e) => setPhotoEditTitle(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] font-sans" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" disabled={photoUploading} onClick={() => setEditingPhoto(null)} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-sans text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all text-center">취소하기</button>
                <button type="submit" disabled={photoUploading} className="flex-1 py-2.5 bg-[#0F2C59] hover:bg-opacity-90 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-2">
                  {photoUploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <span>변경사항 저장</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 신규 사진 추가 모달 */}
      {isAddPhotoOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-[#DFD5C6]/60 rounded-2xl shadow-2xl p-6 sm:p-8 relative text-left font-sans">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0F2C59] rounded-t-2xl" />
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#0F2C59] uppercase tracking-widest block">Media Register</span>
                <h3 className="text-lg font-extrabold text-slate-800">신규 원내 전경 사진 기재</h3>
              </div>
              <button onClick={() => { setIsAddPhotoOpen(false); setNewPhotoTitle(""); setNewPhotoDesc(""); setNewPhotoFile(null); setNewPhotoPreview(""); setNewPhotoTagLabel("원내 인증 전경"); setPhotoAddError(""); }} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-all"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddPhotoSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">전경 사진 파일 선택 *</label>
                {newPhotoPreview ? (
                  <div className="relative border border-slate-100 rounded-xl overflow-hidden aspect-[16/9] bg-slate-50 mb-2 flex items-center justify-center">
                    <img src={newPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setNewPhotoFile(null); setNewPhotoPreview(""); }} className="absolute top-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white p-1.5 rounded-full transition-all cursor-pointer" title="사진 삭제"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#0F2C59]/40 bg-slate-50/50 hover:bg-slate-50/85 rounded-xl aspect-[16/9] mb-2 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all p-4 text-center group">
                    <div className="p-2.5 bg-slate-100 group-hover:bg-indigo-50 text-slate-400 group-hover:text-[#0F2C59] rounded-full transition-colors"><Upload className="w-5 h-5 pointer-events-none" /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">원내 로비, 치료실 등 사진 업로드</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">최대 권장 해상도 @2x (최대 10MB)</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleNewPhotoUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1.5">구분 꼬리표 (Tag) *</label>
                <input type="text" required value={newPhotoTagLabel} onChange={(e) => setNewPhotoTagLabel(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] font-sans font-bold" placeholder="예: 대기실 & 접수데스크, 치료실 등" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1.5">노출 지점 선택 *</label>
                <select 
                  value={newPhotoBranch} 
                  onChange={(e) => setNewPhotoBranch(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] font-sans font-bold"
                >
                  <option value="both">공통 (노원/구리 전체)</option>
                  <option value="nowon">노원점 단독</option>
                  <option value="guri">구리점 단독</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">사진 제목 *</label>
                <input type="text" required value={newPhotoTitle} onChange={(e) => setNewPhotoTitle(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] font-sans" placeholder="예: 아늑하고 깔끔한 1인 대기실" />
              </div>

              {photoAddError && (
                <div className="text-center text-xs text-red-500 font-bold py-1 bg-red-50 rounded-lg">{photoAddError}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsAddPhotoOpen(false); setNewPhotoTitle(""); setNewPhotoDesc(""); setNewPhotoFile(null); setNewPhotoPreview(""); setNewPhotoTagLabel("원내 인증 전경"); setPhotoAddError(""); }} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-sans text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all text-center">취소하기</button>
                <button type="submit" disabled={photoUploading} className="flex-1 py-2.5 bg-[#0F2C59] hover:bg-opacity-90 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed">
                  {photoUploading ? "업로드 중..." : "신규 사진 추가"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 자가진단 수정 모달 */}
      {editingDiag && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="w-full max-w-2xl bg-white border border-[#DFD5C6]/60 rounded-2xl shadow-2xl p-6 sm:p-8 relative text-left font-sans max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0F2C59] rounded-t-2xl" />
            <button onClick={() => setEditingDiag(null)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            <div className="mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0"><Pencil className="w-5 h-5" /></div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#2A2826] font-sans">자가진단 기록 수동 변경</h3>
                <p className="text-[11px] text-[#7A7571] mt-0.5 font-sans">환우의 인적 사항, 삼잘 상태 및 원장의 피드백 소견을 직접 보완하거나 정정할 수 있습니다.</p>
              </div>
            </div>
            <form onSubmit={handleUpdateDiag} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">연령 분류 *</label>
                  <select value={editDiagAge} onChange={(e) => setEditDiagAge(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] font-sans">
                    {["10대", "20대", "30대", "40대", "50대", "60대 이상"].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">성별 구분 *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["여성", "남성"].map(g => (
                      <button key={g} type="button" onClick={() => setEditDiagGender(g)} className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${editDiagGender === g ? "bg-[#0F2C59] text-white border-[#0F2C59]" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"}`}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className="block text-xs font-bold text-slate-600 mb-1.5">수면 상태</label><input type="text" value={editDiagSleep} onChange={(e) => setEditDiagSleep(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] font-sans" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1.5">식사 상태</label><input type="text" value={editDiagEat} onChange={(e) => setEditDiagEat(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] font-sans" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1.5">배변 상태</label><input type="text" value={editDiagPoop} onChange={(e) => setEditDiagPoop(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] font-sans" /></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-600 mb-1.5">직접 진술한 증상</label><textarea rows={2} value={editDiagSymptoms} onChange={(e) => setEditDiagSymptoms(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] font-sans leading-relaxed resize-none" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />AI 1차 자가진단 분석 결과</label><textarea rows={5} value={editDiagAnalysis} onChange={(e) => setEditDiagAnalysis(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] leading-relaxed resize-y" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-1.5">원장 보완 처방 및 후속 소견</label><textarea rows={3} value={editDiagDoctorNotes} onChange={(e) => setEditDiagDoctorNotes(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/25 focus:border-[#0F2C59] transition-all text-[#2A2826] font-sans leading-relaxed resize-y" /></div>
              {editDiagError && <div className="text-center text-xs text-red-500 font-bold py-1 bg-red-50 rounded-lg">{editDiagError}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingDiag(null)} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-sans text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all text-center">취소하기</button>
                <button type="submit" disabled={editDiagLoading} className="flex-1 py-2.5 bg-[#0F2C59] hover:bg-opacity-90 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer text-center">{editDiagLoading ? "수정 내용 저장 중..." : "진단기록 수정 완료"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 사진 삭제 확인 모달 */}
      {photoToDelete && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fadeIn">
          <div className="w-full max-w-sm bg-white border border-[#DFD5C6]/60 rounded-2xl shadow-2xl p-6 relative text-center font-sans overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1bg bg-rose-600 rounded-t-2xl" style={{ height: "4px" }} />
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50/70 flex items-center justify-center text-rose-600 mb-4 animate-pulse">
              <Trash2 className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#2A2826] font-sans">원내 전경 사진 영구 삭제</h3>
            <p className="text-xs text-[#7A7571] mt-2.5 font-sans leading-relaxed">
              해당 인테리어 사진 게시글을 행정 전산망 및 홈페이지에서 영구 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setPhotoToDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-sans text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all text-center"
              >
                취소하기
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = photoToDelete;
                  setPhotoToDelete(null);
                  await executeDeletePhoto(target.id, target.storagePath);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer text-center"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공지 삭제 확인 모달 */}
      {noticeToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fadeIn">
          <div className="w-full max-w-sm bg-white border border-[#DFD5C6]/60 rounded-2xl shadow-2xl p-6 relative text-center font-sans overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1bg bg-rose-600 rounded-t-2xl" style={{ height: "4px" }} />
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50/70 flex items-center justify-center text-rose-600 mb-4 animate-pulse">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#2A2826] font-sans">공지사항 영구 삭제</h3>
            <p className="text-xs text-[#7A7571] mt-2.5 font-sans leading-relaxed">
              선택하신 공지 게시글을 목록에서 영구 삭제하시겠습니까? 삭제된 공지사항은 즉시 복원이 불가능합니다.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setNoticeToDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-sans text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all text-center"
              >
                취소하기
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = noticeToDelete;
                  setNoticeToDelete(null);
                  await executeDeleteNotice(targetId);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer text-center"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 진단기록 삭제 확인 모달 */}
      {diagnosisToDelete && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fadeIn">
          <div className="w-full max-w-sm bg-white border border-[#DFD5C6]/60 rounded-2xl shadow-2xl p-6 relative text-center font-sans overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1bg bg-rose-600 rounded-t-2xl" style={{ height: "4px" }} />
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50/70 flex items-center justify-center text-rose-600 mb-4 animate-pulse">
              <Trash2 className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#2A2826] font-sans">진단 기록 영구 삭제</h3>
            <p className="text-xs text-[#7A7571] mt-2.5 font-sans leading-relaxed">
              선택하신 환우의 AI 자가진단 및 소견 기록을 관리 전산망에서 영구 삭제하시겠습니까?
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDiagnosisToDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-sans text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all text-center"
              >
                취소하기
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = diagnosisToDelete;
                  setDiagnosisToDelete(null);
                  await executeDeleteDiagnose(targetId);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer text-center"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 실시간 알림 피드백 토스트 모듈 */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-[#0c2244] border border-slate-700/60 text-white text-xs sm:text-sm font-sans font-bold px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn">
          {toastType === "success" ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs shrink-0 font-sans">✓</span>
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/15 text-rose-400 text-xs shrink-0 font-sans">!</span>
          )}
          <span className="tracking-tight">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
