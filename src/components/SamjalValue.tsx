import { HeartPulse, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

export default function SamjalValue() {
  const values = [
    {
      title: "잘자기",
      desc: (
        <>
          잠은 단순한 휴식이 아닙니다. 항산화/항노화/재생의 원천입니다.<br />
          잘 자지 못하면 건강은 반드시 나빠지게 됩니다.
        </>
      ),
    },
    {
      title: "잘먹기",
      desc: (
        <>
          먹는 것이 곧 내 몸이 됩니다.<br />
          좋은 음식을 잘 받아들일 수 있는 상태가 되어야 합니다.
        </>
      ),
    },
    {
      title: "잘보내기",
      desc: (
        <>
          호흡, 대/소변, 땀을 통해 불필요한 노폐물을 원활히 배출할 수 있어야 합니다.<br />
          잘 보내야 잘 채울 수 있습니다.
        </>
      ),
    },
  ];

  return (
    <section className="py-20 bg-[#F8FAFC] border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 상단 타이포그래피 안내 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-3 mb-16"
        >
          <p className="text-xs sm:text-sm font-sans text-[#0F2C59] tracking-[0.3em] uppercase font-bold">
            Health Philosophy & Harmony
          </p>
          <h2 className="text-2xl sm:text-4xl font-sans text-[#0F172A] font-bold tracking-wide">
            건강의 기본기 세가지 잘하기
          </h2>
          <div className="w-12 h-0.5 bg-[#0F2C59] mx-auto mt-4" />
          <p className="text-sm font-sans text-slate-500 max-w-xl mx-auto pt-2 leading-relaxed">
            우리 몸 본연의 자생력을 되찾는 한의 치료,<br className="sm:hidden" /> 삼잘한의원입니다.<br />
            끊임없는 연구와 세심한 진료로 함께하겠습니다.
          </p>
        </motion.div>

        {/* 2컬럼 레이아웃 (왼쪽 귀여운 캐릭터 드로잉, 오른쪽 명인 텍스트 영역) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* 왼쪽 삼잘 일러스트 캐릭터 뷰포트 (사용자 그림 1:1 완벽 정위 매치) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, scale: 1.01, transition: { duration: 0.3 } }}
            className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-md relative overflow-hidden group cursor-pointer"
          >
            <div className="w-full max-w-[400px] overflow-hidden rounded-xl bg-transparent mix-blend-multiply flex items-center justify-center p-1">
              <img
                src="/images/samjal_characters_colored.jpg"
                alt="삼잘한의원 캐릭터 일러스트"
                className="w-full h-auto object-contain group-hover:scale-102 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* 하단 동글동글 엠블럼 */}
            <h3 className="text-2xl font-sans font-bold text-[#0F2C59] tracking-widest mt-6">
              삼잘한의원
            </h3>
          </motion.div>

          {/* 오른쪽 3대 철학 텍스트 상세 (사용자 그림 글자 완벽 100% 매치 및 세련 확장) */}
          <div className="lg:col-span-7 space-y-10 pl-0 lg:pl-6">
            {values.map((val, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative pl-8 sm:pl-10 space-y-2 group"
              >
                {/* 세련된 한방 디자인 표식 */}
                <span className="absolute left-0 -top-0.5 sm:left-0 sm:top-1 text-2xl font-sans font-extrabold text-slate-200 group-hover:text-[#0F2C59] transition-colors duration-300">
                  0{index + 1}
                </span>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h4 className="text-xl sm:text-2xl font-sans font-bold text-[#0F172A] group-hover:text-[#0F2C59] transition-colors font-sans">
                    {val.title}
                  </h4>
                </div>
                
                <p className="text-[15px] sm:text-[17px] font-sans text-slate-600 leading-relaxed tracking-wide pt-2 border-l-2 border-slate-200 pl-4 group-hover:border-[#0F2C59] transition-all">
                  {val.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
