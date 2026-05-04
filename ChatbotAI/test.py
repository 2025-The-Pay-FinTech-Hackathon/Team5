import json
import os
import re
import sys

import joblib
import numpy as np

BASE_DIR = os.path.dirname(os.path.realpath(__file__))
BUNDLE_PATH = os.path.join(BASE_DIR, "finterm_chatbot.pkl")

bundle = joblib.load(BUNDLE_PATH)
terms = bundle["terms"]
definitions = bundle["definitions"]
embeddings = np.asarray(bundle["embeddings"], dtype=np.float32)
embedding_norms = np.linalg.norm(embeddings, axis=1)
term_map = {str(term).lower(): index for index, term in enumerate(terms)}
model = None


def normalize_text(text):
    return re.sub(r"[^0-9a-zA-Z가-힣]+", " ", str(text).lower()).strip()


def get_model():
    global model

    if model is None:
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer(bundle["model_name"])

    return model


def find_direct_term(query):
    norm = normalize_text(query)
    if not norm:
        return None

    for term, index in term_map.items():
        if term and term in norm:
            return terms[index], definitions[index], index

    for token in norm.split():
        if token in term_map:
            index = term_map[token]
            return terms[index], definitions[index], index

    return None


def cosine_scores(query_vector):
    query_vector = np.asarray(query_vector, dtype=np.float32)
    query_norm = np.linalg.norm(query_vector)

    if query_norm == 0:
        return np.zeros(len(embeddings), dtype=np.float32)

    denominator = embedding_norms * query_norm
    return np.divide(
        embeddings @ query_vector,
        denominator,
        out=np.zeros_like(embedding_norms, dtype=np.float32),
        where=denominator != 0,
    )


def get_best_definition(query, threshold=0.45):
    direct_match = find_direct_term(query)
    if direct_match:
        term, definition, _ = direct_match
        return term, definition, 1.0

    normalized_query = str(query).strip()
    if len(normalized_query.split()) == 1:
        normalized_query = f"{normalized_query}가 무엇인가요?"

    query_vector = get_model().encode([normalized_query], show_progress_bar=False)[0]
    similarities = cosine_scores(query_vector)
    index = int(similarities.argmax())

    if similarities[index] >= threshold:
        return terms[index], definitions[index], float(similarities[index])

    return None, None, None


def answer_query(query):
    term, definition, score = get_best_definition(query)

    if term:
        return {
            "term": term,
            "definition": definition,
            "similarity": float(score),
        }

    return {"error": "관련 용어를 찾지 못했습니다."}


def run_worker():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        request_id = None

        try:
            payload = json.loads(line)
            request_id = payload.get("id")
            result = answer_query(payload.get("message", ""))
        except Exception as error:
            result = {"error": "챗봇 처리 중 오류가 발생했습니다."}
            if os.environ.get("CHATBOT_DEBUG"):
                result["detail"] = str(error)

        result["id"] = request_id
        print(json.dumps(result, ensure_ascii=False), flush=True)


def run_once(query):
    print(json.dumps(answer_query(query), ensure_ascii=False))


def run_repl():
    while True:
        query = input("질문> ").strip()
        if query.lower() == "exit":
            break

        result = answer_query(query)
        if result.get("term"):
            print(
                f"\n용어: {result['term']}\n"
                f"\n정의: {result['definition']}\n"
                f"유사도: {result['similarity']:.4f}"
            )
        else:
            print(result["error"])


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--worker":
        run_worker()
    elif len(sys.argv) > 1:
        run_once(sys.argv[1])
    else:
        run_repl()
