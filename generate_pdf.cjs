const fs = require('fs');
const http = require('https');
const path = require('path');
const PDFDocument = require('pdfkit');

// 폰트 다운로드 함수
function downloadFont(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    http.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  const fontDir = path.join(__dirname, 'fonts');
  if (!fs.existsSync(fontDir)) {
    fs.mkdirSync(fontDir);
  }

  const regularFontPath = path.join(fontDir, 'NanumGothic.ttf');
  const boldFontPath = path.join(fontDir, 'NanumGothic-Bold.ttf');

  console.log('Downloading NanumGothic fonts...');
  try {
    if (!fs.existsSync(regularFontPath)) {
      await downloadFont('https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/NanumGothic-Regular.ttf', regularFontPath);
    }
    if (!fs.existsSync(boldFontPath)) {
      await downloadFont('https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/NanumGothic-Bold.ttf', boldFontPath);
    }
    console.log('Fonts downloaded successfully.');
  } catch (error) {
    console.error('Failed to download fonts. Falling back to default font (which might not support Korean):', error);
  }

  // PDF 생성 설정
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  const pdfPath = path.join(__dirname, 'public', 'samjal_essential_line.pdf');
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // 폰트 등록
  const hasKoreanFonts = fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath);
  if (hasKoreanFonts) {
    doc.registerFont('NanumGothic', regularFontPath);
    doc.registerFont('NanumGothic-Bold', boldFontPath);
    doc.font('NanumGothic');
  }

  // --- PDF 그리기 ---

  // 1. 헤더 영역
  // "SJ Summary" 로고 (좌측 상단)
  doc.fillColor('#0F2C59');
  if (hasKoreanFonts) {
    doc.font('NanumGothic-Bold').fontSize(26).text('SJ Summary', 50, 50);
  } else {
    doc.fontSize(26).text('SJ Summary', 50, 50);
  }

  // "삼잘한의원" 브랜드명 (우측 상단)
  if (hasKoreanFonts) {
    doc.font('NanumGothic').fontSize(12).fillColor('#64748B').text('삼잘한의원', 480, 55, { align: 'right' });
  }

  // 상단 데코레이션 라인
  doc.moveTo(50, 85).lineTo(545, 85).lineWidth(1).strokeColor('#E2E8F0').stroke();
  doc.moveTo(50, 85).lineTo(150, 85).lineWidth(2).strokeColor('#0F2C59').stroke();

  // "에센셜 라인 한눈에 살펴보기" 서브타이틀
  if (hasKoreanFonts) {
    doc.font('NanumGothic-Bold').fontSize(11).fillColor('#64748B').text('에센셜 라인 한눈에 살펴보기', 55, 95);
  }

  // 2. 콘텐츠 아이템 데이터
  const items = [
    {
      no: '01.',
      eng: 'Feather step',
      kor: '페더스텝',
      quote: '“깃털이 달린 듯 가벼운 발걸음을 위해”',
      desc: '관절내 염증 치료제',
      color: '#0F2C59'
    },
    {
      no: '02.',
      eng: 'Allergy-control',
      kor: '알레르기컨트롤',
      quote: '“급성과 만성을 함께 다스리는 종합 알레르기 솔루션”',
      desc: '비염/결막염/두드러기, 아토피, 천식 치료제',
      color: '#0D9488'
    },
    {
      no: '03.',
      eng: '수원단(粹源丹)',
      kor: '캡슐',
      quote: '“근원부터 깨끗하게 정화하는 해독항산화제”',
      desc: '해독/암 재발 및 전이관리/항산화 포뮬러',
      color: '#B45309'
    },
    {
      no: '04.',
      eng: 'Cell renewal',
      kor: '셀리뉴얼',
      quote: '“세포의 노화를 늦추는 신개념 항노화 포뮬러”',
      desc: '신개념 항노화/해독 치료제',
      color: '#4F46E5'
    },
    {
      no: '05.',
      eng: 'Goyo',
      kor: '고요',
      quote: '“생리적인 수면기전을 유도하는 불면증 솔루션”',
      desc: '천연물 수면 보조제',
      color: '#1E293B'
    },
    {
      no: '06.',
      eng: 'Primer oil',
      kor: '프라이머오일',
      quote: '“약의 효과를 증폭하고 염증을 억제하는 오일 형태의 치료제”',
      desc: '항염증 오일 (5-LOX억제를 통한 항알레르기/관절연골보호)',
      color: '#854D0E'
    }
  ];

  // 3. 아이템 루프 렌더링
  let startY = 135;
  const itemHeight = 98;

  items.forEach((item, index) => {
    const currentY = startY + index * itemHeight;

    // 아이템 구분선 (첫 아이템 제외)
    if (index > 0) {
      doc.moveTo(50, currentY - 12).lineTo(545, currentY - 12).lineWidth(0.5).strokeColor('#F1F5F9').stroke();
    }

    // 왼쪽 넘버링 박스 및 텍스트
    doc.fillColor(item.color);
    if (hasKoreanFonts) {
      doc.font('NanumGothic-Bold').fontSize(22).text(item.no, 55, currentY);
    } else {
      doc.fontSize(22).text(item.no, 55, currentY);
    }

    // 중앙/우측 텍스트 내용
    const textX = 110;

    // 타이틀: 영문 + 한글명
    doc.fillColor('#1E293B');
    if (hasKoreanFonts) {
      doc.font('NanumGothic-Bold').fontSize(14).text(item.eng, textX, currentY);
      const engWidth = doc.widthOfString(item.eng);
      doc.font('NanumGothic').fontSize(14).fillColor('#64748B').text('  ' + item.kor, textX + engWidth, currentY);
    } else {
      doc.fontSize(14).text(`${item.eng} ${item.kor}`, textX, currentY);
    }

    // 인용구 (Quote)
    doc.fillColor('#475569');
    if (hasKoreanFonts) {
      doc.font('NanumGothic').fontSize(10.5).text(item.quote, textX, currentY + 22);
    } else {
      doc.fontSize(10).text(item.quote, textX, currentY + 22);
    }

    // 설명문 (Description)
    doc.fillColor('#0F2C59');
    if (hasKoreanFonts) {
      doc.font('NanumGothic-Bold').fontSize(10.5).text(item.desc, textX, currentY + 42);
    } else {
      doc.fontSize(10).text(item.desc, textX, currentY + 42);
    }
  });

  // 4. 푸터 영역
  const footerY = 745;
  doc.moveTo(50, footerY).lineTo(545, footerY).lineWidth(1).strokeColor('#E2E8F0').stroke();
  
  if (hasKoreanFonts) {
    doc.font('NanumGothic').fontSize(9).fillColor('#94A3B8').text('본 자료는 삼잘한의원의 에센셜 라인 치료제 정보를 담은 공식 안내서입니다.', 50, footerY + 12);
    doc.font('NanumGothic-Bold').fontSize(11).fillColor('#64748B').text('03', 530, footerY + 10, { align: 'right' });
  }

  doc.end();
  console.log('PDF generated at:', pdfPath);
}

main();
