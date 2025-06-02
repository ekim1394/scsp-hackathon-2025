

from datetime import datetime
from uuid import UUID
from app.main import get_current_user, get_session
from app.models import Thread, User
from fastapi import Depends
from sqlmodel import Session, select
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

app = APIRouter()


class ThreadCreate(BaseModel):
    title: str
    content: str

@app.post("/thread", response_model=Thread)

def create_thread(thread: ThreadCreate, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    thread = Thread(
        title=thread.title,
        content=thread.content,
        user_id=user.id  # Assuming get_current_user() returns the current user
    )
    session.add(thread)
    session.commit()
    session.refresh(thread)
    return thread



@app.get("/threads", response_model=list[Thread])
def read_threads(skip: int = 0, limit: int = 10, session: Session = Depends(get_session)):
    threads = session.exec(select(Thread).offset(skip).limit(limit)).all()
    return threads

@app.get("/threads/{thread_id}", response_model=Thread)
def read_thread(thread_id: int, session: Session = Depends(get_session)):
    thread = session.exec(select(Thread).where(Thread.id == thread_id)).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    return thread

@app.put("/threads/{thread_id}", response_model=Thread)
def update_thread(thread_id: int, thread: ThreadCreate, session: Session = Depends(get_session)):
    thread_to_update = session.exec(select(Thread).where(Thread.id == thread_id)).first()
    if not thread_to_update:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    thread_to_update.title = thread.title
    thread_to_update.content = thread.content
    thread_to_update.updated_at = datetime.utcnow()  # Assuming you have an updated_at field
    session.commit()
    session.refresh(thread_to_update)
    return thread_to_update

@app.delete("/threads/{thread_id}", response_model=Thread)
def delete_thread(thread_id: int, session: Session = Depends(get_session)):
    thread_to_delete = session.exec(select(Thread).where(Thread.id == thread_id)).first()
    if not thread_to_delete:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    session.delete(thread_to_delete)
    session.commit()
    return thread_to_delete