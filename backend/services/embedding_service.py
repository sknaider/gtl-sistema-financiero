"""
Embedding Service - multilingual-e5-large-instruct wrapper
Handles text vectorization for semantic search
"""
import os
from typing import List, Union
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating embeddings using multilingual-e5-large-instruct"""
    
    def __init__(self):
        """Initialize embedding model"""
        self.model_name = 'intfloat/multilingual-e5-large-instruct'
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Lazy load embedding model"""
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info("✅ Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading embedding model: {str(e)}")
            raise
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Embed documents for storage in vector database.
        Uses 'passage:' prefix as per model documentation.
        
        Args:
            texts: List of document texts to embed
            
        Returns:
            List of embedding vectors (1024 dimensions each)
        """
        if not self.model:
            self._load_model()
        
        try:
            # Add 'passage:' prefix for document embeddings
            prefixed_texts = [f"passage: {text}" for text in texts]
            
            embeddings = self.model.encode(
                prefixed_texts,
                normalize_embeddings=True,
                show_progress_bar=len(texts) > 10
            )
            
            return embeddings.tolist()
            
        except Exception as e:
            logger.error(f"Error embedding documents: {str(e)}")
            raise
    
    def embed_query(self, query: str) -> List[float]:
        """
        Embed a search query.
        Uses 'query:' prefix as per model documentation.
        
        Args:
            query: Search query text
            
        Returns:
            Embedding vector (1024 dimensions)
        """
        if not self.model:
            self._load_model()
        
        try:
            # Add 'query:' prefix for search queries
            prefixed_query = f"query: {query}"
            
            embedding = self.model.encode(
                prefixed_query,
                normalize_embeddings=True
            )
            
            return embedding.tolist()
            
        except Exception as e:
            logger.error(f"Error embedding query: {str(e)}")
            raise
    
    def get_model_info(self) -> dict:
        """Get model information"""
        return {
            "model_name": self.model_name,
            "dimensions": 1024,
            "max_seq_length": 512,
            "loaded": self.model is not None
        }

# Singleton instance
_embedding_service = None

def get_embedding_service() -> EmbeddingService:
    """Get or create embedding service singleton"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
