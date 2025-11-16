"""
AI Agent model for chat history and AI interactions.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class AIChatHistory(Base):
    """AI chat history model for storing conversation history."""

    __tablename__ = "ai_chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(255), index=True, nullable=True)  # Group messages by session
    role = Column(String(50), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    model = Column(String(100), nullable=True)  # gemini-pro, gemini-1.5-pro, etc.
    tokens_used = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="chat_history")

    def __repr__(self):
        return f"<AIChatHistory session={self.session_id} role={self.role}>"
