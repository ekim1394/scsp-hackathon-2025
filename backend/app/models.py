from typing import Optional, List
from sqlmodel import JSON, Column, SQLModel, Field, Relationship
from datetime import datetime

# ---------- USER ----------

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, nullable=False, unique=True)
    email: Optional[str] = Field(default=None, unique=True)
    organization: Optional[str] = Field(default=None)
    password_hash: str
    role: str = Field(default="user", regex="^(user|moderator|admin)$")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    threads: List["Thread"] = Relationship(back_populates="user")
    comments: List["Comment"] = Relationship(back_populates="user")
    votes: List["Vote"] = Relationship(back_populates="user")

# ---------- THREAD ----------

class Thread(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    title: str
    content: Optional[str]
    summary: Optional[str]
    category: Optional[str]
    tags: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))  # PostgreSQL array
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="threads")
    comments: List["Comment"] = Relationship(back_populates="thread")
    attachments: List["Attachment"] = Relationship(back_populates="thread")

# ---------- COMMENT ----------

class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    thread_id: int = Field(foreign_key="thread.id")
    user_id: int = Field(foreign_key="user.id")
    content: str
    parent_comment_id: Optional[int] = Field(default=None, foreign_key="comment.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    thread: Optional[Thread] = Relationship(back_populates="comments")
    user: Optional[User] = Relationship(back_populates="comments")

# ---------- VOTE ----------

class Vote(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    thread_id: Optional[int] = Field(default=None, foreign_key="thread.id", ondelete="CASCADE")
    comment_id: Optional[int] = Field(default=None, foreign_key="comment.id", ondelete="CASCADE")
    value: int = Field(ge=-1, le=1)

    user: Optional[User] = Relationship(back_populates="votes")

# ---------- ATTACHMENT ----------

class Attachment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    thread_id: int = Field(foreign_key="thread.id")
    file_url: str
    file_type: str  # Consider enum: image, video, 3d_model, pdf
    description: Optional[str] = None

    thread: Optional[Thread] = Relationship(back_populates="attachments")

# ---------- ACCESS KEY ----------

class AccessKey(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    key: str = Field(index=True, unique=True)
    used: bool = Field(default=False)
