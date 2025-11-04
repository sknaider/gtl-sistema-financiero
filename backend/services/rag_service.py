"""
RAG Service - Retrieval Augmented Generation
Manages ChromaDB vector store and context retrieval
"""
import os
import logging
from typing import List, Dict, Optional
from datetime import datetime

# ChromaDB fix para AlmaLinux (DEBE estar ANTES de import chromadb)
import chromadb_fix

import chromadb
from chromadb.config import Settings

from services.embedding_service import get_embedding_service

logger = logging.getLogger(__name__)

class RAGService:
    """Service for RAG operations with ChromaDB"""
    
    def __init__(self):
        """Initialize ChromaDB client and collection"""
        self.db_path = "/home/gtl.pe/chromadb"
        self.collection_name = "gtl_financial_embeddings"
        self.client = None
        self.collection = None
        self.embedding_service = get_embedding_service()
        self._init_chromadb()
    
    def _init_chromadb(self):
        """Initialize ChromaDB client and collection"""
        try:
            logger.info(f"Initializing ChromaDB at: {self.db_path}")
            
            self.client = chromadb.PersistentClient(
                path=self.db_path,
                settings=Settings(anonymized_telemetry=False)
            )
            
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={
                    "description": "GTL Financial System - Transaction Embeddings",
                    "created_at": datetime.now().isoformat()
                }
            )
            
            logger.info(f"✅ ChromaDB initialized: {self.collection_name}")
            
        except Exception as e:
            logger.error(f"Error initializing ChromaDB: {str(e)}")
            raise
    
    def add_documents(
        self,
        texts: List[str],
        metadatas: List[Dict],
        ids: List[str]
    ) -> bool:
        """
        Add documents to vector store.
        
        Args:
            texts: List of document texts
            metadatas: List of metadata dicts (must include 'mes', 'tipo', etc)
            ids: List of unique document IDs
            
        Returns:
            Success boolean
        """
        try:
            # Generate embeddings
            embeddings = self.embedding_service.embed_documents(texts)
            
            # Add to ChromaDB
            self.collection.add(
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )
            
            logger.info(f"✅ Added {len(texts)} documents to vector store")
            return True
            
        except Exception as e:
            logger.error(f"Error adding documents: {str(e)}")
            return False
    
    def query_similar(
        self,
        query: str,
        n_results: int = 5,
        filter_metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Query similar documents from vector store.
        
        Args:
            query: Search query
            n_results: Number of results to return
            filter_metadata: Optional metadata filters (e.g., {"mes": "OCTUBRE"})
            
        Returns:
            Dict with 'documents', 'metadatas', 'distances'
        """
        try:
            # Generate query embedding
            query_embedding = self.embedding_service.embed_query(query)
            
            # Query ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=filter_metadata
            )
            
            logger.info(f"✅ Found {len(results['documents'][0])} similar documents")
            
            return {
                "documents": results['documents'][0],
                "metadatas": results['metadatas'][0],
                "distances": results['distances'][0]
            }
            
        except Exception as e:
            logger.error(f"Error querying documents: {str(e)}")
            return {"documents": [], "metadatas": [], "distances": []}
    
    def build_context(
        self,
        query: str,
        mes: Optional[str] = None,
        n_results: int = 5
    ) -> str:
        """
        Build context string from similar documents for LLM.
        
        Args:
            query: User query
            mes: Optional month filter
            n_results: Number of similar docs to retrieve
            
        Returns:
            Formatted context string
        """
        try:
            # Build metadata filter
            filter_metadata = {"mes": mes} if mes else None
            
            # Query similar documents
            results = self.query_similar(
                query=query,
                n_results=n_results,
                filter_metadata=filter_metadata
            )
            
            if not results['documents']:
                return ""
            
            # Build context string
            context_parts = ["CONTEXTO HISTÓRICO RELEVANTE:\n"]
            
            for i, (doc, meta, dist) in enumerate(zip(
                results['documents'],
                results['metadatas'],
                results['distances']
            ), 1):
                similarity = round((1 - dist) * 100, 1)
                context_parts.append(
                    f"\n{i}. [{meta.get('tipo', 'N/A')} - {meta.get('mes', 'N/A')}] "
                    f"(Relevancia: {similarity}%)\n{doc}\n"
                )
            
            return "\n".join(context_parts)
            
        except Exception as e:
            logger.error(f"Error building context: {str(e)}")
            return ""
    
    def get_stats(self) -> Dict:
        """Get vector store statistics"""
        try:
            count = self.collection.count()
            return {
                "total_documents": count,
                "collection_name": self.collection_name,
                "db_path": self.db_path
            }
        except Exception as e:
            logger.error(f"Error getting stats: {str(e)}")
            return {"total_documents": 0}

# Singleton instance
_rag_service = None

def get_rag_service() -> RAGService:
    """Get or create RAG service singleton"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
