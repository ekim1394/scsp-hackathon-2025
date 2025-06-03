

from datetime import datetime
from uuid import UUID
from app.main import get_current_user, get_session
from app.models import Thread, User, Vote
from fastapi import Depends
from sqlmodel import Session, select
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.routes.user import UserView

app = APIRouter()


class ThreadCreate(BaseModel):
    title: str
    content: str
    
class ThreadView(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    user: UserView
    vote: list[Vote]

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



@app.get("/threads", response_model=list[ThreadView])
def read_threads(skip: int = 0, limit: int = 10, session: Session = Depends(get_session)):
    threads = session.exec(
        select(Thread, Vote, User)
        .join(User, Thread.user_id == User.id)
        .join(Vote, Vote.thread_id == Thread.id, isouter=True)
        .offset(skip)
        .limit(limit)
    )
    view = []
    for t, v, u in threads:
        thread = ThreadView(
            id=t.id,
            title=t.title,
            content=t.content,
            created_at=t.created_at,
            updated_at=t.updated_at,
            user=UserView(
                id=u.id,
                username=u.username,
                email=u.email,
                role=u.role
            ),
            vote=[v] if v else []
        )  
        view.append(thread)
    return view

@app.get("/threads/{thread_id}", response_model=ThreadView)
def read_thread(thread_id: int, session: Session = Depends(get_session)):
    result = session.exec(
        select(Thread, Vote, User)
        .join(User, Thread.user_id == User.id)
        .join(Vote, Vote.thread_id == Thread.id, isouter=True)
        .where(Thread.id == thread_id)
    ).first()

    if not result:
        raise HTTPException(status_code=404)

    t, v, u = result
    thread = ThreadView(
        id=t.id,
        title=t.title,
        content=t.content,
        created_at=t.created_at,
        updated_at=t.updated_at,
        user=UserView(
            id=u.id,
            username=u.username,
            email=u.email,
            role=u.role
        ),
        vote=[v] if v else []
    )  
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