"""
SQLAlchemy Database Models
Contains inefficient and misconfigured database models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
# ERROR 324: Importing Mapped from wrong module (should be from sqlalchemy.orm)
from typing import Mapped, Optional, List

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id: Mapped[int] = Column(Integer, primary_key=True)
    username: Mapped[str] = Column(String(50), unique=True, nullable=False)
    
    # ERROR 322: No unique=True or index=True on frequently queried email field
    # This will cause performance issues on lookups
    email: Mapped[str] = Column(String(100), nullable=False)
    # Should have: unique=True, index=True
    
    password_hash: Mapped[str] = Column(String(255), nullable=False)
    is_active: Mapped[bool] = Column(Boolean, default=True)
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # ERROR 323: Missing uselist=False for one-to-one relationship
    # This creates a one-to-many relationship instead
    profile = relationship("UserProfile", back_populates="user")
    # Should be: relationship("UserProfile", back_populates="user", uselist=False)
    
    # Additional relationships that look normal
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user")
    
    def __repr__(self):
        return f"<User(username='{self.username}', email='{self.email}')>"


class UserProfile(Base):
    __tablename__ = 'user_profiles'
    
    id: Mapped[int] = Column(Integer, primary_key=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Profile fields
    first_name: Mapped[Optional[str]] = Column(String(100))
    last_name: Mapped[Optional[str]] = Column(String(100))
    bio: Mapped[Optional[str]] = Column(Text)
    avatar_url: Mapped[Optional[str]] = Column(String(500))
    phone: Mapped[Optional[str]] = Column(String(20))
    address: Mapped[Optional[str]] = Column(Text)
    date_of_birth: Mapped[Optional[datetime]] = Column(DateTime)
    
    # Preferences stored as JSON string (bad practice)
    preferences: Mapped[Optional[str]] = Column(Text)  # Should use JSON column type
    
    # Back reference to user
    user = relationship("User", back_populates="profile")
    
    def __repr__(self):
        return f"<UserProfile(user_id={self.user_id})>"


class Post(Base):
    __tablename__ = 'posts'
    
    id: Mapped[int] = Column(Integer, primary_key=True)
    author_id: Mapped[int] = Column(Integer, ForeignKey('users.id'), nullable=False)
    title: Mapped[str] = Column(String(200), nullable=False)
    content: Mapped[str] = Column(Text, nullable=False)
    
    # No index on frequently queried fields
    status: Mapped[str] = Column(String(20), default='draft')  # Should have index
    published_at: Mapped[Optional[datetime]] = Column(DateTime)  # Should have index
    
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Post(title='{self.title}', status='{self.status}')>"


class Comment(Base):
    __tablename__ = 'comments'
    
    id: Mapped[int] = Column(Integer, primary_key=True)
    post_id: Mapped[int] = Column(Integer, ForeignKey('posts.id'), nullable=False)
    user_id: Mapped[int] = Column(Integer, ForeignKey('users.id'), nullable=False)
    content: Mapped[str] = Column(Text, nullable=False)
    
    # Storing IP address as string (should consider privacy laws)
    ip_address: Mapped[Optional[str]] = Column(String(45))
    
    # Missing indexes on foreign keys
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")
    
    def __repr__(self):
        return f"<Comment(post_id={self.post_id}, user_id={self.user_id})>"


class Transaction(Base):
    """Financial transaction model with precision issues"""
    __tablename__ = 'transactions'
    
    id: Mapped[int] = Column(Integer, primary_key=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Using Float for money (precision issues)
    amount: Mapped[float] = Column(Float, nullable=False)  # Should use Decimal
    balance_after: Mapped[float] = Column(Float, nullable=False)  # Should use Decimal
    
    transaction_type: Mapped[str] = Column(String(20), nullable=False)
    description: Mapped[Optional[str]] = Column(Text)
    
    # No index on frequently queried timestamp
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Transaction(amount={self.amount}, type='{self.transaction_type}')>"