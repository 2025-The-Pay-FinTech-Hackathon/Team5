import joblib
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# 로드
bundle = joblib.load("finterm_chatbot.pkl")
model = SentenceTransformer(bundle["model_name"])  # 모델은 따로 로드
terms = bundle["terms"]
definitions = bundle["definitions"]
embeddings = bundle["embeddings"]

def get_best_definition(query, threshold=0.5):
    if len(query.strip().split()) == 1:
        query = f"{query.strip()}이 무엇인가요?"
    q_vec = model.encode([query])
    sims = cosine_similarity(q_vec, embeddings)[0]
    idx = int(sims.argmax())
    if sims[idx] >= threshold:
        return terms[idx], definitions[idx], sims[idx]
    return None, None, None

# 인터페이스
if __name__ == "__main__":
    while True:
        q = input("질문> ").strip()
        if q.lower() == "exit":
            break
        term, defi, score = get_best_definition(q)
        if term:
            print(f"\n✅ 용어: {term}\n📖 정의: {defi}\n📊 유사도: {score:.4f}")
        else:
            print("🙁 관련 용어를 찾지 못했습니다.")
