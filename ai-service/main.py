from __future__ import annotations

import os
import re
import random
import logging
import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple
from urllib.request import urlopen, Request

import faiss
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException
from neo4j import GraphDatabase
from google import genai
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer

app = FastAPI(title="AI Service")
logger = logging.getLogger("ai-service")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))


@dataclass
class Product:
    product_id: int
    name: str
    category: str
    price: float
    description: str


class ChatbotRequest(BaseModel):
    query: str
    user_id: int = 1


class LSTMModel(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 64, output_dim: int = 100):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        return self.fc(out)


class HybridAIEngine:
    def __init__(self):
        self.data_dir = Path(os.getenv("AI_DATA_DIR", "/app/data"))
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.products = self._build_product_catalog()
        if not self.products:
            self.products = self._build_fallback_product_catalog()
        self.product_ids = [p.product_id for p in self.products]
        self.product_by_id = {p.product_id: p for p in self.products}

        self.behavior_path = self.data_dir / "user_behavior.csv"

        self.product_to_index = {pid: idx + 1 for idx, pid in enumerate(self.product_ids)}
        self.index_to_product = {idx + 1: pid for idx, pid in enumerate(self.product_ids)}

        self.user_histories: Dict[int, List[int]] = {}
        self.user_search_terms: Dict[int, str] = {}
        self.user_buy_edges: Dict[int, Dict[int, float]] = {}
        self.similar_edges: Dict[int, Dict[int, float]] = {}

        self.lstm_model: LSTMModel | None = None
        self.rag_vectorizer: TfidfVectorizer | None = None
        self.rag_index: faiss.IndexFlatIP | None = None
        self.rag_matrix: np.ndarray | None = None
        self.rag_product_order: List[int] = []

        self.neo4j_driver = None
        self.neo4j_enabled = False
        self._try_connect_neo4j()

    def initialize(self):
        rebuild_dataset = os.getenv("AI_REBUILD_DATASET", "1") == "1"
        self._generate_behavior_dataset_if_missing(force=rebuild_dataset)
        behavior_df = pd.read_csv(self.behavior_path)
        self._prepare_behavior_views(behavior_df)
        self._build_graph_edges(behavior_df)
        self._build_rag_index()
        self._train_lstm()
        self._sync_graph_to_neo4j(behavior_df)

    def _build_product_catalog(self) -> List[Product]:
        product_service_url = os.getenv("PRODUCT_SERVICE_URL", "http://product-service:8001")
        url = f"{product_service_url.rstrip('/')}/products/"

        try:
            with urlopen(url, timeout=6) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception:
            logger.exception("Cannot fetch products from product-service. Fallback to local catalog.")
            return []

        raw_products = data if isinstance(data, list) else data.get("results", [])
        result: List[Product] = []
        for item in raw_products:
            try:
                pid = int(item["id"])
                name = item.get("name", "Product")
                category = item.get("domain", "electronics")
                price = float(item.get("final_price") or item.get("price") or 0)
                desc = item.get("description") or item.get("short_description") or ""
                result.append(Product(pid, name, category, price, desc))
            except Exception:
                continue

        if result:
            logger.info("Loaded %s products from product-service for AI engine.", len(result))
        return result

    def _build_fallback_product_catalog(self) -> List[Product]:
        return [
            Product(101, "Laptop Gaming Nitro 5", "electronics", 980.0, "Laptop gaming RTX, 16GB RAM, SSD 512GB, phù hợp học tập và chơi game."),
            Product(102, "Laptop Văn Phòng Slim", "electronics", 620.0, "Laptop mỏng nhẹ, pin tốt, phù hợp làm việc văn phòng và học online."),
            Product(103, "Tai Nghe Bluetooth Pro", "electronics", 65.0, "Tai nghe chống ồn chủ động, pin 30 giờ, kết nối ổn định."),
            Product(104, "Smartphone Camera 50MP", "electronics", 430.0, "Điện thoại pin 5000mAh, camera rõ nét, hiệu năng ổn định."),
            Product(201, "Clean Code", "book", 15.0, "Sách kỹ thuật phần mềm kinh điển về tư duy viết mã sạch."),
            Product(202, "Introduction to Algorithms", "book", 25.0, "Giáo trình thuật toán đầy đủ cho sinh viên công nghệ thông tin."),
            Product(203, "Designing Data-Intensive Applications", "book", 29.0, "Sách về kiến trúc hệ thống phân tán, dữ liệu lớn và độ tin cậy."),
            Product(301, "Áo Thun Cotton Basic", "fashion", 12.0, "Áo thun thoáng mát, form đẹp, dễ phối đồ hàng ngày."),
            Product(302, "Giày Chạy Bộ AirRun", "fashion", 45.0, "Giày chạy bộ đế êm, bám đường tốt, nhẹ chân."),
            Product(303, "Balo Laptop Chống Nước", "fashion", 28.0, "Balo nhiều ngăn, chống nước nhẹ, đựng laptop 15.6 inch."),
        ]

    def _query_templates_for_category(self, category: str) -> List[str]:
        if category == "electronics":
            return [
                "laptop giá rẻ học online",
                "laptop văn phòng pin trâu",
                "điện thoại pin khỏe",
                "tai nghe bluetooth chống ồn",
            ]
        if category == "book":
            return [
                "sách lập trình dễ hiểu",
                "sách thuật toán cho sinh viên",
                "sách hệ thống phân tán",
            ]
        if category == "fashion":
            return [
                "giày chạy bộ giá tốt",
                "áo thun cotton nam",
                "balo laptop chống nước",
            ]
        return ["sản phẩm phù hợp nhu cầu"]

    def _generate_behavior_dataset_if_missing(self, force: bool = False):
        if self.behavior_path.exists() and not force:
            return

        rng = random.Random(42)
        now = datetime.utcnow() - timedelta(days=5)
        rows = []

        by_category: Dict[str, List[int]] = {}
        for p in self.products:
            by_category.setdefault(p.category, []).append(p.product_id)

        categories = [cat for cat, pids in by_category.items() if pids]
        if not categories:
            categories = ["electronics"]

        user_segments = {
            cat: {
                "products": by_category.get(cat, self.product_ids),
                "queries": self._query_templates_for_category(cat),
            }
            for cat in categories
        }
        actions = ["view", "click", "add_to_cart", "search"]
        action_weights = [0.42, 0.33, 0.17, 0.08]

        for user_id in range(1, 81):
            segment = rng.choice(categories)
            segment_meta = user_segments[segment]
            preferred_products = segment_meta["products"]
            query_templates = segment_meta["queries"]
            num_events = rng.randint(20, 36)
            time_cursor = now + timedelta(minutes=rng.randint(0, 600))

            for _ in range(num_events):
                time_cursor += timedelta(minutes=rng.randint(3, 55))
                action = rng.choices(actions, weights=action_weights, k=1)[0]
                product_id = rng.choice(preferred_products if rng.random() < 0.9 else self.product_ids)
                query = ""

                if action == "search":
                    query = rng.choice(query_templates)
                elif action == "add_to_cart" and rng.random() < 0.75:
                    # Bias add_to_cart strongly to products in the preferred segment.
                    product_id = rng.choice(preferred_products)

                rows.append(
                    {
                        "user_id": user_id,
                        "product_id": product_id,
                        "action": action,
                        "timestamp": time_cursor.isoformat(),
                        "query": query,
                    }
                )

        df = pd.DataFrame(rows)
        df.sort_values(["user_id", "timestamp"], inplace=True)
        df.to_csv(self.behavior_path, index=False)

    def _extract_budget(self, query: str) -> float | None:
        q = query.lower().replace(".", "")
        m = re.search(r"(\d+(?:[.,]\d+)?)\s*(k|tr|triệu|m|usd)?", q)
        if not m:
            return None
        value = float(m.group(1).replace(",", "."))
        unit = m.group(2)
        if unit == "k":
            return value / 1000.0
        if unit in {"tr", "triệu", "m"}:
            return value * 40.0
        if unit == "usd":
            return value
        return value

    def _infer_query_context(self, query: str) -> Dict[str, object]:
        q = query.lower().strip()
        budget = self._extract_budget(q)

        category_keywords = {
            "electronics": ["laptop", "điện thoại", "dien thoai", "tai nghe", "gaming", "camera", "smartphone", "phone", "iphone", "samsung", "xiaomi", "pixel"],
            "book": ["sách", "sach", "thuật toán", "thuat toan", "lập trình", "lap trinh", "code", "data", "algorithm", "clean code", "book"],
            "fashion": ["áo", "ao", "giày", "giay", "shoes", "sneaker", "running", "t-shirt", "jacket", "jeans", "hoodie", "thời trang", "thoi trang", "cotton", "măng tô", "mang to", "quần", "quan"],
        }

        category = None
        best_hits = 0
        for cat, kws in category_keywords.items():
            hits = sum(1 for kw in kws if kw in q)
            if hits > best_hits:
                best_hits = hits
                category = cat

        tokens = [t for t in re.findall(r"[a-zA-ZÀ-ỹ0-9]+", q) if len(t) > 1]
        return {"category": category, "budget": budget, "tokens": tokens}

    def _intent_scores(self, query: str) -> Dict[int, float]:
        context = self._infer_query_context(query)
        category = context["category"]
        budget = context["budget"]
        tokens: List[str] = context["tokens"]

        scores: Dict[int, float] = {}
        for p in self.products:
            score = 0.0
            searchable = f"{p.name} {p.description} {p.category}".lower()

            if category and p.category == category:
                score += 1.4

            keyword_hits = sum(1 for tok in tokens if tok in searchable)
            score += min(1.8, keyword_hits * 0.35)

            if budget is not None:
                if p.price <= budget:
                    score += 0.7
                elif p.price <= budget * 1.25:
                    score += 0.2
                else:
                    score -= 0.6

            scores[p.product_id] = max(0.0, score)

        return scores

    def _prepare_behavior_views(self, behavior_df: pd.DataFrame):
        sorted_df = behavior_df.sort_values(["user_id", "timestamp"])
        strong_actions = {"view", "click", "add_to_cart"}

        self.user_histories.clear()
        self.user_search_terms.clear()

        for user_id, group in sorted_df.groupby("user_id"):
            seq = [int(pid) for pid, act in zip(group["product_id"], group["action"]) if act in strong_actions]
            if seq:
                self.user_histories[int(user_id)] = seq

            search_terms = [q for q in group["query"].tolist() if isinstance(q, str) and q.strip()]
            if search_terms:
                self.user_search_terms[int(user_id)] = search_terms[-1]

    def _build_graph_edges(self, behavior_df: pd.DataFrame):
        self.similar_edges = {pid: {} for pid in self.product_ids}
        self.user_buy_edges = {}

        by_category: Dict[str, List[int]] = {}
        for product in self.products:
            by_category.setdefault(product.category, []).append(product.product_id)

        for _, pids in by_category.items():
            for src in pids:
                for dst in pids:
                    if src != dst:
                        self.similar_edges[src][dst] = 0.7

        for user_id, group in behavior_df.groupby("user_id"):
            interactions = {}
            for _, row in group.iterrows():
                pid = int(row["product_id"])
                action = row["action"]
                if action == "add_to_cart":
                    interactions[pid] = interactions.get(pid, 0.0) + 1.0
                elif action == "click":
                    interactions[pid] = interactions.get(pid, 0.0) + 0.6
                elif action == "view":
                    interactions[pid] = interactions.get(pid, 0.0) + 0.25
            self.user_buy_edges[int(user_id)] = interactions

    def _build_training_tensors(self, seq_len: int = 5) -> Tuple[torch.Tensor, torch.Tensor]:
        x_samples = []
        y_samples = []
        input_dim = len(self.product_ids) + 1

        for seq in self.user_histories.values():
            encoded = [self.product_to_index[pid] for pid in seq if pid in self.product_to_index]
            if len(encoded) < 2:
                continue

            for i in range(1, len(encoded)):
                context = encoded[max(0, i - seq_len):i]
                padded = [0] * (seq_len - len(context)) + context
                one_hot = np.eye(input_dim, dtype=np.float32)[padded]
                x_samples.append(one_hot)
                y_samples.append(encoded[i])

        if not x_samples:
            x = np.zeros((1, seq_len, input_dim), dtype=np.float32)
            y = np.array([1], dtype=np.int64)
        else:
            x = np.asarray(x_samples, dtype=np.float32)
            y = np.asarray(y_samples, dtype=np.int64)

        return torch.tensor(x), torch.tensor(y)

    def _train_lstm(self):
        input_dim = len(self.product_ids) + 1
        output_dim = len(self.product_ids) + 1
        model = LSTMModel(input_dim=input_dim, hidden_dim=64, output_dim=output_dim)

        x_train, y_train = self._build_training_tensors(seq_len=5)

        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

        model.train()
        epochs = int(os.getenv("LSTM_EPOCHS", "18"))
        for _ in range(epochs):
            optimizer.zero_grad()
            output = model(x_train)
            loss = criterion(output, y_train)
            loss.backward()
            optimizer.step()

        self.lstm_model = model.eval()

    def _build_rag_index(self):
        docs = [f"{p.name}. {p.description}. Danh mục: {p.category}." for p in self.products]
        self.rag_product_order = [p.product_id for p in self.products]

        vectorizer = TfidfVectorizer(max_features=256, ngram_range=(1, 2))
        matrix = vectorizer.fit_transform(docs).toarray().astype("float32")

        norms = np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-8
        matrix = matrix / norms

        index = faiss.IndexFlatIP(matrix.shape[1])
        index.add(matrix)

        self.rag_vectorizer = vectorizer
        self.rag_index = index
        self.rag_matrix = matrix

    def _try_connect_neo4j(self):
        uri = os.getenv("NEO4J_URI", "")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "neo4j")
        if not uri:
            self.neo4j_driver = None
            self.neo4j_enabled = False
            logger.info("Neo4j URI not configured. Graph sync disabled; fallback to in-memory graph scores.")
            return

        try:
            driver = GraphDatabase.driver(uri, auth=(user, password))
            with driver.session() as session:
                session.run("RETURN 1")
            self.neo4j_driver = driver
            self.neo4j_enabled = True
            logger.info("Connected to Neo4j successfully.")
        except Exception:
            self.neo4j_driver = None
            self.neo4j_enabled = False
            logger.exception("Failed to connect Neo4j. Running with fallback graph in memory.")

    def _sync_graph_to_neo4j(self, behavior_df: pd.DataFrame):
        if not self.neo4j_driver:
            logger.info("Neo4j driver unavailable. Skip graph sync to external graph database.")
            return

        try:
            with self.neo4j_driver.session() as session:
                session.run("MATCH (n) DETACH DELETE n")

                for p in self.products:
                    session.run(
                        "MERGE (p:Product {id: $id}) SET p.name = $name, p.category = $category, p.price = $price",
                        id=p.product_id,
                        name=p.name,
                        category=p.category,
                        price=p.price,
                    )

                for user_id in sorted(behavior_df["user_id"].unique().tolist()):
                    session.run("MERGE (u:User {id: $id})", id=int(user_id))

                for _, row in behavior_df.iterrows():
                    rel = "BUY" if row["action"] == "add_to_cart" else "VIEW"
                    session.run(
                        f"""
                        MATCH (u:User {{id: $uid}}), (p:Product {{id: $pid}})
                        MERGE (u)-[r:{rel}]->(p)
                        SET r.weight = coalesce(r.weight, 0) + 1
                        """,
                        uid=int(row["user_id"]),
                        pid=int(row["product_id"]),
                    )

                for src, neighbors in self.similar_edges.items():
                    for dst, weight in neighbors.items():
                        session.run(
                            """
                            MATCH (a:Product {id: $src}), (b:Product {id: $dst})
                            MERGE (a)-[r:SIMILAR]->(b)
                            SET r.weight = $w
                            """,
                            src=int(src),
                            dst=int(dst),
                            w=float(weight),
                        )

            logger.info("Neo4j graph sync completed.")
        except Exception:
            logger.exception("Neo4j graph sync failed. Continue with in-memory graph.")

    def _normalize_scores(self, scores: Dict[int, float]) -> Dict[int, float]:
        if not scores:
            return {}
        max_v = max(scores.values())
        if max_v <= 0:
            return {k: 0.0 for k in scores}
        return {k: v / max_v for k, v in scores.items()}

    def _lstm_scores(self, user_id: int) -> Dict[int, float]:
        if self.lstm_model is None:
            return {}

        seq = self.user_histories.get(user_id, [])
        if not seq:
            return {}

        seq_len = 5
        input_dim = len(self.product_ids) + 1
        encoded = [self.product_to_index.get(pid, 0) for pid in seq[-seq_len:]]
        padded = [0] * (seq_len - len(encoded)) + encoded
        x = np.eye(input_dim, dtype=np.float32)[padded][None, :, :]

        with torch.no_grad():
            logits = self.lstm_model(torch.tensor(x))
            probs = torch.softmax(logits, dim=1).numpy()[0]

        scores = {}
        for idx in range(1, len(probs)):
            pid = self.index_to_product.get(idx)
            if pid is not None:
                scores[pid] = float(probs[idx])
        return scores

    def _graph_scores(self, user_id: int) -> Dict[int, float]:
        score = {}
        interactions = self.user_buy_edges.get(user_id, {})
        for pid, weight in interactions.items():
            for neighbor, sim_w in self.similar_edges.get(pid, {}).items():
                score[neighbor] = score.get(neighbor, 0.0) + weight * sim_w
        return score

    def _rag_scores(self, query: str, top_k: int = 5) -> Dict[int, float]:
        if not self.rag_index or not self.rag_vectorizer:
            return {}
        q_vec = self.rag_vectorizer.transform([query]).toarray().astype("float32")
        q_norm = np.linalg.norm(q_vec, axis=1, keepdims=True) + 1e-8
        q_vec = q_vec / q_norm
        sims, ids = self.rag_index.search(q_vec, top_k)

        result = {}
        for score, idx in zip(sims[0], ids[0]):
            if idx < 0:
                continue
            pid = self.rag_product_order[int(idx)]
            result[pid] = float(max(score, 0.0))
        return result

    def recommend(self, user_id: int, query: str = "", top_k: int = 3):
        if top_k <= 0:
            raise HTTPException(status_code=400, detail="top_k must be > 0")

        effective_query = query.strip() or self.user_search_terms.get(user_id, "sản phẩm phổ biến")

        lstm_raw = self._lstm_scores(user_id)
        graph_raw = self._graph_scores(user_id)
        rag_raw = self._rag_scores(effective_query, top_k=max(8, top_k))
        intent_raw = self._intent_scores(effective_query)

        lstm_scores = self._normalize_scores(lstm_raw)
        graph_scores = self._normalize_scores(graph_raw)
        rag_scores = self._normalize_scores(rag_raw)
        intent_scores = self._normalize_scores(intent_raw)

        context = self._infer_query_context(effective_query)
        inferred_category = context["category"]
        inferred_budget = context["budget"]

        # Bộ lọc từ khóa phụ trợ chi tiết (Heuristic Intent Filters)
        q_lower = effective_query.lower()
        has_laptop_kw = any(kw in q_lower for kw in ["laptop", "máy tính", "may tinh", "computer", "macbook", "thinkpad", "asus", "dell", "hp", "acer", "xps"])
        has_phone_kw = any(kw in q_lower for kw in ["điện thoại", "dien thoai", "phone", "iphone", "samsung", "xiaomi", "smartphone", "oneplus", "pixel", "redmi"])
        has_shoe_kw = any(kw in q_lower for kw in ["giày", "giay", "shoes", "sneaker", "sneakers", "running", "boots", "sandals", "oxford"])
        has_book_kw = any(kw in q_lower for kw in ["sách", "sach", "book", "đọc", "doc", "code", "thuat toan", "thuật toán", "algorithm", "clean code", "clean architecture"])
        has_clothes_kw = any(kw in q_lower for kw in ["áo", "ao", "quần", "quan", "t-shirt", "jacket", "jeans", "hoodie", "polo", "coat", "măng tô", "mang to", "cotton", "denim"])

        has_explicit_query = bool(query.strip())
        if has_explicit_query:
            w_lstm, w_graph, w_rag, w_intent = 0.20, 0.15, 0.30, 0.35
        else:
            w_lstm, w_graph, w_rag, w_intent = 0.40, 0.30, 0.20, 0.10

        all_pids = set(lstm_scores) | set(graph_scores) | set(rag_scores) | set(intent_scores) | set(self.product_ids)
        final_scores = {}
        for pid in all_pids:
            base_score = (
                w_lstm * lstm_scores.get(pid, 0.0)
                + w_graph * graph_scores.get(pid, 0.0)
                + w_rag * rag_scores.get(pid, 0.0)
                + w_intent * intent_scores.get(pid, 0.0)
            )

            product = self.product_by_id.get(pid)
            if product:
                # Phạt nặng sản phẩm khác ngành hàng chính (ví dụ book vs electronics)
                if inferred_category and product.category != inferred_category:
                    base_score *= 0.15
                
                prod_name_lower = product.name.lower()
                prod_desc_lower = product.description.lower()
                
                # Phạt cực nặng sản phẩm khác phân nhóm phụ nếu người dùng chỉ định rõ
                if has_laptop_kw:
                    is_laptop = any(kw in prod_name_lower or kw in prod_desc_lower for kw in ["laptop", "macbook", "thinkpad", "notebook", "asus", "dell", "hp", "acer", "xps", "rog", "predator", "pavilion"])
                    if not is_laptop:
                        base_score *= 0.05
                
                if has_phone_kw:
                    is_phone = any(kw in prod_name_lower or kw in prod_desc_lower for kw in ["điện thoại", "phone", "iphone", "samsung", "xiaomi", "smartphone", "oneplus", "pixel", "redmi"])
                    if not is_phone:
                        base_score *= 0.05
                
                if has_shoe_kw:
                    is_shoe = any(kw in prod_name_lower or kw in prod_desc_lower for kw in ["giày", "giay", "shoes", "sneaker", "sneakers", "running", "boots", "sandals", "oxford", "ultraboost", "airspeed", "canvas"])
                    if not is_shoe:
                        base_score *= 0.05
                
                if has_book_kw:
                    is_book = product.category == "book" or any(kw in prod_name_lower or kw in prod_desc_lower for kw in ["sách", "sach", "book", "clean code", "algorithms", "programmer", "design patterns", "refactoring", "clean architecture"])
                    if not is_book:
                        base_score *= 0.05

                if has_clothes_kw:
                    is_clothes = any(kw in prod_name_lower or kw in prod_desc_lower for kw in ["áo", "ao", "quần", "quan", "t-shirt", "jacket", "jeans", "hoodie", "polo", "coat", "cotton", "denim", "hoodie", "măng tô", "mang to"]) and not any(kw in prod_name_lower or kw in prod_desc_lower for kw in ["giày", "giay", "shoes", "sneaker", "sneakers", "boots", "sandals"])
                    if not is_clothes:
                        base_score *= 0.05

                if inferred_budget is not None and product.price > inferred_budget * 1.2:
                    base_score *= 0.45

            final_scores[pid] = base_score

        top = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
        
        # Lọc bỏ các sản phẩm bị phạt cực kỳ nặng (mismatched sub-categories)
        if has_explicit_query:
            # Loại bỏ hoàn toàn các sản phẩm có điểm số quá bé do bị phạt (< 0.1)
            top = [item for item in top if item[1] >= 0.1]
            
        top = top[:top_k]
        recommendations = [pid for pid, _ in top]

        return {
            "user_id": user_id,
            "query": effective_query,
            "recommendations": recommendations,
            "recommended_products": [
                {
                    "id": p.product_id,
                    "name": p.name,
                    "category": p.category,
                    "price": p.price,
                }
                for p in [self.product_by_id.get(pid) for pid in recommendations]
                if p is not None
            ],
            "components": {
                "lstm": sorted(lstm_scores.items(), key=lambda x: x[1], reverse=True)[:5],
                "graph": sorted(graph_scores.items(), key=lambda x: x[1], reverse=True)[:5],
                "rag": sorted(rag_scores.items(), key=lambda x: x[1], reverse=True)[:5],
                "intent": sorted(intent_scores.items(), key=lambda x: x[1], reverse=True)[:5],
            },
        }

    def _call_gemini(self, prompt: str) -> str:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            logger.warning("GEMINI_API_KEY is not configured.")
            return ""

        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini API call via SDK failed: {e}")
        return ""

    def chatbot(self, user_id: int, query: str):
        rec = self.recommend(user_id=user_id, query=query, top_k=5)
        picks = [self.product_by_id.get(pid) for pid in rec["recommendations"]]
        picks = [p for p in picks if p is not None]

        if not picks:
            answer = "Hiện chưa có gợi ý phù hợp. Bạn có thể thử mô tả cụ thể hơn nhu cầu mua sắm."
            return {"query": query, "answer": answer, "recommendations": []}

        products_context = []
        for p in picks:
            products_context.append(
                f"- ID: {p.product_id}\n"
                f"  Tên: {p.name}\n"
                f"  Danh mục: {p.category}\n"
                f"  Giá: {p.price} USD\n"
                f"  Mô tả: {p.description}"
            )
        products_str = "\n\n".join(products_context)

        prompt = (
            "Bạn là một trợ lý tư vấn mua sắm thông minh và nhiệt tình tên QuickMall AI.\n"
            "Hãy đóng vai trò là nhân viên tư vấn bán hàng chuyên nghiệp.\n\n"
            f"Yêu cầu của khách hàng: \"{query}\"\n\n"
            "Dưới đây là danh sách các sản phẩm phù hợp nhất trong kho hàng hệ thống:\n"
            f"{products_str}\n\n"
            "Hãy viết một câu trả lời tư vấn bằng Tiếng Việt tự nhiên, ngắn gọn (dưới 150 từ), "
            "thuyết phục và làm nổi bật các sản phẩm trên. Giải thích tại sao chúng phù hợp với họ.\n"
            "Lưu ý: Chỉ tư vấn dựa trên danh sách sản phẩm được cung cấp ở trên. "
            "Nếu có nhiều sản phẩm, hãy liệt kê chúng rõ ràng và hấp dẫn."
        )

        answer = self._call_gemini(prompt)

        if not answer:
            context = self._infer_query_context(query)
            intro = "Mình đã phân tích nhu cầu của bạn và gợi ý phù hợp nhất:"
            lines = [f"- {p.name} ({p.category}) khoảng {p.price} USD" for p in picks[:3]]
            if context["category"]:
                lines.append(f"- Nhóm ưu tiên: {context['category']}")
            if context["budget"] is not None:
                lines.append(f"- Mức ngân sách tham chiếu: ~{round(context['budget'], 2)} USD")
            answer = intro + "\n" + "\n".join(lines)

        return {
            "query": query,
            "answer": answer,
            "recommendations": [p.product_id for p in picks],
        }


ENGINE = HybridAIEngine()


@app.on_event("startup")
def startup_event():
    ENGINE.initialize()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "dataset": str(ENGINE.behavior_path),
        "records": int(pd.read_csv(ENGINE.behavior_path).shape[0]) if ENGINE.behavior_path.exists() else 0,
        "pipeline": ["LSTM", "KnowledgeGraph", "RAG"],
        "neo4j_enabled": ENGINE.neo4j_enabled,
    }


@app.get("/recommend")
def recommend(user_id: int, query: str = "", top_k: int = 3):
    return ENGINE.recommend(user_id=user_id, query=query, top_k=top_k)


@app.post("/chatbot")
def chatbot(payload: ChatbotRequest):
    return ENGINE.chatbot(user_id=payload.user_id, query=payload.query)
