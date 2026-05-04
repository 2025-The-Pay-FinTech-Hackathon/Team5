from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import os

app = FastAPI()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "finterm_chatbot.pkl")

# 서버 시작 시 모델 1회 로딩
model = joblib.load(MODEL_PATH)


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


@app.get("/")
def health_check():
    return {"message": "Financial chatbot model server is running"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    question = request.question.strip()

    if not question:
        return {"answer": "질문을 입력해주세요."}

    try:
        # 가장 일반적인 sklearn pipeline 형태
        prediction = model.predict([question])

        answer = prediction[0]

        return {"answer": str(answer)}

    except Exception as e:
        print("Model prediction error:", e)
        return {"answer": "죄송합니다. 답변을 생성하는 중 오류가 발생했습니다."}