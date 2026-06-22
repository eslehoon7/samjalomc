import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp as initFirebaseApp } from "firebase/app";
import { getStorage as getFirebaseStorage, ref as storageRef, uploadBytes as uploadBytesToStorage, getDownloadURL as getStorageDownloadURL } from "firebase/storage";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Server-side Firebase Initialization
let serverStorage: any = null;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const fbApp = initFirebaseApp(firebaseConfig);
    serverStorage = getFirebaseStorage(fbApp);
    console.log("Server-side Firebase Storage initialized successfully from firebase-applet-config.json:", firebaseConfig.projectId);
  } else {
    console.warn("firebase-applet-config.json not found inside server.ts!");
  }
} catch (err) {
  console.warn("Failed to initialize server-side Firebase app from config file:", err);
}

// 임시 인메모리 예약 저장소 (관리용 데모)
interface Reservation {
  id: string;
  name: string;
  phone: string;
  branch: string;
  subject: string;
  date: string;
  time: string;
  memo: string;
  status: string; // "미확인" | "예약조율중" | "상담완료"
  createdAt: string;
}

const reservations: Reservation[] = [
  {
    id: "1",
    name: "홍길동",
    phone: "010-1234-5678",
    branch: "노원점",
    subject: "통증/관절/척추질환",
    date: "2026-06-01",
    time: "14:00",
    memo: "만성 요통이 있어서 치료받고 싶습니다.",
    status: "미확인",
    createdAt: new Date().toISOString()
  }
];

// 임시 공지사항 데이터
interface Notice {
  id: number;
  title: string;
  content: string;
  date: string;
  views: number;
  isPinned?: boolean;
}

const notices: Notice[] = [
  {
    id: 1,
    title: "삼잘한의원 공식 홈페이지 그랜드 오픈 안내",
    content: "전통 한방 마인드와 최신 의학지식의 조화를 추구하는 삼잘한의원의 공식 홈페이지가 오픈했습니다. 노원점과 구리점에서 따뜻한 마음으로 고객님을 모시겠습니다.",
    date: "2026-05-20",
    views: 112,
    isPinned: true
  },
  {
    id: 2,
    title: "[공통] 하절기 수면/위장 장애 다스리기 한방 강좌",
    content: "삼잘의 기본인 '잘자기'와 '잘먹기'를 지키는 방법을 안내해 드립니다. 무더위 속 무너지는 수면 패턴과 위장 운동력을 회복하는 수칙을 원장님들께서 정성스럽게 알려드립니다.",
    date: "2026-05-25",
    views: 48,
    isPinned: false
  },
  {
    id: 3,
    title: "국가대표 패럴림픽 주치의 전준영/제정진 원장 초빙 진료일정 안내",
    content: "국가대표 선수들의 관절 및 신경 회복 관리를 진두지휘하신 원장님들의 정밀 '심부 안정화 대관절 침법' 클리닉 일정입니다. 조기 예약이 필수이오니 많은 관심 부탁드립니다.",
    date: "2026-05-26",
    views: 31,
    isPinned: false
  }
];

interface DiagnoseItem {
  id: string;
  sleep: string;
  eat: string;
  poop: string;
  age: string;
  gender: string;
  symptoms: string;
  createdAt: string;
  analysis: string;
  doctorNotes?: string;
}

const diagnoses: DiagnoseItem[] = [
  {
    id: "1",
    sleep: "잠이 오지 않고 깊이 자지 못합니다.",
    eat: "식후 속이 아주 더부룩하고 가스가 자주 찹니다.",
    poop: "소화불량이 오면 변비가 동반됩니다.",
    age: "45",
    gender: "여성",
    symptoms: "상열감이 자주 발생하며, 등과 뒷목 부위의 극심한 근건 통증과 만성적인 불면증이 겹쳐 일상생활이 힘겹습니다.",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    analysis: `### [삼잘한의원 정밀 한방 삼잘(三잘) 진단 보고서]

귀하의 건강 상태를 동양의학의 세 가지 근본 축인 **'잘자기(수면)', '잘먹기(식이)', '잘싸기(배변)'**의 관점으로 세심히 분석하고 정밀 분석 보고서를 제안해드립니다.

---

#### 1. 대강(大綱) - 삼잘 균형 총평
현재 환우분의 삼잘 점수는 **불균형 가중 단계**에 놓여 있습니다. 수면이 불완전(불면)하고 비위에 만성 가스와 독소(식적)가 고여 있어 기혈 순환이 정체되며, 이것이 경락을 타고 상부로 뻗쳐 '경추 및 대관절 신경염' 및 상열감을 야기하는 구도입니다.

---

#### 2. 각론(各論) - 지표별 상세 처방 소견
*   **잘자기(수면 - 잠들기 어려움 및 잦은 깸)**: 상체 심열(心熱)을 가라앉히고 신장의 음양 조화를 회복하는 산조인 차와 마그네슘이 융합된 케어가 보조적으로 도움이 됩니다.
*   **잘먹기(소화불량 및 더부룩함)**: 중초 비위가 냉하고 소통되지 않는 비양허(脾陽虛) 증상이 있으므로 생강과 진피(귤껍질)를 은은히 달여 장을 데워주어야 소화가 편안해집니다.
*   **잘싸기(변비 현상)**: 기체(氣滯)로 인해 장 전반의 연동력이 굳어 있으므로 하복부 침 치료와 고섬유 식단을 매칭해주시기 강경 권고합니다.`
  }
];

// 1. 예약 API 엔드포인트
app.post("/api/reservations", (req, res) => {
  const { name, phone, branch, subject, date, time, memo } = req.body;
  if (!name || !phone || !branch || !subject || !date || !time) {
    return res.status(400).json({ error: "필수 예약 항목이 누락되었습니다." });
  }

  const newReservation: Reservation = {
    id: String(reservations.length + 1),
    name,
    phone,
    branch,
    subject,
    date,
    time,
    memo: memo || "",
    status: "미확인",
    createdAt: new Date().toISOString()
  };

  reservations.push(newReservation);
  res.status(201).json({ success: true, reservation: newReservation });
});

app.get("/api/reservations", (req, res) => {
  res.json(reservations);
});

app.put("/api/reservations/:id", (req, res) => {
  const reservation = reservations.find(r => r.id === req.params.id);
  if (!reservation) return res.status(404).json({ error: "예약 정보를 찾을 수 없습니다." });
  
  const { status } = req.body;
  if (status) {
    reservation.status = status;
  }
  res.json({ success: true, reservation });
});

app.delete("/api/reservations/:id", (req, res) => {
  const index = reservations.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "예약 정보를 찾을 수 없습니다." });
  
  reservations.splice(index, 1);
  res.json({ success: true });
});

// 2. 공지사항 API 엔드포인트
app.get("/api/notices", (req, res) => {
  res.json(notices);
});

app.post("/api/notices", (req, res) => {
  const { title, content, isPinned } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "제목과 내용은 대단히 필수적입니다." });
  }

  const newNotice: any = {
    id: Date.now(),
    title,
    content,
    date: new Date().toISOString().split("T")[0],
    views: 0,
    isPinned: !!isPinned
  };

  notices.unshift(newNotice);
  res.status(201).json({ success: true, notice: newNotice });
});

app.get("/api/notices/:id", (req, res) => {
  const notice = notices.find(n => n.id === Number(req.params.id));
  if (!notice) return res.status(404).json({ error: "공지사항을 찾을 수 없습니다." });
  notice.views += 1;
  res.json(notice);
});

app.put("/api/notices/:id", (req, res) => {
  const notice = notices.find(n => n.id === Number(req.params.id));
  if (!notice) return res.status(404).json({ error: "공지사항을 찾을 수 없습니다." });
  
  const { title, content, isPinned } = req.body;
  if (title !== undefined) notice.title = title;
  if (content !== undefined) notice.content = content;
  if (isPinned !== undefined) notice.isPinned = !!isPinned;
  
  res.json({ success: true, notice });
});

app.delete("/api/notices/:id", (req, res) => {
  const index = notices.findIndex(n => n.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "공지사항을 찾을 수 없습니다." });
  
  notices.splice(index, 1);
  res.json({ success: true });
});

// 3. AI 삼잘 자가 건강 진단 API 엔드포인트
app.post("/api/diagnose", async (req, res) => {
  const { sleep, eat, poop, age, gender, symptoms } = req.body;

  if (!sleep || !eat || !poop) {
    return res.status(400).json({ error: "수면, 식이, 배변 상태 조건이 필요합니다." });
  }

  const prompt = `
  [한의학 자가진단 1차 초간단 분석요청 - 초소형 요약 및 예산절감용]
  환자 기본 정보: 나이 ${age || "미기재"}, 성별 ${gender || "미기재"}
  주요 불편 증상: ${symptoms || "특이사항 없음"}
  수면 상태: ${sleep}
  식이 상태: ${eat}
  배변 상태: ${poop}

  위 지표들에 대해 매우 간단하고 핵심 요약(각 지표별 1~2문장 이내)으로 한방 1차 분석 리포트를 작성해 주세요. 불필요한 장황한 서론과 거창한 수식어는 배제하여 리소스를 아끼십시오.

  [답변 포맷]
  ### [삼잘한의원 1차 간이 자가진단 분석본]
  ---
  #### ● 삼잘 기혈 상태 한줄진단
  - (내용 기재)
  
  #### ● 1차 수면/식이/배변 소견
  * **수면(잘자기)**: (내용)
  * **식이(잘먹기)**: (내용)
  * **배변(잘싸기)**: (내용)
  `;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // API Key가 없거나 데모 환경일 때의 매우 가볍고 직관적인 Fallback 결과물
      const mockAnalysis = `### [삼잘한의원 1차 간이 자가진단 분석본]
---
#### ● 삼잘 기혈 상태 한줄진단
- 현재 비위와 대장 주변에 경미한 열독이 쌓여 상부의 숙면 흐름을 방해하는 '상열하한(上熱下寒)'의 불균형 징후가 초입 상태로 감지됩니다.

#### ● 1차 수면/식이/배변 소견
* **수면(잘자기)**: 만성적인 잦은 깸 및 교감신경의 긴장이 주원인으로 산조인 차나 족욕이 1차 숙면에 기여해 줍니다.
* **식이(잘먹기)**: 소화 비위의 연동력이 둔화되어 가스가 차기 쉬우니 하복부 온열 처방 및 미지근한 음용 습관을 권장합니다.
* **배변(잘싸기)**: 대장 점막의 수분 불균형이나 연동 저하로 잔변이 남는 기체(氣滯) 양상이므로 따뜻하게 한방 순환을 돕는 치료가 좋습니다.`;

      const newD: DiagnoseItem = {
        id: String(Date.now()),
        sleep,
        eat,
        poop,
        age: age || "미기재",
        gender: gender || "미기재",
        symptoms: symptoms || "특이사항 없음",
        createdAt: new Date().toISOString(),
        analysis: mockAnalysis,
        doctorNotes: req.body.doctorNotes || "" // 원장이 직접 추가 기재하여 보완할 수 있는 별도 영역
      };
      diagnoses.unshift(newD);
      return res.json({ analysis: mockAnalysis, isDemo: true, diagnosis: newD });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5
      }
    });

    const resultText = response.text || "해결책을 분석해내지 못하였습니다. 잠시 후 감사하겠습니다.";
    const newD: DiagnoseItem = {
      id: String(Date.now()),
      sleep,
      eat,
      poop,
      age: age || "미기재",
      gender: gender || "미기재",
      symptoms: symptoms || "특이사항 없음",
      createdAt: new Date().toISOString(),
      analysis: resultText,
      doctorNotes: req.body.doctorNotes || ""
    };
    diagnoses.unshift(newD);

    res.json({ analysis: resultText, isDemo: false, diagnosis: newD });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "자가진단을 수행하는 동안 시스템 오류가 발생했습니다.", details: error.message });
  }
});

// 자가진단 관리 API 엔드포인트
app.get("/api/diagnoses", (req, res) => {
  res.json(diagnoses);
});

app.put("/api/diagnoses/:id", (req, res) => {
  const diagnosis = diagnoses.find(d => d.id === req.params.id);
  if (!diagnosis) return res.status(404).json({ error: "진단 기록을 찾을 수 없습니다." });
  
  const { age, gender, sleep, eat, poop, symptoms, analysis, doctorNotes } = req.body;
  if (age !== undefined) diagnosis.age = age;
  if (gender !== undefined) diagnosis.gender = gender;
  if (sleep !== undefined) diagnosis.sleep = sleep;
  if (eat !== undefined) diagnosis.eat = eat;
  if (poop !== undefined) diagnosis.poop = poop;
  if (symptoms !== undefined) diagnosis.symptoms = symptoms;
  if (analysis !== undefined) diagnosis.analysis = analysis;
  if (doctorNotes !== undefined) diagnosis.doctorNotes = doctorNotes || "";
  
  res.json({ success: true, diagnosis });
});

app.delete("/api/diagnoses/:id", (req, res) => {
  const index = diagnoses.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "진단 기록을 찾을 수 없습니다." });
  
  diagnoses.splice(index, 1);
  res.json({ success: true });
});

// 이미지 파일 업로드 프록시 API (CORS 및 iframe 제약 없이 백엔드에서 다이렉트로 Firebase Storage에 업로드)
app.post("/api/photos/upload", async (req, res) => {
  try {
    const { fileData, fileName } = req.body;
    if (!fileData || !fileName) {
      return res.status(400).json({ error: "업로드할 파일 데이터 또는 파일 이름이 유실되었습니다." });
    }

    if (!serverStorage) {
      return res.status(500).json({ error: "서버가 현재 Firebase Storage 인스턴스를 확보하지 못했습니다." });
    }

    // Base64 형식 파싱 및 Buffer 변환
    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "유효한 Base64 데이터 및 이미지 규격이 아닙니다." });
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");

    const finalStoragePath = `site-images/gallery/${Date.now()}_${fileName}`;
    const fileRef = storageRef(serverStorage, finalStoragePath);

    // Metadata 헤더 지정하여 브라우저에서 다운로드 혹은 스트리밍 시 정상 Content-Type 유지 가능
    await uploadBytesToStorage(fileRef, buffer, { contentType: mimeType });

    const downloadUrl = await getStorageDownloadURL(fileRef);

    res.json({
      success: true,
      imageUrl: downloadUrl,
      storagePath: finalStoragePath
    });
  } catch (error: any) {
    console.error("서버측 이미지 파일 Storage 업로드 에러:", error);
    res.status(500).json({ error: "서버 Storage 업로드 중 시스템 오류가 발생했습니다.", details: error.message });
  }
});

// Vite 및 정적 리소스 브릿지
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Samjal Clinic Oriental Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
