from datetime import datetime
import uuid

from fastapi.responses import FileResponse
from app.main import get_current_user, get_session
from app.models import Attachment, Thread, User, Vote
from fastapi import Depends, Form, UploadFile
from sqlmodel import Session, select
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.routes.user import UserView
import os

app = APIRouter()


class AttachmentSimpleView(BaseModel):
    id: int
    file_url: str = None
    file_type: str = None


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
    attachment: AttachmentSimpleView | None = None


@app.post("/thread", response_model=Thread)
def create_thread(
    thread: ThreadCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    thread = Thread(
        title=thread.title,
        content=thread.content,
        user_id=user.id,  # Assuming get_current_user() returns the current user
    )
    session.add(thread)
    session.commit()
    session.refresh(thread)
    return thread


@app.get("/threads", response_model=list[ThreadView])
def read_threads(
    page: int = 0, limit: int = 10, session: Session = Depends(get_session)
):
    threads = session.exec(
        select(Thread, User, Attachment)
        .join(User, Thread.user_id == User.id)
        .join(Attachment, Attachment.thread_id == Thread.id, isouter=True)
        .order_by(Thread.created_at.desc())
        .offset(page * 10)
        .limit(limit)
    )
    view = []
    thread_votes = session.exec(select(Vote).where(Vote.thread_id is not None)).all()
    for t, u, a in threads:
        thread = ThreadView(
            id=t.id,
            title=t.title,
            content=t.content,
            created_at=t.created_at,
            updated_at=t.updated_at,
            user=UserView(id=u.id, username=u.username, email=u.email, role=u.role),
            vote=[v for v in thread_votes if v.thread_id == t.id],
            attachment=AttachmentSimpleView(
                id=a.id, file_url=a.file_url, file_type=a.file_type
            )
            if a and a.file_url and a.file_type
            else None,
        )
        view.append(thread)
    return view


@app.get("/threads/{thread_id}", response_model=ThreadView)
def read_thread(thread_id: int, session: Session = Depends(get_session)):
    result = session.exec(
        select(Thread, User, Attachment)
        .join(User, Thread.user_id == User.id)
        .join(Attachment, Attachment.thread_id == Thread.id, isouter=True)
        .where(Thread.id == thread_id)
    ).first()

    if not result:
        raise HTTPException(status_code=404)
    thread_votes = session.exec(select(Vote).where(Vote.thread_id is not None)).all()

    t, u, a = result
    thread = ThreadView(
        id=t.id,
        title=t.title,
        content=t.content,
        created_at=t.created_at,
        updated_at=t.updated_at,
        user=UserView(id=u.id, username=u.username, email=u.email, role=u.role),
        vote=[v for v in thread_votes if v.thread_id == t.id],
        attachment=AttachmentSimpleView(
            id=a.id, file_url=a.file_url, file_type=a.file_type
        )
        if a and a.file_url and a.file_type
        else None,
    )
    return thread


@app.put("/threads/{thread_id}", response_model=Thread)
def update_thread(
    thread_id: int, thread: ThreadCreate, session: Session = Depends(get_session)
):
    thread_to_update = session.exec(
        select(Thread).where(Thread.id == thread_id)
    ).first()
    if not thread_to_update:
        raise HTTPException(status_code=404, detail="Thread not found")

    thread_to_update.title = thread.title
    thread_to_update.content = thread.content
    thread_to_update.updated_at = (
        datetime.utcnow()
    )  # Assuming you have an updated_at field
    session.commit()
    session.refresh(thread_to_update)
    return thread_to_update


@app.delete("/threads/{thread_id}", response_model=Thread)
def delete_thread(thread_id: int, session: Session = Depends(get_session)):
    thread_to_delete = session.exec(
        select(Thread).where(Thread.id == thread_id)
    ).first()
    if not thread_to_delete:
        raise HTTPException(status_code=404, detail="Thread not found")

    session.delete(thread_to_delete)
    session.commit()
    return thread_to_delete


class AttachmentView(BaseModel):
    id: int
    thread_id: int
    file_url: str
    file_type: str


@app.post("/file/upload")
async def upload_file(
    file: UploadFile,
    thread_id: int = Form(...),
    session: Session = Depends(get_session),
):
    tmp_dir = "/tmp"
    os.makedirs(tmp_dir, exist_ok=True)
    file_path = os.path.join(tmp_dir, file.filename)
    with open(file_path, "wb") as f:
        file_bytes = await file.read()
        f.write(file_bytes)
    attachment = Attachment(
        thread_id=thread_id,
        file_url=file_path,
        file_type=file.filename.split(".")[-1],
    )
    session.add(attachment)
    session.commit()
    return AttachmentView(
        id=attachment.id,
        thread_id=attachment.thread_id,
        file_url=file_path,
        file_type=file.filename.split(".")[-1],
    )


@app.get("/file/{file_name}")
async def get_file(file_name: str, session: Session = Depends(get_session)):
    attachment = session.exec(
        select(Attachment).where(Attachment.file_url == f"/tmp/{file_name}")
    ).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="File not found")

    if not os.path.exists(attachment.file_url):
        raise HTTPException(status_code=404, detail="File does not exist")

    return FileResponse(
        attachment.file_url, filename=attachment.file_url.split("/")[-1]
    )
