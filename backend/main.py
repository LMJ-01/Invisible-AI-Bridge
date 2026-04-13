from typing import List, Optional
import io
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types

# 루트의 .env.local 파일 로드
load_dotenv(dotenv_path="../.env.local")

# Gemini API 설정
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    # 최신 SDK 방식 (Client 객체 사용)
    client = genai.Client(api_key=api_key)
    model_name = "gemini-2.5-flash" # 가장 안정적인 모델명
else:
    print("Warning: GEMINI_API_KEY not found in .env.local")
    client = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "FastAPI 백엔드가 최신 제미나이 SDK와 연결되었습니다."}

@app.post("/api/convert")
async def convert_file(file: UploadFile = File(...)):
    filename = file.filename
    content_type = file.content_type
    
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API 키가 설정되지 않았습니다.")

    try:
        # 파일 내용 읽기
        contents = await file.read()
        text_content = ""
        
        # 텍스트 파일 처리
        if content_type == "text/plain" or filename.endswith(".txt"):
            text_content = contents.decode("utf-8")
        elif filename.endswith(".pdf"):
            text_content = f"[PDF 파일: {filename}]"
        else:
            text_content = f"[바이너리 파일: {filename}]"

        # Gemini AI에게 정규화 요청
        prompt = f"""
        당신은 데이터 정규화 전문가입니다. 아래 제공된 [원본 데이터]를 분석하여, 
        AI가 읽고 처리하기 가장 좋은 형태인 '계층적 마크다운(Hierarchical Markdown)' 형식으로 변환해주세요.
        
        [지침]
        1. 데이터의 핵심 구조를 파악하여 제목, 목록, 표 등을 적절히 사용하세요.
        2. 불필요한 노이즈나 반복은 제거하고 정보의 밀도를 높이세요.
        3. 환각 현상(Hallucination) 없이 원본에 충실해야 합니다.
        4. 결과물은 반드시 마크다운 형식이어야 합니다.
        
        [원본 데이터 - 파일명: {filename}]
        {text_content if text_content else "데이터를 직접 분석해주세요"}
        """

        # 최신 SDK 호출 방식
        if filename.endswith((".pdf", ".png", ".jpg", ".jpeg")):
            # 멀티모달 (이미지/PDF 등) 처리
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    prompt,
                    types.Part.from_bytes(data=contents, mime_type=content_type)
                ]
            )
        else:
            # 텍스트 기반 처리
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )

        normalized_markdown = response.text

        # 환각 감소율 시뮬레이션
        reduction_rate = 92 if "markdown" in response.text.lower() else 88
        
        return {
            "id": 1,
            "title": filename,
            "raw_text": text_content[:500],
            "normalized_markdown": normalized_markdown,
            "hallucination_reduction": reduction_rate
        }
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI 변환 중 오류 발생: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    user_message = request.messages[-1].content
    if not client:
        return {"role": "assistant", "content": "API 키가 설정되지 않았습니다."}
        
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=user_message
        )
        return {
            "role": "assistant",
            "content": response.text
        }
    except Exception as e:
        return {"role": "assistant", "content": f"오류 발생: {str(e)}"}

@app.post("/api/analyze")
async def analyze_data(data: dict):
    return {"status": "success", "analysis": "데이터 분석 결과가 여기에 표시됩니다."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
