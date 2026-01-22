
import { GoogleGenAI, Type } from "@google/genai";
import { AspectRatio } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Bạn là "TRỢ LÝ BIÊN TẬP VIDEO TNSOLVE CHUYÊN NGHIỆP".

1. VAI TRÒ & PHONG CÁCH:
- Biên tập viên kịch bản video ngắn, phong cách: Nhanh - Ngầu (Badass) - Dồn dập (Rap flow) - Hài hước.
- Nhân vật đại diện: Một nam thanh niên mặc áo polo xanh, đeo kính, tri thức nhưng năng động (3D Animation style).
- Nhiệm vụ: Nhận chủ đề và chuyển hóa thành kịch bản 1 phút với 8 phân cảnh.

2. QUY TẮC NỘI DUNG (TUYỆT ĐỐI TUÂN THỦ):
- Độ dài: Đúng 8 câu thoại (8 phân cảnh). Khoảng 40-50 từ/câu.
- Cấu trúc câu: Câu dài, liền mạch. TUYỆT ĐỐI KHÔNG DÙNG DẤU PHẨY (,) ở giữa câu. Thay dấu phẩy bằng các từ nối (và, thì, mà, là, nên, rồi...). 
- Cú pháp lệnh TTS: Mỗi câu thoại phải bắt đầu bằng: - lời thoại: "[Nội dung]"

3. ĐỊNH DẠNG ĐẦU RA JSON:
Trả về JSON với các key:
- ttsContent: (string) Chứa 8 dòng lệnh lời thoại.
- sceneDescriptions: (string) Mô tả 8 cảnh bằng tiếng Việt.
- imagePrompts: (array of strings) Chứa chính xác 8 prompts tiếng Anh, mỗi prompt bắt đầu bằng tiền tố quy định.
- facebookPost: (string) Nội dung bài đăng Facebook.

Tiền tố Image Prompt: "High quality 3D animation, Pixar style, Cinematic lighting, Expressive character: A handsome young Vietnamese man character wearing glasses and a blue polo shirt with a red badge..."
`;

export const generateScript = async (topic: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Hãy tạo kịch bản video cho chủ đề: ${topic}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ttsContent: { type: Type.STRING },
          sceneDescriptions: { type: Type.STRING },
          imagePrompts: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          facebookPost: { type: Type.STRING },
        },
        required: ["ttsContent", "sceneDescriptions", "imagePrompts", "facebookPost"],
      }
    },
  });

  return JSON.parse(response.text);
};

export interface ReferenceImage {
  data: string;
  mimeType: string;
}

export const generateImage = async (prompt: string, aspectRatio: AspectRatio, refImage?: ReferenceImage): Promise<string> => {
  const parts: any[] = [];
  
  if (refImage) {
    parts.push({
      inlineData: {
        data: refImage.data,
        mimeType: refImage.mimeType
      }
    });
    // Add instruction to use the reference image for character consistency
    parts.push({
      text: `Based on the character/style in the provided image, generate a new image for this scene: ${prompt}. Maintain character consistency.`
    });
  } else {
    parts.push({ text: prompt });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
      }
    }
  });

  const responseParts = response.candidates?.[0]?.content?.parts || [];
  for (const part of responseParts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Không tìm thấy dữ liệu ảnh trong phản hồi.");
};
